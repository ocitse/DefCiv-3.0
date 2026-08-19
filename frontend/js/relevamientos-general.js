// frontend/js/relevamientos-general.js
import { cargarVistaDinamica } from './utils.js';
import { mostrarNotificacion } from './ui.js';
import { departamentosYLocalidades } from './ubicaciones.js';
import { Storage } from './storage.js'; 
import { verFichaNecesidades } from './relevamientos-familias.js';
import { editarDatosFamilia } from './relevamientos-form.js';
import { verListaRelevamientos } from './relevamientos-familias.js';

// Variables globales en memoria para almacenar los relevamientos y la paginación local
let relevamientosOriginales = [];
let paginaActualRelevamientos = 1;

function getBadgePrioridad(prioridad) {
    if (prioridad === 'Alta') return 'bg-danger';
    if (prioridad === 'Media') return 'bg-warning text-dark';
    return 'bg-success';
}
function getBadgeEstado(estado) {
    const est = (estado || 'Nuevo').toLowerCase();
    if (est === 'completado' || est === 'finalizado') return 'bg-success';
    if (est === 'en proceso' || est === 'en curso') return 'bg-warning text-dark';
    return 'bg-info text-dark'; // Por defecto para 'Nuevo' u otros
}

function cargarDesplegablesUbicacion() {
    const selectDep = document.getElementById('r_departamento');
    const selectLoc = document.getElementById('r_localidad');
    if (!selectDep || !selectLoc) return;

    selectDep.innerHTML = '<option value="" selected disabled>Seleccione Departamento...</option>';
    const departamentos = Object.keys(departamentosYLocalidades);
    departamentos.forEach(depto => {
        const option = document.createElement('option');
        option.value = depto;
        option.textContent = depto;
        selectDep.appendChild(option);
    });

    selectLoc.innerHTML = '<option value="" selected disabled>Seleccione Localidad...</option>';

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
    
    select.innerHTML = '<option value="" disabled selected>Asignar a...</option>';

    try {
        const token = localStorage.getItem('token');
        // Apuntamos a /api/usuarios pasando los filtros por URL
        const respuesta = await fetch('/api/usuarios?rol=Relevador&estado=Activo', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const resultado = await respuesta.json();

        if (resultado.success && resultado.data) {
            resultado.data.forEach(rev => {
                const option = document.createElement('option');
                option.value = rev.id; 
                option.textContent = `${rev.apellido}, ${rev.nombres}`;
                select.appendChild(option);
            });
        } else {
            console.error('No se pudieron cargar los relevadores activos');
        }
    } catch (error) {
        console.error('Error de red al obtener relevadores:', error);
    }
}

export function editarRelevamientoGeneral(idRelevamiento) {
    cargarVistaDinamica('/frontend/pages/form-relevamiento.html', async () => {
        try {
            const token = localStorage.getItem('token');
            const respuesta = await fetch(`/api/relevamientos/${idRelevamiento}`, {
                headers: { 'Authorization': `Bearer ${token}` } // <-- Enviar token
            });
            const rel = await respuesta.json();

            if (!respuesta.ok || !rel) {
                mostrarNotificacion("No se encontró el relevamiento a editar.", "error");
                verListaRelevamientos(); 
                return;
            }

            const titulo = document.getElementById('titulo-form-relevamiento');
            if (titulo) {
                titulo.innerHTML = `<i class="bi bi-pencil-square text-warning me-2"></i> Editar Configuración de Relevamiento`;
            }

            document.getElementById('r_id_edicion').value = rel.id_relevamiento || rel.id;

            cargarDesplegablesUbicacion();
            await cargarDesplegableRelevadores();

            const selectDep = document.getElementById('r_departamento');
            if (selectDep) {
                selectDep.value = rel.departamento || '';
                if (selectDep.onchange) selectDep.onchange({ target: selectDep });
            }

            document.getElementById('r_localidad').value = rel.localidad || '';
            document.getElementById('r_barrio').value = rel.barrio || '';
            document.getElementById('r_tipo_evento').value = rel.tipo_evento || '';
            document.getElementById('r_solicitante').value = rel.solicitante || '';
            document.getElementById('r_prioridad').value = rel.prioridad || 'Baja';
            document.getElementById('r_relevador').value = rel.relevador_asignado || '';

            const form = document.getElementById('form-nuevo-relevamiento');
            if (form) {
                form.removeEventListener('submit', guardarRelevamientoGeneral);
                form.addEventListener('submit', guardarRelevamientoGeneral);
            }
        } catch (error) {
            console.error("Error al obtener los datos para la edición:", error);
            mostrarNotificacion("Error al cargar los datos del relevamiento.", "error");
        }
    });
}
export async function eliminarRelevamientoGeneral(idRelevamiento) {
    if (!confirm('¿Estás seguro de que deseas eliminar este relevamiento y todas sus familias asociadas?')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const respuesta = await fetch(`/api/relevamientos/${idRelevamiento}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` } // <-- Enviar token
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            mostrarNotificacion(resultado.mensaje || 'Relevamiento eliminado con éxito.', 'success');
            // Recargamos la tabla local para reflejar los cambios al instante
            cargarTablaRelevamientos();
        } else {
            mostrarNotificacion(resultado.mensaje || 'Error al intentar eliminar el relevamiento.', 'error');
        }
    } catch (error) {
        console.error('Error de red al eliminar relevamiento:', error);
        mostrarNotificacion('No se pudo conectar con el servidor.', 'error');
    }
}

