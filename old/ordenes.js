import { Storage } from './storage.js';

export function cargarOrdenes() {
    const data = Storage.getData();
    const tbody = document.getElementById('tabla-ordenes');
    if (!tbody) return;

    if (!data.ordenes || data.ordenes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3">No hay órdenes vigentes</td></tr>';
        return;
    }

    tbody.innerHTML = data.ordenes.map(ord => `
        <tr class="align-middle">
            <td><strong>#${ord.id}</strong></td>
            <td>${ord.fecha_emision || 'N/A'}</td>
            <td>${ord.encargado || 'Personal'}</td>
            <td><span class="badge bg-info text-dark">${ord.estado}</span></td>
            <td>
                <button class="btn btn-sm btn-light border" onclick="alert('Funcionalidad de impresión en desarrollo')"><i class="bi bi-printer"></i></button>
            </td>
        </tr>
    `).join('');
}