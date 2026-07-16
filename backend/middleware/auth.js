import express from 'express';
import { registrar, login, cambiarPassword } from '../controllers/authcontroller.js';
import { verificarToken } from '../middleware/auth.js'; // 👈 Importamos el validador

const router = express.Router();

router.post('/register', registrar);      
router.post('/login', login);             

// 🟢 Protegemos la ruta de cambiar contraseña exigiendo el token
router.post('/cambiar-password', verificarToken, cambiarPassword); 

export default router;