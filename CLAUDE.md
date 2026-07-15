# DefCiv 3.0 — Sistema de Gestión de Asistencia (Defensa Civil)

Sistema web para el registro y seguimiento de relevamientos de emergencias y las familias afectadas, con un flujo de "Solicitudes" hacia Desarrollo Social. Proyecto académico, en producción liviana (Alwaysdata).

Este repo es un monorepo simple, sin build step: `backend/` (API Express) y `frontend/` (HTML/CSS/JS vanilla) conviven en la misma raíz y el propio backend sirve los archivos del frontend como estáticos.

Para trabajar en cada mitad por separado usá:
- [backend/CLAUDE.md](backend/CLAUDE.md) — API, modelos, rutas, base de datos
- [frontend/CLAUDE.md](frontend/CLAUDE.md) — vistas, JS de cliente, patrones de UI

> El `README.md` de la raíz está desactualizado (menciona MySQL/MySQL Workbench, un `backend/package.json` propio y un script SQL que ya no existen). No confíes en él — este archivo y los de `backend/`/`frontend/` reflejan el estado real del código a 2026-07-15.

## Stack real (verificado en código, no en README)

- **Backend:** Node.js (ESM, `"type": "module"`), Express 4, Sequelize 6 sobre **PostgreSQL** (migrado desde MySQL recientemente — commit `bd8c46b "Actualizar Sequelize a Postgres"`).
- **Frontend:** HTML5 + Bootstrap 5 (CDN) + JavaScript vanilla con ES Modules. Sin framework (no React/Vue/Angular), sin bundler, sin TypeScript.
- **Auth:** bcryptjs + jsonwebtoken, pero ver limitación crítica más abajo.
- Un único `package.json` en la raíz cubre todas las dependencias (no hay `backend/package.json` separado pese a lo que dice el README).

## Cómo correr en local

```bash
npm install
npm run dev          # nodemon backend/app.js — sirve API + estáticos en :3000
```

No hace falta correr `npm run frontend` (live-server) para uso normal: `backend/app.js` ya sirve todo el frontend de forma estática. Ese script queda como alternativa para iterar solo sobre HTML/CSS sin backend.

Variables de entorno esperadas (`.env`, no versionado): `DATABASE_URL` (si es Render/Postgres remoto) o `DB_NAME`/`DB_USER`/`DB_PASS`/`DB_HOST`/`DB_PORT`, más `JWT_SECRET` y `PORT`. Detalle en [backend/CLAUDE.md](backend/CLAUDE.md).

## Rutas de entrada servidas por `backend/app.js`

- `/` → `portal.html` (landing pública, fuera del sistema).
- `/sistema` → `index.html` (shell del sistema interno, requiere sesión vía `sessionStorage`).
- `/api/*` → rutas REST (ver backend).
- Cualquier otra ruta no-API → redirige a `portal.html` (comodín).

## Hechos arquitectónicos importantes (para no perder tiempo re-descubriéndolos)

1. **La autenticación es solo de fachada en el cliente.** El login emite un JWT y lo guarda en `sessionStorage`, pero **ningún endpoint del backend valida ese token ni el rol del usuario**. `backend/middleware/authMiddleware.js` define `verificarRolPermitido()` pero no está importado ni usado en ninguna ruta. Todas las rutas `/api/*` están abiertas a quien las llame directamente. La matriz de permisos por rol (`frontend/js/permisos.js`) es puramente decorativa a nivel de UI.
2. **Relevamientos y Familias viven en `localStorage` del navegador, no en la base de datos.** `frontend/js/relevamientos.js` (el archivo más grande del frontend, ~980 líneas) gestiona toda la carga/edición de relevamientos y familias contra `frontend/js/storage.js` (clave `sistema_defensa_civil_data`), generando IDs client-side (`REV-xxxxx`, `FAM-xxxxx`). El backend sí tiene endpoints REST completos para esto (`POST/GET /api/relevamientos`, `POST/GET /api/familias`), pero **el frontend nunca los llama** (verificado, cero referencias). Consecuencia práctica: el módulo de "Solicitudes" (`/api/solicitudes/en-espera`) consulta la tabla `relevamientos` de Postgres, que en el flujo actual normalmente está vacía porque nada la puebla desde la UI.
3. **La tabla `relevadores` no tiene modelo Sequelize.** `backend/routes/relevadorroutes.js` le pega con SQL crudo (`sequelize.query`) asumiendo que la tabla ya existe en la base. Como no es un modelo registrado, `sequelize.sync()` en `app.js` no la crea ni la altera — si falta en una base nueva, esas rutas van a fallar.
4. Los módulos de **Usuarios, Relevadores, Solicitudes y Auth sí usan la API real** de punta a punta.

Si vas a tocar el flujo de relevamientos/familias, decidí primero si el objetivo es conectar esa parte a la base de datos real (hay backend ya construido para eso) o seguir con localStorage — son dos mundos separados hoy.

## Roles del sistema

`Administrador`, `Administrativo`, `Relevador`, `Consulta` (definidos en el ENUM del modelo `Usuario` y duplicados manualmente en `frontend/js/permisos.js` y `backend/middleware/authMiddleware.js`). Si agregás/cambiás un rol, actualizá los tres lugares — no hay una única fuente de verdad.

## Notas de seguridad conocidas (no arreglar sin que te lo pidan explícitamente)

- `JWT_SECRET` tiene un fallback hardcodeado (`'clave_secreta_defensa_civil'`) en `authcontroller.js` si la env var no está seteada.
- Ver punto 1 arriba: no hay verificación de JWT/rol server-side en ningún endpoint.
- `.vscode/sftp.json` contenía credenciales de despliegue en texto plano; ya se agregó a `.gitignore` y se destrackeó del repo (pendiente: rotar la contraseña en Alwaysdata, porque quedó expuesta en el historial de git ya pusheado a GitHub).

## Despliegue

Vía SFTP a Alwaysdata (`ssh-defenprov.alwaysdata.net`, `uploadOnSave` configurado en `.vscode/sftp.json`). No hay CI/CD.
