let idUsuarioEnEdicion = null;

document.addEventListener('DOMContentLoaded', () => {
    const formAlta = document.getElementById('form-usuario');
    
    if (formAlta) {
        const inputApellido = document.getElementById('apellido');
        const inputNombres = document.getElementById('nombres');
        const inputUsername = document.getElementById('username');

        const generarSugerenciaUsuario = () => {
            const apellido = inputApellido?.value.trim().toLowerCase().replace(/\s+/g, '') || '';
            const nombres = inputNombres?.value.trim().toLowerCase().split(' ') || [];
            
            if (apellido && nombres[0]) {
                const inicialNombre = nombres[0].charAt(0);
                if (inputUsername) inputUsername.value = `${inicialNombre}${apellido}`;
            }
        };

        if (inputApellido) inputApellido.addEventListener('input', generarSugerenciaUsuario);
        if (inputNombres) inputNombres.addEventListener('input', generarSugerenciaUsuario);

        formAlta.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (idUsuarioEnEdicion) {
                await actualizarUsuarioBackend(); 
                return; 
            }

            const formData = new FormData(formAlta);
            const datosUsuario = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/home/defenprov/api/usuarios/crear', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datosUsuario)
                });

                const resultado = await response.json();

                if (response.ok && resultado.success) {
                    alert('¡Usuario creado con éxito!');
                    formAlta.reset();
                    if (typeof window.cargarModuloUsuarios === 'function') {
                        window.cargarModuloUsuarios();
                    }
                } else {
                    alert(`Error al guardar: ${resultado.message || 'Hubo un problema.'}`);
                }
            } catch (error) {
                console.error('Error en la petición Fetch:', error);
            }
        });
    }
});

function abrirModalEditar(usuario) {
    console.log("Datos que llegan del usuario:", usuario);
    idUsuarioEnEdicion = usuario.id; 

    const tituloModal = document.getElementById('modalUsuarioLabel');
    const botonGuardar = document.getElementById('btn-guardar-usuario');
    
    if (tituloModal) tituloModal.innerHTML = `<i class="bi bi-pencil-square text-warning me-2"></i> Editar Usuario (ID: ${usuario.id})`;
    if (botonGuardar) botonGuardar.innerHTML = `<i class="bi bi-save-fill me-1"></i> Actualizar Cambios`;

    if (document.getElementById('u-nombres')) document.getElementById('u-nombres').value = usuario.nombres || '';
    if (document.getElementById('u-apellido')) document.getElementById('u-apellido').value = usuario.apellido || '';
    if (document.getElementById('u-username')) document.getElementById('u-username').value = usuario.username || '';
    if (document.getElementById('u-dni')) document.getElementById('u-dni').value = usuario.dni || '';
    if (document.getElementById('u-email')) document.getElementById('u-email').value = usuario.email || '';
    if (document.getElementById('u-celular')) document.getElementById('u-celular').value = usuario.celular || '';
    
    const selectRol = document.getElementById('u-rol');
    if (selectRol) {
        selectRol.value = usuario.rol || '';
    }

    const alerta = document.getElementById('alert-modal-usuario');
    if (alerta) alerta.classList.add('d-none');
    
    const miModal = new bootstrap.Modal(document.getElementById('modalUsuario'));
    miModal.show();
}

async function actualizarUsuarioBackend() {
    const formModal = document.getElementById('form-usuario');
    
    const datosActualizados = {
        nombres: document.getElementById('u-nombres').value,
        apellido: document.getElementById('u-apellido').value,
        dni: document.getElementById('u-dni').value,
        email: document.getElementById('u-email').value,
        celular: document.getElementById('u-celular').value,
        rol: document.getElementById('u-rol').value
    };

    try {
        const response = await fetch(`/api/usuarios/${idUsuarioEnEdicion}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosActualizados)
        });

        const resultado = await response.json();

        if (response.ok && resultado.success) {
            alert('¡Usuario actualizado con éxito!');
            
            const modalEl = document.getElementById('modalUsuario');
            const modalInstance = bootstrap.Modal.getInstance(modalEl);
            modalInstance?.hide();

            if (formModal) {
                formModal.reset();
            }
            
            idUsuarioEnEdicion = null; 
            
            if (typeof window.cargarModuloUsuarios === 'function') {
                window.cargarModuloUsuarios();
            }
        } else {
            alert(`Error al actualizar: ${resultado.message || 'Hubo un problema.'}`);
        }
    } catch (error) {
        console.error('Error en la petición Fetch PUT:', error);
        alert('Error de conexión al intentar actualizar.');
    }
}

// Exposición global obligatoria
window.abrirModalEditar = abrirModalEditar;
window.actualizarUsuarioBackend = actualizarUsuarioBackend;