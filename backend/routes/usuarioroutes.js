// backend/routes/usuarioroutes.js
import express from 'express';
import { obtenerUsuarios, crearUsuario } from '../controllers/usuariocontroller.js';

const router = express.Router();

// Definimos los verbos HTTP para la gestión de usuarios
// Recordá que en Alwaysdata colgarán de la base '/home/defenprov/api/usuarios'
router.get('/', obtenerUsuarios);   // Ruta para listar usuarios
router.post('/', crearUsuario);     // Ruta para registrar el nuevo usuario (Alta)

export default router;