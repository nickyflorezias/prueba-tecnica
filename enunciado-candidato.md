# Prueba técnica — Desarrollador de Software (full-stack) — DS-FS-20261119-gqga

## 1. Antes de empezar

- Tienes 120 minutos desde que abres este documento. Registra en DECISIONES.md la hora de inicio, la hora en que terminaste la Parte 1 y la hora de fin.
- Lee todo el enunciado antes de empezar. Las tres partes son obligatorias.
- Tiempo sugerido: Parte 1 30 min · Parte 2 25 min · Parte 3 20 min · DECISIONES.md 12 min.
- Si el tiempo no alcanza, trabaja en este orden: Parte 1, Parte 2, Parte 3. Entrega lo que tengas y explica en DECISIONES.md qué faltó y cómo lo resolverías.
- No se espera: más de un corte vertical; diseño visual propio de alta fidelidad; despliegue en la nube; integración con proveedores reales de autenticación; más endpoints, pantallas o entidades de los indicados.
- Si algo es ambiguo, no preguntes: decide, documenta el supuesto en DECISIONES.md y sigue.
- Se valora la solución más adecuada para el contexto descrito: rendimiento, seguridad, mantenibilidad y buenas prácticas. Que funcione no basta.

## 2. Contexto de negocio

Seguros Andinos de Salud S. A. vende pólizas colectivas de salud; sus asegurados reciben servicios ambulatorios en 60 sedes de IPS con convenio. En cada sede, el auxiliar de admisión registra la autorización y el asegurado pasa a la caja, que le cobra su parte según el plan y al final del día cuadra lo cobrado con lo autorizado.

Los puestos de admisión son computadores compartidos por los tres turnos, con la pantalla a la vista de la fila. Mientras registra, el auxiliar se detiene a pedir el documento o la orden médica, o a atender el teléfono. Tras un festivo la fila se multiplica.

La v1 cobra a algunos asegurados más de lo que dice su plan, y auditoría abrió un caso por un faltante de caja. El corte empieza por la sede IPS-0412 de la Clínica Santa Lucía, en Medellín.

## 3. Objetivo

Construir el corte vertical (API, persistencia y pantalla) que registra las autorizaciones ambulatorias, liquida el pago del asegurado y lista las del día con el recaudo esperado; analizar el faltante de caja, registrar los riesgos y dejar el corte listo para extenderlo.

## 4. Datos iniciales y glosario

Estos son los únicos insumos de la prueba. No necesitas buscar información externa.

### 4.1 Datos de ejemplo

Sede IPS-0412, Clínica Santa Lucía, sede Laureles, Medellín. Datos sintéticos.

Plan Salud Integral Colectivo, el de todos los asegurados del ejemplo: deducible de 350.000 pesos, coaseguro del 15 %, tope de desembolso de 1.800.000 pesos por año de póliza y carencia de 90 días para los servicios de complejidad alta.

Tarifario convenido de la sede (configuración de la sede, no una entidad del corte):

| Código | Servicio | Valor por unidad | Complejidad |
|---|---|---|---|
| 890201 | Consulta de medicina general | 58.700 | baja |
| 890264 | Consulta de medicina especializada | 112.400 | baja |
| 931000 | Sesión de terapia física | 47.938 | baja |
| 883101 | Resonancia magnética de columna | 948.300 | alta |

Asegurados de ejemplo:

| Documento | Ingreso a la póliza | Inicio del año de póliza en curso | Pagos del asegurado en el año de póliza en curso por otros canales |
|---|---|---|---|
| 43876521 | 2019-03-01 | 2026-03-01 | 1.700.000 |
| 1036654782 | 2026-09-10 | 2026-09-10 | 0 |
| 71234890 | 2015-11-20 | 2025-11-20 | 120.000 |
| 32557019 | 2024-08-25 | 2026-08-25 | 0 |
| 1128450032 | 2021-07-14 | 2026-07-14 | 1.950.000 |

Los pagos por otros canales (reembolsos, hospitalización y otras redes) los informa el core de la aseguradora y pueden ir como dato inicial del asegurado.

Autorizaciones ya registradas en este sistema (hora de Colombia):

| Asegurado | Servicio | Cantidad | Pago del asegurado | Sede | Fecha y hora |
|---|---|---|---|---|---|
| 43876521 | 890264 | 1 | 16.860 | IPS-0412 | 2026-02-27 10:15 |
| 71234890 | 890201 | 1 | 58.700 | IPS-0188 (atención 24 horas) | 2025-11-19 21:30 |
| 71234890 | 931000 | 2 | 95.876 | IPS-0412 | 2026-06-10 10:20 |

