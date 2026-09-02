// backend/controllers/familiaController.js
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import Familia from '../models/familia.js';
import Relevamiento from '../models/relevamiento.js';
import necesidadFamilia from '../models/necesidadFamilia.js';
import Documentacion from '../models/Documentacion.js';

// 1. Configuración de Cloudinary (Reemplazá con tus credenciales reales)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
// Agregá esta línea temporalmente para diagnosticar:
console.log("☁️ Verificando Cloudinary Name:", process.env.CLOUDINARY_CLOUD_NAME);
// 2. Le decimos a Multer que envíe los archivos directo a la nube
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'defensa_civil_documentos',
        allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
        resource_type: 'auto' // <-- ESTA LÍNEA PERMITE PDFs Y DOCUMENTOS
    }
});

// Exportamos el middleware listo para usar en las rutas
export const uploadDocumentos = multer({ storage: storage }).array('documentos', 10);
// 1. CREAR UNA NUEVA FAMILIA VINCULADA A UN RELEVAMIENTO
export const crearFamilia = async (req, res) => {
    try {
        console.log("FILES RECIBIDOS EN BACKEND ->", req.files);
        console.log("BODY RECIBIDO EN BACKEND ->", req.body);
        const { jefe_familia, dni_jefe, direccion, id_relevamiento, necesidades, ...restoDeCampos } = req.body;

        // Validaciones básicas de campos obligatorios
        if (!jefe_familia || !dni_jefe || !direccion || !id_relevamiento) {
            return res.status(400).json({ mensaje: 'Faltan campos obligatorios para registrar la familia.' });
        }

        // Verificamos primero si el relevamiento al que la quieren asociar realmente existe
        const existeRelevamiento = await Relevamiento.findByPk(id_relevamiento);
        if (!existeRelevamiento) {
            return res.status(404).json({ mensaje: 'El relevamiento especificado no existe.' });
        }

        // --- VALIDACIÓN DE SEGURIDAD: Evitar cambios si está completado/finalizado/cancelado ---
        const estadoActual = (existeRelevamiento.estado || '').toLowerCase();
        if (['completado', 'finalizado', 'cancelado'].includes(estadoActual)) {
            return res.status(403).json({ mensaje: 'No se pueden agregar familias a un relevamiento que ya se encuentra completado o finalizado.' });
        }

        // CORRECCIÓN: Usamos Familia en lugar de Familia
        const nuevaFamilia = await Familia.create({
            jefe_familia,
            dni_jefe,
            direccion,
            id_relevamiento,
            ...restoDeCampos
        });

        // --- PARSEO DE NECESIDADES (Soporte para FormData) ---
        let necesidadesParsed = [];
        if (necesidades) {
            if (typeof necesidades === 'string') {
                try {
                    necesidadesParsed = JSON.parse(necesidades);
                } catch (e) {
                    console.error("Error al parsear necesidades:", e);
                }
            } else {
                necesidadesParsed = necesidades;
            }
        }

        // Si hay materiales válidos, los insertamos en la tabla relacional
        if (Array.isArray(necesidadesParsed) && necesidadesParsed.length > 0) {
            const necesidadesAInsertar = necesidadesParsed.map(nec => ({
                id_familia: nuevaFamilia.id_familia,
                tipo_material: nec.tipo_material,
                cantidad: nec.cantidad || 1
            }));
            await necesidadFamilia.bulkCreate(necesidadesAInsertar);
        }

        if (req.files && req.files.length > 0) {
            const docsAInsertar = req.files.map(file => ({
                id_familia: nuevaFamilia.id_familia,
                nombre_archivo: file.originalname,
                ruta_archivo: file.path // ¡Magia! Cloudinary nos devuelve la URL lista para guardar
            }));
            await Documentacion.bulkCreate(docsAInsertar);
        }

        // --- REGLA DE BACKEND: Actualizar estado del relevamiento si está 'nuevo' ---
        await existeRelevamiento.reload(); 

        if (existeRelevamiento.estado === 'nuevo' || !existeRelevamiento.estado) {
            await existeRelevamiento.update({ estado: 'en proceso' });
        }

        // CORRECCIÓN: Usamos Familia para buscar la familia completa
        const familiaCompleta = await Familia.findByPk(nuevaFamilia.id_familia, {
            include: [
                { model: Relevamiento },
                { model: necesidadFamilia, as: 'necesidades' }
            ]
        });

        res.status(201).json({
            mensaje: 'Ficha de familia agregada con éxito.',
            data: familiaCompleta
        });

    } catch (error) {
        console.error('Error al crear familia:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al guardar la familia.' });
    }
};

