import express from 'express';
import { QueryTypes } from 'sequelize'; 
import sequelize from '../config/database.js';

const router = express.Router();

// GET /api/relevadores - Listar relevadores activos (Para selectores/desplegables)
router.get('/', async (req, res) => {
    try {
        const relevadores = await sequelize.query(
            'SELECT id, nombre, dni, email FROM relevadores WHERE activo = 1 ORDER BY nombre ASC',
            { type: QueryTypes.SELECT }
        );
        
        res.json({
            success: true,
            data: relevadores
        });
    } catch (error) {
        console.warn('⚠️ Aviso: La tabla relevadores aún no existe o está vacía:', error.message);
        res.json({
            success: true,
            data: []
        });
    }
});

// GET /api/relevadores/admin - Listar TODOS los relevadores (Activos e inactivos para Configuración)
router.get('/admin', async (req, res) => {
    try {
        const relevadores = await sequelize.query(
            'SELECT id, nombre, dni, email, activo FROM relevadores ORDER BY nombre ASC',
            { type: QueryTypes.SELECT }
        );
        
        res.json({
            success: true,
            data: relevadores
        });
    } catch (error) {
        console.warn('⚠️ Aviso: La tabla relevadores admin aún no existe o está vacía:', error.message);
        res.json({
            success: true,
            data: []
        });
    }
});

// POST /api/relevadores - Registrar un nuevo relevador
router.post('/', async (req, res) => {
    const { nombre, dni, email } = req.body;

    if (!nombre || !dni) {
        return res.status(400).json({ 
            success: false, 
            message: 'El nombre y el DNI son obligatorios' 
        });
    }

    try {
        // Verificar si ya existe un relevador con el mismo DNI
        const existente = await sequelize.query(
            'SELECT id FROM relevadores WHERE dni = ?',
            { replacements: [dni], type: QueryTypes.SELECT }
        );

        if (existente.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Ya existe un relevador registrado con ese DNI' 
            });
        }

        const resultado = await sequelize.query(
            'INSERT INTO relevadores (nombre, dni, email, activo) VALUES (?, ?, ?, 1)',
            { 
                replacements: [nombre, dni, email || null],
                type: QueryTypes.INSERT 
            }
        );

        res.json({
            success: true,
            message: 'Relevador registrado con éxito',
            id: resultado[0] 
        });
    } catch (error) {
        console.error('Error al insertar el relevador:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al registrar el relevador en la base de datos' 
        });
    }
});

// PUT /api/relevadores/:id/estado - Cambiar estado Activo/Inactivo (Toggle)
router.put('/:id/estado', async (req, res) => {
    const { id } = req.params;
    const { activo } = req.body; 

    try {
        await sequelize.query(
            'UPDATE relevadores SET activo = ? WHERE id = ?',
            { 
                replacements: [activo, id],
                type: QueryTypes.UPDATE 
            }
        );

        res.json({
            success: true,
            message: 'Estado del relevador actualizado con éxito'
        });
    } catch (error) {
        console.error('Error al actualizar estado del relevador:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el estado'
        });
    }
});

export default router;