// backend/routes/familiaroutes.js
import express from 'express';
import { verificarToken } from '../middleware/authMiddleware.js';
import { 
    crearFamilia, 
    obtenerFamilias, 
    obtenerFamiliaPorId, 
    actualizarFamilia, 
    eliminarFamilia,
    uploadDocumentos,
    eliminarDocumento
} from '../controllers/familiacontroller.js';

const router = express.Router();

router.post('/', verificarToken, uploadDocumentos, crearFamilia);
router.get('/', obtenerFamilias);
router.get('/relevamiento/:id', obtenerFamilias);

// 🌟 PONER ESTA RUTA ANTES DE LOS `/:id` GENÉRICOS
router.delete('/documentos/:idDocumento', verificarToken, eliminarDocumento); 

router.get('/:id', obtenerFamiliaPorId);
router.put('/:id', verificarToken, uploadDocumentos, actualizarFamilia);
router.delete('/:id', eliminarFamilia);

export default router;