// backend/controllers/familiacontroller.js
export const obtenerFamilias = async (req, res) => {
    try {
        const idRelevamiento = req.params.id || req.query.id_relevamiento;
        
        const whereClause = {};
        if (idRelevamiento) {
            whereClause.id_relevamiento = idRelevamiento;
        }

        // Consultamos usando el nombre único del modelo
        const listaFamilias = await Familia.findAll({
            where: whereClause
        });
        
        return res.json(listaFamilias);
    } catch (error) {
        console.error('Error al obtener familias:', error);
        return res.status(500).json({ mensaje: 'Error en el servidor al obtener las familias.', error: error.message });
    }
};
// OBTENER UNA FAMILIA POR SU ID (Para ver la ficha y editarla)
export const obtenerFamiliaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const familia = await Familia.findByPk(id, {
            include: [{ model: Relevamiento },
                      { model: necesidadFamilia, as: 'necesidades' },
                      { model: Documentacion, as: 'documentacion' }    
            ]
        });

        if (!familia) {
            return res.status(404).json({ mensaje: 'No se encontró la familia especificada.' });
        }

        res.json(familia);
    } catch (error) {
        console.error('Error al obtener la familia:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al buscar la familia.' });
    }
};

// ELIMINAR UNA FAMILIA POR SU ID
export const eliminarFamilia = async (req, res) => {
    try {
        const { id } = req.params;
        const familia = await Familia.findByPk(id, {
            include: [{ model: Relevamiento }]
        });

        if (!familia) {
            return res.status(404).json({ mensaje: 'La familia que intenta eliminar no existe.' });
        }

        // --- VALIDACIÓN DE SEGURIDAD: Evitar eliminar si el relevamiento está bloqueado ---
        if (familia.Relevamiento) {
            const estadoRelevamiento = (familia.Relevamiento.estado || '').toLowerCase();
            if (['completado', 'finalizado', 'cancelado'].includes(estadoRelevamiento)) {
                return res.status(403).json({ mensaje: 'No se pueden eliminar familias de un relevamiento completado o finalizado.' });
            }
        }
        // ------------------------------------------------------------------------------------

        await familia.destroy();
        res.json({ mensaje: 'Registro familiar eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar familia:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al eliminar la familia.' });
    }
};

// ACTUALIZAR UNA FAMILIA POR SU ID
export const actualizarFamilia = async (req, res) => {
    try {
        console.log("FILES EN EDITAR ->", req.files);
        console.log("BODY EN EDITAR ->", req.body);
        const { id } = req.params;
        const { necesidades, ...restoDeCampos } = req.body;

        const familia = await Familia.findByPk(id, {
            include: [{ model: Relevamiento }]
        });

        if (!familia) {
            return res.status(404).json({ mensaje: 'La familia que intenta actualizar no existe.' });
        }
        // Si llegan nuevos archivos al editar, los guardamos
        if (req.files && req.files.length > 0) {
            const docsAInsertar = req.files.map(file => ({
                id_familia: nuevaFamilia.id_familia,
                nombre_archivo: file.originalname,
                ruta_archivo: file.path // ¡Magia! Cloudinary nos devuelve la URL lista para guardar
            }));
            await Documentacion.bulkCreate(docsAInsertar);
        }

        // --- VALIDACIÓN DE SEGURIDAD: Evitar modificar si el relevamiento está bloqueado ---
        if (familia.Relevamiento) {
            const estadoRelevamiento = (familia.Relevamiento.estado || '').toLowerCase();
            if (['completado', 'finalizado', 'cancelado'].includes(estadoRelevamiento)) {
                return res.status(403).json({ mensaje: 'No se pueden modificar familias de un relevamiento completado o finalizado.' });
            }
        }
        // ------------------------------------------------------------------------------------

        // Actualiza los campos principales de la familia
        await familia.update(restoDeCampos);

        // Si el formulario envía el array de necesidades, sincronizamos la tabla relacional
        if (necesidades) {
            let necesidadesParsed = necesidades;
            
            // Si viene como string desde el FormData del frontend, lo parseamos a JSON
            if (typeof necesidades === 'string') {
                try {
                    necesidadesParsed = JSON.parse(necesidades);
                } catch (e) {
                    necesidadesParsed = [];
                }
            }

            if (Array.isArray(necesidadesParsed)) {
                await necesidadFamilia.destroy({ where: { id_familia: id } });

                if (necesidadesParsed.length > 0) {
                    const necesidadesAInsertar = necesidadesParsed.map(nec => ({
                        id_familia: id,
                        tipo_material: nec.tipo_material,
                        cantidad: nec.cantidad || 1
                    }));
                    await necesidadFamilia.bulkCreate(necesidadesAInsertar);
                }
            }
        }

        // Consultamos la familia actualizada trayendo sus necesidades
        const familiaActualizada = await Familia.findByPk(id, {
            include: [
                { model: Relevamiento },
                { model: necesidadFamilia, as: 'necesidades' },
                { model: Documentacion, as: 'documentacion' }
            ]
        });

        res.json({
            mensaje: 'Ficha de familia actualizada con éxito.',
            data: familiaActualizada
        });
    } catch (error) {
        console.error('Error al actualizar familia:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al actualizar la familia.' });
    }
};