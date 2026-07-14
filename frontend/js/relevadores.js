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
                <td>#${rev.id}</td>
                <td class="fw-semibold">${rev.nombre}</td>
                <td>${rev.dni || '-'}</td>
                <td>${rev.email || '-'}</td>
                <td class="text-center">
                    <span class="badge ${rev.activo ? 'bg-success' : 'bg-secondary'}">
                        ${rev.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td class="text-center">
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
            cargarVistaRelevadores(); // Recargamos la tabla
        } else {
            mostrarNotificacion("No se pudo cambiar el estado.", "error");
        }
    } catch (error) {
        console.error("Error de red:", error);
        mostrarNotificacion("Error al comunicarse con el servidor.", "error");
    }
}

/**
 * Abre el modal para dar de alta un nuevo relevador
 */
export function abrirModalNuevoRelevador() {
    const elModal = document.getElementById('modalNuevoRelevador');
    if (elModal && typeof bootstrap !== 'undefined') {
        const form = document.getElementById('form-nuevo-relevador');
        if (form) form.reset();
        
        const modalInstance = new bootstrap.Modal(elModal);
        modalInstance.show();
    }
}

/**
 * Guarda un nuevo relevador consumiendo la API POST de forma segura contra doble clic
 */
export async function guardarNuevoRelevador() {
    const nombreInput = document.getElementById('rev-nombre');
    const dniInput = document.getElementById('rev-dni');
    const emailInput = document.getElementById('rev-email');
    
    // Buscar el botón de guardar en el modal para bloquearlo momentáneamente
    const btnGuardar = document.querySelector('#modalNuevoRelevador .btn-primary');

    if (!nombreInput || !dniInput) return;

    const nombre = nombreInput.value.trim();
    const dni = dniInput.value.trim();
    const email = emailInput ? emailInput.value.trim() : '';

    if (!nombre || !dni) {
        mostrarNotificacion("Complete los campos obligatorios (Nombre y DNI).", "error");
        return;
    }

    try {
        if (btnGuardar) {
            btnGuardar.disabled = true;
            btnGuardar.textContent = 'Guardando...';
        }

        const respuesta = await fetch('/api/relevadores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, dni, email })
        });
        const resultado = await respuesta.json();

        if (resultado.success) {
            mostrarNotificacion("Relevador guardado correctamente.");
            
            const elModal = document.getElementById('modalNuevoRelevador');
            if (elModal && typeof bootstrap !== 'undefined') {
                const modalInstance = bootstrap.Modal.getInstance(elModal);
                if (modalInstance) modalInstance.hide();
            }

            const form = document.getElementById('form-nuevo-relevador');
            if (form) form.reset();

            cargarVistaRelevadores(); 
        } else {
            mostrarNotificacion(resultado.message || "Error al registrar el relevador.", "error");
        }
    } catch (error) {
        console.error("Error al registrar relevador:", error);
        mostrarNotificacion("Error de conexión con el servidor.", "error");
    } finally {
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.textContent = 'Guardar Relevador';
        }
    }
}

// Vinculación global para los botones del DOM / onclick
if (typeof window !== 'undefined') {
    window.cargarVistaRelevadores = cargarVistaRelevadores;
    window.cambiarEstadoRelevador = cambiarEstadoRelevador;
    window.abrirModalNuevoRelevador = abrirModalNuevoRelevador;
    window.guardarNuevoRelevador = guardarNuevoRelevador;
}