Solicitudes del 19 de noviembre de 2026 en IPS-0412, en este orden:

| Solicitud | Documento | Servicio | Cantidad | Hora |
|---|---|---|---|---|
| S1 | 43876521 | 883101 | 1 | 08:05 |
| S2 | 1036654782 | 883101 | 1 | 08:20 |
| S3 | 71234890 | 931000 | 4 | 08:40 |
| S4 | 32557019 | 883101 | 1 | 09:10 |
| S5 | 43876521 | 890264 | 1 | 09:30 |
| S6 | 1128450032 | 890201 | 1 | 10:00 |

Operación: 60 sedes con convenio y unas 45.000 autorizaciones al mes; la tabla tendrá unas 540.000 en un año. Por sede y día: unas 38 autorizaciones en un día normal y hasta 320 en los días hábiles siguientes a un festivo y en las jornadas de salud de empresas colectivas, que desde enero de 2027 serán semanales. Cada sede tiene tres puestos de admisión y una caja. Las sedes atienden de 6:00 a 19:00, salvo las de atención 24 horas; las admisiones registran hasta el cierre y la caja hace el cuadre del día desde las 18:40.

Funcionamiento de la v1: la pantalla de cuadre lista las autorizaciones del día de la sede en páginas de 50, con el recaudo esperado.

Registros de la v1 del 3 de noviembre de 2026 (el 2 fue festivo), en hora de Colombia (API «api», base de datos «bd», tarea nocturna «tarea», caja «caja», auditoría, soporte y pantallas «pant-<puesto>»):

```text
10-31 00:10:00 tarea       RESUMEN sede=IPS-0412 dia=2026-10-30 autorizaciones=41 recaudo=2318400
10-31 00:10:01 tarea       RESUMEN sede=IPS-0412 ultimos_90_dias autorizaciones_dia_normal=38 dia_siguiente_festivo=286 jornada_empresa=320
11-03 06:00:00 api         INICIO version=v1.6.0 zona_horaria_servidor=UTC pool_bd=30
11-03 07:30:00 api         METRICAS cpu=21% mem=46% pool_bd=6/30 p95_post=210ms p95_get=95ms
11-03 09:12:44 api         POST /v1/autorizaciones 201 dur=180ms id=AU-51043 puesto=ADM-01 asegurado=XXXXXX2210 pago_asegurado=350000
11-03 09:12:45 pant-ADM-01 INFO doble clic en Autorizar ignorado; botón deshabilitado durante el envío
11-03 11:05:10 bd          WARN consulta lenta reporte_mensual_recobros dur=2.8s filas=1240388 origen=tarea_programada_sede_principal
11-03 12:00:00 api         METRICAS cpu=33% mem=51% pool_bd=9/30 p95_post=260ms p95_get=140ms
11-03 18:30:00 api         METRICAS cpu=24% mem=47% pool_bd=5/30 autorizaciones_dia_sede=286
11-03 18:40:05 api         GET /v1/autorizaciones?fecha=2026-11-03&pagina=1&tamano=50 200 dur=92ms total=286 primero=AU-51286 ultimo=AU-51237
11-03 18:40:06 pant-CAJA-1 INFO cuadre iniciado usuario=caja1 orden=mas_reciente_primero carga=al_llegar_al_final
11-03 18:40:52 api         GET /v1/autorizaciones?fecha=2026-11-03&pagina=2&tamano=50 200 dur=88ms total=286 primero=AU-51236 ultimo=AU-51187
11-03 18:41:30 api         POST /v1/autorizaciones 201 dur=230ms id=AU-51287 puesto=ADM-02 asegurado=XXXXXX7781 pago_asegurado=52300
11-03 18:42:10 api         GET /v1/autorizaciones?fecha=2026-11-03&pagina=3&tamano=50 200 dur=90ms total=287 primero=AU-51187 ultimo=AU-51138
11-03 18:43:02 api         POST /v1/autorizaciones 201 dur=210ms id=AU-51288 puesto=ADM-03 asegurado=XXXXXX0954 pago_asegurado=0
11-03 18:43:15 api         POST /v1/autorizaciones 201 dur=240ms id=AU-51289 puesto=ADM-02 asegurado=XXXXXX3318 pago_asegurado=147200
11-03 18:44:20 api         GET /v1/autorizaciones?fecha=2026-11-03&pagina=4&tamano=50 200 dur=94ms total=289 primero=AU-51139 ultimo=AU-51090
11-03 18:45:30 api         GET /v1/autorizaciones?fecha=2026-11-03&pagina=5&tamano=50 200 dur=91ms total=289 primero=AU-51089 ultimo=AU-51040
11-03 18:46:30 api         GET /v1/autorizaciones?fecha=2026-11-03&pagina=6&tamano=50 200 dur=85ms items=39 total=289 primero=AU-51039 ultimo=AU-51001
11-03 18:46:31 pant-CAJA-1 INFO cuadre filas_cargadas=289 recaudo_esperado=15052700
11-03 18:50:12 caja        CIERRE sede=IPS-0412 usuario=caja1 efectivo_y_datafono=14862300 diferencia=-190400
11-03 18:50:13 pant-CAJA-1 WARN cuadre con faltante=190400; se notifica a auditoría
11-03 18:55:00 api         METRICAS cpu=11% mem=42% pool_bd=2/30 p95_get=97ms
11-04 00:10:00 tarea       RESUMEN sede=IPS-0412 dia=2026-11-03 autorizaciones=289 recaudo=14862300
11-04 08:15:22 auditoria   CASO faltante=190400 sede=IPS-0412 dia=2026-11-03 responsable=caja1 estado=en_investigacion
11-04 09:02:10 soporte     NOTA caja1 afirma que contó dos veces y que ningún paciente se fue sin pagar
11-04 09:30:41 bd          CONSULTA autorizaciones sede=IPS-0412 dia=2026-11-03 filas=289 ids_distintos=289
11-04 09:31:05 bd          CONSULTA coaseguros_con_fraccion sede=IPS-0412 dia=2026-11-03 filas=17 efecto_redondeo_total=+3
11-04 09:40:00 api         INFO zona_horaria_servidor=UTC; fecha=2026-11-03 filtra de 2026-11-03T00:00Z a 2026-11-04T00:00Z
11-04 09:41:12 pant-CAJA-1 INFO version_app=1.9.4 tamano_pagina=50 navegador=Edge
```

