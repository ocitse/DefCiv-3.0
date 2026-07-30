// backend/routes/familiaroutes.js
import express from 'express';
import { 
    crearFamilia, 
    obtenerFamilias, 
    obtenerFamiliaPorId, 
    actualizarFamilia, 
    eliminarFamilia 
} from '../controllers/familiacontroller.js';

const router = express.Router();

router.post('/', crearFamilia);                   // POST /api/familias
router.get('/', obtenerFamilias);                 // GET /api/familias
router.get('/:id', obtenerFamiliaPorId);          // GET /api/familias/:id (Ficha)
router.put('/:id', actualizarFamilia);            // PUT /api/familias/:id (Actualizar edición)
router.delete('/:id', eliminarFamilia);           // DELETE /api/familias/:id

export default router;