document.addEventListener('DOMContentLoaded', () => {
    const changeForm = document.getElementById('change-pass-form');
    const alertMessage = document.getElementById('alert-message');
    const btnSubmit = document.getElementById('btn-submit');
    
    const iconoHeader = document.getElementById('icono-header');
    const tituloHeader = document.getElementById('titulo-header');
    const descripcionHeader = document.getElementById('descripcion-header');
    const labelPassActual = document.getElementById('label-pass-actual');
    const contenedorVolver = document.getElementById('contenedor-volver');

    const token = sessionStorage.getItem('token');
    const usuarioRaw = sessionStorage.getItem('usuario');

    if (!token || !usuarioRaw) {
        window.location.replace('/login'); 
        return;
    }

    const usuarioLogueado = JSON.parse(usuarioRaw);

    if (!usuarioLogueado.requiereCambioPass) {
        iconoHeader.className = 'bi bi-key-fill text-primary';
        tituloHeader.textContent = 'Cambiar Contraseña';
        descripcionHeader.textContent = 'Ingresa tu contraseña actual y la nueva clave que deseas utilizar.';
        labelPassActual.textContent = 'Contraseña Actual';
        contenedorVolver.classList.remove('d-none');
        btnSubmit.className = 'btn btn-primary w-100 text-white fw-bold';
    } else {
        iconoHeader.className = 'bi bi-shield-lock text-warning';
        tituloHeader.textContent = 'Actualización Obligatoria';
        descripcionHeader.textContent = 'Por seguridad, debes cambiar tu contraseña predeterminada antes de ingresar al sistema.';
        labelPassActual.textContent = 'Contraseña Actual (DNI)';
        contenedorVolver.classList.add('d-none');
        btnSubmit.className = 'btn btn-warning w-100 text-white fw-bold';
    }

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

            // 🟢 Usamos exactamente id_usuario tal como lo espera authcontroller.js
            const respuesta = await fetch('/api/auth/cambiar-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id_usuario: usuarioLogueado.id || usuarioLogueado.usuarioId,
                    passwordActual,
                    passwordNueva
                })
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(resultado.mensaje || 'Error al intentar cambiar la contraseña.');
            }

            usuarioLogueado.requiereCambioPass = false;
            sessionStorage.setItem('usuario', JSON.stringify(usuarioLogueado));

            alertMessage.classList.remove('d-none');
            alertMessage.classList.add('alert-success');
            alertMessage.textContent = '¡Contraseña actualizada con éxito! Redirigiendo al sistema...';

            setTimeout(() => {
                window.location.replace('/sistema');
            }, 1500);

        } catch (error) {
            alertMessage.classList.remove('d-none');
            alertMessage.classList.add('alert-danger');
            alertMessage.textContent = error.message;

            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i class="bi bi-check-circle"></i> Actualizar Contraseña`;
        }
    });
});