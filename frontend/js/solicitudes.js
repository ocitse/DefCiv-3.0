// frontend/js/solicitudes.js
import { Storage } from './storage.js';
import { mostrarNotificacion } from './ui.js';

const CONTENEDOR_APP = 'contenedor-principal';

async function cargarVistaDinamica(rutaHtml, callback) {
    try {
        const respuesta = await fetch(rutaHtml);
        if (!respuesta.ok) throw new Error(`Error: ${rutaHtml}`);
        const htmlTexto = await respuesta.text();
        document.getElementById(CONTENEDOR_APP).innerHTML = htmlTexto;
        if (callback) callback();
    } catch (error) {
        console.error(error);
    }
}

/**
 * Muestra la tabla de solicitudes emitidas (Nivel Solicitudes)
 */
export function verListaSolicitudes() {
    // CORREGIDO: Buscamos el ID nuevo para que se ilumine correctamente al hacer clic
    const btnMenu = document.getElementById('btn-menu-solicitudes'); 
    
    if (btnMenu) {
        document.querySelectorAll('#sidebar-app .nav-link').forEach(el => el.classList.remove('active'));
        btnMenu.classList.add('active');
    }
    
    cargarVistaDinamica('frontend/pages/tabla-solicitudes.html', () => {
        const tbody = document.getElementById('tabla-solicitudes-body');
        if (!tbody) return;

        const data = Storage.getData();
        const solicitudes = data.solicitudes || [];

        if (solicitudes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4"><i class="bi bi-info-circle"></i> No hay expedientes de solicitudes creados todavía.</td></tr>`;
            return;
        }

        tbody.innerHTML = solicitudes.map(sol => `
            <tr>
                <td><strong>${sol.id_solicitud}</strong></td>
                <td><span class="badge bg-light text-dark border">${sol.id_relevamiento_origen}</span></td>
                <td><strong>${sol.zona_afectada}</strong></td>
                <td>${sol.fecha_emision}</td>
                <td class="text-center fw-bold text-dark">${sol.familias_totales}</td>
                <td><span class="badge bg-warning text-dark">${sol.estado}</span></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-dark" onclick="alert('Detalle de insumos consolidados en backend.')">
                        <i class="bi bi-search"></i> Ver Expediente
                    </button>
                </td>
            </tr>
        `).join('');
    });
}

/**
 * Abre el formulario e inicializa los sumadores lógicos
 */
export function mostrarFormularioNuevaSolicitud() {
    cargarVistaDinamica('frontend/pages/form-solicitud.html', () => {
        const data = Storage.getData();
        const relevamientos = data.relevamientos || [];
        const selectOrigen = document.getElementById('s_relevamiento_origen');

        if (!selectOrigen) return;

        // Rellenamos el select únicamente con relevamientos que ya tengan familias censadas
        const filtrados = relevamientos.filter(r => r.familias && r.familias.length > 0);

        if (filtrados.length === 0) {
            selectOrigen.innerHTML = `<option value="" disabled selected>No hay relevamientos con familias censadas disponibles</option>`;
        } else {
            selectOrigen.innerHTML += filtrados.map(r => `
                <option value="${r.id_relevamiento}">${r.id_relevamiento} - ${r.departamento} (${r.barrio}) - Evento: ${r.tipo_evento}</option>
            `).join('');
        }

        // Evento que se dispara al cambiar de Relevamiento: Suma total de insumos automática
        selectOrigen.addEventListener('change', (e) => {
            const relSeleccionado = relevamientos.find(r => r.id_relevamiento === e.target.value);
            if (!relSeleccionado) return;

            document.getElementById('s_zona_espejo').value = `${relSeleccionado.departamento} - ${relSeleccionado.localidad} (B° ${relSeleccionado.barrio})`;

            // Variables acumuladoras logísticas
            let alim = 0, abri = 0, fraz = 0, agua = 0, higi = 0, colch = 0;

            // Recorremos las familias sumando sus necesidades cuantitativas de forma atómica
            relSeleccionado.familias.forEach(f => {
                alim += f.necesidades_detectadas?.alimentos_cant || 0;
                abri += f.necesidades_detectadas?.abrigos_cant || 0;
                fraz += f.necesidades_detectadas?.frazadas_cant || 0;
                agua += f.necesidades_detectadas?.bidones_agua_cant || 0;
                higi += f.necesidades_detectadas?.kit_higiene_cant || 0;
                colch += f.necesidades_detectadas?.colchones_cant || 0;
            });

            // Pintamos los resultados en los contadores superiores de la interfaz
            document.getElementById('sum-alimentos').innerText = alim;
            document.getElementById('sum-abrigos').innerText = abri;
            document.getElementById('sum-frazadas').innerText = fraz;
            document.getElementById('sum-agua').innerText = agua;
            document.getElementById('sum-higiene').innerText = higi;
            document.getElementById('sum-colchones').innerText = colch;
        });

        document.getElementById('form-nueva-solicitud').addEventListener('submit', guardarSolicitudOficial);
    });
}

/**
 * Persiste la solicitud procesada en el Storage
 */
function guardarSolicitudOficial(e) {
    if (e) e.preventDefault();

    try {
        const data = Storage.getData();
        if (!data.solicitudes) data.solicitudes = [];

        const idRel = document.getElementById('s_relevamiento_origen').value;
        const rel = data.relevamientos.find(r => r.id_relevamiento === idRel);

        const nuevaSolicitud = {
            id_solicitud: `SOL-${Math.floor(10000 + Math.random() * 90000)}`,
            id_relevamiento_origen: idRel,
            zona_afectada: `${rel.departamento} (${rel.localidad})`,
            fecha_emision: new Date().toLocaleDateString('es-AR'),
            familias_totales: rel.familias.length,
            estado: 'Pendiente'
        };

        data.solicitudes.push(nuevaSolicitud);
        Storage.setData(data);

        mostrarNotificacion("Solicitud de recursos emitida al circuito de aprobación.");
        verListaSolicitudes();
    } catch (err) {
        console.error(err);
    }
}

// Inyección al objeto Window
if (typeof window !== 'undefined') {
    window.verListaSolicitudes = verListaSolicitudes;
    window.mostrarFormularioNuevaSolicitud = mostrarFormularioNuevaSolicitud;
}