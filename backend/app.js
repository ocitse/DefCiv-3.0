// backend/app.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs'; // 👈 1. Importamos el módulo fs acá arriba
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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔍 2. Agregamos el diagnóstico acá mismo para que verifique las dos opciones físicas
const rutaOpcion1 = path.join(__dirname, 'frontend');
const rutaOpcion2 = path.join(__dirname, '../frontend');

console.log("--- DIAGNÓSTICO DE RUTAS ---");
console.log("Directorio actual (__dirname):", __dirname);
console.log("¿Existe /backend/frontend?:", fs.existsSync(rutaOpcion1));
console.log("¿Existe un nivel arriba (/home/defenprov/frontend)?:", fs.existsSync(rutaOpcion2));

// Directorio actual de trabajo
console.log('Directorio actual de trabajo (CWD):', process.cwd());

const app = express();

// Definimos la ruta absoluta al directorio raíz del proyecto (un nivel arriba de backend)
const projectRoot = path.join(__dirname, '../');

// Middlewares generales
app.use(cors());
app.use(express.json());

// 📂 SERVIR ARCHIVOS ESTÁTICOS
app.use('/frontend/assets', express.static(path.join(projectRoot, 'frontend/assets')));
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

// Comodín para SPA
app.get('*', (req, res) => {
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