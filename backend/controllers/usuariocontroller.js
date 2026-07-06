// backend/controllers/usuariocontroller.js
import bcrypt from 'bcryptjs';
import usuario from '../models/usuario.js'; // Importamos el modelo que acabas de crear
import { Op } from 'sequelize'; // Para usar operadores lógicos en las búsquedas (OR, AND)

// 1. Obtener todos los usuarios (para listar en la tabla)
// Excluimos a los que tienen estado 'Baja' para no mostrarlos
export const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            where: {
                estado: {
                    [Op.ne]: 'Baja' // Op.ne significa "Not Equal" (No igual a 'Baja')
                }
            },
            // Atributos que queremos devolver al frontend (excluimos el password_hash por seguridad)
            attributes: ['id', 'username', 'dni', 'apellido', 'nombres', 'email', 'celular', 'rol', 'estado', 'ultimoAcceso']
        });

        res.json({ success: true, data: usuarios });
    } catch (error) {
        console.error('Error al obtener usuarios con Sequelize:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

// 2. Crear un nuevo usuario (Alta)
export const crearUsuario = async (req, res) => {
    const { username, dni, apellido, nombres, email, celular, rol } = req.body;

    // Validación de campos obligatorios
    if (!username || !dni || !apellido || !nombres || !celular || !rol) {
        return res.status(400).json({ 
            success: false, 
            message: 'Todos los campos marcados con (*) son obligatorios.' 
        });
    }

    try {
        // Verificar si ya existe un usuario con ese mismo username o DNI
        const existe = await Usuario.findOne({
            where: {
                [Op.or]: [{ username }, { dni }]
            }
        });

        if (existe) {
            return res.status(400).json({ 
                success: false, 
                message: 'El Nombre de Usuario o el DNI ya se encuentran registrados.' 
            });
        }

        // Encriptamos el DNI para usarlo como contraseña inicial
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(dni, salt);

        // Guardamos en la base de datos usando el modelo
        // Sequelize maneja automáticamente: estado='Activo', requiereCambioPass=true, y los timestamps
        await Usuario.create({
            username,
            dni,
            apellido,
            nombres,
            email: email || null, // Si viene vacío lo guarda como NULL en la BD
            celular,
            passwordHash,
            rol
        });

        res.status(201).json({ 
            success: true, 
            message: 'Usuario creado con éxito. Su contraseña inicial provisoria es su número de DNI.' 
        });

    } catch (error) {
        console.error('Error al crear usuario con Sequelize:', error);
        res.status(500).json({ success: false, message: 'Error al procesar el alta en el servidor.' });
    }
};