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
        
        // Limpiamos el ID oculto para indicar que es un registro NUEVO
        const inputId = document.getElementById('rev-id');
        if (inputId) inputId.value = '';

        const tituloTexto = document.getElementById('modalTituloTexto');
        if (tituloTexto) tituloTexto.innerText = 'Registrar Nuevo Relevador';
        
        const modalInstance = new bootstrap.Modal(elModal);
        modalInstance.show();
    }
}

/**
 * Abre el modal para editar un relevador existente (¡Esto faltaba!)
 */
export function abrirModalEditarRelevador(id, nombre, dni, email, telefono) {
    const elModal = document.getElementById('modalNuevoRelevador');
    if (elModal && typeof bootstrap !== 'undefined') {
        // Cargamos los datos en el formulario
        document.getElementById('rev-id').value = id;
        document.getElementById('rev-nombre').value = nombre;
        document.getElementById('rev-dni').value = dni;
        document.getElementById('rev-email').value = email !== 'null' ? email : '';
        document.getElementById('rev-telefono').value = (telefono && telefono !== 'null') ? telefono : '';
        
        const tituloTexto = document.getElementById('modalTituloTexto');
        if (tituloTexto) tituloTexto.innerText = 'Editar Relevador';

        const modalInstance = new bootstrap.Modal(elModal);
        modalInstance.show();
    }
}

/**
 * Guarda o actualiza un relevador (Detecta automáticamente si es POST o PUT según el ID)
 */
export async function guardarNuevoRelevador() {
    const id = document.getElementById('rev-id').value.trim();
    const nombre = document.getElementById('rev-nombre').value.trim();
    const dni = document.getElementById('rev-dni').value.trim();
    const email = document.getElementById('rev-email').value.trim();
    const telefono = document.getElementById('rev-telefono').value.trim();

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
            
            // Cerrar el modal de manera segura con Bootstrap
            const elModal = document.getElementById('modalNuevoRelevador');
            const modalInstance = bootstrap.Modal.getInstance(elModal) || new bootstrap.Modal(elModal);
            modalInstance.hide();

            // Limpiar formulario y recargar tabla
            document.getElementById('form-nuevo-relevador').reset();
            cargarVistaRelevadores(); 
        } else {
            mostrarNotificacion(resultado.mensaje || resultado.message || "Error al procesar el relevador.", "error");
        }
    } catch (error) {
        console.error("Error al procesar relevador:", error);
        mostrarNotificacion("Error de conexión con el servidor.", "error");
    }
}

// Vinculación global para los botones del DOM / onclick
if (typeof window !== 'undefined') {
    window.cargarVistaRelevadores = cargarVistaRelevadores;
    window.cambiarEstadoRelevador = cambiarEstadoRelevador;
    window.abrirModalNuevoRelevador = abrirModalNuevoRelevador;
    window.abrirModalEditarRelevador = abrirModalEditarRelevador;
    window.guardarNuevoRelevador = guardarNuevoRelevador;
}