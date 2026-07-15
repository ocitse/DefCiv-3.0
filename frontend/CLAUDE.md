# Frontend — DefCiv 3.0

HTML + CSS + JavaScript vanilla con ES Modules. Sin framework, sin bundler, sin TypeScript, sin gestor de paquetes propio (Bootstrap 5, Bootstrap Icons, animate.css y pdfmake se cargan por CDN desde los `<script>`/`<link>` de cada página, no vía npm).

Visión general del proyecto en [../CLAUDE.md](../CLAUDE.md). Este archivo es solo la mitad frontend.

## Estructura

```
frontend/
├── css/          # index.css, login.css, configuracion.css — CSS plano, sin preprocesador
├── js/           # Un módulo ES por dominio (ver tabla abajo)
├── pages/        # Fragmentos HTML (páginas propias + fragmentos inyectados dinámicamente)
└── assets/       # logo.jpg
```

Puntos de entrada HTML (fuera de `frontend/`, en la raíz del repo):
- `portal.html` — landing pública, standalone, no forma parte del sistema.
- `index.html` — shell del sistema interno (sidebar + topbar + contenedor `.content-principal`), es el que arma el layout y monta los módulos.
- `frontend/pages/login.html` — página de login standalone (no vive dentro del shell de `index.html`).

## Patrón de "SPA" sin router

`index.html` no navega entre páginas reales: mantiene un layout fijo (sidebar/topbar) y cada sección inyecta HTML dentro de `.content-principal` (o `#contenedor-principal`, según el módulo) haciendo `fetch()` de un fragmento en `frontend/pages/*.html` y seteando `innerHTML`. Ver `cargarVistaDinamica()` en `frontend/js/relevamientos.js` como el ejemplo canónico del patrón; `solicitudes.js` y el `<script type="module">` inline de `index.html` repiten la misma idea de forma ad hoc (no está centralizado en una sola función reutilizable — si agregás un módulo nuevo, lo más consistente es copiar ese patrón, no inventar uno nuevo).

Los fragmentos HTML inyectados usan `onclick="funcion(...)"` inline, por lo que cada módulo cuelga sus funciones en `window.*` al final del archivo (bloque `if (typeof window !== 'undefined') { window.foo = foo; ... }`). Es necesario porque el HTML inyectado dinámicamente no tiene acceso a las funciones `export`adas de un `<script type="module">` a menos que se expongan explícitamente así.

## Módulos JS (`frontend/js/`)

| Archivo | Responsabilidad | Fuente de datos |
|---|---|---|
| `storage.js` | Wrapper de `localStorage` (clave `sistema_defensa_civil_data`) | — |
| `relevamientos.js` | Alta/edición/listado de Relevamientos y Familias (Niveles 1-3: relevamiento → familias → ficha) | **`localStorage` únicamente**, ver nota abajo |
| `solicitudes.js` | Lista relevamientos "en espera", envía solicitud, genera PDF con pdfmake y arma link de WhatsApp | API real (`/api/solicitudes/*`) |
| `usuarios.js` | CRUD de usuarios (tabla + modal) | API real (`/api/usuarios`) |
| `relevadores.js` | CRUD de relevadores (activar/desactivar, alta) | API real (`/api/relevadores`) |
| `ubicaciones.js` | Datos estáticos de departamentos/localidades (Santiago del Estero) para selects en cascada | Estático, hardcodeado |
| `permisos.js` | `MATRIZ_PERMISOS` por rol, usada solo para mostrar/ocultar UI | Estático |
| `ui.js` | `mostrarNotificacion()` (toast) + comportamiento del menú móvil | — |
| `login.js` | Submit del form de login, guarda `token`/`usuario` en `sessionStorage` | API real (`/api/auth/login`) |
| `cambiar-password.js` | Form de cambio de contraseña (modo obligatorio vs voluntario) | API real (`/api/auth/cambiar-password`) |

## ⚠️ Relevamientos/Familias viven en `localStorage`, no en la base de datos

Este es el punto más importante para no perder tiempo si te piden tocar algo de Relevamientos o Familias: **todo ese módulo (el archivo más grande del frontend, `relevamientos.js`) lee y escribe exclusivamente contra `localStorage`** vía `Storage.getData()`/`Storage.setData()`. Los IDs se generan en el cliente (`REV-12345`, `FAM-67890`, `Math.random()`). El backend expone endpoints REST completos y funcionales para relevamientos y familias (`POST/GET /api/relevamientos`, `POST/GET /api/familias`), pero **nada en el frontend los llama** — confirmado por búsqueda directa, cero referencias a esas rutas fuera del backend.

Consecuencia concreta: el tab de "Solicitudes" (`solicitudes.js`) sí pega contra la API real y consulta la tabla `relevamientos` de Postgres — pero como nada la puebla desde la UI, esa lista normalmente aparece vacía en un flujo end-to-end real. Si te piden "conectar Relevamientos a la base de datos" o "que las solicitudes muestren algo", el trabajo es cablear `relevamientos.js` para que use `fetch('/api/relevamientos', ...)` en vez de `Storage`, no un bug puntual a parchear.

## Autenticación en el cliente

`login.js` guarda `token` y `usuario` (JSON) en `sessionStorage` tras un login exitoso. El shell de `index.html` chequea que existan esas dos claves antes de mostrar el body (`display: none` hasta confirmar sesión) y redirige a `/` si faltan. **Este chequeo es puramente decorativo**: el `token` nunca se adjunta a ningún `fetch()` posterior (no hay headers `Authorization` en ningún módulo) y el backend no lo valida en ningún endpoint (ver [../backend/CLAUDE.md](../backend/CLAUDE.md)). No asumas que hay control de acceso real server-side basado en este token.

El primer login fuerza redirección a `cambiar-password.html` si `usuario.requiereCambioPass` es `true` (contraseña inicial = DNI, asignada en el alta desde `usuarios.js`/backend).

## Roles y permisos

`permisos.js` define `MATRIZ_PERMISOS` (mismos 4 roles que el backend: `administrador`, `administrativo`, `relevador`, `consulta`, todo en minúscula acá aunque en la base están capitalizados — normaliza con `.toLowerCase()`). Es una copia manual de la misma matriz que existe en `backend/middleware/authMiddleware.js`; si cambiás permisos, actualizá ambos archivos (no hay una fuente única).

## Convenciones a seguir si agregás un módulo nuevo

- Un archivo JS por dominio, con `export` para las funciones "públicas" usadas desde `index.html`/otros módulos, y un bloque final `window.x = x` para lo que se invoque desde `onclick` inline en HTML inyectado.
- Fragmentos de vista van en `frontend/pages/*.html`, cargados con `fetch()` + `innerHTML` (no hay templating, es texto HTML directo con placeholders vía template literals en JS para las filas de tablas).
- Feedback al usuario: `mostrarNotificacion(mensaje, tipo)` de `ui.js` (`'success' | 'error' | 'danger' | 'info' | 'warning'`) para toasts; varios módulos más viejos usan `alert()` nativo en su lugar (p. ej. partes de `usuarios.js`, `solicitudes.js`) — preferí `mostrarNotificacion` para código nuevo, es el patrón más reciente.
- No hay linter ni test runner configurado para el frontend.
