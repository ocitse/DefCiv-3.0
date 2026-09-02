// backend/routes/familiaroutes.js
import express from 'express';
import { verificarToken } from '../middleware/authMiddleware.js'; // <- AGREGAR ESTA LÍNEA
import { 
    crearFamilia, 
    obtenerFamilias, 
    obtenerFamiliaPorId, 
    actualizarFamilia, 
    eliminarFamilia,
    uploadDocumentos 
} from '../controllers/familiacontroller.js';

const router = express.Router();

router.post('/',verificarToken, uploadDocumentos, crearFamilia);          // POST con archivos
router.get('/', obtenerFamilias);                         // GET /api/familias (soporta ?relevamiento_id=X si se programa en el controller)
router.get('/relevamiento/:id', obtenerFamilias);         // <-- ¡NUEVA RUTA EXPLÍCITA! GET /api/familias/relevamiento/:id
router.get('/:id', obtenerFamiliaPorId);                  // GET /api/familias/:id (Ficha)
router.put('/:id', verificarToken, uploadDocumentos, actualizarFamilia);  // PUT con archivos (para edición)
router.delete('/:id', eliminarFamilia);                   // DELETE /api/familias/:id

export default router;