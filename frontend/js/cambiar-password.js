document.addEventListener('DOMContentLoaded', () => {
    const changeForm = document.getElementById('change-pass-form');
    const alertMessage = document.getElementById('alert-message');
    const btnSubmit = document.getElementById('btn-submit');
    
    // Elementos dinámicos del DOM
    const iconoHeader = document.getElementById('icono-header');
    const tituloHeader = document.getElementById('titulo-header');
    const descripcionHeader = document.getElementById('descripcion-header');
    const labelPassActual = document.getElementById('label-pass-actual');
    const contenedorVolver = document.getElementById('contenedor-volver');

    // 🔒 1. CONTROL DE SEGURIDAD INTERNO
    const token = sessionStorage.getItem('token');
    const usuarioRaw = sessionStorage.getItem('usuario');

    if (!token || !usuarioRaw) {
        window.location.href = 'login.html'; 
        return;
    }

    const usuarioLogueado = JSON.parse(usuarioRaw);

    // 🎨 2. ADAPTAR VISTA SEGÚN EL ESTADO (Obligatorio vs Voluntario)
    if (!usuarioLogueado.requiereCambioPass) {
        // Modo Voluntario
        iconoHeader.className = 'bi bi-key-fill text-primary';
        tituloHeader.textContent = 'Cambiar Contraseña';
        descripcionHeader.textContent = 'Ingresa tu contraseña actual y la nueva clave que deseas utilizar.';
        labelPassActual.textContent = 'Contraseña Actual';
        contenedorVolver.classList.remove('d-none'); // Muestra la opción de volver al index
        btnSubmit.className = 'btn btn-primary w-100 text-white fw-bold';
    } else {
        // Modo Obligatorio (Primera vez)
        iconoHeader.className = 'bi bi-shield-lock text-warning';
        tituloHeader.textContent = 'Actualización Obligatoria';
        descripcionHeader.textContent = 'Por seguridad, debes cambiar tu contraseña predeterminada antes de ingresar al sistema.';
        labelPassActual.textContent = 'Contraseña Actual (DNI)';
        contenedorVolver.classList.add('d-none');
        btnSubmit.className = 'btn btn-warning w-100 text-white fw-bold';
    }

    // 📩 3. MANEJO DEL FORMULARIO
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

            // ÉXITO: Actualizamos el estado de la sesión
            usuarioLogueado.requiereCambioPass = false;
            sessionStorage.setItem('usuario', JSON.stringify(usuarioLogueado));

            alertMessage.classList.remove('d-none');
            alertMessage.classList.add('alert-success');
            alertMessage.textContent = '¡Contraseña actualizada con éxito!';

            setTimeout(() => {
                window.location.href = '../../index.html';
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