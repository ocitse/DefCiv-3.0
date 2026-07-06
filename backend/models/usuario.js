// backend/models/usuario.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js'; // Apunta a tu archivo de conexión

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id_usuario' // <-- ESTO le dice a Sequelize: "en el código llamalo 'id', pero en la base de datos buscalo como 'id_usuario'"
      },
    username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    dni: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true
    },
    apellido: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    nombres: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true, // Permitimos nulo por ahora, si viene vacío
        unique: true
    },
    celular: {
        type: DataTypes.STRING(30),
        allowNull: false // Obligatorio como acordamos
    },
    // REEMPLAZÁ EL BLOQUE DE passwordHash POR ESTE:
    password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash' // En MySQL se llamará password_hash, pero en JS lo usás como .password
   },
    rol: {
        type: DataTypes.ENUM('Operador', 'Administrador', 'Solo Consulta'),
        allowNull: false,
        defaultValue: 'Operador'
    },
    estado: {
        type: DataTypes.ENUM('Activo', 'Inactivo', 'Baja'),
        allowNull: false,
        defaultValue: 'Activo' // En el alta entra directo como Activo
    },
    requiereCambioPass: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // Fuerza el cambio de contraseña la primera vez
        field: 'requiere_cambio_pass'
    },
    fechaUltimoCambioPass: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW, // Setea la fecha actual para el control de los 3 meses
        field: 'fecha_ultimo_cambio_pass'
    },
    ultimoAcceso: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'ultimo_acceso'
    }
}, {
    tableName: 'usuarios' // Nombre de la tabla en MySQL
});

export default Usuario;