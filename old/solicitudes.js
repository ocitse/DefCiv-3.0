import { Storage } from './storage.js';
import { mostrarNotificacion } from './ui.js';

export function cargarSolicitudes() {
    const data = Storage.getData();
    const tbody = document.getElementById('tabla-solicitudes');
    if (!tbody) return;

    if (!data.solicitudes || data.solicitudes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3">No hay solicitudes registradas</td></tr>';
        return;
    }

    tbody.innerHTML = data.solicitudes.map(sol => `
        <tr class="align-middle">
            <td><strong>#${sol.id}</strong></td>
            <td>${new Date(sol.fecha).toLocaleDateString('es-AR')}</td>
            <td>${sol.tipologia || 'Suministros'}</td>
            <td>${sol.destino || 'Localidad'}</td>
            <td><span class="badge ${sol.estado === 'Pendiente' ? 'bg-warning text-dark' : 'bg-success'}">${sol.estado}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-success btn-aprobar-sol" data-id="${sol.id}"><i class="bi bi-check-lg"></i></button>
            </td>
        </tr>
    `).join('');
}

export function aprobarSolicitud(id) {
    const data = Storage.getData();
    const sol = data.solicitudes.find(s => s.id == id);
    if (sol) {
        sol.estado = 'Aprobada';
        Storage.setData(data);
        mostrarNotificacion(`Solicitud #${id} aprobada con éxito.`);
        cargarSolicitudes();
    }
}