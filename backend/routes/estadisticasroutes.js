import express from 'express';
import { obtenerEstadisticasPublicas } from '../controllers/estadisticascontroller.js';

const router = express.Router();

router.get('/publicas', obtenerEstadisticasPublicas);

export default router;
