document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('change-pass-form');
    const alertMessage = document.getElementById('alert-message');
    const btnSubmit = document.getElementById('btn-submit');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const passwordActual = document.getElementById('pass-actual').value.trim();
        const passwordNueva = document.getElementById('pass-nueva').value.trim();
        const passwordRepetir = document.getElementById('pass-repetir').value.trim();

        // Ocultar alertas previas
        alertMessage.className = 'alert d-none small text-center';
        alertMessage.textContent = '';

        // Validaciones en cliente
        if (!passwordActual || !passwordNueva || !passwordRepetir) {
            mostrarAlerta('Por favor, complete todos los campos.', 'danger');
            return;
        }

        if (passwordNueva !== passwordRepetir) {
            mostrarAlerta('Las nuevas contraseñas no coinciden.', 'danger');
            return;
        }

        if (passwordNueva.length < 6) {
            mostrarAlerta('La nueva contraseña debe tener al menos 6 caracteres.', 'danger');
            return;
        }

        try {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Actualizando...`;

            const token = sessionStorage.getItem('token');
            const usuarioRaw = sessionStorage.getItem('usuario');

            if (!token || !usuarioRaw) {
                throw new Error('No hay sesión activa. Por favor, vuelva a iniciar sesión.');
            }

            const usuario = JSON.parse(usuarioRaw);
            const id_usuario = usuario.id || usuario.usuarioId; // Mapeo exacto para el backend

            // 🟢 Usamos POST y los nombres de campos que el controlador backend procesa
            const respuesta = await fetch('/api/auth/cambiar-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id_usuario,
                    passwordActual,
                    passwordNueva
                })
            });

            const textoRespuesta = await respuesta.text();
            let resultado;
            try {
                resultado = JSON.parse(textoRespuesta);
            } catch (err) {
                throw new Error('Respuesta inválida del servidor.');
            }

            if (!respuesta.ok) {
                throw new Error(resultado.mensaje || 'Error al actualizar la contraseña.');
            }

            // ÉXITO: Actualizamos el estado en sessionStorage
            usuario.requiereCambioPass = false;
            sessionStorage.setItem('usuario', JSON.stringify(usuario));

            mostrarAlerta('¡Contraseña actualizada con éxito! Redirigiendo al sistema...', 'success');

            // 🟢 Redirección definitiva al panel principal del sistema
            setTimeout(() => {
                window.location.replace('/sistema');
            }, 1500);

        } catch (error) {
            console.error("Error al cambiar contraseña:", error);
            mostrarAlerta(error.message, 'danger');
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i class="bi bi-check-circle"></i> Actualizar Contraseña`;
        }
    });

    function mostrarAlerta(mensaje, tipo) {
        alertMessage.className = `alert alert-${tipo} small text-center`;
        alertMessage.textContent = mensaje;
    }
});