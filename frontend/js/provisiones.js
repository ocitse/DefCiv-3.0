// frontend/js/provisiones.js

let solicitandoVistaProvisiones = false;

/**
 * Muestra la vista principal de Provisiones inyectando el HTML parcial
 */
export async function verListaProvisiones() {
    const contenedor = document.querySelector('.content-principal');
    if (!contenedor) return;

    if (document.getElementById('tablaProvisiones')) return;

    if (solicitandoVistaProvisiones) return;
    solicitandoVistaProvisiones = true;

    try {
        const respuesta = await fetch('/frontend/pages/provisiones.html');
        if (!respuesta.ok) throw new Error('No se pudo cargar la página de provisiones.');
        
        const htmlTexto = await respuesta.text();
        contenedor.innerHTML = htmlTexto;
        
        await cargarProvisionesData();
    } catch (error) {
        console.error("Error al cargar la vista de provisiones:", error);
        contenedor.innerHTML = `<div class="p-4 text-center text-danger fw-bold"><i class="bi bi-exclamation-triangle-fill me-2"></i> Error al cargar el módulo de Provisiones.</div>`;
    } finally {
        solicitandoVistaProvisiones = false;
    }
}

async function cargarProvisionesData() {
    const tbody = document.querySelector('#tbody-provisiones');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4"><div class="spinner-border spinner-border-sm me-2" role="status"></div>Cargando provisiones...</td></tr>`;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/provisiones', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        
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

                    <!-- 2. VISTA MÓVIL (Tarjeta adaptable al 100%) -->
                    <tr class="d-block d-md-none mb-3 border rounded shadow-sm p-3 bg-white">
                        <td class="text-start border-0 p-0">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                    <div class="fw-bold text-primary">Provisión #${p.id}</div>
                                    <div class="small text-muted">Solicitud Orig. #${p.solicitud_id || 'N/A'}</div>
                                </div>
                                <div><span class="badge ${badgeClass}">${p.estado}</span></div>
                            </div>
                            <div class="small mb-1 text-dark"><strong>Detalle / Insumos:</strong> ${p.detalle}</div>
                            <div class="small mb-1 text-dark"><strong>Destino:</strong> ${p.destino}</div>
                            <div class="small mb-2 text-muted"><strong>Observaciones:</strong> ${p.observaciones || 'Sin observaciones'}</div>
                            <div class="dropdown-divider"></div>
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
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">Error al conectar con el servidor.</td></tr>`;
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

// Exposición global idéntica a solicitudes.js
if (typeof window !== 'undefined') {
    window.verListaProvisiones = verListaProvisiones;
    window.cerrarCircuitoProvision = cerrarCircuitoProvision;
}