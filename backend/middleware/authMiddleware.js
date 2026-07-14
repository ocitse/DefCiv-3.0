// backend/middleware/authMiddleware.js
export function verificarRolPermitido(seccionRequerida) {
    return (req, res, next) => {
        // Asumiendo que guardaste los datos del usuario logueado en req.user (vía JWT o sesión)
        const rolUsuario = req.user ? req.user.rol.toLowerCase() : '';
        
        // Mapeo idéntico al del frontend
        const permisos = {
            administrador: ['dashboard', 'relevadores', 'usuarios', 'configuracion', 'reportes'],
            administrativo: ['dashboard', 'relevadores', 'reportes'],
            relevador: ['dashboard', 'relevadores'],
            consulta: ['dashboard']
        };

        if (permisos[rolUsuario] && permisos[rolUsuario].includes(seccionRequerida)) {
            next();
        } else {
            res.status(403).json({ success: false, message: 'Acceso no autorizado para este rol.' });
        }
    };
}

// Uso en usuarioroutes.js:
// router.post('/', verificarRolPermitido('usuarios'), crearUsuario);