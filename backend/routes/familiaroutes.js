// backend/routes/familiaroutes.js
import express from 'express';
import { 
    crearFamilia, 
    obtenerFamilias, 
    obtenerFamiliaPorId, 
    actualizarFamilia, 
    eliminarFamilia,
    uploadDocumentos 
} from '../controllers/familiacontroller.js';

const router = express.Router();

router.post('/', uploadDocumentos, crearFamilia);          // POST con archivos
router.get('/', obtenerFamilias);                 // GET /api/familias
router.get('/:id', obtenerFamiliaPorId);          // GET /api/familias/:id (Ficha)
router.put('/:id', uploadDocumentos, actualizarFamilia);   // PUT con archivos (para edición)
router.delete('/:id', eliminarFamilia);           // DELETE /api/familias/:id

export default router;