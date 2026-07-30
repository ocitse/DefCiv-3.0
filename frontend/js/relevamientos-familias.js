// frontend/js/relevamientos-familias.js
import { cargarVistaDinamica } from './utils.js';
import { mostrarNotificacion } from './ui.js';
import { cargarTablaRelevamientos } from './relevamientos-general.js';
import { guardarDatosFamiliaDefinitivo, inicializarCalculoIntegrantes } from './relevamientos-form.js';


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
        <div class="col-md-3"><strong>Fecha:</strong> ${rel.createdAt ? new Date(rel.createdAt).toLocaleDateString() : 'N/D'}</div>
        <div class="col-md-3"><strong>Departamento:</strong> ${rel.departamento || 'N/D'}</div>
        <div class="col-md-3"><strong>Localidad:</strong> ${rel.localidad || 'N/D'}</div>
        <div class="col-md-3"><strong>Barrio:</strong> ${rel.barrio || 'N/D'}</div>
        <div class="col-md-3"><strong>Evento:</strong> ${rel.tipo_evento || 'N/D'}</div>
        <div class="col-md-3"><strong>Solicitante:</strong> ${rel.solicitante || 'N/D'}</div>
        <div class="col-md-3"><strong>Prioridad:</strong> ${rel.prioridad || 'N/D'}</div>
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
        <td>${index + 1}</td> <!-- Número cardinal secuencial -->
        <td><strong>${fam.dni_jefe || fam.dni || 'N/D'}</strong></td>
        <td>${fam.jefe_familia || 'Sin especificar'}</td>
        <td class="text-center"><span class="badge bg-secondary">${fam.cantidad_integrantes || 1}</span></td>
        <td>
            <span class="badge bg-${obtenerColorUrgencia(fam.urgencia_familiar || fam.prioridad)}">
                ${fam.urgencia_familiar || fam.prioridad || 'Normal'}
            </span>
        </td>
        <td><span class="badge bg-info text-dark">${fam.estado_asistencia || 'Pendiente'}</span></td>
        <td class="text-center">
            <div class="d-flex justify-content-center gap-1"> <!-- Evita que se acoplen mal -->
                <button class="btn btn-sm btn-outline-info" onclick="window.verFichaNecesidades('${fam.id_familia}')" title="Ver Ficha">
    <i class="bi bi-eye"></i>
</button>
<button class="btn btn-sm btn-outline-warning" onclick="window.editarDatosFamilia('${fam.id_familia}')" title="Editar">
    <i class="bi bi-pencil"></i>
</button>
<button class="btn btn-sm btn-outline-danger" onclick="window.eliminarFamiliar('${fam.id_familia}')" title="Eliminar">
    <i class="bi bi-trash"></i>
</button>
            </div>
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

