// backend/models/relevador.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Relevador = sequelize.define('Relevador', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    codigo_relevador: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    dni: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: true
    },
    telefono: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    zona_asignada: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    activo: {
        type: DataTypes.TINYINT,
        defaultValue: 1
    }
}, {
    tableName: 'relevadores',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

export default Relevador;