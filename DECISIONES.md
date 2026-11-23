# Registro de decisiones — DS-FS-20261119-gqga

Inicio: <hora> · Fin de la Parte 1: <hora> · Fin: <hora>

## Supuestos

- La tecnología aprobada no se nombra, así que usé la del proyecto: Java 21, Spring Boot y PostgreSQL en el servidor, y Angular en el cliente.
- El deducible está pagado cuando lo acumulado en el año de póliza, por todos los canales, llega a 350.000. Si la regla fuera otra, las solicitudes S1 y S5 cambiarían.
- Los pagos de otros canales solo cuentan si son del año de póliza vigente. Si el dato es de un año anterior, lo ignoro.
- La carencia termina el día ingreso más 90 días, y ese día ya se puede autorizar. Para 1036654782 es el 2026-12-09.
- Si otros canales ya superan el tope (1.950.000), lo que falta para el tope es cero, no un número negativo.
- Cuando el tope recorta un pago, quito primero el coaseguro y después el deducible.
- De las autorizaciones previas que solo traen el pago total, tomo 16.860 como coaseguro y 58.700 y 95.876 como deducible. Solo afecta al seed.
- El día de la sede es el día calendario de Colombia, de 00:00 a 24:00.
- Las sesiones de terapia para el tope de 20 son la suma de `cantidad`.
- Agregué la sede IPS-0188 al tarifario solo para probar que cada usuario ve únicamente la suya.

## Decisiones

### D-01 Bloqueo de la fila del asegurado
Dos solicitudes simultáneas del mismo asegurado no pueden cobrar dos veces el deducible. Descarté el bloqueo optimista con reintento, el aislamiento SERIALIZABLE y `synchronized`, que no sirve con más de una instancia. Usé `SELECT ... FOR UPDATE` sobre el asegurado, dentro de una sola transacción, porque rara vez un asegurado tiene dos autorizaciones a la vez y no afecta a los demás. Con 8 solicitudes simultáneas el deducible sumó 350.000 y el pago total 432.380, igual que en secuencia. Costo: las solicitudes del mismo asegurado hacen cola.

### D-02 Arquitectura limpia, con el dominio sin Spring ni JPA
La alternativa era controlador, servicio y repositorio. Con el dominio puro pude probar las seis solicitudes del enunciado con repositorios en memoria, sin base de datos. Costo: más clases y un mapper por entidad. Lo escribí a mano porque son solo dos entidades.

### D-03 Transacciones en un servicio de infraestructura
Los casos de uso no usan Spring, pero el bloqueo del asegurado dura lo que dura la transacción, así que la abro en `AutorizacionService`. La consulta del día va en `REPEATABLE_READ` y solo lectura, para que la página y los totales salgan de la misma foto de datos.

### D-04 El registro usa los repositorios y las reglas son funciones puras
`RegistrarAutorizacionUseCase` trabaja directo con los repositorios, no con otros casos de uso. `LiquidadorPago` y `AnioPoliza` son funciones puras y se prueban con números. Costo: `BuscarPorDocumentoConBloqueo`, `SumarPagosAseguradoUseCase` y `ContarSesionesUseCase` no las llama nadie todavía. La última servirá para el tope de 20 sesiones.

### D-05 Pesos enteros
Los montos son `long`. Descarté `double` por los errores de redondeo y `BigDecimal` por ser más de lo necesario. El coaseguro se redondea con `(x * 15 + 50) / 100`, que da 8.644 para 8.644,2.

### D-06 Hora de Colombia explícita
El servidor de la v1 corría en UTC. Una autorización de las 21:30 del 19 de noviembre de 2025 es el día 20 a las 02:30 en UTC, y caería en el año de póliza equivocado. Descarté fijar la zona de la JVM porque depende de cómo se lance. Guardo `timestamptz` y convierto siempre con America/Bogota. El año de póliza lo calculo desde la fecha de ingreso y no confío en el campo guardado, que se vuelve viejo con cada renovación.

### D-07 Plan y tarifario en configuración
El enunciado dice que el tarifario es configuración y no una entidad. Los dejé en `application.yml`. Cambiar una tarifa exige reiniciar. Cada autorización guarda una copia del nombre, la complejidad y el valor unitario, y también el documento ya enmascarado. Así el listado no necesita unir con la tabla de asegurados y el documento completo no viaja a la capa web.

### D-08 Listado estable y totales del servidor
En la v1 el cliente cargaba páginas en orden descendente mientras entraban autorizaciones, así que las páginas se solapaban, y sumaba las filas cargadas. Ahora el orden es ascendente por `(fecha_hora, id)`, de modo que lo nuevo queda al final, y el total, el valor total y el recaudo salen de un agregado SQL de todo el día, con `calculado_en`. La solución completa sería paginar por cursor, pero cambia el contrato que piden. Riesgo que queda: la hora se toma tras el bloqueo y dos transacciones de asegurados distintos pueden confirmarse en otro orden. El análisis del incidente está en INCIDENTE.md.

