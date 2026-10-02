import express from 'express';
// 🌟 Importamos la función mejorada desde el controlador
import { obtenerProvisiones, cerrarProvision } from '../controllers/provisionesController.js';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';

const router = express.Router();

// GET /api/provisiones - Listar todas las provisiones (Llamando al controlador con el LEFT JOIN)
router.get('/', obtenerProvisiones);

// POST /api/provisiones - Crear una provisión a partir de una solicitud aprobada
router.post('/', async (req, res) => {
    const { solicitud_id, detalle, destino } = req.body;
    try {
        await sequelize.query(
            'INSERT INTO provisiones (solicitud_id, detalle, destino, estado) VALUES (?, ?, ?, "Enviado")',
            { replacements: [solicitud_id, detalle, destino], type: QueryTypes.INSERT }
        );
        res.json({ success: true, message: 'Provisión registrada y enviada para entrega.' });
    } catch (error) {
        console.error('Error al registrar provisión:', error);
        res.status(500).json({ success: false, message: 'Error al registrar la provisión' });
    }
});

// PUT /api/provisiones/:id/cerrar - Registrar el retorno y cerrar el circuito (Llamando al controlador)
router.put('/:id/cerrar', cerrarProvision);

export default router;