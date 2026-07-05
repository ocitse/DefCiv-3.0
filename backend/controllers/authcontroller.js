// backend/controllers/authController.js
import usuario from '../models/usuarios.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 1. REGISTRAR UN NUEVO USUARIO
export const registrar = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
        }

        // Verificamos si el email ya está en uso
        const usuarioExiste = await usuario.findOne({ where: { email } });
        if (usuarioExiste) {
            return res.status(400).json({ mensaje: 'El correo electrónico ya está registrado.' });
        }

        // Encriptamos la contraseña (hashing) antes de guardarla
        const salt = await bcrypt.genSalt(10);
        const passwordEncriptada = await bcrypt.hash(password, salt);

        // Guardamos en MySQL
        const nuevoUsuario = await usuario.create({
            nombre,
            email,
            password: passwordEncriptada,
            rol
        });

        res.status(201).json({
            mensaje: 'Usuario registrado con éxito.',
            usuario: { id: nuevoUsuario.id_usuario, nombre: nuevoUsuario.nombre, email: nuevoUsuario.email }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al registrar el usuario.' });
    }
};

// 2. INICIAR SESIÓN (LOGIN)
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ mensaje: 'Email y contraseña requeridos.' });
        }

        // 🌟 CAMBIAMOS EL NOMBRE DE LA VARIABLE A "usuarioEncontrado"
        // Dejamos "usuario.findOne" porque tu modelo se llama "usuario"
        const usuarioEncontrado = await usuario.findOne({ where: { email } });
        
        if (!usuarioEncontrado) {
            return res.status(400).json({ mensaje: 'Credenciales inválidas (Usuario no encontrado).' });
        }

        // 🌟 Aquí también usamos "usuarioEncontrado.password"
        const passwordCorrecta = await bcrypt.compare(password, usuarioEncontrado.password);
        if (!passwordCorrecta) {
            return res.status(400).json({ mensaje: 'Credenciales inválidas (Contraseña incorrecta).' });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_defensa_civil';
        
        // 🌟 Aquí también cambiamos a "usuarioEncontrado"
        const token = jwt.sign(
            { id_usuario: usuarioEncontrado.id_usuario, rol: usuarioEncontrado.rol },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            mensaje: 'Login exitoso.',
            token,
            usuario: {
                id: usuarioEncontrado.id_usuario,
                nombre: usuarioEncontrado.nombre,
                rol: usuarioEncontrado.rol
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al intentar iniciar sesión.' });
    }
};