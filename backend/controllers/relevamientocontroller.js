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