import express from 'express';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';

const router = express.Router();

// GET /api/provisiones - Listar todas las provisiones / envíos pendientes o cerrados
router.get('/', async (req, res) => {
    try {
        // Puedes adaptarlo a una tabla propia de provisiones o filtrar de solicitudes
        const provisiones = await sequelize.query(
            'SELECT * FROM provisiones ORDER BY id DESC',
            { type: QueryTypes.SELECT }
        );
        res.json({ success: true, data: provisiones });
    } catch (error) {
        console.warn('⚠️ La tabla provisiones no existe o está vacía, devolviendo vacío.');
        res.json({ success: true, data: [] });
    }
});

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

// PUT /api/provisiones/:id/cerrar - Registrar el retorno y cerrar el circuito
router.put('/:id/cerrar', async (req, res) => {
    const { id } = req.params;
    const { estado_retorno, observaciones } = req.body; // Ej: "Entregado con éxito", "Rechazado"

    try {
        await sequelize.query(
            'UPDATE provisiones SET estado = ?, observaciones = ?, fecha_cierre = CURRENT_TIMESTAMP WHERE id = ?',
            { replacements: [estado_retorno, observaciones, id], type: QueryTypes.UPDATE }
        );
        res.json({ success: true, message: 'Circuito de provisión cerrado correctamente.' });
    } catch (error) {
        console.error('Error al cerrar provisión:', error);
        res.status(500).json({ success: false, message: 'Error al cerrar el circuito' });
    }
});

export default router;