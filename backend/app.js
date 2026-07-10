// backend/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from './config/database.js';

import relevamiento from './models/relevamiento.js';
import familia from './models/familia.js';
import usuario from './models/usuario.js';
import relevadorroutes from './routes/relevadorroutes.js'; // <--- NUEVO

// 🌟 IMPORTAMOS LAS RUTAS NUEVAS
import relevamientoroutes from './routes/relevamientoroutes.js';
import familiaroutes from './routes/familiaroutes.js';
import authroutes from './routes/authroutes.js';
import usuarioroutes from './routes/usuarioroutes.js';

import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Ruta dinámica que se adapta sola si estás en Windows o en Linux
const rootDir = process.env.NODE_ENV === 'production' 
    ? '/home/defenprov' 
    : path.join(__dirname, '../');

app.use(express.static(rootDir));

app.use(express.static('/home/defenprov'));
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoints de la API
app.get('/api/status', (req, res) => {
    res.json({ status: 'online', message: 'API de Defensa Civil funcionando correctamente.' });
});

// 🌟 VINCULAMOS LAS RUTAS A UN ENDPOINT BASE
app.use('/api/relevamientos', relevamientoroutes);
app.use('/api/familias', familiaroutes);
app.use('/api/auth', authroutes);
app.use('/api/usuarios', usuarioroutes);
app.use('/api/relevadores', relevadorroutes); // <--- NUEVO

app.get('*', (req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
});

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
