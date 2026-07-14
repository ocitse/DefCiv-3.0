// 🛠️ FUNCIÓN 1: CARGA DE LA TABLA Y EL MODAL (ROLES ACTUALIZADOS)
export async function cargarModuloUsuarios() {
    const contenedor = document.querySelector('.content-principal');
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="animate__animated animate__fadeIn">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 class="mb-1 text-dark"><i class="bi bi-people-fill text-warning me-2"></i> Gestión de Usuarios</h2>
                    <p class="text-muted mb-0">Administración de accesos y roles del sistema.</p>
                </div>
                <button class="btn btn-warning fw-bold d-flex align-items-center gap-2 shadow-sm" id="btn-nuevo-usuario" data-bs-toggle="modal" data-bs-target="#modalUsuario">
                    <i class="bi bi-person-plus-fill fs-5"></i> Nuevo Usuario
                </button>
            </div>

            <div class="card shadow-sm border-0" style="background-color: #f8f9fa;">
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-bordered table-striped align-middle mb-0" id="tabla-usuarios" style="border-color: #dee2e6;">
                            <thead class="table-dark text-white fw-bold">
                                <tr>
                                    <th class="ps-3 text-center" style="width: 80px;">ID</th>
                                    <th>Usuario / DNI</th>
                                    <th>Nombre Completo</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th class="text-end pe-3" style="width: 120px;">Acciones</th>
                                </tr>
                            </thead>
                            <tbody id="tbody-usuarios" class="bg-white"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="modalUsuario" data-bs-backdrop="static" tabindex="-1" aria-labelledby="modalUsuarioLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered text-dark">
                <div class="modal-content border-0 shadow">
                    <div class="modal-header bg-dark text-white border-0">
                        <h5 class="modal-title" id="modalUsuarioLabel"><i class="bi bi-person-plus-fill text-warning me-2"></i> Registrar Nuevo Usuario</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body bg-light p-4">
                        <form id="form-usuario">
                            <div class="alert alert-danger d-none small text-center" id="alert-modal-usuario"></div>
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold small">Nombres *</label>
                                    <input type="text" class="form-control" id="u-nombres" placeholder="Ej: Juan Pedro" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold small">Apellido *</label>
                                    <input type="text" class="form-control" id="u-apellido" placeholder="Ej: Pérez" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold small">Documento (Será su clave inicial) *</label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-secondary text-white"><i class="bi bi-card-text"></i></span>
                                        <input type="number" class="form-control" id="u-dni" placeholder="Ej: 38444222" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold small">Rol del Usuario *</label>
                                    <select class="form-select" id="u-rol" required>
                                        <option value="" disabled selected>Seleccione un rol...</option>
                                        <option value="Administrador">Administrador</option>
                                        <option value="Administrativo">Administrativo</option>
                                        <option value="Relevador">Relevador</option>
                                        <option value="Consulta">Consulta</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold small">Email *</label>
                                    <input type="email" class="form-control" id="u-email" placeholder="Ej: juan@defensacivil.com" required>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold small">Celular *</label>
                                    <input type="tel" class="form-control" id="u-celular" placeholder="Ej: 3851234567" required>
                                </div>
                            </div>
                            <div class="d-flex justify-content-end gap-2 mt-4">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="submit" class="btn btn-dark fw-bold" id="btn-guardar-usuario">
                                    <i class="bi bi-save-fill me-1"></i> Guardar Usuario
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('form-usuario')?.addEventListener('submit', (e) => {
        e.preventDefault();
        registrarUsuarioBackend();
    });

    try {
        const respuesta = await fetch('/api/usuarios');
        const resultado = await respuesta.json();

        const tbody = document.getElementById('tbody-usuarios');
        if (!tbody) return;

        if (!respuesta.ok || !resultado.success) {
            throw new Error(resultado.message || 'No se pudieron cargar los usuarios.');
        }

        if (resultado.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">No hay usuarios registrados.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';

        resultado.data.forEach(u => {
            const rolCrudo = String(u.rol || '').trim().toLowerCase();
            let nombreRolMostrar = 'No Asignado';
            let badgeColor = 'bg-secondary text-white'; 

            if (rolCrudo === 'administrador') {
                nombreRolMostrar = 'Administrador';
                badgeColor = 'bg-primary text-white';
            } else if (rolCrudo === 'administrativo') {
                nombreRolMostrar = 'Administrativo';
                badgeColor = 'bg-info text-dark';
            } else if (rolCrudo === 'relevador') {
                nombreRolMostrar = 'Relevador';
                badgeColor = 'bg-success text-white';
            } else if (rolCrudo === 'consulta') {
                nombreRolMostrar = 'Consulta';
                badgeColor = 'bg-secondary text-white';
            } else if (u.rol) {
                nombreRolMostrar = u.rol;
            }

            const badgeEstado = String(u.estado).trim().toLowerCase() === 'activo' 
                ? '<span class="badge bg-success text-white">Activo</span>' 
                : '<span class="badge bg-danger text-white">Inactivo</span>';

            tbody.innerHTML += `
                <tr class="text-dark">
                    <td class="ps-3 fw-bold text-center text-muted" style="background-color: #f1f3f5;">${u.id}</td>
                    <td>
                        <div class="fw-bold text-primary">@${u.username}</div>
                        <div class="small text-muted">DNI: ${u.dni || 'S/D'}</div>
                    </td>
                    <td class="fw-bold">${u.apellido || ''}, ${u.nombres || ''}</td>
                    <td><span class="badge ${badgeColor}">${nombreRolMostrar}</span></td>
                    <td>${badgeEstado}</td>
                    <td class="text-end pe-3">
                       <button class="btn btn-sm btn-outline-secondary me-1" title="Editar" onclick='abrirModalEditar(${JSON.stringify(u)})'>
                            <i class="bi bi-pencil-square text-dark"></i>
                        </button>
                        <button class="btn btn-sm ${u.estado === 'Activo' ? 'btn-outline-danger' : 'btn-outline-success'}" 
                                onclick="cambiarEstadoUsuario(${u.id}, '${u.estado}')">
                            <i class="bi ${u.estado === 'Activo' ? 'bi-person-x-fill' : 'bi-person-check-fill'}"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

    } catch (error) {
        console.error(error);
        const tbody = document.getElementById('tbody-usuarios');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-danger fw-bold"><i class="bi bi-exclamation-triangle-fill me-2"></i> Error al conectar con el servidor.</td></tr>`;
        }
    }
}

// 🛠️ FUNCIÓN 2: REGISTRO DE UN NUEVO USUARIO
async function registrarUsuarioBackend() {
    const btnGuardar = document.getElementById('btn-guardar-usuario');
    const alertModal = document.getElementById('alert-modal-usuario');

    const nombres = document.getElementById('u-nombres').value.trim();
    const apellido = document.getElementById('u-apellido').value.trim();
    const dni = document.getElementById('u-dni').value.trim();
    const rol = document.getElementById('u-rol').value;
    const email = document.getElementById('u-email').value.trim();
    const celular = document.getElementById('u-celular').value.trim();

    const primerNombre = nombres.split(' ')[0]; 
    const primerApellido = apellido.split(' ')[0];
    const username = (primerNombre.charAt(0) + primerApellido).toLowerCase().replace(/[^a-z0-9]/g, '');

    alertModal.className = 'alert alert-danger d-none small text-center';
    alertModal.textContent = '';

    try {
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = `<i class="bi bi-arrow-repeat spin"></i> Guardando...`;

        const respuesta = await fetch('/api/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, dni, apellido, nombres, email, celular, rol })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.success) {
            throw new Error(resultado.message || 'Error al intentar registrar el usuario.');
        }

        alertModal.classList.remove('alert-danger', 'd-none');
        alertModal.classList.add('alert-success');
        alertModal.textContent = resultado.message;

        document.getElementById('form-usuario').reset();

        setTimeout(() => {
            const modalElement = document.getElementById('modalUsuario');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();
            cargarModuloUsuarios();
        }, 2000);

    } catch (error) {
        alertModal.classList.remove('d-none');
        alertModal.textContent = error.message;
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = `<i class="bi bi-save-fill me-1"></i> Guardar Usuario`;
    }
}

// 🔄 FUNCIÓN 3: Cambiar estado (Activo/Inactivo) en el Backend
window.cambiarEstadoUsuario = async function(id, estadoActual) {
    const accion = estadoActual === 'Activo' ? 'dar de BAJA' : 'ACTIVAR';
    
    if (!confirm(`¿Está seguro de que desea ${accion} al usuario con ID ${id}?`)) {
        return; 
    }

    try {
        const respuesta = await fetch(`/api/usuarios/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok || !resultado.success) {
            throw new Error(resultado.message || 'No se pudo cambiar el estado.');
        }

        alert(resultado.message);
        cargarModuloUsuarios();

    } catch (error) {
        console.error(error);
        alert(`Error: ${error.message}`);
    }
}

// Exponemos la función al objeto global window por si se llama desde eventos inline
window.cargarModuloUsuarios = cargarModuloUsuarios;