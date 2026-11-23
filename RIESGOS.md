# Riesgos técnicos

## R-01 Dos autorizaciones simultáneas del mismo asegurado

- **Probabilidad:** media. Con tres puestos por sede y filas de hasta 320 autorizaciones tras un festivo, dos auxiliares pueden atender al mismo asegurado casi a la vez.
- **Impacto:** alto. Cada una leería el mismo acumulado y cobraría dos veces el deducible, o superarían juntas el tope de desembolso.
- **Mitigación:** el registro bloquea la fila del asegurado (`SELECT ... FOR UPDATE`) y todo ocurre en una sola transacción: leer el acumulado, liquidar y guardar. La segunda solicitud espera y ve el acumulado ya actualizado. Con 8 solicitudes simultáneas el deducible sumó exactamente 350.000.
- **Pendiente:** la prueba es manual. Falta una prueba automática con base real (Testcontainers) que lance 20 solicitudes a la vez.

## R-02 El bloqueo puede encolar solicitudes y agotar conexiones

- **Probabilidad:** baja. Solo se encolan solicitudes del mismo asegurado, y los demás no se bloquean.
- **Impacto:** medio. Cada solicitud en espera retiene una conexión de la base. El pool es de 10 conexiones, y si varias esperan por el mismo asegurado pueden dejar sin conexión a las consultas de caja.
- **Mitigación actual:** la transacción solo contiene lo necesario: no hay llamadas externas dentro. Se bloquea una sola fila por transacción, así que no puede haber un bloqueo cruzado entre dos asegurados.
- **Pendiente:** no configuré un tiempo máximo de espera del bloqueo. Hoy una solicitud puede esperar indefinidamente si otra transacción se queda abierta. Hay que fijar `jakarta.persistence.lock.timeout` y dimensionar el pool con la prueba de carga.

## R-03 Registro duplicado por doble envío o reintento

- **Probabilidad:** media. La v1 ya registró dobles clics. Una red lenta o un reintento del navegador puede enviar la misma solicitud dos veces.
- **Impacto:** alto. Se crea una segunda autorización idéntica, se cobra de más al asegurado y la caja termina con un descuadre.
- **Mitigación actual:** solo en el cliente. El botón se deshabilita mientras se envía y la fachada ignora un segundo envío en curso. El cliente nunca reintenta un POST de forma automática.
- **Pendiente:** el servidor no lo impide. Una llamada directa a la API, o dos puestos distintos, crean dos autorizaciones. La solución es una clave de idempotencia enviada por el cliente y guardada con una restricción única. Tampoco hay una regla de negocio que impida dos autorizaciones del mismo servicio para el mismo asegurado, porque el enunciado no la define.

## R-04 Filas repetidas o faltantes al paginar el listado

- **Probabilidad:** baja tras el cambio. Era alta en la v1: el 3 de noviembre las páginas se solapaban porque entraban autorizaciones mientras caja paginaba.
- **Impacto:** alto. Una suma hecha con filas repetidas produjo un recaudo esperado distinto del cobrado.
- **Mitigación:** orden ascendente por `(fecha_hora, id)`, de modo que lo nuevo queda al final. Los totales salen de una consulta de todo el día, en la misma transacción que la página, y el cliente no suma filas.
- **Riesgo que queda:** la hora de la autorización se toma después del bloqueo, pero dos transacciones de asegurados distintos pueden confirmarse en un orden diferente al de sus horas, y una fila nueva podría quedar antes de otra ya vista. Es una ventana de milisegundos. La solución definitiva es paginar por cursor, que cambia el contrato.

## Otros

- **Rendimiento sin medir.** No he medido el p95 del POST con 20 concurrentes ni del GET con 540.000 filas. Los índices están definidos, pero no hay evidencia.
- **Secreto del token compartido.** HS256 obliga a que emisor y API conozcan el mismo secreto. En producción debe usarse RS256 con clave pública.
- **Esquema sin versiones.** Los scripts SQL no modifican tablas existentes y se ejecutan en cada arranque. Antes de producción hacen falta migraciones.
- **Autorizaciones modificables desde la base.** La inmutabilidad se aplica en la aplicación y con restricciones de la tabla, pero quien tenga acceso directo puede cambiar filas.
- **Pagos de otros canales desactualizados.** Si el core no actualiza el dato al renovar la póliza, se ignora y el acumulado queda más bajo de lo real.