export async function verPanelPrincipal() {
    cargarVistaDinamica('./frontend/pages/panel-principal.html', async () => {
        try {
            const token = localStorage.getItem('token'); // <-- Recuperar token
            const respuesta = await fetch('/api/relevamientos', {
                headers: { 'Authorization': `Bearer ${token}` } // <-- Enviar token
            });

            // Validamos primero si la respuesta es correcta antes de parsear a JSON
            if (!respuesta.ok) {
                const errorData = await respuesta.json().catch(() => ({}));
                throw new Error(errorData.mensaje || `Error en el servidor: ${respuesta.status}`);
            }

            const relevamientos = await respuesta.json();
            const listaRelevamientos = Array.isArray(relevamientos) ? relevamientos : [];

            if (listaRelevamientos.length === 0) {
                // Si no hay datos, muestra un mensaje amigable o sal de la función de forma segura
                tbodyDash.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay registros cargados</td></tr>`;
                return;
            }

            const nuevos = listaRelevamientos.filter(r => r.estado === 'Nuevo' || !r.familias || r.familias.length === 0).length;
            
            let totalFamilias = 0;
            listaRelevamientos.forEach(r => {
                if (r.familias) totalFamilias += r.familias.length;
            });

            if (document.getElementById('dash-relevamientos-nuevos')) {
                document.getElementById('dash-relevamientos-nuevos').innerText = nuevos;
                document.getElementById('dash-familias-asistidas').innerText = totalFamilias;
                document.getElementById('dash-solicitudes-pendientes').innerText = listaRelevamientos.length; 
                document.getElementById('dash-ordenes-aprobadas').innerText = Math.floor(totalFamilias * 0.7); 
                document.getElementById('dash-entregas-reportes').innerText = listaRelevamientos.length;
            }

            const tbodyDash = document.getElementById('dash-tabla-emergencias');
            if (tbodyDash) {
                if (listaRelevamientos.length === 0) {
                    tbodyDash.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay incidentes reportados</td></tr>`;
                    return;
                }
                
                const ultimos = listaRelevamientos.slice(-4).reverse();
                tbodyDash.innerHTML = ultimos.map(r => `
                    <tr>
                        <td><strong>${r.departamento || 'N/D'}</strong> (${r.localidad || 'N/D'})</td>
                        <td>${r.tipo_evento || 'N/D'}</td>
                        <td><small>${r.relevador_asignado || r.relevador_assigned || 'N/D'}</small></td>
                        <td>${r.relevador_apellido ? `${r.relevador_apellido}, ${r.relevador_nombre}` : (r.relevador_asignado || 'Sin asignar')}</td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error("Error al cargar los datos del panel principal:", error);
            const tbodyDash = document.getElementById('dash-tabla-emergencias');
            if (tbodyDash) {
                // Cambiamos el mensaje de error rojo por un aviso limpio de que no hay registros
                tbodyDash.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay emergencias asignadas</td></tr>`;
            }
        }
    });
}

