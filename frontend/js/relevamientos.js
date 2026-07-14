// frontend/js/relevamientos.js
import { Storage } from './storage.js'; // Ajustá la ruta según tu proyecto
import { departamentosYLocalidades } from './ubicaciones.js';
import { mostrarNotificacion } from './ui.js'; // Ajustá la ruta según tu proyecto

// ID del contenedor principal en tu index.html donde se renderiza todo
const CONTENEDOR_APP = 'contenedor-principal'; 

let idFamiliaEdicion = null; // Para saber si es alta o edición
let listaTemporalMedicamentos = [];
let listaTemporalMateriales = [];

// Variables de estado de la sesión actual
let idRelevamientoActivo = null; // Guarda el ID del relevamiento que se está explorando (Nivel 2)

/**
 * 🌀 FUNCIÓN NÚCLEO: Carga un archivo HTML de forma asrincrónica e inyecta su contenido
 */
async function cargarVistaDinamica(rutaHtml, callback) {
    try {
        const respuesta = await fetch(rutaHtml);
        if (!respuesta.ok) throw new Error(`No se pudo cargar la página: ${rutaHtml}`);
        
        const htmlTexto = await respuesta.text();
        
        // 🛠️ CORRECCIÓN DE CONTENEDOR (Intenta buscar por ID, si no, busca por la Clase)
        let contenedor = document.getElementById(CONTENEDOR_APP);
        if (!contenedor) {
            contenedor = document.querySelector('.content-principal');
        }
        
        if (contenedor) {
            contenedor.innerHTML = htmlTexto;
        } else {
            console.warn("No se encontró ningún contenedor válido para inyectar la vista.");
        }

        // Si se cargó con éxito el esqueleto HTML, ejecutamos su lógica específica
        if (callback) callback();
    } catch (error) {
        console.error("Error crítico en ruteo dinámico:", error);
        mostrarNotificacion("Error al cargar la interfaz visual.", "error");
    }
}

// =========================================================================
// 🌐 NIVEL 1: GESTIÓN DE RELEVAMIENTOS GENERALES
// =========================================================================

/**
 * Muestra la lista de Relevamientos generales (Vista de tabla principal)
 */
