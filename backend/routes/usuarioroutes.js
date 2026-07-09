// backend/routes/usuarioroutes.js
import express from 'express';
// Dejamos solo los métodos que ya te funcionaban antes de romperle el 502
import { obtenerUsuarios, crearUsuario } from '../controllers/usuariocontroller.js';
import Usuario from '../models/usuario.js'; 

const router = express.Router();

// Definimos los verbos HTTP para la gestión de usuarios
router.get('/', obtenerUsuarios);   // Ruta para listar usuarios
router.post('/', crearUsuario);     // Ruta para registrar el nuevo usuario (Alta)

// 🔄 Cambiar estado del usuario (Borrado Lógico)
router.put('/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await Usuario.findByPk(id);

        if (!usuario) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        const nuevoEstado = usuario.estado === 'Activo' ? 'Inactivo' : 'Activo';
        usuario.estado = nuevoEstado;
        await usuario.save();

        res.json({
            success: true,
            message: `Usuario ${usuario.apellido} pasado a estado: ${nuevoEstado} con éxito.`
        });

    } catch (error) {
        console.error('Error al cambiar estado del usuario:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

// 🌟 SOLUCIÓN DIRECTA: Lógica embebida en la ruta para evitar problemas con el import del controlador
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nombres, apellido, dni, email, celular, rol } = req.body;

    try {
        // Usamos Sequelize directamente acá
        const [rowsUpdated] = await Usuario.update(
            { nombres, apellido, dni, email, celular, rol },
            { where: { id: id } }
        );

        if (rowsUpdated === 0) {
            return res.status(404).json({
                success: false,
                message: 'No se encontró el usuario o los datos son idénticos.'
            });
        }

        return res.json({
            success: true,
            message: 'Usuario actualizado correctamente.'
        });

    } // En lugar de esto:
    // res.status(500).json({ success: false, message: "Hubo un error interno en el servidor al intentar actualizar." });
    
    // Poné esto para ver la verdad en el Response de la consola:
    catch (error) {
        console.error("Error real:", error);
        res.status(500).json({ success: false, message: error.message, stack: error.stack });
    }
});

export default router;