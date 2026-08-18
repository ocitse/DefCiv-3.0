import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import relevamiento from './relevamiento.js';
import documentacion from './documentacion.js'; // <-- 1. Importas el nuevo modelo de adjuntos

const familia = sequelize.define('familia', {
    id_familia: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    jefe_familia: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    dni_jefe: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    telefono: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    direccion: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    // Composición familiar
    mayores: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    menores: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    cantidad_integrantes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    urgencia_familiar: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    // Estado de la vivienda / Daños (Booleanos)
    dano_techo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    dano_paredes: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    dano_pisos: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    dano_instalaciones: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    danos_estructurales: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    requiere_evacuacion: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // Necesidades detectadas (Unidades / Cantidades)
    unidades_alimentarias: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    abrigos: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    frazadas: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    bidones_agua: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    kits_higiene: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    ropa: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    colchones: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // Observaciones particulares sobre la vulnerabilidad
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'familias',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    underscored: false
});

// 🌟 CONFIGURACIÓN DE RELACIONES
relevamiento.hasMany(familia, { foreignKey: 'id_relevamiento', onDelete: 'CASCADE' });
familia.belongsTo(relevamiento, { foreignKey: 'id_relevamiento' });

// Relación con Documentación (Adjuntos / Fotos / PDFs)
familia.hasMany(documentacion, { foreignKey: 'id_familia', as: 'documentacion', onDelete: 'CASCADE' });
documentacion.belongsTo(familia, { foreignKey: 'id_familia' });

export default familia;