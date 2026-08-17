// frontend/js/relevamientos-familias.js
import { cargarVistaDinamica } from './utils.js';
import { mostrarNotificacion } from './ui.js';
import { cargarTablaRelevamientos } from './relevamientos-general.js';
import { guardarDatosFamiliaDefinitivo, inicializarCalculoIntegrantes } from './relevamientos-form.js';

// Variable global en memoria para almacenar las familias del relevamiento activo
let familiasOriginalesRelevamiento = [];
let paginaActualFamilias = 1;

// Función principal para cargar la vista del relevamiento y sus familias desde el Backend
export async function ingresarARelevamiento(idRelevamiento) {
    window.idRelevamientoActivo = idRelevamiento;
    paginaActualFamilias = 1; // Reiniciamos a la primera página

    // Cargamos la estructura HTML de la tabla de familias
    cargarVistaDinamica('./frontend/pages/tabla-familias.html', async () => {
        try {
            // Recuperamos el token almacenado al iniciar sesión
            const token = localStorage.getItem('token');

            // 1. Consultamos los datos generales del relevamiento para el "Contexto Territorial"
            const respuestaRel = await fetch(`/api/relevamientos/${idRelevamiento}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
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

            // 2. Consultamos al backend las familias asociadas a este relevamiento UNA SOLA VEZ
            const respuesta = await fetch(`/api/familias?id_relevamiento=${idRelevamiento}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!respuesta.ok) {
                throw new Error('No se pudo obtener la lista de familias del servidor.');
            }

            const familias = await respuesta.json();
            familiasOriginalesRelevamiento = familias; // Guardamos la base en memoria
            manejarCambioFiltros(); // Procesamos y renderizamos localmente

        } catch (error) {
            console.error("Error al cargar familias:", error);
            mostrarNotificacion("Error al conectar con el servidor para traer las familias.", "error");
            familiasOriginalesRelevamiento = [];
            renderizarTablaFamilias([]);
        }
    });
}export async function eliminarFamiliar(idFamilia) {
    if (!confirm("¿Está seguro de que desea eliminar esta familia del registro?")) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const respuesta = await fetch(`/api/familias/${idFamilia}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
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
        const nombreTitular = fam.jefe_familia || 'Sin especificar';

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

        const asistencia = [
            { label: 'Unidades Alimentarias', val: fam.unidades_alimentarias },
            { label: 'Abrigos', val: fam.abrigos },
            { label: 'Frazadas', val: fam.frazadas },
            { label: 'Bidones de Agua', val: fam.bidones_agua },
            { label: 'Kits de Higiene', val: fam.kits_higiene },
            { label: 'Ropa', val: fam.ropa },
            { label: 'Colchones', val: fam.colchones }
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

        const danosRegistrados = [
            { label: 'Techo', activo: fam.dano_techo, clase: 'bg-danger' },
            { label: 'Paredes', activo: fam.dano_paredes, clase: 'bg-danger' },
            { label: 'Pisos', activo: fam.dano_pisos, clase: 'bg-danger' },
            { label: 'Instalaciones', activo: fam.dano_instalaciones, clase: 'bg-danger' },
            { label: 'Estructurales', activo: fam.danos_estructurales, clase: 'bg-dark text-danger fw-bold' },
            { label: 'Requiere Evacuación', activo: fam.requiere_evacuacion, clase: 'bg-warning text-dark fw-bold' }
        ].filter(d => d.activo);

        let htmlDanos = '';
        if (danosRegistrados.length > 0) {
            htmlDanos = `
                <div class="d-flex flex-wrap gap-1 mt-1">
                    ${danosRegistrados.map(d => `<span class="badge ${d.clase}">${d.label}</span>`).join('')}
                </div>
            `;
        } else {
            htmlDanos = `<p class="text-muted small m-0 fst-italic">No se registraron daños en la vivienda.</p>`;
        }

        const contenidoModal = `
            <div class="modal fade" id="modalFichaFamilia" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content shadow-lg border-0">
                        <div class="modal-header bg-dark text-white">
                            <h5 class="modal-title"><i class="bi bi-file-earmark-text-fill text-warning me-2"></i> Ficha: ${nombreTitular}</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body p-4 bg-light">
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <div class="p-3 bg-white rounded border shadow-sm h-100">
                                        <h6 class="text-primary fw-bold border-bottom pb-2 mb-2"><i class="bi bi-people-fill me-1"></i> Datos Demográficos</h6>
                                        <p class="mb-1 small"><strong>Jefe de Familia:</strong> ${nombreTitular}</p>
                                        <p class="mb-1 small"><strong>DNI:</strong> ${fam.dni_jefe || 'No especificado'}</p>
                                        <p class="mb-1 small"><strong>Teléfono:</strong> ${fam.telefono || 'No especificado'}</p>
                                        <p class="mb-1 small"><strong>Dirección:</strong> ${fam.direccion || 'No especificado'}</p>
                                        <p class="mb-0 small"><strong>Integrantes (Total):</strong> <span class="badge bg-secondary">${fam.cantidad_integrantes || 1}</span> (Mayores: ${fam.mayores || 0}, Menores: ${fam.menores || 0})</p>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="p-3 bg-white rounded border shadow-sm h-100">
                                        <h6 class="text-danger fw-bold border-bottom pb-2 mb-2"><i class="bi bi-house-exclamation-fill me-1"></i> Estado de Vivienda</h6>
                                        <p class="mb-1 small"><strong>Urgencia Familiar:</strong> ${fam.urgencia_familiar || 'Normal'}</p>
                                        <div class="mb-2 small">
                                            <strong>Daños Registrados:</strong>
                                            ${htmlDanos}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="row g-3 mb-3">
                                <div class="col-md-12">
                                    <div class="p-3 bg-white rounded border shadow-sm">
                                        <h6 class="text-success fw-bold border-bottom pb-2 mb-2"><i class="bi bi-box-seam me-1"></i> Asistencia Inmediata (Insumos)</h6>
                                        ${htmlAsistencia}
                                    </div>
                                </div>
                            </div>
                            <div class="row g-3 mb-3">
                                <div class="col-md-12">
                                    <div class="p-3 bg-white rounded border shadow-sm">
                                        <h6 class="text-primary fw-bold border-bottom pb-2 mb-2"><i class="bi bi-tools me-1"></i> Materiales de Construcción</h6>
                                        ${htmlMateriales}
                                    </div>
                                </div>
                            </div>
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

// Exposiciones globales para los eventos onclick y onchange en el DOM dinámico
window.ingresarARelevamiento = ingresarARelevamiento;
window.mostrarFormularioNuevaFamilia = mostrarFormularioNuevaFamilia;
window.verListaRelevamientos = verListaRelevamientos;
window.eliminarFamiliar = eliminarFamiliar;
window.verFichaNecesidades = verFichaNecesidades;
window.manejarCambioFiltros = manejarCambioFiltros;