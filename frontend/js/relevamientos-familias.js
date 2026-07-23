import { cargarVistaDinamica } from './utils.js';
import { mostrarNotificacion } from './ui.js'; // (si también usas notificaciones en este módulo)
import { cargarTablaRelevamientos } from './relevamientos-general.js'; // <-- Agregá esta línea

export function eliminarFamiliar(idFamilia) {
    if (!confirm("¿Está seguro de que desea eliminar esta familia del registro de asistencia? Esta acción no se puede deshacer.")) {
        return;
    }

    try {
        const data = Storage.getData();
        const relIdx = data.relevamientos.findIndex(r => r.id_relevamiento === idRelevamientoActivo);

        if (relIdx !== -1) {
            data.relevamientos[relIdx].familias = data.relevamientos[relIdx].familias.filter(f => f.id_familia !== idFamilia);
            Storage.setData(data);
            mostrarNotificacion("Registro familiar eliminado correctamente.");
            
            if (typeof ingresarARelevamiento === 'function') {
                ingresarARelevamiento(idRelevamientoActivo);
            }
        }
    } catch (error) {
        console.error("Error al eliminar familia:", error);
    }
}

export function verFichaNecesidades(idFamilia) {
    const data = Storage.getData();
    const rel = data.relevamientos.find(r => r.id_relevamiento === idRelevamientoActivo);
    const fam = rel?.familias?.find(f => f.id_familia === idFamilia);

    if (!fam) {
        mostrarNotificacion("No se encontró la información detallada de la familia.", "error");
        return;
    }

    const contenidoModal = `
        <div class="modal fade" id="modalFichaFamilia" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg">
                <div class="modal-content shadow-lg border-0">
                    <div class="modal-header bg-dark text-white">
                        <h5 class="modal-title"><i class="bi bi-file-earmark-text-fill text-warning me-2"></i> Ficha de Necesidades: ${fam.apellido}, ${fam.nombre}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-4 bg-light">
                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <div class="p-3 bg-white rounded border shadow-sm">
                                    <h6 class="text-primary fw-bold border-bottom pb-2 mb-2"><i class="bi bi-people-fill me-1"></i> Datos Demográficos</h6>
                                    <p class="mb-1 small"><strong>DNI:</strong> ${fam.dni || 'No especificado'}</p>
                                    <p class="mb-1 small"><strong>Teléfono:</strong> ${fam.telefono || 'No especificado'}</p>
                                    <p class="mb-1 small"><strong>Dirección:</strong> ${fam.direccion || 'No especificado'}</p>
                                    <p class="mb-0 small"><strong>Integrantes:</strong> Mayores: ${fam.mayores} | Menores: ${fam.menores} | Total: <strong>${fam.total_personas}</strong></p>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="p-3 bg-white rounded border shadow-sm">
                                    <h6 class="text-danger fw-bold border-bottom pb-2 mb-2"><i class="bi bi-house-exclamation-fill me-1"></i> Daños Estructurales</h6>
                                    <ul class="list-unstyled small mb-0">
                                        <li><i class="bi bi-check2-square text-danger me-1"></i> Techo: ${fam.danos_estructurales?.techo ? 'Sí' : 'No'}</li>
                                        <li><i class="bi bi-check2-square text-danger me-1"></i> Paredes: ${fam.danos_estructurales?.paredes ? 'Sí' : 'No'}</li>
                                        <li><i class="bi bi-check2-square text-danger me-1"></i> Pisos: ${fam.danos_estructurales?.pisos ? 'Sí' : 'No'}</li>
                                        <li><i class="bi bi-check2-square text-danger me-1"></i> Pérdida completa: ${fam.danos_estructurales?.perdida_completa ? 'Sí' : 'No'}</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div class="card border shadow-sm mb-3">
                            <div class="card-header bg-white fw-bold text-success">
                                <i class="bi bi-box-seam me-1"></i> Insumos y Asistencia Requerida
                            </div>
                            <div class="card-body p-0">
                                <div class="table-responsive">
                                    <table class="table table-bordered text-center m-0 small align-middle">
                                        <thead class="table-light">
                                            <tr>
                                                <th>Alimentos</th>
                                                <th>Abrigos</th>
                                                <th>Frazadas</th>
                                                <th>Agua</th>
                                                <th>Higiene</th>
                                                <th>Ropa</th>
                                                <th>Colchones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr class="fw-bold text-dark">
                                                <td>${fam.necesidades_detectadas?.alimentos_cant || 0}</td>
                                                <td>${fam.necesidades_detectadas?.abrigos_cant || 0}</td>
                                                <td>${fam.necesidades_detectadas?.frazadas_cant || 0}</td>
                                                <td>${fam.necesidades_detectadas?.bidones_agua_cant || 0}</td>
                                                <td>${fam.necesidades_detectadas?.kit_higiene_cant || 0}</td>
                                                <td>${fam.necesidades_detectadas?.ropa_cant || 0}</td>
                                                <td>${fam.necesidades_detectadas?.colchones_cant || 0}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <div class="mb-2 bg-light p-2 rounded border small mt-2 mx-3">
                                    <strong>Medicamentos:</strong><br>
                                    <span class="text-secondary">${fam.necesidades_detectadas?.medicamentos_detalle || 'Ninguno especificado.'}</span>
                                </div>
                                <div class="bg-light p-2 rounded border small mb-3 mx-3">
                                    <strong>Materiales de Construcción:</strong><br>
                                    <span class="text-secondary">${fam.necesidades_detectadas?.materiales_construccion_detalle || 'Ninguno especificado.'}</span>
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