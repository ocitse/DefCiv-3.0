// backend/routes/authRoutes.js
import express from 'express';
import { registrar, login } from '../controllers/authcontroller.js';

const router = express.Router();

router.post('/register', registrar); // POST http://localhost:3000/api/auth/register
router.post('/login', login);       // POST http://localhost:3000/api/auth/login

export default router;