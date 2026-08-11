import express from 'express';
import { 
    obtenerrelevamientos, 
    crearrelevamiento, 
    obtenerRelevamientoPorId, 
    actualizarRelevamiento,
    eliminarRelevamiento,
} from '../controllers/relevamientocontroller.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Definimos los verbos HTTP correspondientes
router.get('/', verificarToken, obtenerrelevamientos);
router.post('/', verificarToken, crearrelevamiento);
router.get('/', obtenerrelevamientos);           // Listar todos: GET /api/relevamientos
router.get('/:id', obtenerRelevamientoPorId);   // Obtener uno por ID: GET /api/relevamientos/:id
router.post('/', crearrelevamiento);            // Crear nuevo: POST /api/relevamientos
router.put('/:id', actualizarRelevamiento);     // Actualizar existente: PUT /api/relevamientos/:id
router.delete('/:id', eliminarRelevamiento);    // Eliminar existente: DELETE /api/relevamientos/:id

export default router;