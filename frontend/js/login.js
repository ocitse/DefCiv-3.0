// frontend/js/login.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const btnLogin = document.getElementById('btn-login');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Capturamos los valores de los inputs
        const email = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        // Limpiamos mensajes previos
        errorMessage.textContent = '';
        errorMessage.style.color = '#dc3545'; 

        // Validación visual rápida en el cliente
        if (!email || !password) {
            errorMessage.textContent = 'Por favor, complete todos los campos.';
            return;
        }

        try {
            // Deshabilitamos el botón para evitar doble clic
            btnLogin.disabled = true;
            btnLogin.innerHTML = `<i class="bi bi-arrow-repeat spin"></i> Conectando...`;

            // 2. Hacemos la petición fetch real a nuestro Backend
            const respuesta = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const resultado = await respuesta.json();

            // 3. Evaluamos la respuesta de la API
            if (!respuesta.ok) {
                // Si el backend responde con 400 o 500, mostramos el mensaje exacto que programamos
                throw new Error(resultado.mensaje || 'Error al intentar iniciar sesión.');
            }

            // ÉXITO TOTAL: Guardamos el Token y los datos del usuario en sessionStorage
            // Usamos sessionStorage para que si cierra la pestaña, la sesión se destruya por seguridad
            sessionStorage.setItem('token', resultado.token);
            sessionStorage.setItem('usuario', JSON.stringify(resultado.usuario));

            // Feedback visual verde antes de pasar
            errorMessage.style.color = '#198754';
            errorMessage.textContent = '¡Acceso concedido! Redirigiendo...';

            // 4. Redirección al Dashboard tras 1 segundo
            setTimeout(() => {
                window.location.href = '../../index.html';
            }, 1000);

        } catch (error) {
            // Mostramos los errores controlados (Usuario no encontrado, Contraseña incorrecta, etc.)
            errorMessage.textContent = error.message;
            
            // Restauramos el botón original
            btnLogin.disabled = false;
            btnLogin.innerHTML = `<i class="bi bi-box-arrow-in-right"></i> Ingresar`;
        }
    });
});