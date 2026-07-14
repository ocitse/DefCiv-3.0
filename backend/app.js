// backend/app.js
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

// Diagnóstico de rutas para Alwaysdata
const rutaOpcion1 = path.join(__dirname, 'frontend');
const rutaOpcion2 = path.join(__dirname, '../frontend');

console.log("--- DIAGNÓSTICO DE RUTAS ---");
console.log("Directorio actual (__dirname):", __dirname);
console.log("¿Existe /backend/frontend?:", fs.existsSync(rutaOpcion1));
console.log("¿Existe un nivel arriba (/home/defenprov/frontend)?:", fs.existsSync(rutaOpcion2));
console.log('Directorio actual de trabajo (CWD):', process.cwd());

const app = express();

// Definimos la ruta absoluta al directorio raíz del proyecto (un nivel arriba de backend)
const projectRoot = path.join(__dirname, '../');

// Middlewares generales
app.use(cors());
app.use(express.json());

// 📂 SERVIR ARCHIVOS ESTÁTICOS Y CARPETA FRONTEND COMPLETA
app.use('/frontend/assets', express.static('/home/defenprov/frontend/assets', {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
        } else if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        }
    }
}));

// Servir de forma estática toda la carpeta frontend para que los .html sean accesibles directamente por fetch
app.use('/frontend', express.static(path.join(projectRoot, 'frontend')));
app.use(express.static(projectRoot));

// Endpoints y Rutas de la API
app.get('/api/status', (req, res) => {
    res.json({ status: 'online', message: 'API de Defensa Civil funcionando correctamente.' });
});

app.use('/api/relevamientos', relevamientoroutes);
app.use('/api/familias', familiaroutes);
app.use('/api/auth', authroutes);
app.use('/api/usuarios', usuarioroutes);
app.use('/api/relevadores', relevadorroutes);
app.use('/api/solicitudes', solicitudroutes); // O app.use('/api/solicitudes', solicitudroutes); según cómo lo pida tu frontend

// Comodín para SPA (Excluyendo explícitamente las rutas de api y frontend para que no interceptes los partials)
app.get(/^(?!\/api|\/frontend).*/, (req, res) => {
    res.sendFile(path.join(projectRoot, 'index.html'));
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