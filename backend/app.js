import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import bcrypt from 'bcryptjs';
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
app.use(express.static(projectRoot));
app.use('/frontend', express.static(path.join(projectRoot, 'frontend')));

// ==========================================
// 🌐 RUTAS DE VISTAS (FRONTEND)
// ==========================================
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
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

// Función para crear un administrador si la tabla está vacía
async function crearAdminPorDefecto() {
    try {
        // Verificamos si ya existe el usuario admin por su username
        const adminExistente = await usuario.findOne({ where: { username: 'admin' } });
        
        if (!adminExistente) {
            console.log('⚠️ No existe el usuario admin. Creando administrador por defecto...');
            
            const passwordPlana = '123456';
            const salt = await bcrypt.genSalt(10);
            const passwordEncriptada = await bcrypt.hash(passwordPlana, salt);

            await usuario.create({
                username: 'admin',
                dni: '00000000',
                apellido: 'Sistema',
                nombres: 'Administrador',
                email: 'admin@defensacivil.com',
                celular: '0000000000',
                password: passwordEncriptada,
                rol: 'Administrador'
            });
            
            console.log('✅ ¡Administrador por defecto creado con éxito!');
        } else {
            console.log('ℹ️ El usuario administrador ya existe en la base de datos.');
        }
    } catch (error) {
        // Capturamos el error para que NO tire abajo el servidor de Render
        console.error('⚠️ Aviso menor al verificar/crear el admin (el servidor continuará):', error.message);
    }
}
async function iniciarServidor() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos establecida.');
        await sequelize.sync();
        
        // Ejecutamos la verificación del usuario admin
        await crearAdminPorDefecto();

        app.listen(PORT, () => {
            console.log(`📡 Servidor corriendo en el puerto ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error crítico al iniciar:', error);
        process.exit(1);
    }
}

iniciarServidor();