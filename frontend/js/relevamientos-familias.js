import { cargarVistaDinamica } from './utils.js';
import { mostrarNotificacion } from './ui.js';
import { cargarTablaRelevamientos } from './relevamientos-general.js';

// Función principal para cargar la vista del relevamiento y sus familias desde el Backend
export async function ingresarARelevamiento(idRelevamiento) {
    window.idRelevamientoActivo = idRelevamiento;

    // Cargamos la estructura HTML de la tabla de familias
    cargarVistaDinamica('./frontend/pages/tabla-familias.html', async () => {
        try {
            // 1. Consultamos los datos generales del relevamiento para el "Contexto Territorial"
            const respuestaRel = await fetch(`/api/relevamientos/${idRelevamiento}`);
            if (respuestaRel.ok) {
                const rel = await respuestaRel.json();
                const contenedorContexto = document.getElementById('contexto-relevamiento-activo');
                if (contenedorContexto) {
                    contenedorContexto.innerHTML = `
                        <div class="col-md-3"><strong>Código:</strong> ${rel.codigo_relevamiento || 'N/D'}</div>
                        <div class="col-md-3"><strong>Depto / Loc:</strong> ${rel.departamento || 'N/D'} / ${rel.localidad || 'N/D'}</div>
                        <div class="col-md-3"><strong>Barrio:</strong> ${rel.barrio || 'N/D'}</div>
                        <div class="col-md-3"><strong>Evento:</strong> ${rel.tipo_evento || 'N/D'}</div>
                    `;
                }
            }

            // 2. Consultamos al backend las familias asociadas a este relevamiento
            const respuesta = await fetch(`/api/familias?id_relevamiento=${idRelevamiento}`);
            
            if (!respuesta.ok) {
                throw new Error('No se pudo obtener la lista de familias del servidor.');
            }

            const familias = await respuesta.json();
            renderizarTablaFamilias(familias);

        } catch (error) {
            console.error("Error al cargar familias:", error);
            mostrarNotificacion("Error al conectar con el servidor para traer las familias.", "error");
            renderizarTablaFamilias([]);
        }
    });
}

