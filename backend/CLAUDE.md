# Backend — DefCiv 3.0

API REST en Express 4 + Sequelize 6 sobre PostgreSQL. ESM puro (`"type": "module"` en el `package.json` de la raíz — usá `import`/`export`, no `require`).

Visión general del proyecto en [../CLAUDE.md](../CLAUDE.md). Este archivo es solo la mitad backend.

## Estructura

```
backend/
├── app.js                    # Entry point: middlewares, rutas de vistas, estáticos, API, arranque
├── config/database.js        # Conexión Sequelize (Postgres)
├── models/                   # usuario.js, relevamiento.js, familia.js
├── controllers/               # Lógica de negocio por entidad
├── routes/                   # Definición de endpoints Express Router
└── middleware/authMiddleware.js  # Definido pero NO usado en ninguna ruta (ver abajo)
```

No hay carpeta `backend/database/` con SQL (el script `npm run db:create` del `package.json` raíz apunta a un archivo `backend/database/defcivilBD.sql` que no existe — es resto de una versión anterior con MySQL).

## Base de datos

`config/database.js` decide el modo de conexión según entorno:
- Si existe `process.env.DATABASE_URL` → se conecta así (pensado para Render), con SSL forzado (`rejectUnauthorized: false`).
- Si no, arma la conexión con `DB_NAME`/`DB_USER`/`DB_PASS`/`DB_HOST`/`DB_PORT` (default puerto `5432`).

En ambos casos: `dialect: 'postgres'`, `define: { timestamps: true, underscored: true }` (los modelos usan `createdAt`/`updatedAt` en JS pero columnas `created_at`/`updated_at` en la tabla).

`app.js` llama `sequelize.authenticate()` y luego `sequelize.sync()` al arrancar — **solo sincroniza los modelos registrados** (`Usuario`, `Relevamiento`, `Familia`). La tabla `relevadores`, usada con SQL crudo en `routes/relevadorroutes.js`, no tiene modelo Sequelize y por lo tanto no la crea `sync()`; tiene que existir de antemano en la base.

## Modelos

- **`Usuario`** (`models/usuario.js`, tabla `usuarios`): PK expuesta como `id` pero mapea a columna `id_usuario`. Password en columna `password_hash` (campo JS `password`). Roles ENUM: `Administrador | Administrativo | Relevador | Consulta`. `estado` ENUM: `Activo | Inactivo | Baja` (baja lógica). `requiereCambioPass` fuerza cambio de clave en el primer login (contraseña inicial = DNI, ver `usuariocontroller.crearUsuario`).
- **`Relevamiento`** (`models/relevamiento.js`, tabla `relevamientos`): PK `id_relevamiento`. `estado` ENUM incluye valores mixtos en minúscula/mayúscula heredados de distintas iteraciones: `'en-espera' | 'enviado' | 'Nuevo' | 'En Proceso' | 'Finalizado'` — cuidado al comparar estados, no está normalizado.
- **`Familia`** (`models/familia.js`, tabla `familias`): PK `id_familia`, `belongsTo(Relevamiento)` vía FK `id_relevamiento`, `onDelete: 'CASCADE'` desde el lado de `Relevamiento.hasMany`.
- **`relevadores`**: sin modelo Sequelize, accedida solo con SQL crudo (`SELECT/INSERT/UPDATE` directos en `relevadorroutes.js`).

Nota de estilo: los archivos de modelo importan/exportan con casing inconsistente entre sí (`Usuario` en mayúscula vs `familia`/`relevamiento` en minúscula) — los controladores a veces re-importan el mismo modelo con distinto casing (`usuariocontroller.js` importa `Usuario`, `relevamientocontroller.js` importa `relevamiento`). Funciona porque los nombres de archivo en disco son case-sensitive pero los imports coinciden exactamente; si agregás un modelo nuevo, elegí un casing y sé consistente en vez de replicar la mezcla existente.

## Endpoints