export function verListaRelevamientos() {
    idRelevamientoActivo = null; // Limpiamos el contexto activo

    const btnMenu = document.getElementById('btn-menu-relevamientos');
    if (btnMenu) {
        document.querySelectorAll('#sidebar-app .nav-link').forEach(el => el.classList.remove('active'));
        btnMenu.classList.add('active');
    }

    cargarVistaDinamica('frontend/pages/tabla-relevamientos.html', () => {
        const tbody = document.getElementById('tabla-relevamientos-body');
        if (!tbody) return;

        const btnVolver = document.getElementById('btn-volver-panel');
        if (btnVolver) {
            btnVolver.onclick = verPanelPrincipal;
        }

        const data = Storage.getData();
        const lista = data.relevamientos || [];

        if (lista.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center text-muted py-4">
                        <i class="bi bi-info-circle me-1"></i> No hay relevamientos registrados
                    </td>
                </tr>`;
            return;
        }

        // Renderizamos las filas incluyendo el Estado de Terreno y Botón de Cierre
        tbody.innerHTML = lista.map(rel => {
            const cantFamilias = rel.familias ? rel.familias.length : 0;
            const estadoTerreno = rel.estado_relevamiento || 'En curso';
            
            return `
                <tr>
                    <td><strong>${rel.id_relevamiento}</strong></td>
                    <td>${rel.fecha_creacion}</td>
                    <td><span class="fw-semibold">${rel.departamento}</span> / ${rel.localidad}</td>
                    <td>${rel.barrio}</td>
                    <td>${rel.tipo_evento}</td>
                    <td>${rel.relevador_asignado || '<span class="text-muted">-</span>'}</td>
                    <td><span class="badge ${getBadgeUrgencia(rel.urgencia_general)}">${rel.urgencia_general}</span></td>
                    <td><span class="badge ${getBadgeEstadoTerreno(estadoTerreno)}">${estadoTerreno}</span></td>
                    <td class="text-center"><span class="badge bg-info text-dark fw-bold">${cantFamilias} Familias</span></td>
                    <td class="text-center">
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="ingresarARelevamiento('${rel.id_relevamiento}')" title="Ver Familias">
                                <i class="bi bi-eye-fill"></i>
                            </button>
                            <button class="btn btn-outline-success" onclick="abrirModalCierreRelevamiento('${rel.id_relevamiento}')" title="Gestionar Cierre / Estado">
                                <i class="bi bi-check2-circle"></i>
                            </button>
                            <button class="btn btn-outline-secondary" onclick="editarRelevamientoGeneral('${rel.id_relevamiento}')" title="Editar Configuración">
                                <i class="bi bi-pencil"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    });
}

/**
 * Retorna la clase CSS para el badge según el estado de terreno
 */
function getBadgeEstadoTerreno(estado) {
    if (estado === 'Completado') return 'bg-success';
    if (estado === 'En curso') return 'bg-primary';
    if (estado === 'Suspendido') return 'bg-warning text-dark';
    return 'bg-danger'; // Baja
}

/**
 * Abre un modal rápido o selector para cambiar el estado de terreno y cerrar el relevamiento
 */
export function abrirModalCierreRelevamiento(idRelevamiento) {
    const data = Storage.getData();
    const rel = data.relevamientos.find(r => r.id_relevamiento === idRelevamiento);
    if (!rel) return;

    const modalHtml = `
        <div class="modal fade" id="modalCierreRel" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 shadow">
                    <div class="modal-header bg-dark text-white">
                        <h5 class="modal-title fw-bold">Gestión de Cierre: #${rel.id_relevamiento}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-4">
                        <div class="mb-3">
                            <label class="form-label fw-bold">Seleccionar Estado Operativo de Terreno:</label>
                            <select id="select-nuevo-estado-terreno" class="form-select">
                                <option value="En curso" ${rel.estado_relevamiento === 'En curso' ? 'selected' : ''}>En curso</option>
                                <option value="Completado" ${rel.estado_relevamiento === 'Completado' ? 'selected' : ''}>Completado (Habilita para Solicitudes)</option>
                                <option value="Suspendido" ${rel.estado_relevamiento === 'Suspendido' ? 'selected' : ''}>Suspendido</option>
                                <option value="Baja" ${rel.estado_relevamiento === 'Baja' ? 'selected' : ''}>Baja</option>
                            </select>
                        </div>
                        <div class="alert alert-info small m-0">
                            <i class="bi bi-info-circle-fill me-1"></i> Al marcar como <strong>Completado</strong> y guardar, el relevamiento quedará disponible de inmediato en el menú de <strong>Solicitudes</strong>.
                        </div>
                    </div>
                    <div class="modal-footer bg-light">
                        <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-success btn-sm" onclick="guardarEstadoTerreno('${rel.id_relevamiento}')">Guardar y Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const viejo = document.getElementById('temp-modal-cierre');
    if (viejo) viejo.remove();

    const div = document.createElement('div');
    div.id = 'temp-modal-cierre';
    div.innerHTML = modalHtml;
    document.body.appendChild(div);

    const m = new bootstrap.Modal(document.getElementById('modalCierreRel'));
    m.show();

    document.getElementById('modalCierreRel').addEventListener('hidden.bs.modal', () => div.remove());
}

/**
 * Guarda el cambio de estado de terreno en el LocalStorage / Estructura
 */
export function guardarEstadoTerreno(idRelevamiento) {
    const nuevoEstado = document.getElementById('select-nuevo-estado-terreno').value;
    const data = Storage.getData();
    const idx = data.relevamientos.findIndex(r => r.id_relevamiento === idRelevamiento);

    if (idx !== -1) {
        data.relevamientos[idx].estado_relevamiento = nuevoEstado;
        Storage.setData(data);
        mostrarNotificacion(`Estado actualizado a: ${nuevoEstado}`);
        
        const modalEl = document.getElementById('modalCierreRel');
        const modalObj = bootstrap.Modal.getInstance(modalEl);
        if (modalObj) modalObj.hide();

        verListaRelevamientos();
    }
}

/**
 * Muestra el formulario para configurar un Nuevo Relevamiento (Jefe)
 */
export function mostrarFormularioNuevoRelevamiento() {
    cargarVistaDinamica('frontend/pages/form-relevamiento.html', () => {
        // 1. Aquí se cargarían los selects de Departamentos y Localidades de Santiago del Estero
        cargarDesplegablesUbicacion();
        cargarDesplegableRelevadores();

        // 2. Escuchar el envío del formulario
        const form = document.getElementById('form-nuevo-relevamiento');
        if (form) {
            form.addEventListener('submit', guardarRelevamientoGeneral);
        }
    });
}

/**
 * Procesa y persiste el alta/modificación del Relevamiento General
 */
function guardarRelevamientoGeneral(e) {
    if (e) e.preventDefault();
    
    const form = e.target;
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        mostrarNotificacion("Por favor, complete todos los campos obligatorios.", "error");
        return;
    }

    try {
        const data = Storage.getData();
        if (!data.relevamientos) data.relevamientos = [];

        const idEdicion = document.getElementById('r_id_edicion').value;
        const selectDept = document.getElementById('r_departamento');
        const selectLoc = document.getElementById('r_localidad');
        const selectRel = document.getElementById('r_relevador');

        const datosRelevamiento = {
            id_relevamiento: idEdicion ? idEdicion : `REV-${Math.floor(10000 + Math.random() * 90000)}`,
            fecha_creacion: idEdicion ? data.relevamientos.find(r => r.id_relevamiento === idEdicion).fecha_creacion : new Date().toLocaleDateString('es-AR'),
            mes_creacion: idEdicion ? data.relevamientos.find(r => r.id_relevamiento === idEdicion).mes_creacion : new Date().getMonth() + 1,
            anio_creacion: idEdicion ? data.relevamientos.find(r => r.id_relevamiento === idEdicion).anio_creacion : new Date().getFullYear(),
            
            id_departamento: selectDept.value,
            departamento: selectDept.options[selectDept.selectedIndex].text,
            id_localidad: selectLoc.value,
            localidad: selectLoc.options[selectLoc.selectedIndex].text,
            
            barrio: document.getElementById('r_barrio').value.trim(),
            tipo_evento: document.getElementById('r_tipo_evento').value,
            solicitante: document.getElementById('r_solicitante').value.trim() || 'Particular',
            urgencia_general: document.getElementById('r_urgencia').value,
            estado: 'Asignado',
            id_relevador: selectRel.value,
            relevador_asignado: selectRel.options[selectRel.selectedIndex].text,
            familias: idEdicion ? data.relevamientos.find(r => r.id_relevamiento === idEdicion).familias : []
        };

        if (idEdicion) {
            const idx = data.relevamientos.findIndex(r => r.id_relevamiento === idEdicion);
            if (idx !== -1) data.relevamientos[idx] = datosRelevamiento;
            mostrarNotificacion("Configuración del relevamiento actualizada.");
        } else {
            data.relevamientos.push(datosRelevamiento);
            mostrarNotificacion("Nuevo relevamiento creado e inicializado con éxito.");
        }

        Storage.setData(data);
        verListaRelevamientos(); // Volvemos a la tabla general

    } catch (error) {
        console.error("Error al guardar Relevamiento:", error);
        mostrarNotificacion("Error al procesar el almacenamiento.", "error");
    }
}


// =========================================================================
// 👥 NIVEL 2: DESGLOSE DE FAMILIAS DE UN RELEVAMIENTO SELECCIONADO
// =========================================================================

/**
 * Entra a la vista de un Relevamiento específico para gestionar sus familias
 */
export function ingresarARelevamiento(idRelevamiento) {
    idRelevamientoActivo = idRelevamiento;

    cargarVistaDinamica('frontend/pages/tabla-familias.html', () => {
        const data = Storage.getData();
        const rel = data.relevamientos.find(r => r.id_relevamiento === idRelevamiento);
        
        if (!rel) {
            mostrarNotificacion("No se encontró el relevamiento seleccionado.", "error");
            verListaRelevamientos();
            return;
        }

        // Pintamos el encabezado contextual superior
        const divContexto = document.getElementById('contexto-relevamiento-activo');
        if (divContexto) {
            divContexto.innerHTML = `
                <div class="col-md-3"><strong>ID RELEVAMIENTO:</strong> ${rel.id_relevamiento}</div>
                <div class="col-md-3"><strong>UBICACIÓN:</strong> ${rel.departamento} (${rel.localidad})</div>
                <div class="col-md-3"><strong>BARRIO:</strong> ${rel.barrio}</div>
                <div class="col-md-3"><strong>EVENTO:</strong> ${rel.tipo_evento}</div>
            `;
        }

        // Renderizamos la lista interna de familias
        const tbody = document.getElementById('tabla-familias-body');
        if (!tbody) return;

        const familias = rel.familias || [];

        if (familias.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-3">
                        No hay familias registradas en este sector. Haga clic en "Agregar Nueva Familia" para comenzar.
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = familias.map((fam, index) => `
            <tr>
                <td><strong>${index + 1}</strong></td>
                <td>${fam.dni}</td>
                <td>${fam.apellido}, ${fam.nombre}</td>
                <td class="text-center fw-bold text-primary">${fam.total_personas}</td>
                <td><span class="badge ${getBadgeUrgencia(fam.urgencia_familiar)}">${fam.urgencia_familiar}</span></td>
                <td><span class="badge bg-secondary">${fam.estado_asistencia || 'Pendiente'}</span></td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info" onclick="verFichaNecesidades('${fam.id_familia}')" title="Ver Ficha Completa">
                            <i class="bi bi-file-text-fill"></i>
                        </button>
                        <button class="btn btn-outline-secondary" onclick="editarDatosFamilia('${fam.id_familia}')" title="Editar">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="eliminarFamiliar('${fam.id_familia}')" title="Eliminar">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    });
}


