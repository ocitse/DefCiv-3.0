// backend/controllers/relevamientocontroller.js
import relevamiento from '../models/relevamiento.js';

// 1. OBTENER TODOS LOS RELEVAMIENTOS
export const obtenerrelevamientos = async (req, res) => {
    try {
        // .findAll() es el equivalente a "SELECT * FROM relevamientos"
        const relevamientos = await relevamiento.findAll();
        res.json(relevamientos);
    } catch (error) {
        console.error('Error al obtener relevamientos:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al obtener los datos.' });
    }
};

// 2. CREAR UN NUEVO RELEVAMIENTO
export const crearrelevamiento = async (req, res) => {
    try {
        // Desestructuramos los datos que vienen desde el formulario del frontend
        const { departamento, localidad, tipo_evento, relevador_assigned, urgencia_general } = req.body;

        // Validamos que los campos obligatorios existan
        if (!departamento || !localidad || !tipo_evento || !relevador_assigned) {
            return res.status(400).json({ mensaje: 'Todos los campos obligatorios deben ser completados.' });
        }

        // .create() inserta el registro de manera nativa en MySQL
        const nuevorelevamiento = await relevamiento.create({
            departamento,
            localidad,
            tipo_evento,
            relevador_asignado: relevador_assigned, // Mapeamos al nombre de la columna en la BD
            urgencia_general,
            estado: 'Nuevo' // Estado inicial por defecto
        });

        res.status(201).json({
            mensaje: 'Relevamiento creado con éxito.',
            data: nuevorelevamiento
        });
    } catch (error) {
        console.error('Error al crear relevamiento:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al guardar el relevamiento.' });
    }
};

// 3. OBTENER UN RELEVAMIENTO POR SU ID
export const obtenerRelevamientoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const rel = await relevamiento.findByPk(id);

        if (!rel) {
            return res.status(404).json({ mensaje: 'No se encontró el relevamiento.' });
        }

        res.json(rel);
    } catch (error) {
        console.error('Error al obtener el relevamiento por ID:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al buscar el relevamiento.' });
    }
};

// 4. ACTUALIZAR UN RELEVAMIENTO EXISTENTE
export const actualizarRelevamiento = async (req, res) => {
    try {
        const { id } = req.params;
        const { departamento, localidad, tipo_evento, relevador_assigned, urgencia_general, barrio, solicitante } = req.body;

        const rel = await relevamiento.findByPk(id);
        if (!rel) {
            return res.status(404).json({ mensaje: 'No se encontró el relevamiento a actualizar.' });
        }

        await rel.update({
            departamento,
            localidad,
            tipo_evento,
            relevador_asignado: relevador_assigned,
            urgencia_general,
            barrio,
            solicitante
        });

        res.json({
            mensaje: 'Relevamiento actualizado con éxito.',
            data: rel
        });
    } catch (error) {
        console.error('Error al actualizar relevamiento:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al actualizar el relevamiento.' });
    }
};

