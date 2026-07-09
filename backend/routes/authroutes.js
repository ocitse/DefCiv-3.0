// backend/routes/authRoutes.js
import express from 'express';
import { registrar, login, cambiarPassword } from '../controllers/authcontroller.js'; // 👈 Sumamos la función acá

const router = express.Router();

router.post('/register', registrar);       // POST http://localhost:3000/api/auth/register
router.post('/login', login);             // POST http://localhost:3000/api/auth/login
router.post('/cambiar-password', cambiarPassword); // 👈 Nueva ruta para el cambio de clave

export default router;