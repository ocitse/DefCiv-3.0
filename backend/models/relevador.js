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
    apellido: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING(100),
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
    activo: {
        type: DataTypes.TINYINT,
        defaultValue: 1
    }
}, {
    tableName: 'relevadores',
    timestamps: false  // <-- Apaga los timestamps por completo para que no busque columnas que no existen
    //timestamps: true,
    //createdAt: 'created_at',
    //updatedAt: 'updated_at'
});

export default Relevador;