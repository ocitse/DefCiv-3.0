const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); 

const Documentacion = sequelize.define('Documentacion', {
    id_documento: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    id_familia: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Familias',
            key: 'id_familia'
        },
        onDelete: 'CASCADE' // Si se borra la familia, se borran sus adjuntos automáticamente
    },
    nombre_archivo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ruta_archivo: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'documentacion_familias',
    timestamps: true
});

module.exports = Documentacion; 