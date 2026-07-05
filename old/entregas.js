import { Storage } from './storage.js';

export function cargarEntregas() {
    const data = Storage.getData();
    const tbody = document.getElementById('tabla-entregas');
    if (!tbody) return;

    if (!data.entregas || data.entregas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3">No hay entregas efectuadas</td></tr>';
        return;
    }

    tbody.innerHTML = data.entregas.map(ent => `
        <tr class="align-middle">
            <td><strong>#${ent.id}</strong></td>
            <td>${ent.fecha_entrega || 'N/A'}</td>
            <td>${ent.beneficiario || 'Familia'}</td>
            <td>${ent.materiales_entregados || 'Suministros'}</td>
            <td><span class="badge bg-success">Entregado</span></td>
        </tr>
    `).join('');
}