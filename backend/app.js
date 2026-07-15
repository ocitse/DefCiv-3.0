import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sequelize from './config/database.js';

import relevamiento from './models/relevamiento.js';
import familia from './models/familia.js';
import usuario from './models/usuario.js';
import relevadorroutes from './routes/relevadorroutes.js';

import relevamientoroutes from './routes/relevamientoroutes.js';
import familiaroutes from './routes/familiaroutes.js';
import authroutes from './routes/authroutes.js';
import usuarioroutes from './routes/usuarioroutes.js';
import solicitudroutes from './routes/solicitudroutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const projectRoot = path.join(__dirname, '../');

// Middlewares generales
app.use(cors());
app.use(express.json());

// ==========================================
// 🌐 RUTAS DE VISTAS PRINCIPALES (FRONTEND)
// ==========================================

// 1. Ruta Raíz: Única y exclusivamente devuelve el Portal Público
app.get('/', (req, res) => {
    const rutaPortal = path.join(projectRoot, 'portal.html');
    if (fs.existsSync(rutaPortal)) {
        return res.sendFile(rutaPortal);
    }
    res.sendFile(path.join(projectRoot, 'frontend', 'portal.html'));
});

// 2. Ruta de Sistema Interno: Única y exclusivamente devuelve el index.html del sistema
app.get('/sistema', (req, res) => {
    const rutaIndex = path.join(projectRoot, 'index.html');
    if (fs.existsSync(rutaIndex)) {
        return res.sendFile(rutaIndex);
    }
    res.sendFile(path.join(projectRoot, 'frontend', 'index.html'));
});

// ==========================================
// 📂 ARCHIVOS ESTÁTICOS (Corregidos dinámicamente)
// ==========================================

// Usamos ruta dinámica en lugar de quemar '/home/defenprov/...' para que no falle
app.use('/frontend/assets', express.static(path.join(projectRoot, 'frontend', 'assets')));
app.use('/frontend', express.static(path.join(projectRoot, 'frontend')));
app.use(express.static(projectRoot));

// ==========================================
// 🔌 API ROUTES
// ==========================================

app.get('/api/status', (req, res) => {
    res.json({ status: 'online', message: 'API de Defensa Civil funcionando correctamente.' });
});

app.use('/api/relevamientos', relevamientoroutes);
app.use('/api/familias', familiaroutes);
app.use('/api/auth', authroutes);
app.use('/api/usuarios', usuarioroutes);
app.use('/api/relevadores', relevadorroutes);
app.use('/api/solicitudes', solicitudroutes);

// Comodín estricto para que cualquier otra ruta que no sea API redirija al portal
app.get(/^(?!\/api|\/frontend).*/, (req, res) => {
    const rutaPortal = path.join(projectRoot, 'portal.html');
    if (fs.existsSync(rutaPortal)) {
        return res.sendFile(rutaPortal);
    }
    res.sendFile(path.join(projectRoot, 'frontend', 'portal.html'));
});

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a MySQL establecida de manera exitosa.');

        await sequelize.sync();
        console.log('🚀 Tablas de la base de datos sincronizadas correctamente.');

        app.listen(PORT, () => {
            console.log(`📡 Servidor backend corriendo en: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error crítico al iniciar la aplicación:', error);
        process.exit(1);
    }
}

iniciarServidor();