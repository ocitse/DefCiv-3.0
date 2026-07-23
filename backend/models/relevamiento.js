// backend/models/Relevamiento.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Relevamiento = sequelize.define('Relevamiento', {
    // 1. ID Técnico interno para la BD (Relaciones y claves primarias)
    id_relevamiento: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // 2. Código visible amigable (Ej: CAP-SDE-CEN-001-26)
    codigo_relevamiento: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    departamento: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    localidad: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    barrio: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    tipo_evento: {
        type: DataTypes.STRING(100),
        allowNull: false // Ej: Inundación, Incendio, Temporal
    },
    solicitante: {
        type: DataTypes.STRING(150),
        allowNull: false // Quién realiza el pedido/reclamo
    },
    relevador_asignado: {
        type: DataTypes.STRING(150),
        allowNull: false // Para filtrar rápidamente por operador
    },
    prioridad: {
        type: DataTypes.ENUM('Baja', 'Media', 'Alta', 'Urgente'),
        allowNull: false,
        defaultValue: 'Media'
    },
    estado: {
        type: DataTypes.ENUM('nuevo', 'en-espera', 'en-proceso', 'derivado', 'finalizado', 'cancelado'),
        allowNull: false,
        defaultValue: 'nuevo'
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'relevamientos', // Nombre explícito de la tabla en PostgreSQL
    timestamps: true            // Mantiene createdAt y updatedAt
});

export default Relevamiento;