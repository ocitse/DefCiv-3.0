import { Storage } from './storage.js';

export function actualizarDashboard() {
    const data = Storage.getData();
    
    const totalRev = document.getElementById('total-relevamientos');
    if (totalRev) totalRev.textContent = data.relevamientos ? data.relevamientos.filter(r => r.estado === 'Nuevo').length : 0;

    const totalSol = document.getElementById('total-solicitudes');
    if (totalSol) totalSol.textContent = data.solicitudes ? data.solicitudes.filter(s => s.estado === 'Pendiente').length : 0;

    const totalOrd = document.getElementById('total-ordenes');
    if (totalOrd) totalOrd.textContent = data.ordenes ? data.ordenes.filter(o => o.estado === 'aprobada').length : 0;

    const totalFam = document.getElementById('total-familias');
    if (totalFam) totalFam.textContent = data.entregas ? data.entregas.length : 0;
}