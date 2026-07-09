import express from 'express';
import sequelize from '../config/database.js';

const router = express.Router();

// GET /api/relevadores - Listar relevadores activos
router.get('/', async (req, res) => {
    try {
        const [relevadores] = await sequelize.query(
            'SELECT id, nombre, dni, email FROM relevadores WHERE activo = 1 ORDER BY nombre ASC'
        );
        
        res.json({
            success: true,
            data: relevadores
        });
    } catch (error) {
        console.error('Error al obtener relevadores:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor al cargar relevadores'
        });
    }
});

export default router;