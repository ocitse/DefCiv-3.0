// frontend/js/login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const btnLogin = document.getElementById('btn-login');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Capturamos el valor del input de usuario (renombramos la variable a 'nombre')
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        // Limpiamos mensajes previos
        errorMessage.textContent = '';
        errorMessage.style.color = '#dc3545'; 

        // Validación visual rápida en el cliente
        if (!username || !password) {
            errorMessage.textContent = 'Por favor, complete todos los campos.';
            return;
        }

        try {
            // Deshabilitamos el botón para evitar doble clic
            btnLogin.disabled = true;
            btnLogin.innerHTML = `<i class="bi bi-arrow-repeat spin"></i> Conectando...`;

            // 2. Hacemos la petición fetch enviando la propiedad 'nombre'
            const respuesta = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }) // 👈 Enviamos 'nombre' en lugar de 'email'
            });

            const resultado = await respuesta.json();

            // 3. Evaluamos la respuesta de la API
            if (!respuesta.ok) {
                throw new Error(resultado.mensaje || 'Error al intentar iniciar sesión.');
            }

            // ÉXITO TOTAL: Guardamos el Token y los datos del usuario en sessionStorage
            sessionStorage.setItem('token', resultado.token);
            sessionStorage.setItem('usuario', JSON.stringify(resultado.usuario));

            // Feedback visual verde antes de pasar
            errorMessage.style.color = '#198754';
            errorMessage.textContent = '¡Acceso concedido! Redirigiendo...';

            // 4. Redirección inteligente tras 1 segundo
            setTimeout(() => {
                if (resultado.usuario.requiereCambioPass) {
                    window.location.href = 'cambiar-password.html'; 
                } else {
                    window.location.href = '../index.html';
                }
            }, 1000);

        } catch (error) {
            errorMessage.textContent = error.message;
            
            // Restauramos el botón original
            btnLogin.disabled = false;
            btnLogin.innerHTML = `<i class="bi bi-box-arrow-in-right"></i> Ingresar`;
        }
    });
});