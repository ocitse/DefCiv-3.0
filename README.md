# Sistema de Gestión de Asistencia - Defensa Civil

Sistema web para la gestión integral de asistencia a familias afectadas por emergencias.

## � Cómo usar el sistema

### 1. Abrir el sistema
- Abrir `index.html` en tu navegador, o
- Ir directamente a `frontend/pages/login.html`

### 2. Iniciar sesión
- **Usuario:** `admin`
- **Contraseña:** `111`

### 3. Funcionalidades disponibles
- ✅ **Relevamientos** - Registrar necesidades de familias afectadas
- ✅ **Solicitudes** - Enviar pedidos a Desarrollo Social
- ✅ **Órdenes de Provisión** - Registrar aprobaciones/rechazos
- ✅ **Entregas** - Registrar distribución a familias
- ✅ **Inventario** - Control de stock en tiempo real
- ✅ **Reportes** - Generar informes por período

## 📁 Estructura del Proyecto

```
PP/
├── frontend/           # Código del cliente
│   ├── pages/          # HTML (login, dashboard)
│   ├── css/            # Estilos
│   ├── js/             # JavaScript
│   └── assets/         # Imágenes
│
├── backend/            # API (preparado para futuro)
│   ├── config/         # Configuración
│   ├── database/       # Scripts SQL
│   └── ...             # Modelos, controladores, rutas
│
└── legacy/             # Archivos antiguos
```

## 🔧 Tecnologías

- **Frontend:** HTML5, CSS3, Bootstrap 5, JavaScript ES6
- **Almacenamiento:** LocalStorage (temporal)
- **Backend (futuro):** Node.js, Express, MySQL

## 🎯 Flujo del Sistema (4 Momentos)

```
1. RELEVAMIENTO → 2. SOLICITUD → 3. ORDEN PROVISIÓN → 4. ENTREGA
```

## � Base de Datos

Script SQL disponible en: `backend/database/defcivilBD.sql`

---

**Proyecto Académico - Defensa Civil**  
Versión 1.0.0 | Diciembre 2025
