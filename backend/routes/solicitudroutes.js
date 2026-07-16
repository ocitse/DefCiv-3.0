// backend/routes/solicitudroutes.js
import express from 'express';
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Relevamiento from '../models/relevamiento.js';

const router = express.Router();

// 1. Obtener relevamientos en espera (los que están como 'Nuevo')
router.get('/en-espera', async (req, res) => {
    try {
        const enEspera = await Relevamiento.findAll({ 
            where: { estado: 'Nuevo' } 
        });
        res.json(enEspera);
    } catch (error) {
        console.error("Error al obtener relevamientos en espera:", error);
        res.status(500).json({ error: "Error al obtener relevamientos en espera" });
    }
});

// 2. Enviar solicitud: cambia el estado a 'En Proceso', guarda observaciones Y CREA LA PROVISIÓN AUTOMÁTICAMENTE
router.post('/', async (req, res) => {
    try {
        const { relevamientoId, observaciones } = req.body;
        
        if (!relevamientoId) {
            return res.status(400).json({ success: false, error: "Falta el ID del relevamiento." });
        }

        console.log(`Guardando solicitud del relevamiento ID: ${relevamientoId} con observaciones: ${observaciones}`);

        // A. Actualizamos el relevamiento a 'En Proceso'
        await Relevamiento.update(
            { 
                estado: 'En Proceso', 
                observaciones: observaciones 
            }, 
            { where: { id_relevamiento: relevamientoId } }
        );

        // B. Buscamos los datos del relevamiento para asignarlos al detalle y destino de la provisión
        const relevamientoInfo = await Relevamiento.findOne({
            where: { id_relevamiento: relevamientoId }
        });

        // C. ¡EL PUENTE AUTOMÁTICO HACIA PROVISIONES!
        const detalleInsumos = observaciones || 'Insumos / Ayuda solicitada según relevamiento';
        const destinoEntrega = relevamientoInfo ? (relevamientoInfo.direccion || 'Dirección no especificada') : 'Destino general';

        await sequelize.query(
            'INSERT INTO provisiones (solicitud_id, detalle, destino, estado) VALUES (?, ?, ?, "Enviado")',
            { 
                replacements: [relevamientoId, detalleInsumos, destinoEntrega], 
                type: QueryTypes.INSERT 
            }
        );

        console.log(`✅ Provisión creada automáticamente para el relevamiento ID: ${relevamientoId}`);

        res.status(201).json({ success: true, message: "Solicitud enviada y provisión generada correctamente." });
    } catch (error) {
        console.error("Error al guardar la solicitud y crear la provisión:", error);
        res.status(500).json({ success: false, error: "Error al procesar la solicitud" });
    }
});

// 3. Obtener el historial de solicitudes enviadas (los que pasaron a 'En Proceso' o 'Finalizado')
router.get('/historial', async (req, res) => {
    try {
        const historial = await Relevamiento.findAll({
            where: { estado: ['En Proceso', 'Finalizado'] },
            order: [['updated_at', 'DESC']]
        });
        res.json(historial);
    } catch (error) {
        console.error("Error al obtener el historial:", error);
        res.status(500).json({ error: "Error al obtener el historial de solicitudes" });
    }
});

export default router;