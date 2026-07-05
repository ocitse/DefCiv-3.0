// backend/routes/relevamientoroutes.js
import express from 'express';
import { obtenerrelevamientos, crearrelevamiento } from '../controllers/relevamientocontroller.js';

const router = express.Router();

// Definimos los verbos HTTP correspondientes
router.get('/', obtenerrelevamientos);  // Ruta para listar: GET http://localhost:3000/api/relevamientos
router.post('/', crearrelevamiento);   // Ruta para guardar: POST http://localhost:3000/api/relevamientos

export default router;