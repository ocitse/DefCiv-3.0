import { QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';

// Listar todas las provisiones
export const obtenerProvisiones = async (req, res) => {
    try {
        const provisiones = await sequelize.query(
            'SELECT * FROM provisiones ORDER BY id DESC',
            { type: QueryTypes.SELECT }
        );
        res.json({ success: true, data: provisiones });
    } catch (error) {
        console.warn('⚠️ La tabla provisiones no existe o está vacía, devolviendo vacío.');
        res.json({ success: true, data: [] });
    }
};

// Registrar el retorno y cerrar el circuito de una provisión
export const cerrarProvision = async (req, res) => {
    const { id } = req.params;
    const { estado_retorno, observaciones } = req.body;

    try {
        await sequelize.query(
            'UPDATE provisiones SET estado = ?, observaciones = ?, fecha_cierre = CURRENT_TIMESTAMP WHERE id = ?',
            { replacements: [estado_retorno, observaciones, id], type: QueryTypes.UPDATE }
        );
        res.json({ success: true, message: 'Circuito de provisión cerrado correctamente.' });
    } catch (error) {
        console.error('Error al cerrar provisión:', error);
        res.status(500).json({ success: false, message: 'Error al cerrar el circuito' });
    }
};