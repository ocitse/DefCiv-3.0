import { mostrarNotificacion } from './ui.js';

/**
 * Carga el listado completo de administradores de relevadores
 */
export async function cargarVistaRelevadores() {
    const tbody = document.getElementById('tabla-relevadores-body');
    if (!tbody) return;

    try {
        const respuesta = await fetch('/api/relevadores/admin');
        const resultado = await respuesta.json();
        const lista = resultado.data || [];

        if (lista.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No hay relevadores registrados.</td></tr>`;
            return;
        }

        tbody.innerHTML = lista.map(rev => `
            <tr>
                <td><span class="badge bg-dark">${rev.codigo_relevador || 'null'}</span></td>
                <td class="fw-semibold">${rev.nombre}</td>
                <td>${rev.dni || '-'}</td>
                <td>${rev.email || '-'}</td>
                <td class="text-center">
                    <span class="badge ${rev.activo ? 'bg-success' : 'bg-secondary'}">
                        ${rev.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td class="text-center">
                    <button class="btn btn-outline-primary btn-sm me-1" onclick="abrirModalEditarRelevador(${rev.id}, '${rev.nombre}', '${rev.dni}', '${rev.email || ''}', '${rev.telefono || ''}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="cambiarEstadoRelevador(${rev.id}, ${rev.activo ? 0 : 1})" title="Cambiar Estado">
                        <i class="bi ${rev.activo ? 'bi-toggle-on text-success' : 'bi-toggle-off text-muted'} fs-5"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error("Error al cargar la tabla de relevadores:", error);
        mostrarNotificacion("No se pudo obtener el listado de relevadores.", "error");
    }
}

/**
 * Cambia el estado (Activo/Inactivo) de un relevador
 */
export async function cambiarEstadoRelevador(id, nuevoEstado) {
    try {
        const respuesta = await fetch(`/api/relevadores/${id}/estado`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activo: nuevoEstado })
        });
        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarNotificacion("Estado actualizado correctamente.");
            cargarVistaRelevadores();
        } else {
            mostrarNotificacion("No se pudo cambiar el estado.", "error");
        }
    } catch (error) {
        console.error("Error de red:", error);
        mostrarNotificacion("Error al comunicarse con el servidor.", "error");
    }
}

/**
 * Abre el modal para dar de alta un nuevo relevador limpio
 */
export function abrirModalNuevoRelevador() {
    const elModal = document.getElementById('modalNuevoRelevador');
    if (elModal && typeof bootstrap !== 'undefined') {
        const form = document.getElementById('form-nuevo-relevador');
        if (form) form.reset();
        
        const inputId = document.getElementById('rev-id');
        if (inputId) inputId.value = '';

        const tituloTexto = document.getElementById('modalTituloTexto');
        if (tituloTexto) tituloTexto.innerText = 'Registrar Nuevo Relevador';
        
        const modalInstance = new bootstrap.Modal(elModal);
        modalInstance.show();
    }
}

/**
 * Abre el modal para editar un relevador existente cargando todos sus datos (incluido el teléfono)
 */
export function abrirModalEditarRelevador(id, nombre, dni, email, telefono) {
    const elModal = document.getElementById('modalNuevoRelevador');
    if (elModal && typeof bootstrap !== 'undefined') {
        document.getElementById('rev-id').value = id;
        document.getElementById('rev-nombre').value = nombre || '';
        document.getElementById('rev-dni').value = dni || '';
        document.getElementById('rev-email').value = (email && email !== 'null') ? email : '';
        document.getElementById('rev-telefono').value = (telefono && telefono !== 'null') ? telefono : '';
        
        const tituloTexto = document.getElementById('modalTituloTexto');
        if (tituloTexto) tituloTexto.innerText = 'Editar Relevador';

        const modalInstance = new bootstrap.Modal(elModal);
        modalInstance.show();
    }
}

/**
 * Guarda o actualiza un relevador conectando directamente con el botón del modal
 */
export async function guardarRelevador() {
    const idInput = document.getElementById('rev-id');
    const nombreInput = document.getElementById('rev-nombre');
    const dniInput = document.getElementById('rev-dni');
    const emailInput = document.getElementById('rev-email');
    const telefonoInput = document.getElementById('rev-telefono');

    if (!nombreInput || !dniInput) return;

    const id = idInput ? idInput.value.trim() : '';
    const nombre = nombreInput.value.trim();
    const dni = dniInput.value.trim();
    const email = emailInput ? emailInput.value.trim() : '';
    const telefono = telefonoInput ? telefonoInput.value.trim() : '';

    if (!nombre || !dni) {
        mostrarNotificacion("Complete los campos obligatorios (Nombre y DNI).", "error");
        return;
    }

    try {
        const url = id ? `/api/relevadores/${id}` : '/api/relevadores';
        const metodo = id ? 'PUT' : 'POST';

        const respuesta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, dni, email, telefono })
        });
        const resultado = await respuesta.json();

        if (respuesta.ok || resultado.success) {
            mostrarNotificacion(id ? "Relevador actualizado correctamente." : "Relevador guardado correctamente.");
            
            const elModal = document.getElementById('modalNuevoRelevador');
            if (elModal && typeof bootstrap !== 'undefined') {
                const modalInstance = bootstrap.Modal.getInstance(elModal);
                if (modalInstance) modalInstance.hide();
            }

            const form = document.getElementById('form-nuevo-relevador');
            if (form) form.reset();

            cargarVistaRelevadores(); 
        } else {
            mostrarNotificacion(resultado.mensaje || resultado.message || "Error al procesar el relevador.", "error");
        }
    } catch (error) {
        console.error("Error al procesar relevador:", error);
        mostrarNotificacion("Error de conexión con el servidor.", "error");
    }
}

// Vinculación global para que el HTML reconozca las funciones por onclick
if (typeof window !== 'undefined') {
    window.cargarVistaRelevadores = cargarVistaRelevadores;
    window.cambiarEstadoRelevador = cambiarEstadoRelevador;
    window.abrirModalNuevoRelevador = abrirModalNuevoRelevador;
    window.abrirModalEditarRelevador = abrirModalEditarRelevador;
    window.guardarRelevador = guardarRelevador;
}