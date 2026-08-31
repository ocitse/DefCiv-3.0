import { cargarVistaDinamica } from './utils.js';

export async function cargarModuloProvisiones() {
    await cargarVistaDinamica('/frontend/pages/provisiones.html', () => {
        cargarProvisionesData();
    });
}

async function cargarProvisionesData() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/provisiones', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        const tbody = document.querySelector('#tbody-provisiones');
        
        if (!tbody) return;
        tbody.innerHTML = '';

        if (json.success && json.data.length > 0) {
            json.data.forEach(p => {
                let badgeClass = 'bg-warning text-dark';
                if (p.estado && (p.estado.includes('Entregado') || p.estado.includes('Cerrado'))) {
                    badgeClass = 'bg-success text-white';
                } else if (p.estado && p.estado.includes('Rechazado')) {
                    badgeClass = 'bg-danger text-white';
                }

                const botonAccion = p.estado === 'Enviado' ? `
                    <button class="btn btn-sm btn-success fw-bold px-3 py-2" onclick="window.cerrarCircuitoProvision(${p.id})">
                        <i class="fas fa-check-circle me-1"></i> Registrar Retorno
                    </button>
                ` : `<span class="text-muted small">Cerrado</span>`;

                tbody.innerHTML += `
                    <!-- 1. VISTA DE ESCRITORIO -->
                    <tr class="text-dark d-none d-md-table-row">
                        <td class="ps-3"><strong>#${p.id}</strong></td>
                        <td>Solicitud #${p.solicitud_id || 'N/A'}</td>
                        <td>${p.detalle}</td>
                        <td>${p.destino}</td>
                        <td><span class="badge ${badgeClass}">${p.estado}</span></td>
                        <td>${p.observaciones || 'Sin observaciones'}</td>
                        <td class="text-center pe-3">${botonAccion}</td>
                    </tr>

                    <!-- 2. VISTA MÓVIL (Tarjeta oscura adaptable al 100%) -->
                    <tr class="d-block d-md-none mb-3 border rounded shadow-sm p-3" style="background-color: #1a222c !important; border-color: #2d3748 !important; color: #e2e8f0; margin-bottom: 1rem !important;">
                        <td class="text-start border-0 p-0" style="background-color: transparent !important; color: inherit;">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <div class="fw-bold text-info">Provisión #${p.id}</div>
                                    <div class="small text-muted">Solicitud Orig. #${p.solicitud_id || 'N/A'}</div>
                                </div>
                                <div><span class="badge ${badgeClass}">${p.estado}</span></div>
                            </div>
                            <div class="small mb-1 text-light"><strong>Detalle / Insumos:</strong> ${p.detalle}</div>
                            <div class="small mb-1 text-light"><strong>Destino:</strong> ${p.destino}</div>
                            <div class="small mb-2 text-muted"><strong>Observaciones:</strong> ${p.observaciones || 'Sin observaciones'}</div>
                            <div class="dropdown-divider" style="border-color: #2d3748 !important;"></div>
                            <div class="mt-2 text-center w-100">
                                ${botonAccion}
                            </div>
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No hay provisiones registradas en tránsito.</td></tr>`;
        }
    } catch (err) {
        console.error("Error al cargar provisiones:", err);
        const tbody = document.querySelector('#tbody-provisiones');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Error al conectar con el servidor.</td></tr>`;
        }
    }
}

async function cerrarCircuitoProvision(id) {
    const observaciones = prompt("Ingrese el resultado del retorno (Ej: Entregado correctamente, firmó el remito, etc.):");
    if (observaciones === null) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/provisiones/${id}/cerrar`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                estado_retorno: 'Cerrado / Entregado', 
                observaciones: observaciones || 'Entregado sin novedades' 
            })
        });
        
        const data = await res.json();
        if (data.success) {
            alert('¡Circuito cerrado correctamente!');
            cargarProvisionesData();
        } else {
            alert('Error al cerrar el circuito.');
        }
    } catch (error) {
        console.error('Error de red al intentar cerrar la provisión:', error);
        alert('Ocurrió un error de red.');
    }
}

window.cerrarCircuitoProvision = cerrarCircuitoProvision;
window.cargarModuloProvisiones = cargarModuloProvisiones;