### D-09 Esquema con scripts SQL, sin Flyway
Se decidió no usar Flyway. `ddl-auto=update` no crea los `CHECK` ni los índices compuestos que necesito, así que uso `schema.sql` y `seed-prueba.sql`, con Hibernate en `validate`. Costo: el esquema no tiene versiones, y cambiar una tabla existente obliga a recrear la base. Las autorizaciones son inmutables con `@Immutable` y `CHECK` en la tabla. No agregué disparador ni permisos de base de datos, porque eso ya es administrar la base.

### D-10 Token JWT con el secreto del entorno
Valido la firma HS256 con el secreto de `JWT_SECRET`, que viene de un `.env` fuera de git, y exijo `exp`, `sub`, un rol conocido y una sede. La sede siempre sale del token, nunca del cuerpo. En producción usaría RS256 con la clave pública del proveedor, pero eso exige montar un emisor. Una prueba manual mostró un defecto: un error 500 se reenviaba a `/error` y la regla de denegar todo lo convertía en 403. Lo corregí.

### D-11 Errores del contrato y cantidad como texto
Jackson convierte `1.5` en `1` al leer un entero, sin avisar. Por eso `cantidad` llega como texto y se valida con un patrón, y un `1.5` se rechaza con su mensaje. Los errores salen con el nombre del campo en snake_case y ningún mensaje repite el documento.

### D-12 Logs con SLF4J
Una línea por petición, con el formato de la v1 y en hora de Colombia, con los datos de negocio al final: id, asegurado enmascarado, pagos, y en el GET el total, el primero y el último. Esos dos últimos fueron lo que permitió ver el solapamiento del incidente. Nunca se registran el documento completo, el cuerpo ni el token. Descarté el JSON por legibilidad.

### D-13 Cliente Angular con las mismas capas
Domain, application, infrastructure y presentation. El dominio no importa Angular ni RxJS, los casos de uso son clases con los puertos en el constructor, y la regla de dependencias la verifica `npm run lint:arch`. Costo: muchos archivos para una sola pantalla.

### D-14 Sesión simulada y datos solo en memoria
El secreto del token no puede llegar al navegador, así que un servidor Node local (`dev/token-server.mjs`, solo en 127.0.0.1) firma tokens de 3 minutos leyendo el `.env`. El token y los datos del asegurado viven solo en memoria, no en `localStorage` ni `sessionStorage`, porque los puestos son compartidos entre turnos. Las peticiones llevan `no-store` y el campo del documento se muestra como contraseña, con un botón para verlo, porque la pantalla queda a la vista de la fila. En desarrollo uso un proxy en lugar de abrir CORS en el servidor.

### D-15 Validación, inactividad y totales en el cliente
Las reglas de validación son funciones del dominio con los mismos mensajes del servidor, y el formulario solo las invoca. El tarifario de IPS-0412 está fijo en el cliente porque el contrato no tiene endpoint de tarifario. El cierre por inactividad (180 s, con aviso a los 150) es un caso de uso con reloj y actividad inyectados, para probarlo con tiempo simulado. La lista usa paginación explícita y muestra los totales como llegan del servidor: el cliente no suma filas.

## Verificación

Probé:
- 34 pruebas automáticas del servidor: el caso de uso, el controlador con token y roles, y los logs.
- Las seis solicitudes del 19 de noviembre en orden: S1 100.000, S2 en carencia hasta el 2026-12-09, S3 142.768, S4 439.745, S5 0 y S6 0, con recaudo de 682.513. También la carencia en el día 89 y el 90, el redondeo de medio peso, el tope y la hora de las 21:30.
- Contra PostgreSQL 16 en Docker: arranque con Hibernate en `validate`, las seis solicitudes por HTTP y las 8 solicitudes simultáneas.

No probé:
- El rendimiento: ni el p95 de 300 ms del POST con 20 concurrentes ni el de 200 ms del GET con 540.000 filas.
- La concurrencia de forma automática. Solo la verifiqué a mano.
- El mapeo JPA con Testcontainers.
- La prueba `contextLoads` falla porque necesita base de datos y `JWT_SECRET`. No la arreglé.
- Accesibilidad con axe y pruebas de componentes del cliente: pendiente de anotar cuando se ejecuten.

## Lo que dejé fuera y por qué

- El tope de 20 sesiones de terapia. Es la extensión de la Parte 3 y va en GUIA-EXTENSION.md.
- Clave de idempotencia en el POST. El doble clic solo lo evita el cliente.
- Paginación por cursor, por el contrato.
- Endpoint de tarifario, login real y CORS, porque el enunciado limita el corte a dos endpoints.
- README.md, INCIDENTE.md, RIESGOS.md y GUIA-EXTENSION.md aún no están escritos.

## Si tuviera más tiempo

1. Medir el rendimiento con 540.000 filas y 20 concurrentes.
2. Automatizar la prueba de concurrencia con Testcontainers.
3. Implementar el tope de 20 sesiones y pedir a alguien que siga la guía.
4. Paginar por cursor y pasar el token a RS256.
5. Cambiar los scripts por migraciones versionadas.