| Método | Ruta | Controlador/handler | Notas |
|---|---|---|---|
| POST | `/api/auth/register` | `authcontroller.registrar` | Alta de usuario con password propia |
| POST | `/api/auth/login` | `authcontroller.login` | Devuelve JWT (8h) + datos de usuario |
| POST | `/api/auth/cambiar-password` | `authcontroller.cambiarPassword` | Requiere `id_usuario`, `passwordActual`, `passwordNueva` en el body |
| GET | `/api/usuarios` | `usuariocontroller.obtenerUsuarios` | Excluye `estado = 'Baja'` |
| POST | `/api/usuarios` | `usuariocontroller.crearUsuario` | Password inicial = DNI hasheado |
| PUT | `/api/usuarios/:id` | inline en `usuarioroutes.js` | Actualiza datos y rol |
| PUT | `/api/usuarios/:id/estado` | inline en `usuarioroutes.js` | Toggle Activo/Inactivo |
| GET | `/api/relevamientos` | `relevamientocontroller.obtenerrelevamientos` | **No consumido por el frontend actualmente** |
| POST | `/api/relevamientos` | `relevamientocontroller.crearrelevamiento` | **No consumido por el frontend actualmente** |
| GET | `/api/familias` | `familiacontroller.obtenerFamilias` | Incluye JOIN con `Relevamiento`. **No consumido por el frontend actualmente** |
| POST | `/api/familias` | `familiacontroller.crearFamilia` | Valida que `id_relevamiento` exista. **No consumido por el frontend actualmente** |
| GET | `/api/relevadores` | inline en `relevadorroutes.js` | Solo `activo = 1`, para selects |
| GET | `/api/relevadores/admin` | inline en `relevadorroutes.js` | Todos, para pantalla de configuración |
| POST | `/api/relevadores` | inline en `relevadorroutes.js` | Valida DNI único |
| PUT | `/api/relevadores/:id/estado` | inline en `relevadorroutes.js` | Toggle activo/inactivo |
| GET | `/api/solicitudes/en-espera` | inline en `solicitudroutes.js` | `Relevamiento` con `estado = 'Nuevo'` |
| POST | `/api/solicitudes` | inline en `solicitudroutes.js` | Cambia `estado` a `'En Proceso'` |
| GET | `/api/solicitudes/historial` | inline en `solicitudroutes.js` | `estado` en `['En Proceso','Finalizado']` |
| GET | `/api/status` | inline en `app.js` | Health check |

Convención de respuesta **no uniforme** entre controladores: unos devuelven `{ mensaje, ... }` (auth, relevamientos, familias), otros `{ success, message, data }` (usuarios, relevadores, solicitudes). Si agregás un endpoint nuevo, elegí el formato `{ success, message, data }` (es el que domina en código más reciente) en vez de introducir un tercer estilo.

## Auth — limitación crítica a tener presente

`middleware/authMiddleware.js` exporta `verificarRolPermitido(seccion)`, pensado para usarse como middleware de ruta (`router.post('/', verificarRolPermitido('usuarios'), crearUsuario)`, según el comentario en el propio archivo), pero **no está importado en ningún archivo de `routes/`**. Ningún endpoint valida el JWT (`jwt.verify`) en el request. El login genera el token y el cliente lo guarda, pero nunca lo reenvía en headers `Authorization` — confirmado, no hay ninguna referencia a `Authorization`/`Bearer` en el proyecto. Si te piden "proteger" un endpoint, hay que: 1) crear un middleware real de verificación de JWT (no existe todavía, solo el de rol que asume `req.user` ya poblado), 2) aplicarlo en las rutas, 3) hacer que el frontend mande el token. Esto no está implementado hoy, no asumas que sí.

## Variables de entorno (`.env`, gitignored)

```
DATABASE_URL=...        # o alternativamente:
DB_NAME=...
DB_USER=...
DB_PASS=...
DB_HOST=...
DB_PORT=5432
JWT_SECRET=...          # si falta, cae a un valor hardcodeado inseguro
PORT=3000
```

## Comandos

```bash
npm run dev      # nodemon backend/app.js (desde la raíz del repo)
npm start        # node backend/app.js
```
