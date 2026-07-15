import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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
const projectRoot = path.join(__dirname, '../');

const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// 📂 ARCHIVOS ESTÁTICOS
// ==========================================
app.use('/frontend', express.static(path.join(projectRoot, 'frontend')));
app.use(express.static(projectRoot));

// ==========================================
// 🌐 RUTAS DE VISTAS (FRONTEND)
// ==========================================
app.get('/login', (req, res) => {
    res.sendFile(path.join(projectRoot, 'login.html'));
});

app.get('/sistema', (req, res) => {
    res.sendFile(path.join(projectRoot, 'frontend', 'pages', 'panel-principal.html'));
});

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

// Ruta por defecto (Raíz)
//app.get('/', (req, res) => {
 //   res.send('¡DefCiv-3.0 en línea y funcionando!');
 //   res.sendFile(path.join(projectRoot, 'portal.html'));
//});

// Ruta por defecto (Raíz)
app.get('/', (req, res) => {
    const portalPath = path.join(projectRoot, 'portal.html');
    res.sendFile(portalPath, (err) => {
        if (err) {
            console.error('Error al enviar portal.html:', err);
            res.status(404).send('No se encontró el archivo portal.html en la raíz del proyecto.');
        }
    });
});



const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida.');
        await sequelize.sync();
        app.listen(PORT, () => {
            console.log(`📡 Servidor corriendo en el puerto ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error crítico al iniciar:', error);
        process.exit(1);
    }
}

iniciarServidor();