### 4.2 Contrato de API o sistema bajo prueba

Cada petición lleva el token de sesión (Authorization: Bearer). El token identifica al usuario, su rol (AUXILIAR_ADMISION o AUXILIAR_CAJA) y su sede. Solo existen estos dos endpoints. El core de la aseguradora queda fuera del corte: asegurados, pagos por otros canales y tarifario se manejan en tu base de datos o en configuración.

```text
POST /api/v1/autorizaciones                                   solo AUXILIAR_ADMISION
Cuerpo:
{
  "documento_asegurado": "43876521",     6 a 10 dígitos
  "codigo_servicio": "883101",           uno del tarifario de la sede
  "cantidad": 1                          entero entre 1 y 10
}
201: Autorizacion
400: { "errores": [ { "campo": "cantidad", "mensaje": "..." } ] }
403: el rol no puede registrar
404: el documento no corresponde a un asegurado de la póliza
409: { "codigo": "EN_CARENCIA", "mensaje": "...", "disponible_desde": "AAAA-MM-DD" }

GET /api/v1/autorizaciones?fecha=2026-11-19&pagina=1&tamano=50     de la sede de la sesión; tamano máximo 50
200: { "items": [ Autorizacion ], "pagina": 1, "tamano": 50, "total": 41,
       "valor_total": 6874300, "recaudo_esperado": 2318400, "calculado_en": "2026-10-30T18:40:00-05:00" }

Autorizacion:
{
  "id": "AU-...",
  "asegurado_enmascarado": "XXXX6521",
  "servicio": { "codigo": "...", "nombre": "...", "complejidad": "baja | alta" },
  "cantidad": ...,
  "valor": ...,
  "deducible": ...,
  "coaseguro": ...,
  "pago_asegurado": ...,
  "pago_aseguradora": ...,
  "sede": "IPS-0412",
  "fecha_hora": "..."
}
```

### 4.3 Glosario del dominio