export function mostrarFormularioNuevaFamilia() {
    cargarVistaDinamica('./frontend/pages/form-familia.html', () => {
        const inputId = document.getElementById('f_id_edicion');
        if (inputId) inputId.value = '';

        const titulo = document.getElementById('titulo-form-familia');
        if (titulo) {
            titulo.innerHTML = `<i class="bi bi-people-fill text-warning me-2"></i> Registrar Nueva Familia`;
        }

        // <-- ESTO FALTABA AL CREAR NUEVA FAMILIA
        if (typeof inicializarCalculoIntegrantes === 'function') {
            inicializarCalculoIntegrantes();
        }

        const form = document.getElementById('form-nueva-familia');
        if (form) {
            form.removeEventListener('submit', guardarDatosFamiliaDefinitivo);
            form.addEventListener('submit', guardarDatosFamiliaDefinitivo);
        }
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
        const idReal = fam.id_familia || idFamilia;

        // Nombre y apellido completo del titular
        const nombreCompleto = `${fam.apellido || ''}, ${fam.nombre || fam.jefe_familia || 'Sin especificar'}`;

        // 1. Materiales de Construcción (vienen de la relación 'necesidades' del backend)
        const listaMateriales = fam.necesidades || [];
        let htmlMateriales = '';
        
        if (listaMateriales.length > 0) {
            htmlMateriales = `
                <ul class="list-group list-group-flush small">
                    ${listaMateriales.map(m => `
                        <li class="list-group-item d-flex justify-content-between align-items-center bg-white px-0 py-1">
                            <span><i class="bi bi-box-seam me-1 text-secondary"></i> ${m.tipo_material || 'Material'}</span>
                            <span class="badge bg-primary rounded-pill">Cant: ${m.cantidad || 1}</span>
                        </li>
                    `).join('')}
                </ul>
            `;
        } else {
            htmlMateriales = `<p class="text-muted small m-0 fst-italic">No se registraron materiales de construcción solicitados.</p>`;
        }

        // 2. Asistencia Inmediata (mapeando correctamente las columnas need_... de la BD)
        const asistencia = [
            { label: 'Unidades Alimentarias', val: fam.need_alimentos },
            { label: 'Abrigos', val: fam.need_abrigos },
            { label: 'Frazadas', val: fam.need_frazadas },
            { label: 'Bidones de Agua', val: fam.need_agua },
            { label: 'Kit de Higiene', val: fam.need_higiene },
            { label: 'Ropa', val: fam.need_ropa },
            { label: 'Colchones', val: fam.need_colchones }
        ].filter(item => item.val > 0);

        let htmlAsistencia = '';
        if (asistencia.length > 0) {
            htmlAsistencia = `
                <div class="d-flex flex-wrap gap-2 mt-2">
                    ${asistencia.map(a => `<span class="badge bg-success bg-opacity-75 text-white">${a.label}: ${a.val}</span>`).join('')}
                </div>
            `;
        } else {
            htmlAsistencia = `<p class="text-muted small m-0 fst-italic">No se registraron artículos de asistencia inmediata.</p>`;
        }

        // 3. Renderizado del Modal con propiedades sincronizadas
        const contenidoModal = `
            <div class="modal fade" id="modalFichaFamilia" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content shadow-lg border-0">
                        <div class="modal-header bg-dark text-white">
                            <h5 class="modal-title"><i class="bi bi-file-earmark-text-fill text-warning me-2"></i> Ficha: ${nombreCompleto}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4 bg-light">
                            <div class="row g-3 mb-3">
                                <!-- Datos Demográficos -->
                                <div class="col-md-6">
                                    <div class="p-3 bg-white rounded border shadow-sm h-100">
                                        <h6 class="text-primary fw-bold border-bottom pb-2 mb-2"><i class="bi bi-people-fill me-1"></i> Datos Demográficos</h6>
                                        <p class="mb-1 small"><strong>Titular:</strong> ${nombreCompleto}</p>
                                        <p class="mb-1 small"><strong>DNI:</strong> ${fam.dni_jefe || fam.dni || 'No especificado'}</p>
                                        <p class="mb-1 small"><strong>Teléfono:</strong> ${fam.telefono || 'No especificado'}</p>
                                        <p class="mb-1 small"><strong>Dirección:</strong> ${fam.direccion || 'No especificado'}</p>
                                        <p class="mb-0 small"><strong>Integrantes (Total):</strong> <span class="badge bg-secondary">${fam.cantidad_integrantes || 1}</span> (Mayores: ${fam.mayores || 0}, Menores: ${fam.menores || 0})</p>
                                    </div>
                                </div>
                                <!-- Estado de Vivienda -->
                                <div class="col-md-6">
                                    <div class="p-3 bg-white rounded border shadow-sm h-100">
                                        <h6 class="text-danger fw-bold border-bottom pb-2 mb-2"><i class="bi bi-house-exclamation-fill me-1"></i> Estado de Vivienda</h6>
                                        <p class="mb-1 small"><strong>Prioridad / Urgencia:</strong> ${fam.urgencia_familiar || fam.prioridad || 'Normal'}</p>
                                        <div class="mb-2 small">
                                            <strong>Daños Registrados:</strong>
                                            <div class="d-flex flex-wrap gap-1 mt-1">
                                                <span class="badge bg-${fam.dano_techo ? 'danger' : 'secondary'}">Techo</span>
                                                <span class="badge bg-${fam.dano_paredes ? 'danger' : 'secondary'}">Paredes</span>
                                                <span class="badge bg-${fam.dano_pisos ? 'danger' : 'secondary'}">Pisos</span>
                                                <span class="badge bg-${fam.dano_instalaciones ? 'danger' : 'secondary'}">Instalaciones</span>
                                                <span class="badge bg-${fam.dano_perdida_completa ? 'dark text-danger fw-bold' : 'secondary'}">Pérdida Total</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Asistencia Inmediata -->
                            <div class="row g-3 mb-3">
                                <div class="col-md-12">
                                    <div class="p-3 bg-white rounded border shadow-sm">
                                        <h6 class="text-success fw-bold border-bottom pb-2 mb-2"><i class="bi bi-box-seam me-1"></i> Asistencia Inmediata (Insumos)</h6>
                                        ${htmlAsistencia}
                                    </div>
                                </div>
                            </div>

                            <!-- Materiales de Construcción -->
                            <div class="row g-3 mb-3">
                                <div class="col-md-12">
                                    <div class="p-3 bg-white rounded border shadow-sm">
                                        <h6 class="text-primary fw-bold border-bottom pb-2 mb-2"><i class="bi bi-tools me-1"></i> Materiales de Construcción</h6>
                                        ${htmlMateriales}
                                    </div>
                                </div>
                            </div>

                            <!-- Observaciones -->
                            <div class="p-3 bg-warning bg-opacity-10 rounded border border-warning-subtle">
                                <h6 class="fw-bold text-dark mb-1"><i class="bi bi-chat-left-text-fill me-1"></i> Observaciones</h6>
                                <p class="m-0 small text-dark">${fam.observaciones || 'Sin observaciones registradas.'}</p>
                            </div>
                        </div>
                        <div class="modal-footer bg-light d-flex justify-content-between">
                            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cerrar Ficha</button>
                            <button type="button" class="btn btn-warning btn-sm fw-bold" id="btn-editar-desde-ficha" data-id="${idReal}">
                                <i class="bi bi-pencil-square me-1"></i> Editar Ficha
                            </button>
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

        document.getElementById('btn-editar-desde-ficha').addEventListener('click', () => {
            bModal.hide();
            divTemporal.remove();
            if (typeof window.editarDatosFamilia === 'function') {
                window.editarDatosFamilia(idReal);
            }
        });

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