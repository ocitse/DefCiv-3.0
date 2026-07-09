// backend/config/database.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Cargamos las variables de entorno
dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
        // 🌟 AGREGAR ESTE BLOQUE DE POOL PARA LIBERAR SENTENCIAS Y CONEXIONES
        pool: {
            max: 5,         // Máximo de conexiones simultáneas en el pool (bajalo si está muy alto)
            min: 0,         // Mínimo de conexiones en reposo
            acquire: 30000, // Tiempo máximo (ms) que el pool intentará conectar antes de tirar error
            idle: 10000     // Tiempo máximo (ms) que una conexión puede estar inactiva antes de ser liberada
        },
        define: {
            timestamps: true,
            underscored: true
        }
    }
);

export default sequelize;