// Función auxiliar para dibujar las filas dentro de #tabla-familias-body
function renderizarTablaFamilias(familias) {
    const tbody = document.getElementById('tabla-familias-body');
    if (!tbody) return;

    if (!familias || familias.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="bi bi-folder2-open fs-3 d-block mb-1"></i>
                    No hay familias registradas en este relevamiento.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = familias.map((fam, index) => `
        <tr>
            <td>${index + 1}</td>
            <td><strong>${fam.dni_jefe || fam.dni || 'N/D'}</strong></td>
            <td>${fam.apellido && fam.nombre ? `${fam.apellido}, ${fam.nombre}` : (fam.jefe_familia || 'Sin especificar')}</td>
            <td class="text-center"><span class="badge bg-secondary">${fam.cantidad_integrantes || fam.total_personas || 1}</span></td>
            <td>
                <span class="badge bg-${obtenerColorUrgencia(fam.urgencia_familiar)}">
                    ${fam.urgencia_familiar || 'Normal'}
                </span>
            </td>
            <td><span class="badge bg-info text-dark">${fam.estado_asistencia || 'Pendiente'}</span></td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-info me-1" onclick="window.verFichaNecesidades('${fam.id_familia}')" title="Ver Ficha">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning me-1" onclick="window.editarDatosFamilia('${fam.id_familia}')" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="window.eliminarFamiliar('${fam.id_familia}')" title="Eliminar">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Función auxiliar para asignar colores a la prioridad
function obtenerColorUrgencia(urgencia) {
    switch ((urgencia || '').toLowerCase()) {
        case 'alta': return 'danger';
        case 'media': return 'warning text-dark';
        case 'baja': return 'success';
        default: return 'secondary';
    }
}

// Función disparada por el botón "Agregar Nueva Familia" en tabla-familias.html
export function mostrarFormularioNuevaFamilia() {
    cargarVistaDinamica('./frontend/pages/form-familia.html', () => {
        const inputId = document.getElementById('f_id_edicion');
        if (inputId) inputId.value = '';
    });
}

export async function eliminarFamiliar(idFamilia) {
    if (!confirm("¿Está seguro de que desea eliminar esta familia del registro?")) {
        return;
    }

    try {
        const respuesta = await fetch(`/api/familias/${idFamilia}`, {
            method: 'DELETE'
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || 'Error al eliminar la familia.');
        }

        mostrarNotificacion(resultado.mensaje || "Registro familiar eliminado correctamente.");
        
        if (window.idRelevamientoActivo) {
            ingresarARelevamiento(window.idRelevamientoActivo);
        }

    } catch (error) {
        console.error("Error al eliminar familia:", error);
        mostrarNotificacion(error.message, "error");
    }
}

export async function verFichaNecesidades(idFamilia) {
    try {
        const respuesta = await fetch(`/api/familias/${idFamilia}`);
        if (!respuesta.ok) throw new Error("No se pudo obtener la información de la familia.");
        
        const fam = await respuesta.json();

        const contenidoModal = `
            <div class="modal fade" id="modalFichaFamilia" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content shadow-lg border-0">
                        <div class="modal-header bg-dark text-white">
                            <h5 class="modal-title"><i class="bi bi-file-earmark-text-fill text-warning me-2"></i> Ficha: ${fam.apellido || ''} ${fam.nombre || fam.jefe_familia || ''}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4 bg-light">
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <div class="p-3 bg-white rounded border shadow-sm">
                                        <h6 class="text-primary fw-bold border-bottom pb-2 mb-2"><i class="bi bi-people-fill me-1"></i> Datos Demográficos</h6>
                                        <p class="mb-1 small"><strong>DNI:</strong> ${fam.dni_jefe || fam.dni || 'No especificado'}</p>
                                        <p class="mb-1 small"><strong>Teléfono:</strong> ${fam.telefono || 'No especificado'}</p>
                                        <p class="mb-1 small"><strong>Dirección:</strong> ${fam.direccion || 'No especificado'}</p>
                                        <p class="mb-0 small"><strong>Integrantes:</strong> Mayores: ${fam.mayores || 1}, Menores: ${fam.menores || 0}</p>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="p-3 bg-white rounded border shadow-sm">
                                        <h6 class="text-danger fw-bold border-bottom pb-2 mb-2"><i class="bi bi-house-exclamation-fill me-1"></i> Estado de Vivienda</h6>
                                        <p class="mb-1 small"><strong>Prioridad:</strong> ${fam.urgencia_familiar || 'Normal'}</p>
                                        <p class="mb-0 small"><strong>Pérdida Total:</strong> ${fam.f_dano_perdida_completa ? 'Sí' : 'No'}</p>
                                    </div>
                                </div>
                            </div>

                            <div class="p-3 bg-warning bg-opacity-10 rounded border border-warning-subtle">
                                <h6 class="fw-bold text-dark mb-1"><i class="bi bi-chat-left-text-fill me-1"></i> Observaciones</h6>
                                <p class="m-0 small text-dark">${fam.observaciones || 'Sin observaciones registradas.'}</p>
                            </div>
                        </div>
                        <div class="modal-footer bg-light">
                            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cerrar Ficha</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const modalViejo = document.getElementById('contenedor-modal-dinamico');
        if (modalViejo) modalViejo.remove();

        const divTemporal = document.createElement('div');
        divTemporal.id = 'contenedor-modal-dinamico';
        divTemporal.innerHTML = contenidoModal;
        document.body.appendChild(divTemporal);

        const elementoModal = document.getElementById('modalFichaFamilia');
        const bModal = new bootstrap.Modal(elementoModal);
        bModal.show();

        elementoModal.addEventListener('hidden.bs.modal', () => {
            divTemporal.remove();
        });

    } catch (error) {
        console.error("Error al abrir ficha:", error);
        mostrarNotificacion(error.message, "error");
    }
}

export function verListaRelevamientos() {
    cargarVistaDinamica('./frontend/pages/tabla-relevamientos.html', () => {
        if (typeof cargarTablaRelevamientos === 'function') {
            cargarTablaRelevamientos();
        } else {
            console.error("No se encontró la función cargarTablaRelevamientos");
        }
    });
}

// Exposiciones globales para los eventos onclick en el DOM dinámico
window.ingresarARelevamiento = ingresarARelevamiento;
window.mostrarFormularioNuevaFamilia = mostrarFormularioNuevaFamilia;
window.verListaRelevamientos = verListaRelevamientos;
window.eliminarFamiliar = eliminarFamiliar;
window.verFichaNecesidades = verFichaNecesidades;