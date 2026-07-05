// backend/models/Usuario.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const usuario = sequelize.define('usuario', {
    id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true, // No puede haber dos usuarios con el mismo correo
        validate: {
            isEmail: true // Valida formato de mail válido
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    rol: {
        type: DataTypes.ENUM('Administrador', 'Operador'),
        defaultValue: 'Operador'
    }
}, {
    tableName: 'usuarios'
});

export default usuario;