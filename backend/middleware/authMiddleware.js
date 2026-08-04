// backend/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_defensa_civil';

// 1. Middleware para verificar que el usuario envió un token JWT válido
export const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({ success: false, message: 'Acceso denegado. No se proporcionó token.' });
    }

    const token = authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token malformado.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Guardamos los datos del usuario en req.user
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Token inválido o expirado.' });
    }
};

// 2. Middleware para controlar el acceso por roles a secciones/recursos específicos
export const verificarRolPermitido = (seccionRequerida) => {
    return (req, res, next) => {
        // Obtenemos el rol del usuario (normalizado a minúsculas)
        const rolUsuario = req.user && req.user.rol ? req.user.rol.toLowerCase() : '';
        
        // Mapeo adaptado a los recursos reales de tu sistema
        const permisos = {
            administrador: ['usuarios', 'relevamientos', 'familias', 'relevadores', 'solicitudes', 'provisiones'],
            operador: ['relevamientos', 'familias', 'solicitudes', 'provisiones'],
            relevador: ['relevamientos', 'familias'],
            consulta: ['relevamientos']
        };

        if (permisos[rolUsuario] && permisos[rolUsuario].includes(seccionRequerida)) {
            next();
        } else {
            res.status(403).json({ success: false, message: 'Acceso no autorizado para este rol en esta sección.' });
        }
    };
};