// =========================================================================
// 📝 NIVEL 3: FORMULARIO DETALLADO DE LA FAMILIA
// =========================================================================

/**
 * Abre el formulario modular para agregar una nueva familia al relevamiento activo
 */
export function mostrarFormularioNuevaFamilia() {
    if (!idRelevamientoActivo) {
        mostrarNotificacion("Contexto de relevamiento perdido.", "error");
        verListaRelevamientos();
        return;
    }

    // RESETEO DE LISTAS: Nos aseguramos de que arranquen completamente limpias
    listaTemporalMedicamentos = [];
    listaTemporalMateriales = [];

    cargarVistaDinamica('frontend/pages/form-familia.html', () => {
        // Inicializamos las cajitas visuales de las listas (para que digan "Ninguno agregado")
        renderizarListaVisual('med', listaTemporalMedicamentos);
        renderizarListaVisual('mat', listaTemporalMateriales);

        // Si usabas esta función para otras lógicas automáticas, la dejamos activa
        if (typeof activarLógicaMatemáticaFamiliar === 'function') {
            activarLógicaMatemáticaFamiliar();
        }

        // CORREGIDO: Buscamos el ID del formulario ('form-familia') que pusimos en el nuevo HTML
        const form = document.getElementById('form-nueva-familia');
        if (form) {
            form.addEventListener('submit', guardarDatosFamiliaDefinitivo);
        }
    });
}

