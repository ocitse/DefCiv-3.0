document.addEventListener('DOMContentLoaded', () => {
    const formAlta = document.getElementById('formAltaUsuario');
    const inputApellido = document.getElementById('apellido');
    const inputNombres = document.getElementById('nombres');
    const inputUsername = document.getElementById('username');

    // 1. Sugerencia automática del Nombre de Usuario (Opcional pero ayuda un montón)
    const generarSugerenciaUsuario = () => {
        const apellido = inputApellido.value.trim().toLowerCase().replace(/\s+/g, '');
        const nombres = inputNombres.value.trim().toLowerCase().split(' ');
        
        if (apellido && nombres[0]) {
            const inicialNombre = nombres[0].charAt(0);
            // Sugiere: inicial del primer nombre + apellido completo (ej: jcarlos perez -> jperez)
            inputUsername.value = `${inicialNombre}${apellido}`;
        }
    };

    inputApellido.addEventListener('input', generarSugerenciaUsuario);
    inputNombres.addEventListener('input', generarSugerenciaUsuario);

    // 2. Captura y envío del Formulario vía Fetch
    formAlta.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página se recargue

        // Creamos un objeto con los datos del formulario
        const formData = new FormData(formAlta);
        const datosUsuario = Object.fromEntries(formData.entries());

        try {
            // Apuntamos a la ruta relativa del backend configurada en Alwaysdata
            const response = await fetch('/home/defenprov/api/usuarios/crear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosUsuario)
            });

            const resultado = await response.json();

            if (response.ok && resultado.success) {
                alert('¡Usuario creado con éxito! Se le asignó su DNI como contraseña provisoria.');
                formAlta.reset(); // Limpia el formulario
            } else {
                alert(`Error al guardar: ${resultado.message || 'Hubo un problema en el servidor.'}`);
            }
        } catch (error) {
            console.error('Error en la petición Fetch:', error);
            alert('Error de conexión. Asegurate de que el servidor esté respondiendo.');
        }
    });
});