// Función principal que hace el fetch UNA VEZ y almacena en memoria
export async function cargarTablaRelevamientos() {
    const tbody = document.getElementById('tabla-relevamientos-body');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm me-2" role="status"></div>Cargando relevamientos...</td></tr>`;

    try {
        const token = localStorage.getItem('token'); // <-- Recuperar token
        const respuesta = await fetch('/api/relevamientos', {
            headers: { 'Authorization': `Bearer ${token}` } // <-- Enviar token
        });
        const relevamientos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(relevamientos.mensaje || 'Error al obtener los datos.');
        }

        relevamientosOriginales = relevamientos || [];
        paginaActualRelevamientos = 1;
        manejarCambioFiltrosRelevamientos();

    } catch (error) {
        console.error("Error al cargar la tabla de relevamientos:", error);
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-danger py-4">Error al conectar con el servidor.</td></tr>`;
    }
}

// Función central que procesa búsqueda, ordenamiento y paginación local de Relevamientos
export function manejarCambioFiltrosRelevamientos(resetPagina = true) {
    if (resetPagina) paginaActualRelevamientos = 1;

    const textoBusqueda = document.getElementById('inputBusquedaRelevamiento')?.value.toLowerCase().trim() || '';
    const criterioOrden = document.getElementById('selectOrdenarRelevamientos')?.value || '';
    const selectPaginacion = document.getElementById('selectPaginacionRelevamientos')?.value || '10';

    // 1. Filtrado local por Código, Localidad, Barrio o Solicitante
    let resultado = relevamientosOriginales.filter(r => {
        const codigo = (r.codigo_relevamiento || '').toLowerCase();
        const localidad = (r.localidad || '').toLowerCase();
        const departamento = (r.departamento || '').toLowerCase();
        const barrio = (r.barrio || '').toLowerCase();
        const solicitante = (r.solicitante || '').toLowerCase();

        return codigo.includes(textoBusqueda) || 
               localidad.includes(textoBusqueda) || 
               departamento.includes(textoBusqueda) || 
               barrio.includes(textoBusqueda) || 
               solicitante.includes(textoBusqueda);
    });

    // 2. Ordenamiento local
    if (criterioOrden === 'localidad') {
        resultado.sort((a, b) => (a.localidad || '').localeCompare(b.localidad || ''));
    } else if (criterioOrden === 'solicitante') {
        resultado.sort((a, b) => (a.solicitante || '').localeCompare(b.solicitante || ''));
    } else if (criterioOrden === 'prioridad') {
        const pesoPrioridad = { 'alta': 1, 'media': 2, 'baja': 3 };
        resultado.sort((a, b) => {
            const pA = pesoPrioridad[(a.prioridad || '').toLowerCase()] || 4;
            const pB = pesoPrioridad[(b.prioridad || '').toLowerCase()] || 4;
            return pA - pB;
        });
    } else if (criterioOrden === 'relevador') {
        resultado.sort((a, b) => {
            const revA = (a.relevador_apellido ? `${a.relevador_apellido}, ${a.relevador_nombre}` : (a.relevador_asignado || '')).toLowerCase();
            const revB = (b.relevador_apellido ? `${b.relevador_apellido}, ${b.relevador_nombre}` : (b.relevador_asignado || '')).toLowerCase();
            return revA.localeCompare(revB);
        });
    } else {
        // Por defecto: Más recientes primero (por fecha de creación descendente)
        resultado.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    // 3. Paginación local
    let relevamientosPaginados = resultado;
    let totalPaginas = 1;

    if (selectPaginacion !== 'todos') {
        const porPagina = parseInt(selectPaginacion, 10);
        totalPaginas = Math.ceil(resultado.length / porPagina) || 1;
        
        if (paginaActualRelevamientos > totalPaginas) paginaActualRelevamientos = totalPaginas;
        if (paginaActualRelevamientos < 1) paginaActualRelevamientos = 1;

        const inicio = (paginaActualRelevamientos - 1) * porPagina;
        const fin = inicio + porPagina;
        relevamientosPaginados = resultado.slice(inicio, fin);
    }

    renderizarFilasRelevamientos(relevamientosPaginados);
    renderizarControlesPaginacionRelevamientos(resultado.length, selectPaginacion === 'todos' ? resultado.length : parseInt(selectPaginacion, 10), totalPaginas);
}

// Función auxiliar para cambiar de página desde los botones de Relevamientos
window.cambiarPaginaRelevamientos = function(nuevaPagina) {
    paginaActualRelevamientos = nuevaPagina;
    manejarCambioFiltrosRelevamientos(false);
}

// Renderizado de filas en la tabla
function renderizarFilasRelevamientos(relevamientos) {
    const tbody = document.getElementById('tabla-relevamientos-body');
    if (!tbody) return;

    if (!relevamientos || relevamientos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted py-4">No se encontraron relevamientos con los criterios de búsqueda.</td></tr>`;
        return;
    }

    tbody.innerHTML = relevamientos.map(r => {
        // Normalizamos el estado para limpiar espacios y evaluar con seguridad
        const estadoRaw = (r.estado || '').toLowerCase().trim();
        const esNuevo = estadoRaw === 'nuevo';
        const esEnProceso = estadoRaw === 'en-proceso' || estadoRaw === 'en proceso';
        const esActivo = esNuevo || esEnProceso;
        const esCompletado = estadoRaw === 'completado' || estadoRaw === 'finalizado';

        console.log(`Relevamiento ID: ${r.id_relevamiento || r.id} - Estado leído: "${estadoRaw}" - ¿Es completado?: ${esCompletado}`);

        return `
        <tr>
            <td><strong>${r.codigo_relevamiento || 'N/D'}</strong></td>
            <td><span class="badge ${getBadgeEstado(r.estado)}">${r.estado || 'Nuevo'}</span></td>
            <td>${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/D'}</td>
            <td><strong>${r.departamento}</strong> / ${r.localidad}</td>
            <td>${r.barrio || ''}</td>
            <td>${r.tipo_evento || ''}</td>
            <td>${r.solicitante || ''}</td>
            <td><span class="badge ${getBadgePrioridad(r.prioridad)}">${r.prioridad || 'Baja'}</span></td>
            <td>${r.relevador_apellido ? `${r.relevador_apellido}, ${r.relevador_nombre}` : (r.relevador_asignado || 'Sin asignar')}</td>
            <td class="text-center">${r.familias ? r.familias.length : 0}</td>
            <td class="text-center">
            <div class="d-flex justify-content-center gap-1">
                ${esActivo ? `
                    <button class="btn btn-sm btn-outline-warning" onclick="window.editarRelevamiento('${r.id_relevamiento || r.id}')" title="Editar Configuración">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    ${esEnProceso ? `
                        <button class="btn btn-sm btn-outline-success" onclick="window.completarRelevamientoGeneral('${r.id_relevamiento || r.id}')" title="Marcar como Completado">
                            <i class="bi bi-check-circle"></i>
                        </button>
                        ` : esCompletado ? `
                    <!-- 🌟 AQUÍ APARECE EL BOTÓN DE DEVOLVER CUANDO ESTÁ COMPLETADO -->
                    <button class="btn btn-sm btn-outline-warning" onclick="window.abrirModalDevolucion('${r.id_relevamiento || r.id}')" title="Devolver al relevador con observaciones">
                        <i class="bi bi-arrow-counterclockwise"></i> Devolver
                    </button>
                    ` : ''}
                ` : `
                    <span class="badge bg-secondary align-self-center">Bloqueado</span>
                `}
                <button class="btn btn-sm btn-outline-primary" onclick="window.ingresarARelevamiento('${r.id_relevamiento || r.id}')" title="Ver Familias">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="window.eliminarRelevamiento('${r.id_relevamiento || r.id}')" title="Eliminar Relevamiento">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </td>
        </tr>
    `;
    }).join('');
}

// Renderiza los controles de paginación para Relevamientos
function renderizarControlesPaginacionRelevamientos(totalRegistros, porPagina, totalPaginas) {
    const contenedor = document.getElementById('contenedor-paginacion-relevamientos');
    if (!contenedor) return;

    if (totalRegistros === 0) {
        contenedor.innerHTML = '';
        return;
    }

    const selectPaginacion = document.getElementById('selectPaginacionRelevamientos')?.value;
    if (selectPaginacion === 'todos') {
        contenedor.innerHTML = `<span class="text-muted small">Mostrando todos los registros (${totalRegistros} en total)</span>`;
        return;
    }

    const inicioRegistro = ((paginaActualRelevamientos - 1) * porPagina) + 1;
    const finRegistro = Math.min(paginaActualRelevamientos * porPagina, totalRegistros);

    contenedor.innerHTML = `
        <span class="text-muted small">Mostrando ${inicioRegistro} a ${finRegistro} de ${totalRegistros} relevamientos</span>
        <ul class="pagination pagination-sm m-0">
            <li class="page-item ${paginaActualRelevamientos === 1 ? 'disabled' : ''}">
                <button class="page-link" onclick="window.cambiarPaginaRelevamientos(${paginaActualRelevamientos - 1})">Anterior</button>
            </li>
            <li class="page-item disabled">
                <span class="page-link bg-light text-dark">Pág. ${paginaActualRelevamientos} de ${totalPaginas}</span>
            </li>
            <li class="page-item ${paginaActualRelevamientos >= totalPaginas ? 'disabled' : ''}">
                <button class="page-link" onclick="window.cambiarPaginaRelevamientos(${paginaActualRelevamientos + 1})">Siguiente</button>
            </li>
        </ul>
    `;
}

export function mostrarFormularioNuevoRelevamiento() {
    cargarVistaDinamica('./frontend/pages/form-relevamiento.html', () => {
        const titulo = document.getElementById('titulo-form-relevamiento');
        if (titulo) {
            titulo.innerHTML = `<i class="bi bi-plus-circle-fill text-primary me-2"></i> Nuevo Relevamiento`;
        }

        const idEdicion = document.getElementById('r_id_edicion');
        if (idEdicion) idEdicion.value = '';

        const form = document.getElementById('form-nuevo-relevamiento');
        if (form) {
            form.reset();
            form.removeEventListener('submit', guardarRelevamientoGeneral);
            form.addEventListener('submit', guardarRelevamientoGeneral);
        }

        cargarDesplegablesUbicacion();
        cargarDesplegableRelevadores();
    });
}

async function guardarRelevamientoGeneral(event) {
    event.preventDefault();

    const idEdicion = document.getElementById('r_id_edicion').value;
    
    const datosFormulario = {
        departamento: document.getElementById('r_departamento').value,
        localidad: document.getElementById('r_localidad').value,
        barrio: document.getElementById('r_barrio')?.value || '',
        tipo_evento: document.getElementById('r_tipo_evento').value,
        solicitante: document.getElementById('r_solicitante')?.value || '',
        prioridad: document.getElementById('r_prioridad')?.value || 'Baja',
        relevador_asignado: document.getElementById('r_relevador').value
    };

    const url = idEdicion ? `/api/relevamientos/${idEdicion}` : '/api/relevamientos';
    const metodo = idEdicion ? 'PUT' : 'POST';

    try {
        const token = localStorage.getItem('token'); // <-- Recuperar token
        const respuesta = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // <-- Enviar token
            },
            body: JSON.stringify(datosFormulario)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            mostrarNotificacion(resultado.mensaje || 'Operación realizada con éxito.', 'success');
            
            document.getElementById('form-nuevo-relevamiento').reset();
            document.getElementById('r_id_edicion').value = '';

            if (typeof verListaRelevamientos === 'function') {
                verListaRelevamientos();
            } else {
                cargarTablaRelevamientos(); 
            }
        } else {
            console.warn("Detalle del error del backend:", resultado);
            mostrarNotificacion(resultado.mensaje || resultado.error || 'Error al procesar la solicitud.', 'error');
        }
    } catch (error) {
        console.error('Error de red al intentar guardar:', error);
        mostrarNotificacion('No se pudo conectar con el servidor.', 'error');
    }
}

