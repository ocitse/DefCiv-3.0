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
    cargarVistaDinamica('/frontend/pages/form-relevamiento.html', () => {
        const data = Storage.getData();
        const rel = data.relevamientos.find(r => r.id_relevamiento === idRelevamiento);

        if (!rel) {
            mostrarNotificacion("No se encontró el relevamiento a editar.", "error");
            verListaRelevamientos();
            return;
        }

        const titulo = document.getElementById('titulo-form-relevamiento');
        if (titulo) titulo.innerHTML = `<i class="bi bi-pencil-square text-warning me-2"></i> Editar Configuración de Relevamiento`;

        document.getElementById('r_id_edicion').value = rel.id_relevamiento;

        cargarDesplegablesUbicacion();
        cargarDesplegableRelevadores();

        document.getElementById('r_barrio').value = rel.barrio;
        document.getElementById('r_tipo_evento').value = rel.tipo_evento;
        document.getElementById('r_solicitante').value = rel.solicitante;
        document.getElementById('r_urgencia').value = rel.urgencia_general;
        
        document.getElementById('r_departamento').value = rel.id_departamento;
        document.getElementById('r_localidad').value = rel.id_localidad;
        document.getElementById('r_relevador').value = rel.id_relevador;

        const form = document.getElementById('form-nuevo-relevamiento');
        if (form) {
            form.addEventListener('submit', guardarRelevamientoGeneral);
        }
    });
}

export function verPanelPrincipal() {
    cargarVistaDinamica('/frontend/pages/panel-principal.html', () => {
        const data = Storage.getData();
        const relevamientos = data.relevamientos || [];

        const nuevos = relevamientos.filter(r => r.estado === 'Nuevo' || !r.familias || r.familias.length === 0).length;
        
        let totalFamilias = 0;
        relevamientos.forEach(r => {
            if (r.familias) totalFamilias += r.familias.length;
        });

        if (document.getElementById('dash-relevamientos-nuevos')) {
            document.getElementById('dash-relevamientos-nuevos').innerText = nuevos;
            document.getElementById('dash-familias-asistidas').innerText = totalFamilias;
            
            document.getElementById('dash-solicitudes-pendientes').innerText = relevamientos.length; 
            document.getElementById('dash-ordenes-aprobadas').innerText = Math.floor(totalFamilias * 0.7); 
            document.getElementById('dash-entregas-reportes').innerText = relevamientos.length;
        }

        const tbodyDash = document.getElementById('dash-tabla-emergencias');
        if (tbodyDash) {
            if (relevamientos.length === 0) {
                tbodyDash.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No hay incidentes reportados</td></tr>`;
                return;
            }
            
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

export function cargarTablaRelevamientos() {
    const tbody = document.getElementById('tabla-relevamientos-body');
    if (!tbody) return;

    try {
        const data = Storage.getData();
        const relevamientos = data.relevamientos || [];

        if (relevamientos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">No hay relevamientos registrados.</td></tr>`;
            return;
        }

        tbody.innerHTML = relevamientos.map(r => `
            <tr>
                <td>${r.id_relevamiento}</td>
                <td>${r.fecha || 'N/D'}</td>
                <td><strong>${r.departamento}</strong> / ${r.localidad}</td>
                <td>${r.barrio || ''}</td>
                <td>${r.tipo_evento || ''}</td>
                <td>${r.solicitante || ''}</td>
                <td><span class="badge ${getBadgeUrgencia(r.urgencia_general)}">${r.urgencia_general}</span></td>
                <td class="text-center">${r.familias ? r.familias.length : 0}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary" onclick="window.verListaRelevamientos('${r.id_relevamiento}')" title="Ver detalle">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error("Error al cargar la tabla de relevamientos:", error);
        tbody.innerHTML = `<tr><td colspan="9" class="text-center text-danger py-4">Error al cargar los datos.</td></tr>`;
    }
}