// backend/routes/familiaRoutes.js
import express from 'express';
import { crearFamilia, obtenerFamilias } from '../controllers/familiacontroller.js';

const router = express.Router();

router.post('/', crearFamilia);   // POST http://localhost:3000/api/familias
router.get('/', obtenerFamilias);  // GET http://localhost:3000/api/familias

export default router;