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

            // 2. Consultamos al backend las familias asociadas a este relevamiento UNA SOLA VEZ
            const respuesta = await fetch(`/api/familias?id_relevamiento=${idRelevamiento}`);
            
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
}

// Función central que procesa búsqueda, ordenamiento y paginación local
export function manejarCambioFiltros(resetPagina = true) {
    if (resetPagina) paginaActualFamilias = 1;

    const textoBusqueda = document.getElementById('inputBusquedaApellido')?.value.toLowerCase().trim() || '';
    const criterioOrden = document.getElementById('selectOrdenar')?.value || '';
    const selectPaginacion = document.getElementById('selectPaginacion')?.value || '10';

    // 1. Filtrado local por Apellido/Nombre o DNI
    let resultado = familiasOriginalesRelevamiento.filter(fam => {
        const apellidoNombre = (fam.jefe_familia || '').toLowerCase();
        const dni = String(fam.dni_jefe || fam.dni || '');
        return apellidoNombre.includes(textoBusqueda) || dni.includes(textoBusqueda);
    });

    // 2. Ordenamiento local
    if (criterioOrden === 'alfabetico') {
        resultado.sort((a, b) => (a.jefe_familia || '').localeCompare(b.jefe_familia || ''));
    } else if (criterioOrden === 'urgencia') {
        const pesoUrgencia = { 'alta': 1, 'media': 2, 'baja': 3 };
        resultado.sort((a, b) => {
            const pA = pesoUrgencia[(a.urgencia_familiar || a.prioridad || '').toLowerCase()] || 4;
            const pB = pesoUrgencia[(b.urgencia_familiar || b.prioridad || '').toLowerCase()] || 4;
            return pA - pB;
        });
    } else if (criterioOrden === 'asistencia') {
        resultado.sort((a, b) => (a.estado_asistencia || '').localeCompare(b.estado_asistencia || ''));
    }

    // 3. Paginación local
    let familiasPaginadas = resultado;
    let totalPaginas = 1;

    if (selectPaginacion !== 'todos') {
        const porPagina = parseInt(selectPaginacion, 10);
        totalPaginas = Math.ceil(resultado.length / porPagina) || 1;
        
        if (paginaActualFamilias > totalPaginas) paginaActualFamilias = totalPaginas;
        if (paginaActualFamilias < 1) paginaActualFamilias = 1;

        const inicio = (paginaActualFamilias - 1) * porPagina;
        const fin = inicio + porPagina;
        familiasPaginadas = resultado.slice(inicio, fin);
    }

    renderizarTablaFamilias(familiasPaginadas, resultado.length);
    renderizarControlesPaginacion(resultado.length, selectPaginacion === 'todos' ? resultado.length : parseInt(selectPaginacion, 10), totalPaginas);
}

// Función auxiliar para cambiar de página desde los botones
window.cambiarPaginaFamilias = function(nuevaPagina) {
    paginaActualFamilias = nuevaPagina;
    manejarCambioFiltros(false);
}

// Función auxiliar para dibujar las filas dentro de #tabla-familias-body
function renderizarTablaFamilias(familias, totalFiltrados = 0) {
    const tbody = document.getElementById('tabla-familias-body');
    if (!tbody) return;

    if (!familias || familias.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="bi bi-folder2-open fs-3 d-block mb-1"></i>
                    No se encontraron familias con los criterios de búsqueda.
                </td>
            </tr>
        `;
        return;
    }

    // Calculamos el índice base según la paginación actual
    const selectPaginacion = document.getElementById('selectPaginacion')?.value || '10';
    let offset = 0;
    if (selectPaginacion !== 'todos') {
        offset = (paginaActualFamilias - 1) * parseInt(selectPaginacion, 10);
    }

    tbody.innerHTML = familias.map((fam, index) => `
    <tr>
        <td>${offset + index + 1}</td> <!-- Orden secuencial correcto -->
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
            <div class="d-flex justify-content-center gap-1">
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

// Renderiza los botones de paginación y el texto informativo
function renderizarControlesPaginacion(totalRegistros, porPagina, totalPaginas) {
    const contenedor = document.getElementById('contenedor-paginacion');
    if (!contenedor) return;

    if (totalRegistros === 0) {
        contenedor.innerHTML = '';
        return;
    }

    const selectPaginacion = document.getElementById('selectPaginacion')?.value;
    if (selectPaginacion === 'todos') {
        contenedor.innerHTML = `<span class="text-muted small">Mostrando todos los registros (${totalRegistros} en total)</span>`;
        return;
    }

    const inicioRegistro = ((paginaActualFamilias - 1) * porPagina) + 1;
    const finRegistro = Math.min(paginaActualFamilias * porPagina, totalRegistros);

    contenedor.innerHTML = `
        <span class="text-muted small">Mostrando ${inicioRegistro} a ${finRegistro} de ${totalRegistros} familias</span>
        <ul class="pagination pagination-sm m-0">
            <li class="page-item ${paginaActualFamilias === 1 ? 'disabled' : ''}">
                <button class="page-link" onclick="window.cambiarPaginaFamilias(${paginaActualFamilias - 1})">Anterior</button>
            </li>
            <li class="page-item disabled">
                <span class="page-link bg-light text-dark">Pág. ${paginaActualFamilias} de ${totalPaginas}</span>
            </li>
            <li class="page-item ${paginaActualFamilias >= totalPaginas ? 'disabled' : ''}">
                <button class="page-link" onclick="window.cambiarPaginaFamilias(${paginaActualFamilias + 1})">Siguiente</button>
            </li>
        </ul>
    `;
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