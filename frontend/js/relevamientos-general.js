import { cargarVistaDinamica } from './utils.js';
import { mostrarNotificacion } from './ui.js';
import { departamentosYLocalidades } from './ubicaciones.js';
import { Storage } from './storage.js'; // Ajusta la ruta si se llama diferente o está en otra carpeta

function getBadgeUrgencia(urgencia) {
    if (urgencia === 'Alta') return 'bg-danger';
    if (urgencia === 'Media') return 'bg-warning text-dark';
    return 'bg-success';
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
        const respuesta = await fetch('/api/relevadores');
        const resultado = await respuesta.json();

        if (resultado.success && resultado.data) {
            resultado.data.forEach(rev => {
                const option = document.createElement('option');
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

export function editarRelevamientoGeneral(idRelevamiento) {
    cargarVistaDinamica('/frontend/pages/form-relevamiento.html', async () => {
        try {
            // Consultamos directamente al endpoint para obtener el relevamiento específico
            const respuesta = await fetch(`/api/relevamientos/${idRelevamiento}`);
            const rel = await respuesta.json();

            if (!respuesta.ok || !rel) {
                mostrarNotificacion("No se encontró el relevamiento a editar.", "error");
                // Asegurate de tener definida o importar la función que lista los relevamientos
                // verListaRelevamientos(); 
                return;
            }

            const titulo = document.getElementById('titulo-form-relevamiento');
            if (titulo) {
                titulo.innerHTML = `<i class="bi bi-pencil-square text-warning me-2"></i> Editar Configuración de Relevamiento`;
            }

            document.getElementById('r_id_edicion').value = rel.id_relevamiento || rel.id;

            cargarDesplegablesUbicacion();
            await cargarDesplegableRelevadores(); // Esperamos a que carguen los selectores

            document.getElementById('r_barrio').value = rel.barrio || '';
            document.getElementById('r_tipo_evento').value = rel.tipo_evento || '';
            document.getElementById('r_solicitante').value = rel.solicitante || '';
            document.getElementById('r_urgencia').value = rel.urgencia_general || '';
            
            document.getElementById('r_departamento').value = rel.id_departamento || rel.departamento || '';
            document.getElementById('r_localidad').value = rel.id_localidad || rel.localidad || '';
            document.getElementById('r_relevador').value = rel.id_relevador || rel.relevador_assigned || '';

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

export async function verPanelPrincipal() {
    cargarVistaDinamica('./frontend/pages/panel-principal.html', async () => {
        try {
            const respuesta = await fetch('/api/relevamientos');
            const relevamientos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(relevamientos.mensaje || 'Error al obtener los datos del panel.');
            }

            const listaRelevamientos = relevamientos || [];

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
                        <td><strong>${r.departamento}</strong> (${r.localidad})</td>
                        <td>${r.tipo_evento}</td>
                        <td><small>${r.relevador_asignado || r.relevador_assigned || 'N/D'}</small></td>
                        <td><span class="badge ${getBadgeUrgencia(r.urgencia_general)}">${r.urgencia_general}</span></td>
                    </tr>
                `).join('');
            }
        } catch (error) {
            console.error("Error al cargar los datos del panel principal:", error);
        }
    });
}

export async function cargarTablaRelevamientos() {
    const tbody = document.getElementById('tabla-relevamientos-body');
    if (!tbody) return;

    // Mostramos un mensaje de carga mientras se conecta con la API
    tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm me-2" role="status"></div>Cargando relevamientos...</td></tr>`;

    try {
        const respuesta = await fetch('/api/relevamientos');
        const relevamientos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(relevamientos.mensaje || 'Error al obtener los datos.');
        }

        if (!relevamientos || relevamientos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">No hay relevamientos registrados.</td></tr>`;
            return;
        }

        tbody.innerHTML = relevamientos.map(r => `
            <tr>
                <td>${r.id_relevamiento || r.id}</td>
                <td>${r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'N/D'}</td>
                <td><strong>${r.departamento}</strong> / ${r.localidad}</td>
                <td>${r.barrio || ''}</td>
                <td>${r.tipo_evento || ''}</td>
                <td>${r.solicitante || ''}</td>
                <td><span class="badge ${getBadgeUrgencia(r.urgencia_general)}">${r.urgencia_general}</span></td>
                <td class="text-center">${r.familias ? r.familias.length : 0}</td>
                <td class="text-center">
    <button class="btn btn-sm btn-outline-primary" onclick="window.editarRelevamientoGeneral('${r.id_relevamiento || r.id}')" title="Ver detalle / Editar">
        <i class="bi bi-eye"></i>
    </button>
</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error("Error al cargar la tabla de relevamientos:", error);
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger py-4">Error al conectar con el servidor.</td></tr>`;
    }
}

export function mostrarFormularioNuevoRelevamiento() {
    cargarVistaDinamica('./frontend/pages/form-relevamiento.html', () => {
        const titulo = document.getElementById('titulo-form-relevamiento');
        if (titulo) {
            titulo.innerHTML = `<i class="bi bi-plus-circle-fill text-primary me-2"></i> Nuevo Relevamiento`;
        }

        const idEdicion = document.getElementById('r_id_edicion');
        if (idEdicion) idEdicion.value = ''; // <-- Vital para que no se duplique

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
        tipo_evento: document.getElementById('r_tipo_evento').value,
        relevador_assigned: document.getElementById('r_relevador').value,
        urgencia_general: document.getElementById('r_urgencia').value,
        barrio: document.getElementById('r_barrio').value,
        solicitante: document.getElementById('r_solicitante').value
    };

    const url = idEdicion ? `/api/relevamientos/${idEdicion}` : '/api/relevamientos';
    const metodo = idEdicion ? 'PUT' : 'POST';

    try {
        const respuesta = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosFormulario)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            mostrarNotificacion(resultado.mensaje || 'Operación realizada con éxito.', 'success');
            
            // Limpiamos el formulario y el ID de edición para evitar duplicados
            document.getElementById('form-nuevo-relevamiento').reset();
            document.getElementById('r_id_edicion').value = '';

            // Redirigimos al listado principal (Asegurate de llamar a tu función que muestra la tabla/lista)
            cargarTablaRelevamientos(); 
        } else {
            mostrarNotificacion(resultado.mensaje || 'Error al procesar la solicitud.', 'error');
        }
    } catch (error) {
        console.error('Error de red al intentar guardar:', error);
        mostrarNotificacion('No se pudo conectar con el servidor.', 'error');
    }
}