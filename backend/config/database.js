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
        logging: false, // Desactiva los logs de SQL en consola para mantenerla limpia
        define: {
            timestamps: true, // Nos crea automáticamente las columnas createdAt y updatedAt
            underscored: true // Convierte camelCase a snake_case en la BD (ej: id_familia)
        }
    }
);

export default sequelize;