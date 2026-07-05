// backend/controllers/familiaController.js
import Familia from '../models/familia.js';
import Relevamiento from '../models/relevamiento.js';

// 1. CREAR UNA NUEVA FAMILIA VINCULADA A UN RELEVAMIENTO
export const crearFamilia = async (req, res) => {
    try {
        const { 
            jefe_familia, 
            dni_jefe, 
            telefono, 
            direccion, 
            cantidad_integrantes, 
            danos_estructurales, 
            requiere_evacuacion, 
            observaciones,
            id_relevamiento // 🌟 Clave foránea que viene desde el frontend
        } = req.body;

        // Validaciones básicas de campos obligatorios
        if (!jefe_familia || !dni_jefe || !direccion || !id_relevamiento) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios para registrar la familia.' });
        }

        // Verificamos primero si el relevamiento al que la quieren asociar realmente existe en MySQL
        const existeRelevamiento = await Relevamiento.findByPk(id_relevamiento);
        if (!existeRelevamiento) {
            return res.status(404).json({ mensaje: 'El relevamiento especificado no existe.' });
        }

        // Insertamos la familia en MySQL
        const nuevaFamilia = await Familia.create({
            jefe_familia,
            dni_jefe,
            telefono,
            direccion,
            cantidad_integrantes,
            danos_estructurales,
            requiere_evacuacion,
            observaciones,
            id_relevamiento
        });

        res.status(201).json({
            mensaje: 'Ficha de familia agregada con éxito.',
            data: nuevaFamilia
        });

    } catch (error) {
        console.error('Error al crear familia:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al guardar la familia.' });
    }
};

// 2. OBTENER TODAS LAS FAMILIAS (Opcional, útil para auditorías)
export const obtenerFamilias = async (req, res) => {
    try {
        const familias = await Familia.findAll({
            include: [{ model: Relevamiento }] // 🌟 Hace un "JOIN" automático para traerte los datos del relevamiento asociado
        });
        res.json(familias);
    } catch (error) {
        console.error('Error al obtener familias:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al obtener las familias.' });
    }
};