/**
 * Lógica matemática reactiva: Suma automágicamente Mayores + Menores
 */
function activarLógicaMatemáticaFamiliar() {
    const inputMayores = document.getElementById('f_mayores');
    const inputMenores = document.getElementById('f_menores');
    const inputTotal = document.getElementById('f_total');
    const inputDni = document.getElementById('f_dni');

    const ejecutarSuma = () => {
        const m = parseInt(inputMayores?.value) || 0;
        const n = parseInt(inputMenores?.value) || 0;
        if (inputTotal) inputTotal.value = m + n;
    };

    if (inputMayores) inputMayores.oninput = ejecutarSuma;
    if (inputMenores) inputMenores.oninput = ejecutarSuma;

    // Filtro para que en el DNI solo tipeen números limpios
    if (inputDni) {
        inputDni.oninput = (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        };
    }
}

/**
 * Muestra un desglose visual y limpio de los daños y necesidades de la familia
 * sin necesidad de entrar al modo edición, usando un Modal de Bootstrap dinámico.
 */
export function verFichaNecesidades(idFamilia) {
    const data = Storage.getData();
    const rel = data.relevamientos.find(r => r.id_relevamiento === idRelevamientoActivo);
    const fam = rel?.familias?.find(f => f.id_familia === idFamilia);

    if (!fam) {
        mostrarNotificacion("No se pudieron cargar los detalles de la ficha.", "error");
        return;
    }

    // Generamos el HTML interno del modal estructurando los Daños vs Necesidades
    const contenidoModal = `
        <div class="modal fade" id="modalFichaFamilia" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content border-0 shadow">
                    <div class="modal-header bg-dark text-white">
                        <h5 class="modal-title fw-bold">
                            <i class="bi bi-file-earmark-medical-fill text-info me-2"></i> 
                            Ficha de Asistencia Social: ${fam.apellido}, ${fam.nombre}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-4">
                        
                        <div class="row g-3 mb-4 pb-3 border-bottom">
                            <div class="col-sm-4"><strong>DNI Jefe/a:</strong><br>${fam.dni}</div>
                            <div class="col-sm-4"><strong>Teléfono:</strong><br>${fam.telefono || 'No registrado'}</div>
                            <div class="col-sm-4"><strong>Dirección:</strong><br>${fam.direccion}</div>
                            <div class="col-sm-4 mt-2"><strong>Total Integrantes:</strong><br><span class="badge bg-primary fs-6">${fam.total_personas}</span> <small class="text-muted">(${fam.mayores} Mayores / ${fam.menores} Menores)</small></div>
                            <div class="col-sm-4 mt-2"><strong>Urgencia Familiar:</strong><br><span class="badge ${getBadgeUrgencia(fam.urgencia_familiar)} fs-6">${fam.urgencia_familiar}</span></div>
                            <div class="col-sm-4 mt-2"><strong>Estado Logístico:</strong><br><span class="badge bg-secondary fs-6">${fam.estado_asistencia || 'Pendiente'}</span></div>
                        </div>

                        <div class="row g-3">
                            <div class="col-md-5 border-end">
                                <h6 class="fw-bold text-danger mb-3"><i class="bi bi-house-dash-fill"></i> Daños en la Vivienda</h6>
                                <ul class="list-group list-group-flush small">
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                        Daño en Techo ${fam.danos_estructurales?.techo ? '<span class="badge bg-danger">SÍ</span>' : '<span class="badge bg-light text-muted">NO</span>'}
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                        Daño en Paredes ${fam.danos_estructurales?.paredes ? '<span class="badge bg-danger">SÍ</span>' : '<span class="badge bg-light text-muted">NO</span>'}
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                        Daño en Pisos ${fam.danos_estructurales?.pisos ? '<span class="badge bg-danger">SÍ</span>' : '<span class="badge bg-light text-muted">NO</span>'}
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                                        Instalaciones Afectadas ${fam.danos_estructurales?.instalaciones ? '<span class="badge bg-danger">SÍ</span>' : '<span class="badge bg-light text-muted">NO</span>'}
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center px-0 fw-bold">
                                        PÉRDIDA COMPLETA ${fam.danos_estructurales?.perdida_completa ? '<span class="badge bg-dark animate__animated animate__flash animate__infinite">SÍ</span>' : '<span class="badge bg-light text-muted">NO</span>'}
                                    </li>
                                </ul>
                            </div>

                            <div class="col-md-7">
                                <h6 class="fw-bold text-success mb-3"><i class="bi bi-box-seam-fill"></i> Recursos Requeridos</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm table-bordered align-middle text-center small mb-3">
                                        <thead class="table-light">
                                            <tr>
                                                <th>Alim.</th>
                                                <th>Abrg.</th>
                                                <th>Fraz.</th>
                                                <th>Agua</th>
                                                <th>Kit Hig.</th>
                                                <th>Ropa</th>
                                                <th>Colch.</th>
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

                                <div class="mb-2 bg-light p-2 rounded border small">
                                    <strong>Medicamentos:</strong><br>
                                    <span class="text-secondary">${fam.necesidades_detectadas?.medicamentos_detalle || 'Ninguno especificado.'}</span>
                                </div>
                                <div class="bg-light p-2 rounded border small">
                                    <strong>Materiales de Construcción:</strong><br>
                                    <span class="text-secondary">${fam.necesidades_detectadas?.materiales_construccion_detalle || 'Ninguno especificado.'}</span>
                                </div>
                            </div>
                        </div>

                        <div class="mt-4 p-3 bg-warning bg-opacity-10 rounded border border-warning-subtle">
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

    // Eliminamos cualquier modal viejo que haya quedado colgado por error
    const modalViejo = document.getElementById('contenedor-modal-dinamico');
    if (modalViejo) modalViejo.remove();

    // Inyectamos el nuevo contenedor del modal al final del body
    const divTemporal = document.createElement('div');
    divTemporal.id = 'contenedor-modal-dinamico';
    divTemporal.innerHTML = contenidoModal;
    document.body.appendChild(divTemporal);

    // Inicializamos y ejecutamos el comportamiento de Bootstrap 5 de forma manual
    const elementoModal = document.getElementById('modalFichaFamilia');
    const bModal = new bootstrap.Modal(elementoModal);
    bModal.show();

    // Limpieza de memoria al cerrar el modal
    elementoModal.addEventListener('hidden.bs.modal', () => {
        divTemporal.remove();
    });
}
/**
 * Recolecta los tres bloques de información (Demográficos, Daños y Necesidades cuantitativas)
 */
function guardarDatosFamiliaDefinitivo(e) {
    if (e) e.preventDefault();

    const form = e.target;
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        mostrarNotificacion("Por favor, complete los datos obligatorios de la familia.", "error");
        return;
    }

    try {
        const data = Storage.getData();
        const relIdx = data.relevamientos.findIndex(r => r.id_relevamiento === idRelevamientoActivo);
        
        if (relIdx === -1) throw new Error("Relevamiento de destino no encontrado.");

        const idFamiliaEdicion = document.getElementById('f_id_edicion')?.value;

        // Construcción estructurada utilizando tus IDs originales intactos
        const nuevaFamilia = {
            id_familia: idFamiliaEdicion ? idFamiliaEdicion : `FAM-${Math.floor(10000 + Math.random() * 90000)}`,
            apellido: document.getElementById('f_apellido').value.trim(),
            nombre: document.getElementById('f_nombre').value.trim(),
            dni: document.getElementById('f_dni').value.trim(),
            telefono: document.getElementById('f_telefono').value.trim(),
            direccion: document.getElementById('f_direccion').value.trim(),
            urgencia_familiar: document.getElementById('f_urgencia_familiar').value,
            estado_asistencia: 'Pendiente',
            mayores: parseInt(document.getElementById('f_mayores').value) || 0,
            menores: parseInt(document.getElementById('f_menores').value) || 0,
            total_personas: parseInt(document.getElementById('f_total').value) || 0,
            
            danos_estructurales: {
                techo: !!document.getElementById('f_dano_techo')?.checked,
                paredes: !!document.getElementById('f_dano_paredes')?.checked,
                pisos: !!document.getElementById('f_dano_pisos')?.checked,
                instalaciones: !!document.getElementById('f_dano_instalaciones')?.checked,
                perdida_completa: !!document.getElementById('f_dano_perdida_completa')?.checked
            },
            necesidades_detectadas: {
                alimentos_cant: parseInt(document.getElementById('f_need_alimentos').value) || 0,
                abrigos_cant: parseInt(document.getElementById('f_need_abrigos').value) || 0,
                frazadas_cant: parseInt(document.getElementById('f_need_frazadas').value) || 0,
                bidones_agua_cant: parseInt(document.getElementById('f_need_agua').value) || 0,
                kit_higiene_cant: parseInt(document.getElementById('f_need_higiene').value) || 0,
                ropa_cant: parseInt(document.getElementById('f_need_ropa').value) || 0,
                colchones_cant: parseInt(document.getElementById('f_need_colchones').value) || 0,
                
                // NUEVO: Guardamos tus listas dinámicas integradas de forma limpia
                medicamentos_lista: listaTemporalMedicamentos || [],
                materiales_lista: listaTemporalMateriales || []
            },
            observaciones: document.getElementById('f_observaciones').value.trim()
        };

        if (!data.relevamientos[relIdx].familias) data.relevamientos[relIdx].familias = [];

        if (idFamiliaEdicion) {
            const fIdx = data.relevamientos[relIdx].familias.findIndex(f => f.id_familia === idFamiliaEdicion);
            if (fIdx !== -1) data.relevamientos[relIdx].familias[fIdx] = nuevaFamilia;
            mostrarNotificacion("Datos familiares actualizados.");
        } else {
            data.relevamientos[relIdx].familias.push(nuevaFamilia);
            mostrarNotificacion("Familia agregada exitosamente al registro.");
        }

        Storage.setData(data);
        
        if (typeof verListaFamilias === 'function') {
            verListaFamilias(idRelevamientoActivo);
        } else if (typeof ingresarARelevamiento === 'function') {
            ingresarARelevamiento(idRelevamientoActivo);
            window.idRelevamientoActivo = idRelevamientoActivo;
        }

    } catch (error) {
        console.error("Error al guardar familia:", error);
    }
}

// =========================================================================
// 🎛️ FUNCIONES AUXILIARES DE SOPORTE Y SIMULACIÓN
// =========================================================================

function getBadgeUrgencia(urgencia) {
    if (urgencia === 'Alta') return 'bg-danger';
    if (urgencia === 'Media') return 'bg-warning text-dark';
    return 'bg-success';
}

function cargarDesplegablesUbicacion() {
    const selectDep = document.getElementById('r_departamento');
    const selectLoc = document.getElementById('r_localidad');
    if (!selectDep || !selectLoc) return;

    // 1. Limpiamos y cargamos los departamentos desde el módulo importado
    selectDep.innerHTML = '<option value="" selected disabled>Seleccione Departamento...</option>';
    
    const departamentos = Object.keys(departamentosYLocalidades);
    departamentos.forEach(depto => {
        const option = document.createElement('option');
        option.value = depto;
        option.textContent = depto;
        selectDep.appendChild(option);
    });

    // 2. Estado inicial del select de localidades
    selectLoc.innerHTML = '<option value="" selected disabled>Seleccione Localidad...</option>';

    // 3. Listener en cascada para cuando cambie el departamento seleccionado
    selectDep.onchange = (e) => {
        const deptoElegido = e.target.value;
        const localidades = departamentosYLocalidades[deptoElegido] || [];

        selectLoc.innerHTML = '<option value="" selected disabled>Seleccione Localidad...</option>';
        localidades.forEach(loc => {
            const option = document.createElement('option');
            option.value = loc;
            option.textContent = loc;
            selectLoc.appendChild(option);
        });
    };
}

async function cargarDesplegableRelevadores() {
    const select = document.getElementById('r_relevador');
    if (!select) return;
    
    // Dejamos la opción por defecto
    select.innerHTML = '<option value="" disabled selected>Asignar a...</option>';

    try {
        const respuesta = await fetch('/api/relevadores');
        const resultado = await respuesta.json();

        if (resultado.success && resultado.data) {
            resultado.data.forEach(rev => {
                const option = document.createElement('option');
                // Usamos el id o dni según cómo guardes el relevamiento en tu base de datos
                option.value = rev.id; 
                option.textContent = rev.nombre;
                select.appendChild(option);
            });
        } else {
            console.error('No se pudieron cargar los relevadores');
        }
    } catch (error) {
        console.error('Error de red al obtener relevadores:', error);
    }
}

/**
 * Abre el formulario de Relevamiento en modo EDICIÓN precargando sus datos
 */
export function editarRelevamientoGeneral(idRelevamiento) {
    cargarVistaDinamica('frontend/pages/form-relevamiento.html', () => {
        const data = Storage.getData();
        const rel = data.relevamientos.find(r => r.id_relevamiento === idRelevamiento);

        if (!rel) {
            mostrarNotificacion("No se encontró el relevamiento a editar.", "error");
            verListaRelevamientos();
            return;
        }

        // Cambiamos el título del formulario visualmente
        const titulo = document.getElementById('titulo-form-relevamiento');
        if (titulo) titulo.innerHTML = `<i class="bi bi-pencil-square text-warning me-2"></i> Editar Configuración de Relevamiento`;

        // Seteamos el ID oculto para que el submit sepa que es una actualización y no un alta
        document.getElementById('r_id_edicion').value = rel.id_relevamiento;

        // Cargamos los desplegables (en un entorno real aquí se seleccionaría el ID correspondiente)
        cargarDesplegablesUbicacion();
        cargarDesplegableRelevadores();

        // Rellenamos los campos con la información guardada
        document.getElementById('r_barrio').value = rel.barrio;
        document.getElementById('r_tipo_evento').value = rel.tipo_evento;
        document.getElementById('r_solicitante').value = rel.solicitante;
        document.getElementById('r_urgencia').value = rel.urgencia_general;
        
        // Ajustamos los selects a sus valores guardados
        document.getElementById('r_departamento').value = rel.id_departamento;
        document.getElementById('r_localidad').value = rel.id_localidad;
        document.getElementById('r_relevador').value = rel.id_relevador;

        // Escuchamos el submit de forma limpia
        const form = document.getElementById('form-nuevo-relevamiento');
        if (form) {
            form.addEventListener('submit', guardarRelevamientoGeneral);
        }
    });
}

/**
 * Abre el formulario familiar en modo EDICIÓN recuperando el JSON atómico
 */
export function editarDatosFamilia(idFamilia) {
    cargarVistaDinamica('frontend/pages/form-familia.html', () => {
        const data = Storage.getData();
        const rel = data.relevamientos.find(r => r.id_relevamiento === idRelevamientoActivo);
        const fam = rel?.familias?.find(f => f.id_familia === idFamilia);

        if (!fam) {
            mostrarNotificacion("No se encontraron los datos de la familia.", "error");
            if (idRelevamientoActivo) ingresarARelevamiento(idRelevamientoActivo);
            return;
        }

        // Cambiamos el título visual
        const titulo = document.getElementById('titulo-form-familia');
        if (titulo) titulo.innerHTML = `<i class="bi bi-pencil-square text-warning me-2"></i> Editar Datos de la Familia`;

        // Guardamos el ID familiar en el campo oculto
        document.getElementById('f_id_edicion').value = fam.id_family || fam.id_familia;

        // Bloque 1: Datos personales
        document.getElementById('f_apellido').value = fam.apellido;
        document.getElementById('f_nombre').value = fam.nombre;
        document.getElementById('f_dni').value = fam.dni;
        document.getElementById('f_telefono').value = fam.telefono;
        document.getElementById('f_direccion').value = fam.direccion;
        document.getElementById('f_urgencia_familiar').value = fam.urgencia_familiar;

        // Bloque 2: Composición demográfica
        document.getElementById('f_mayores').value = fam.mayores;
        document.getElementById('f_menores').value = fam.menores;
        document.getElementById('f_total').value = fam.total_personas;

        // Bloque 3: Checkboxes de daños estructurales
        document.getElementById('f_dano_techo').checked = fam.danos_structurales?.techo || fam.danos_estructurales?.techo;
        document.getElementById('f_dano_paredes').checked = fam.danos_structurales?.paredes || fam.danos_estructurales?.paredes;
        document.getElementById('f_dano_pisos').checked = fam.danos_structurales?.pisos || fam.danos_estructurales?.pisos;
        document.getElementById('f_dano_instalaciones').checked = fam.danos_structurales?.instalaciones || fam.danos_estructurales?.instalaciones;
        document.getElementById('f_dano_perdida_completa').checked = fam.danos_structurales?.perdida_completa || fam.danos_estructurales?.perdida_completa;

        // Bloque 4: Cantidades de Necesidades
        document.getElementById('f_need_alimentos').value = fam.necesidades_detectadas.alimentos_cant;
        document.getElementById('f_need_abrigos').value = fam.necesidades_detectadas.abrigos_cant;
        document.getElementById('f_need_frazadas').value = fam.necesidades_detectadas.frazadas_cant;
        document.getElementById('f_need_agua').value = fam.necesidades_detectadas.bidones_agua_cant;
        document.getElementById('f_need_higiene').value = fam.necesidades_detectadas.kit_higiene_cant;
        document.getElementById('f_need_ropa').value = fam.necesidades_detectadas.ropa_cant;
        document.getElementById('f_need_colchones').value = fam.necesidades_detectadas.colchones_cant;
        document.getElementById('f_need_medicamentos').value = fam.necesidades_detectadas.medicamentos_detail || fam.necesidades_detectadas.medicamentos_detalle;
        document.getElementById('f_need_materiales').value = fam.necesidades_detectadas.materiales_construccion_detail || fam.necesidades_detectadas.materiales_construccion_detalle;

        // Bloque 5: Observaciones
        document.getElementById('f_observaciones').value = fam.observaciones;

        // Volvemos a activar el listener matemático por si el usuario cambia los números de integrantes en la edición
        activarLógicaMatemáticaFamiliar();

        const form = document.getElementById('form-nueva-familia');
        if (form) {
            form.addEventListener('submit', guardarDatosFamiliaDefinitivo);
        }
    });
}

/**
 * Quita una familia del relevamiento activo previo consentimiento del usuario
 */
export function eliminarFamiliar(idFamilia) {
    if (!confirm("¿Está seguro de que desea eliminar esta familia del registro de asistencia? Esta acción no se puede deshacer.")) {
        return;
    }

    try {
        const data = Storage.getData();
        const relIdx = data.relevamientos.findIndex(r => r.id_relevamiento === idRelevamientoActivo);

        if (relIdx !== -1) {
            // Filtramos el arreglo de familias excluyendo la que coincide con el ID
            data.relevamientos[relIdx].familias = data.relevamientos[relIdx].familias.filter(f => f.id_familia !== idFamilia);
            
            Storage.setData(data);
            mostrarNotificacion("Registro familiar eliminado correctamente.");
            
            // Refrescamos la tabla del Nivel 2 inmediatamente
            ingresarARelevamiento(idRelevamientoActivo);
        }
    } catch (error) {
        console.error("Error al eliminar familia:", error);
    }
}

/**
 * Inicializa y renderiza el Panel Principal (Dashboard) calculando métricas reales
 */
export function verPanelPrincipal() {
    cargarVistaDinamica('frontend/pages/panel-principal.html', () => {
        const data = Storage.getData();
        const relevamientos = data.relevamientos || [];

        // 1. Cálculo matemático de métricas
        const nuevos = relevamientos.filter(r => r.estado === 'Nuevo' || !r.familias || r.familias.length === 0).length;
        
        // Sumamos de forma segura la cantidad de familias totales cargadas en el Storage
        let totalFamilias = 0;
        relevamientos.forEach(r => {
            if (r.familias) totalFamilias += r.familias.length;
        });

        // 2. Inyección de valores en las tarjetas correspondientes
        if (document.getElementById('dash-relevamientos-nuevos')) {
            document.getElementById('dash-relevamientos-nuevos').innerText = nuevos;
            document.getElementById('dash-familias-asistidas').innerText = totalFamilias;
            
            // Simulación lógica para los módulos de Órdenes y Entregas que se gestionarán en las otras vistas
            document.getElementById('dash-solicitudes-pendientes').innerText = relevamientos.length; 
            document.getElementById('dash-ordenes-aprobadas').innerText = Math.floor(totalFamilias * 0.7); 
            document.getElementById('dash-entregas-reportes').innerText = relevamientos.length;
        }

        // 3. Renderizado rápido de la mini tabla de últimas emergencias
        const tbodyDash = document.getElementById('dash-tabla-emergencias');
        if (tbodyDash) {
            if (relevamientos.length === 0) {
                tbodyDash.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay incidentes reportados</td></tr>`;
                return;
            }
            
            // Mostramos los últimos 4 relevamientos creados
            const ultimos = relevamientos.slice(-4).reverse();
            tbodyDash.innerHTML = ultimos.map(r => `
                <tr>
                    <td><strong>${r.departamento}</strong> (${r.localidad})</td>
                    <td>${r.tipo_evento}</td>
                    <td><small>${r.relevador_asignado}</small></td>
                    <td><span class="badge ${getBadgeUrgencia(r.urgencia_general)}">${r.urgencia_general}</span></td>
                </tr>
            `).join('');
        }
    });
}

