# Autorizaciones ambulatorias — IPS-0412

Servidor en Spring Boot (Java 21) con PostgreSQL y cliente en Angular. Registra autorizaciones, liquida el pago del asegurado y lista las del día de la sede con el recaudo esperado.

## Requisitos

- Java 21
- Docker, para la base de datos
- Node.js y npm, para el cliente

## Ejecutar

### 1. Base de datos

```powershell
docker run -d --name pg-prueba -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=autorizaciones -p 5432:5432 postgres:16
```

### 2. Secreto del token

Copia `.env.example` a `.env` en la raíz y pon un valor de al menos 32 caracteres en `JWT_SECRET`. El servidor y el cliente leen el mismo archivo. `.env` no se sube a git.

### 3. Servidor

En la raíz del proyecto:

```powershell
.\gradlew.bat bootRun --args="--spring.profiles.active=dev"
```

En Linux o macOS usa `./gradlew`. Queda en `http://localhost:8080`. Al arrancar crea las tablas y carga los datos de ejemplo del enunciado.

### 4. Cliente

En otra terminal:

```powershell
cd frontend
npm install
npm start
```

Abre `http://localhost:4200` y elige un perfil:

- Auxiliar de admisión, sede IPS-0412: puede registrar y consultar.
- Auxiliar de caja, sede IPS-0412: solo consulta.
- Auxiliar de admisión, sede IPS-0188: para comprobar que cada usuario ve solo su sede.

`npm start` levanta también un servidor local que firma los tokens de prueba con el `JWT_SECRET` del `.env`. Es solo para desarrollo.

## Probar

Servidor, en la raíz:

```powershell
.\gradlew.bat test --tests "*RegistrarAutorizacionUseCaseTest" --tests "*AutorizacionControllerTest" --tests "*RegistroPeticionTest"
```

Cliente, en `frontend/`:

```powershell
npm test
npm run lint:arch
```

## Datos de ejemplo

Asegurados: `43876521`, `1036654782`, `71234890`, `32557019` y `1128450032`. El `1036654782` está en periodo de carencia: el servicio `883101` (resonancia) se rechaza hasta el 2026-12-09.

## Volver al estado inicial

Cada autorización que registras queda guardada y cambia los resultados de las siguientes. Para empezar de cero:

```powershell
docker rm -f pg-prueba
```

y vuelve a crear la base con el paso 1.

## Si algo falla

- El servidor no arranca y dice que falta `JWT_SECRET` o que es muy corto: revisa el `.env`.
- El puerto 8080 está ocupado: cierra la otra instancia o usa `--server.port=8081` y cambia el destino de `/api` en `frontend/proxy.conf.json`.
- Error al validar el esquema tras un cambio de columnas: recrea la base, porque los scripts no modifican tablas existentes.
