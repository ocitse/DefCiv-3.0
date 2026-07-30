// backend/models/familia.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import relevamiento from './relevamiento.js';

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
    underscored: true
});

// 🌟 CONFIGURACIÓN DE LA RELACIÓN (Clave Foránea)
relevamiento.hasMany(familia, { foreignKey: 'id_relevamiento', onDelete: 'CASCADE' });
familia.belongsTo(relevamiento, { foreignKey: 'id_relevamiento' });

export default familia;