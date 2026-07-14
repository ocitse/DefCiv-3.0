// backend/models/Relevamiento.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Relevamiento = sequelize.define('Relevamiento', {
    id_relevamiento: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    departamento: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    localidad: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    tipo_evento: {
        type: DataTypes.STRING(100),
        allowNull: false // Ej: Inundación, Incendio, Temporal
    },
    relevador_asignado: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    urgencia_general: {
        type: DataTypes.ENUM('Baja', 'Media', 'Alta'),
        allowNull: false,
        defaultValue: 'Media'
    },
    estado: {
        type: DataTypes.ENUM('en-espera', 'enviado', 'Nuevo', 'En Proceso', 'Finalizado'),
        allowNull: false,
        defaultValue: 'en-espera'
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'relevamientos' // Nombre explícito de la tabla en MySQL
});

export default Relevamiento;