- Asegurado: persona cubierta por la póliza colectiva de salud de su empleador.
- Auxiliar de admisión (AUXILIAR_ADMISION): registra la autorización en el puesto de admisión antes de que el asegurado pase a caja. Auxiliar de caja (AUXILIAR_CAJA): cobra el pago del asegurado y hace el cuadre de caja; consulta las autorizaciones de su sede, no las registra.
- Autorización: aprobación de la aseguradora para prestar un servicio ambulatorio a un asegurado en una sede. Liquida cuánto paga el asegurado en caja y cuánto paga la aseguradora a la IPS. No se modifica ni se elimina.
- Valor del servicio: valor por unidad del tarifario de la sede por la cantidad.
- Año de póliza: periodo de 12 meses que empieza en cada renovación anual de la póliza del asegurado, en hora de Colombia. El deducible y el tope de desembolso se acumulan por año de póliza y se reinician en cada renovación.
- Deducible: lo primero que paga el asegurado en cada año de póliza. Mientras no complete el deducible del plan, paga el valor de los servicios hasta completarlo.
- Coaseguro: porcentaje del plan sobre la parte del valor del servicio que excede el deducible pendiente. Se liquida en pesos enteros, redondeando al peso más cercano.
- Tope de desembolso: lo máximo que paga el asegurado en un año de póliza, sumando deducible y coaseguro de todos los canales (autorizaciones en cualquier sede, reembolsos y hospitalización). Al alcanzarlo, la aseguradora paga el 100 % por el resto del año de póliza.
- Periodo de carencia: días contados desde el ingreso del asegurado a la póliza durante los cuales no se autorizan servicios de complejidad alta.
- Pago del asegurado: deducible más coaseguro de la autorización; lo cobra la caja de la sede. Pago de la aseguradora: valor del servicio menos el pago del asegurado.
- Recaudo esperado: suma de los pagos del asegurado de las autorizaciones del día de la sede. En el cuadre de caja, la caja lo compara con lo cobrado en efectivo y datáfono.
- Datos de salud: el servicio autorizado a una persona identificable es un dato sensible (Ley 1581 de 2012).


## 5. Lo que debes resolver

### 5.1 Parte 1: Corte vertical: API y persistencia (30 min)

Construir desde cero los 2 endpoints y las 2 entidades descritos, con sus reglas de negocio y pruebas.

La API registra cada autorización, verifica la carencia, liquida el pago con los datos de 4.1 y lista las autorizaciones del día de la sede con sus totales. Las pruebas cubren las seis solicitudes del 19 de noviembre, en orden, y sus bordes.

Entregables de esta parte: código del servidor, pruebas del servidor, README.md.

### 5.2 Parte 2: Corte vertical: interfaz (25 min)

Construir la pantalla y el formulario que consumen tu API, con validación coherente en cliente y servidor, accesibilidad WCAG 2.2 AA y protección de los datos sensibles en ambas capas.

Una pantalla para el puesto: arriba, el formulario de autorización (documento, servicio y cantidad), solo para el auxiliar de admisión; debajo, las autorizaciones del día de la sede, paginadas, con el pago del asegurado y el recaudo esperado. Al autorizar, muestra cuánto paga el asegurado y cuánto la aseguradora, o desde qué fecha se puede autorizar si hay carencia. Los errores indican qué campo corregir sin volver a digitar lo que estaba bien.

Entregables de esta parte: código del cliente, pruebas del cliente.

### 5.3 Parte 3: Incidente, riesgos y extensión (20 min)

Analizar el incidente descrito, que cruza cliente y servidor, registrar los riesgos técnicos y dejar una guía para que un desarrollador junior extienda el corte.

El 3 de noviembre, día hábil siguiente a un festivo, el cuadre de caja de IPS-0412 mostró un faltante de 190.400 pesos. La cajera afirma que contó dos veces y nadie se fue sin pagar; auditoría abrió el caso a su nombre; desarrollo sospecha de la zona horaria UTC del servidor, e infraestructura, que la API estuvo estable.

En INCIDENTE.md documenta hipótesis, la evidencia que descarta cada una, causa raíz, capa y cómo tu corte evita que se repita; en RIESGOS.md, los riesgos técnicos con probabilidad, impacto y mitigación. La aseguradora limitará a 20 las sesiones de terapia física por asegurado y año de póliza: GUIA-EXTENSION.md debe permitir que un desarrollador recién llegado lo agregue en ambas capas sin ayuda.

Entregables de esta parte: INCIDENTE.md, RIESGOS.md, GUIA-EXTENSION.md.


## 6. Requisitos no funcionales y restricciones