/**
 * Agrega un elemento cuantitativo a la lista en memoria y actualiza la pantalla
 */
export function agregarItemLista(tipo) {
    const inputItem = document.getElementById(`input-item-${tipo}`);
    const inputCant = document.getElementById(`input-cant-${tipo}`);
    
    if (!inputItem || !inputCant) return;

    const nombre = inputItem.value.trim();
    const cantidad = parseInt(inputCant.value) || 1;

    if (nombre === "") {
        mostrarNotificacion("Por favor, ingrese una descripción válida.", "error");
        return;
    }

    const nuevoItem = { nombre, cantidad };

    if (tipo === 'med') {
        listaTemporalMedicamentos.push(nuevoItem);
        renderizarListaVisual('med', listaTemporalMedicamentos);
    } else {
        listaTemporalMateriales.push(nuevoItem);
        renderizarListaVisual('mat', listaTemporalMateriales);
    }

    // Limpiamos los inputs para la siguiente carga
    inputItem.value = "";
    inputCant.value = "";
    inputItem.focus();
}

/**
 * Renderiza los items acumulados dentro de los contenedores <ul>
 */
function renderizarListaVisual(tipo, arreglo) {
    const ul = document.getElementById(`lista-dinamica-${tipo}`);
    if (!ul) return;

    if (arreglo.length === 0) {
        ul.innerHTML = `<li class="list-group-item text-muted text-center py-3 bg-light opacity-75 small">Ninguno agregado</li>`;
        return;
    }

    ul.innerHTML = arreglo.map((item, index) => `
        <li class="list-group-item d-flex justify-content-between align-items-center p-1 ps-2 bg-light border-secondary-subtle mb-1 rounded">
            <span><strong>${item.cantidad}</strong> x ${item.nombre}</span>
            <button type="button" class="btn btn-sm btn-link text-danger p-0 me-1" onclick="eliminarItemLista('${tipo}', ${index})">
                <i class="bi bi-trash-fill"></i>
            </button>
        </li>
    `).join('');
}

