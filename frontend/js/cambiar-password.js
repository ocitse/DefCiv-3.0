document.addEventListener('DOMContentLoaded', () => {
    const changeForm = document.getElementById('change-pass-form');
    const alertMessage = document.getElementById('alert-message');
    const btnSubmit = document.getElementById('btn-submit');

    // 🔒 1. CONTROL DE SEGURIDAD INTERNO
    const token = sessionStorage.getItem('token');
    const usuarioRaw = sessionStorage.getItem('usuario');

    // Si no hay token o no hay usuario en la sesión, directo al login
    if (!token || !usuarioRaw) {
        window.location.href = 'login.html'; 
        return;
    }

    const usuarioLogueado = JSON.parse(usuarioRaw);

    // Si el usuario YA CAMBIÓ su contraseña, no tiene sentido que esté acá. Al index.
    if (!usuarioLogueado.requiereCambioPass) {
        window.location.href = '../../index.html';
        return;
    }

    // 📩 2. MANEJO DEL FORMULARIO (Se mantiene igual que antes)
    changeForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const passwordActual = document.getElementById('pass-actual').value.trim();
        const passwordNueva = document.getElementById('pass-nueva').value.trim();
        const passwordRepetir = document.getElementById('pass-repetir').value.trim();

        alertMessage.className = 'alert d-none small text-center';
        alertMessage.textContent = '';

        if (passwordNueva !== passwordRepetir) {
            alertMessage.classList.remove('d-none');
            alertMessage.classList.add('alert-danger');
            alertMessage.textContent = 'Las nuevas contraseñas no coinciden.';
            return;
        }

        if (passwordNueva.length < 6) {
            alertMessage.classList.remove('d-none');
            alertMessage.classList.add('alert-danger');
            alertMessage.textContent = 'La nueva contraseña debe tener al menos 6 caracteres.';
            return;
        }

        try {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<i class="bi bi-arrow-repeat spin"></i> Actualizando...`;

            const respuesta = await fetch('/api/auth/cambiar-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_usuario: usuarioLogueado.id,
                    passwordActual,
                    passwordNueva
                })
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(resultado.mensaje || 'Error al intentar cambiar la contraseña.');
            }

            // ÉXITO: Actualizamos el estado del usuario localmente para que los candados lo dejen pasar al index
            usuarioLogueado.requiereCambioPass = false;
            sessionStorage.setItem('usuario', JSON.stringify(usuarioLogueado));

            alertMessage.classList.remove('d-none');
            alertMessage.classList.add('alert-success');
            alertMessage.textContent = '¡Contraseña actualizada! Redirigiendo al sistema...';

            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 1500);

        } catch (error) {
            alertMessage.classList.remove('d-none');
            alertMessage.classList.add('alert-danger');
            alertMessage.textContent = error.message;

            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i class="bi bi-check-circle"></i> Actualizar y Entrar`;
        }
    });
});