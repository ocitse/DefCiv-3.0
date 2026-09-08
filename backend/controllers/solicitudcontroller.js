import { QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Relevamiento from '../models/relevamiento.js';
import Usuario from '../models/usuario.js';

// Obtener relevamientos en espera (ahora filtrados por 'completado')
export const obtenerEnEspera = async (req, res) => {
    try {
        // 1. Buscamos los relevamientos completados que esperan ser enviados como solicitud
        const enEspera = await Relevamiento.findAll({ 
            where: { estado: 'completado' },
            order: [['createdAt', 'DESC']]
        });

        // 2. Buscamos todos los usuarios para armar el mapa de nombres
        const listaUsuarios = await Usuario.findAll().catch(() => []);
        const mapaNombres = {};
        listaUsuarios.forEach(usr => {
            if (usr) {
                const usrJSON = usr.toJSON ? usr.toJSON() : usr;
                const idUsr = usrJSON.id_usuario || usrJSON.id;
                if (idUsr) {
                    const nombreProp = usrJSON.nombres || usrJSON.nombre || '';
                    const apellidoProp = usrJSON.apellido || '';
                    mapaNombres[String(idUsr)] = `${apellidoProp}, ${nombreProp}`;
                }
            }
        });

        // 3. Traducimos el ID del relevador a su nombre y apellido real
        const resultadosFinales = enEspera.map(item => {
            const itemJSON = item.toJSON ? item.toJSON() : item;
            const asignado = String(itemJSON.relevador_asignado || '').trim();
            itemJSON.relevador_asignado = mapaNombres[asignado] || (asignado !== '' ? asignado : 'Sin asignar');
            return itemJSON;
        });

        res.json(resultadosFinales);
    } catch (error) {
        console.error("Error al obtener relevamientos en espera:", error);
        res.status(500).json({ error: "Error al obtener relevamientos en espera" });
    }
};

// Enviar solicitud (Cambia estado a 'En Espera' y crea la provisión automáticamente)
export const enviarSolicitud = async (req, res) => {
    try {
        const { relevamientoId, observaciones } = req.body;
        
        if (!relevamientoId) {
            return res.status(400).json({ success: false, error: "Falta el ID del relevamiento." });
        }

        // A. Cambiamos el estado a 'En Espera' según el flujo correcto
        await Relevamiento.update(
            { 
                estado: 'En Espera', 
                observaciones: observaciones 
            }, 
            { where: { id_relevamiento: relevamientoId } }
        );

        // B. Buscamos la información para la provisión
        const relevamientoInfo = await Relevamiento.findOne({
            where: { id_relevamiento: relevamientoId }
        });

        const detalleInsumos = observaciones || 'Insumos / Ayuda solicitada según relevamiento';
        const destinoEntrega = relevamientoInfo ? (relevamientoInfo.direccion || 'Dirección no especificada') : 'Destino general';

        // C. Insertamos en la tabla de provisiones
        await sequelize.query(
            'INSERT INTO provisiones (solicitud_id, detalle, destino, estado) VALUES (?, ?, ?, "Enviado")',
            { 
                replacements: [relevamientoId, detalleInsumos, destinoEntrega], 
                type: QueryTypes.INSERT 
            }
        );

        res.status(201).json({ success: true, message: "Solicitud enviada correctamente y relevamiento en espera." });
    } catch (error) {
        console.error("Error al guardar la solicitud y crear la provisión:", error);
        res.status(500).json({ success: false, error: "Error al procesar la solicitud" });
    }
};

// Obtener el historial de solicitudes enviadas
export const obtenerHistorialSolicitudes = async (req, res) => {
    try {
        const historial = await Relevamiento.findAll({
            where: { estado: ['En Proceso', 'Finalizado', 'En Espera'] },
            order: [['updated_at', 'DESC']]
        });
        res.json(historial);
    } catch (error) {
        console.error("Error al obtener el historial:", error);
        res.status(500).json({ error: "Error al obtener el historial de solicitudes" });
    }
};