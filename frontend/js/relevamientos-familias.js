import { cargarVistaDinamica } from './utils.js';
import { mostrarNotificacion } from './ui.js';
import { cargarTablaRelevamientos } from './relevamientos-general.js';

// Función principal para cargar la vista del relevamiento y sus familias desde el Backend
export async function ingresarARelevamiento(idRelevamiento) {
    window.idRelevamientoActivo = idRelevamiento;

    // Cargamos primero la estructura HTML de la vista
    cargarVistaDinamica('./frontend/pages/detalle-relevamiento.html', async () => {
        try {
            // Consultamos al backend las familias asociadas a este relevamiento
            const respuesta = await fetch(`/api/familias?id_relevamiento=${idRelevamiento}`);
            
            if (!respuesta.ok) {
                throw new Error('No se pudo obtener la lista de familias del servidor.');
            }

            const familias = await respuesta.json();
            renderizarTablaFamilias(familias);

        } catch (error) {
            console.error("Error al cargar familias:", error);
            mostrarNotificacion("Error al conectar con el servidor para traer las familias.", "error");
            renderizarTablaFamilias([]); // Renderiza vacío o con mensaje de error
        }
    });
}

// Función auxiliar para dibujar la tabla en el DOM
function renderizarTablaFamilias(familias) {
    const contenedorTabla = document.getElementById('contenedor-tabla-familias');
    if (!contenedorTabla) return;

    if (!familias || familias.length === 0) {
        contenedorTabla.innerHTML = `
            <div class="text-center py-5 bg-light rounded border text-muted">
                <i class="bi bi-folder2-open display-4 mb-2 d-block"></i>
                <p class="mb-2 fw-semibold">No hay familias cargadas en este relevamiento.</p>
                <button class="btn btn-primary btn-sm mt-2" onclick="cargarVistaDinamica('./frontend/pages/form-familia.html')">
                    <i class="bi bi-plus-lg me-1"></i> Registrar Primera Familia
                </button>
            </div>
        `;
        return;
    }

    let filasHTML = familias.map(fam => `
        <tr>
            <td><strong>${fam.jefe_familia || 'Sin especificar'}</strong></td>
            <td>${fam.dni_jefe || fam.dni || 'N/D'}</td>
            <td>${fam.telefono || 'Sin teléfono'}</td>
            <td><span class="badge bg-secondary">${fam.cantidad_integrantes || fam.total_personas || 1} pers.</span></td>
            <td>${fam.danos_estructurales ? '<span class="badge bg-danger">Pérdida Total</span>' : '<span class="badge bg-success">Parcial/Leve</span>'}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-info me-1" onclick="verFichaNecesidades('${fam.id_familia}')" title="Ver Ficha">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-warning me-1" onclick="editarDatosFamilia('${fam.id_familia}')" title="Editar">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarFamiliar('${fam.id_familia}')" title="Eliminar">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    contenedorTabla.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-dark">
                    <tr>
                        <th>Jefe de Familia</th>
                        <th>DNI</th>
                        <th>Teléfono</th>
                        <th>Integrantes</th>
                        <th>Daños</th>
                        <th class="text-end">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasHTML}
                </tbody>
            </table>
        </div>
    `;
}

export async function eliminarFamiliar(idFamilia) {
    if (!confirm("¿Está seguro de que desea eliminar esta familia del registro? Esta acción no se puede deshacer.")) {
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
        
        // Recargamos la vista actual para reflejar los cambios
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
                            <h5 class="modal-title"><i class="bi bi-file-earmark-text-fill text-warning me-2"></i> Ficha: ${fam.jefe_familia}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4 bg-light">
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <div class="p-3 bg-white rounded border shadow-sm">
                                        <h6 class="text-primary fw-bold border-bottom pb-2 mb-2"><i class="bi bi-people-fill me-1"></i> Datos Demográficos</h6>
                                        <p class="mb-1 small"><strong>DNI:</strong> ${fam.dni_jefe || 'No especificado'}</p>
                                        <p class="mb-1 small"><strong>Teléfono:</strong> ${fam.telefono || 'No especificado'}</p>
                                        <p class="mb-1 small"><strong>Dirección:</strong> ${fam.direccion || 'No especificado'}</p>
                                        <p class="mb-0 small"><strong>Integrantes Totales:</strong> <strong>${fam.cantidad_integrantes || 1}</strong></p>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="p-3 bg-white rounded border shadow-sm">
                                        <h6 class="text-danger fw-bold border-bottom pb-2 mb-2"><i class="bi bi-house-exclamation-fill me-1"></i> Estado de Vivienda</h6>
                                        <p class="mb-1 small"><strong>Daños estructurales / Pérdida total:</strong> ${fam.danos_estructurales ? 'Sí' : 'No'}</p>
                                        <p class="mb-0 small"><strong>Requiere evacuación:</strong> ${fam.requiere_evacuacion ? 'Sí' : 'No'}</p>
                                    </div>
                                </div>
                            </div>

                            <div class="p-3 bg-warning bg-opacity-10 rounded border border-warning-subtle">
                                <h6 class="fw-bold text-dark mb-1"><i class="bi bi-chat-left-text-fill me-1"></i> Observaciones Adicionales</h6>
                                <p class="m-0 small text-dark">${fam.observaciones || 'Sin observaciones registradas en el campo.'}</p>
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

export function verListaRelevamientos(idRelevamiento) {
    window.idRelevamientoActivo = idRelevamiento;
    cargarVistaDinamica('./frontend/pages/tabla-relevamientos.html', () => {
        if (typeof cargarTablaRelevamientos === 'function') {
            cargarTablaRelevamientos();
        } else {
            console.error("No se encontró la función cargarTablaRelevamientos");
        }
    });
}