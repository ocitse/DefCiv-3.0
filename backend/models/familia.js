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
    cantidad_integrantes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    // Estado de la vivienda / Daños (Booleanos)
    danos_estructurales: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    requiere_evacuacion: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // Observaciones particulares sobre la vulnerabilidad
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'familias'
});

// 🌟 CONFIGURACIÓN DE LA RELACIÓN (Clave Foránea)
// Esto le dice a Sequelize: "Creá una columna id_relevamiento en la tabla familias"
relevamiento.hasMany(familia, { foreignKey: 'id_relevamiento', onDelete: 'CASCADE' });
familia.belongsTo(relevamiento, { foreignKey: 'id_relevamiento' });

export default familia;