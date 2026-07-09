// backend/controllers/authController.js
import usuario from '../models/usuario.js';
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

        const usuarioEncontrado = await usuario.findOne({ where: { email } });
        
        if (!usuarioEncontrado) {
            return res.status(400).json({ mensaje: 'Credenciales inválidas (Usuario no encontrado).' });
        }

        const passwordCorrecta = await bcrypt.compare(password, usuarioEncontrado.password);
        if (!passwordCorrecta) {
            return res.status(400).json({ mensaje: 'Credenciales inválidas (Contraseña incorrecta).' });
        }

        console.log("🔍 DATOS REALES EN EL BACKEND:", usuarioEncontrado.toJSON());
        const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_defensa_civil';
        
        const token = jwt.sign(
            { id_usuario: usuarioEncontrado.id, rol: usuarioEncontrado.rol },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            mensaje: 'Login exitoso.',
            token,
            usuario: {
                id: usuarioEncontrado.id,
                nombres: usuarioEncontrado.nombres,   
                apellido: usuarioEncontrado.apellido, 
                rol: usuarioEncontrado.rol,
                requiereCambioPass: usuarioEncontrado.requiereCambioPass 
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al intentar iniciar sesión.' });
    }
};

// 3. CAMBIAR CONTRASEÑA (PRIMERA VEZ O MANUAL)
export const cambiarPassword = async (req, res) => {
    try {
        const { id_usuario, passwordActual, passwordNueva } = req.body;

        if (!id_usuario || !passwordActual || !passwordNueva) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios.' });
        }

        // Buscamos al usuario por su ID
        const usuarioEncontrado = await usuario.findByPk(id_usuario);
        if (!usuarioEncontrado) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
        }

        // Validamos que la contraseña actual sea la correcta
        const passwordCorrecta = await bcrypt.compare(passwordActual, usuarioEncontrado.password);
        if (!passwordCorrecta) {
            return res.status(400).json({ mensaje: 'La contraseña actual es incorrecta.' });
        }

        // Encriptamos la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const nuevaPasswordEncriptada = await bcrypt.hash(passwordNueva, salt);

        // Actualizamos los campos en la base de datos
        usuarioEncontrado.password = nuevaPasswordEncriptada;
        usuarioEncontrado.requiereCambioPass = false; 
        usuarioEncontrado.fechaUltimoCambioPass = new Date(); 
        
        await usuarioEncontrado.save();

        res.json({ mensaje: 'Contraseña actualizada con éxito.' });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ mensaje: 'Error en el servidor al cambiar la contraseña.' });
    }
};