export async function completarRelevamientoGeneral(idRelevamiento) {
    if (!confirm('¿Estás seguro de marcar este relevamiento como completado? Esta acción finalizará la carga de familias y bloqueará futuras modificaciones.')) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const respuesta = await fetch(`/api/relevamientos/${idRelevamiento}/completar`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            mostrarNotificacion(resultado.mensaje || 'Relevamiento completado con éxito.', 'success');
            cargarTablaRelevamientos();
        } else {
            mostrarNotificacion(resultado.mensaje || 'Error al intentar completar el relevamiento.', 'error');
        }
    } catch (error) {
        console.error('Error de red al completar relevamiento:', error);
        mostrarNotificacion('No se pudo conectar con el servidor.', 'error');
    }
}

// 1. Función para abrir el modal y guardar temporalmente el ID del relevamiento
window.abrirModalDevolucion = function(idRelevamiento) {
    const inputId = document.getElementById('devolucion_id_relevamiento');
    const inputMotivo = document.getElementById('devolucion_motivo');
    
    if (inputId) inputId.value = idRelevamiento;
    if (inputMotivo) inputMotivo.value = ''; // Limpiar campo anterior

    // Mostrar el modal usando Bootstrap
    const modalElement = document.getElementById('modalDevolucionRelevamiento');
    if (modalElement && typeof bootstrap !== 'undefined') {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
};

// 2. Función para confirmar la devolución y enviarla al servidor
window.confirmarDevolucionRelevamiento = async function() {
    const idRelevamiento = document.getElementById('devolucion_id_relevamiento')?.value;
    const motivo = document.getElementById('devolucion_motivo')?.value.trim();

    if (!motivo) {
        mostrarNotificacion('Por favor, ingrese el motivo de la devolución.', 'error');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const respuesta = await fetch(`/api/relevamientos/${idRelevamiento}/devolver`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ motivo })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            mostrarNotificacion(resultado.mensaje || 'Relevamiento devuelto con éxito.', 'success');
            
            // Cerrar el modal
            const modalElement = document.getElementById('modalDevolucionRelevamiento');
            if (modalElement && typeof bootstrap !== 'undefined') {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }

            // Recargar la tabla para ver reflejado el cambio de estado
            cargarTablaRelevamientos();
        } else {
            mostrarNotificacion(resultado.mensaje || 'Error al intentar devolver el relevamiento.', 'error');
        }
    } catch (error) {
        console.error('Error de red al devolver relevamiento:', error);
        mostrarNotificacion('No se pudo conectar con el servidor.', 'error');
    }
};

// No olvides exponerla en el objeto window al final del archivo:
window.completarRelevamientoGeneral = completarRelevamientoGeneral;

// Exposiciones globales necesarias
window.editarRelevamiento = editarRelevamientoGeneral;
window.eliminarRelevamiento = eliminarRelevamientoGeneral;
window.mostrarFormularioNuevoRelevamiento = mostrarFormularioNuevoRelevamiento;
window.cargarTablaRelevamientos = cargarTablaRelevamientos;
window.manejarCambioFiltrosRelevamientos = manejarCambioFiltrosRelevamientos;
window.verFichaNecesidades = verFichaNecesidades;
window.editarDatosFamilia = editarDatosFamilia;