/**
 * Quita un elemento del arreglo temporal por su índice
 */
export function eliminarItemLista(tipo, index) {
    if (tipo === 'med') {
        listaTemporalMedicamentos.splice(index, 1);
        renderizarListaVisual('med', listaTemporalMedicamentos);
    } else {
        listaTemporalMateriales.splice(index, 1);
        renderizarListaVisual('mat', listaTemporalMateriales);
    }
}

// Funciones de escape vinculadas a los botones de cancelar en el HTML
if (typeof window !== 'undefined') {
    window.verListaRelevamientos = verListaRelevamientos;
    window.mostrarFormularioNuevoRelevamiento = mostrarFormularioNuevoRelevamiento;
    window.editarRelevamientoGeneral = editarRelevamientoGeneral;
    window.ingresarARelevamiento = ingresarARelevamiento;
    window.mostrarFormularioNuevaFamilia = mostrarFormularioNuevaFamilia;
    window.verFichaNecesidades = verFichaNecesidades;
    window.editarDatosFamilia = editarDatosFamilia;
    window.eliminarFamiliar = eliminarFamiliar;
    window.agregarItemLista = agregarItemLista;
    window.eliminarItemLista = eliminarItemLista;
    window.verPanelPrincipal = verPanelPrincipal;
    window.abrirModalCierreRelevamiento = abrirModalCierreRelevamiento;
window.guardarEstadoTerreno = guardarEstadoTerreno;
    
    // 🔗 Vinculamos de forma segura ambas variantes para que tus botones funcionen sí o sí:
    window.verListaFamilias = (id) => ingresarARelevamiento(id || idRelevamientoActivo);
    window.regresarAListaFamilias = () => { if (idRelevamientoActivo) ingresarARelevamiento(idRelevamientoActivo); };
}