- Rendimiento: POST p95 ≤ 300 ms con 20 concurrentes; GET p95 ≤ 200 ms por página con 320 autorizaciones del día y 540.000 en la tabla.
- Consistencia: dos autorizaciones simultáneas del mismo asegurado no cobran dos veces el deducible ni superan el tope.
- Seguridad de la clínica: la sesión del puesto se cierra tras 3 minutos sin actividad. La emite el proveedor de identidad, fuera del corte: tu API valida el token y tu cliente la simula.
- Ley 1581 de 2012: los datos de salud son sensibles; nada del asegurado queda en el navegador ni en su caché; la API y la pantalla enmascaran el documento.
- Acceso: solo el auxiliar de admisión registra; cada usuario ve solo su sede. Una autorización no se modifica ni se elimina.
- Cliente: escritorio de 1366 × 768 con Chrome, Edge o Firefox; hay auxiliares con lector de pantalla o ampliación al 200 %. WCAG 2.2 AA.
- Tecnología aprobada por IAS, ejecutable localmente.

## 7. Verificación y calidad

Tu entrega debe incluir pruebas automatizadas que se ejecuten con un solo comando documentado en el README, y al menos una verificación no funcional: una medición de rendimiento del endpoint más exigido y una revisión automática de accesibilidad de la pantalla. Indica en DECISIONES.md qué probaste, qué no y por qué.

## 8. Registro de decisiones

DECISIONES.md es obligatorio y se evalúa tanto como la solución. Registra cada decisión que tomes, no solo las grandes: tecnología, arquitectura, patrones, diseño, datos, seguridad, rendimiento, pruebas y lo que decidiste no hacer. Para cada una explica qué alternativas consideraste y por qué elegiste la tuya en este contexto. En la sustentación tendrás que defender cada decisión registrada.

```markdown
# Registro de decisiones — DS-FS-20261119-gqga
Inicio: <hora> · Fin de la Parte 1: <hora> · Fin: <hora>

## Supuestos
| # | Supuesto | Por qué lo asumí | Qué cambiaría si es falso |
|---|---|---|---|

## Decisiones
### D-01 <Título corto>
- **Tema:** stack | arquitectura | patrón | diseño | datos | seguridad | rendimiento | pruebas | operación | proceso | otro
- **Contexto:** qué problema o restricción obliga a decidir.
- **Alternativas consideradas:** al menos dos, con pros y contras en este contexto.
- **Decisión:** qué elegí.
- **Por qué:** la razón determinante, con datos del enunciado si aplica.
- **Consecuencias y trade-offs:** qué gano, qué sacrifico, qué deuda acepto.
- **Dónde se ve:** archivo, componente, commit o artefacto.

(Una entrada por cada decisión: no solo las grandes. Incluye lo que decidiste no hacer.)

## Lo que dejé fuera y por qué

## Si tuviera más tiempo
```

## 9. Uso de IA

Puedes usar asistentes de IA durante la prueba. No necesitas entregar tus conversaciones con la IA.
Ten presente que la evaluación no termina con la entrega. En una sustentación de 30 minutos, sin asistencia de IA, tendrás que:
- explicar tu solución de memoria y recorrerla sin ayuda;
- defender cada decisión de DECISIONES.md y las alternativas que descartaste;
- adaptar tu solución en vivo a un cambio que se te planteará;
- responder por cualquier parte de lo que entregaste.

Lo que no puedas explicar o defender en la sustentación no cuenta como evidencia, aunque esté en la entrega. Usa la IA como apoyo, pero toma tú cada decisión y asegúrate de entender todo lo que entregas.

## 10. Criterio de completitud

Tu prueba está completa cuando se cumple todo lo siguiente:
- Parte 1: Los endpoints responden según las reglas de negocio y sus pruebas pasan con un solo comando.
- Parte 2: La pantalla y el formulario funcionan contra tu API, la validación es coherente en ambas capas y las pruebas pasan.
- Parte 3: INCIDENTE.md ubica la causa raíz en la capa correcta con evidencia y GUIA-EXTENSION.md permite extender el corte sin ayuda.
- DECISIONES.md registra cada decisión con sus alternativas y las tres horas.

Una parte incompleta se evalúa por lo que muestra; lo que no alcanzaste a hacer se explorará en la sustentación.

## 11. Entrega

Entrega un repositorio Git con commits pequeños y descriptivos (la historia de commits se revisa) y un README con los comandos para instalar, ejecutar y probar.

Archivos obligatorios:
- `README.md`
- `DECISIONES.md`
- `INCIDENTE.md`
- `RIESGOS.md`
- `GUIA-EXTENSION.md`
