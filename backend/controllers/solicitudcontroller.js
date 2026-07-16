import { QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Relevamiento from '../models/relevamiento.js';

// Obtener relevamientos en espera ('Nuevo')
export const obtenerEnEspera = async (req, res) => {
    try {
        const enEspera = await Relevamiento.findAll({ 
            where: { estado: 'Nuevo' } 
        });
        res.json(enEspera);
    } catch (error) {
        console.error("Error al obtener relevamientos en espera:", error);
        res.status(500).json({ error: "Error al obtener relevamientos en espera" });
    }
};

// Enviar solicitud (Cambia estado a 'En Proceso' y crea la provisión automáticamente)
export const enviarSolicitud = async (req, res) => {
    try {
        const { relevamientoId, observaciones } = req.body;
        
        if (!relevamientoId) {
            return res.status(400).json({ success: false, error: "Falta el ID del relevamiento." });
        }

        // A. Actualizamos el relevamiento
        await Relevamiento.update(
            { 
                estado: 'En Proceso', 
                observaciones: observaciones 
            }, 
            { where: { id_relevamiento: relevamientoId } }
        );

        // B. Buscamos info para el puente
        const relevamientoInfo = await Relevamiento.findOne({
            where: { id_relevamiento: relevamientoId }
        });

        const detalleInsumos = observaciones || 'Insumos / Ayuda solicitada según relevamiento';
        const destinoEntrega = relevamientoInfo ? (relevamientoInfo.direccion || 'Dirección no especificada') : 'Destino general';

        // C. Insertamos automáticamente en la tabla provisiones
        await sequelize.query(
            'INSERT INTO provisiones (solicitud_id, detalle, destino, estado) VALUES (?, ?, ?, "Enviado")',
            { 
                replacements: [relevamientoId, detalleInsumos, destinoEntrega], 
                type: QueryTypes.INSERT 
            }
        );

        res.status(201).json({ success: true, message: "Solicitud enviada y provisión generada correctamente." });
    } catch (error) {
        console.error("Error al guardar la solicitud y crear la provisión:", error);
        res.status(500).json({ success: false, error: "Error al procesar la solicitud" });
    }
};

// Obtener el historial de solicitudes enviadas
export const obtenerHistorialSolicitudes = async (req, res) => {
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
};