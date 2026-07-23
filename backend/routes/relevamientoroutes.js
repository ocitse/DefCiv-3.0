// backend/routes/relevamientoroutes.js
import express from 'express';
import { 
    obtenerrelevamientos, 
    crearrelevamiento, 
    obtenerRelevamientoPorId, 
    actualizarRelevamiento 
} from '../controllers/relevamientocontroller.js';

const router = express.Router();

// Definimos los verbos HTTP correspondientes
router.get('/', obtenerrelevamientos);          // Listar todos: GET /api/relevamientos
router.get('/:id', obtenerRelevamientoPorId);   // Obtener uno por ID: GET /api/relevamientos/:id
router.post('/', crearrelevamiento);            // Crear nuevo: POST /api/relevamientos
router.put('/:id', actualizarRelevamiento);     // Actualizar existente: PUT /api/relevamientos/:id

export default router;