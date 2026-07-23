// backend/controllers/relevamientocontroller.js
import relevamiento from '../models/relevamiento.js';

// Función auxiliar para generar el código de relevamiento (Ej: CAP-SDE-CEN-001-26)
const generarCodigoRelevamiento = async (departamento, localidad) => {
    const anioActual = '26'; // Año actual del proyecto
    const dptoPrefix = departamento ? departamento.substring(0, 3).toUpperCase() : 'DEP';
    const locPrefix = localidad ? localidad.substring(0, 3).toUpperCase() : 'LOC';
    
    // Contamos cuántos registros hay para calcular el próximo número correlativo
    const totalRegistros = await relevamiento.count();
    const correlativo = String(totalRegistros + 1).padStart(3, '0');
    
    return `${dptoPrefix}-${locPrefix}-${correlativo}-${anioActual}`;
};

// 1. OBTENER TODOS LOS RELEVAMIENTOS
export const obtenerrelevamientos = async (req, res) => {
    try {
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
        const { 
            departamento, 
            localidad, 
            barrio, 
            tipo_evento, 
            otro_evento, 
            solicitante, 
            relevador_asignado, 
            prioridad 
        } = req.body;

        // Validamos campos obligatorios básicos
        if (!departamento || !localidad || !tipo_evento || !solicitante || !relevador_asignado) {
            return res.status(400).json({ mensaje: 'Todos los campos obligatorios deben ser completados.' });
        }

        // Si seleccionó "Otro" en el evento, usamos el valor del input adicional
        const eventoFinal = tipo_evento === 'Otro' && otro_evento ? otro_evento : tipo_evento;

        // Generamos el código visible automático
        const codigo_relevamiento = await generarCodigoRelevamiento(departamento, localidad);

        const nuevorelevamiento = await relevamiento.create({
            codigo_relevamiento,
            departamento,
            localidad,
            barrio: barrio || null,
            tipo_evento: eventoFinal,
            solicitante,
            relevador_asignado,
            prioridad: prioridad || 'Baja', // Por defecto Baja como pediste
            estado: 'nuevo'
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
        const { 
            departamento, 
            localidad, 
            barrio, 
            tipo_evento, 
            otro_evento, 
            solicitante, 
            relevador_asignado, 
            prioridad, 
            estado,
            observaciones 
        } = req.body;

        const rel = await relevamiento.findByPk(id);
        if (!rel) {
            return res.status(404).json({ mensaje: 'No se encontró el relevamiento a actualizar.' });
        }

        const eventoFinal = tipo_evento === 'Otro' && otro_evento ? otro_evento : tipo_evento;

        await rel.update({
            departamento: departamento || rel.departamento,
            localidad: localidad || rel.localidad,
            barrio: barrio !== undefined ? barrio : rel.barrio,
            tipo_evento: eventoFinal || rel.tipo_evento,
            solicitante: solicitante || rel.solicitante,
            relevador_asignado: relevador_asignado || rel.relevador_asignado,
            prioridad: prioridad || rel.prioridad,
            estado: estado || rel.estado,
            observaciones: observaciones !== undefined ? observaciones : rel.observaciones
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