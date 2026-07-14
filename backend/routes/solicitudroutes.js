// backend/routes/solicitudroutes.js
import express from 'express';
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

// 2. Enviar solicitud: cambia el estado a 'En Proceso' y guarda las observaciones
router.post('/', async (req, res) => {
    try {
        const { relevamientoId, observaciones } = req.body;
        
        if (!relevamientoId) {
            return res.status(400).json({ success: false, error: "Falta el ID del relevamiento." });
        }

        console.log(`Guardando solicitud del relevamiento ID: ${relevamientoId} con observaciones: ${observaciones}`);

        // Actualizamos usando 'id_relevamiento' (tu clave primaria real)
        await Relevamiento.update(
            { 
                estado: 'En Proceso', 
                observaciones: observaciones 
            }, 
            { where: { id_relevamiento: relevamientoId } }
        );

        res.status(201).json({ success: true, message: "Solicitud enviada correctamente a Desarrollo Social." });
    } catch (error) {
        console.error("Error al guardar la solicitud:", error);
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