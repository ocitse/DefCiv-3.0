// frontend/js/provisiones.js

document.addEventListener("DOMContentLoaded", () => {
    cargarProvisiones();
});

// Función para obtener y listar todas las provisiones desde el backend
async function cargarProvisiones() {
    try {
        const res = await fetch('/api/provisiones');
        const json = await res.json();
        const tbody = document.querySelector('#tablaProvisiones tbody');
        
        if (!tbody) {
            console.warn("⚠️ No se encontró el elemento #tablaProvisiones en el HTML.");
            return;
        }

        tbody.innerHTML = '';

        if (json.success && json.data.length > 0) {
            json.data.forEach(p => {
                let badgeClass = 'bg-warning text-dark';
                if (p.estado && (p.estado.includes('Entregado') || p.estado.includes('Cerrado'))) {
                    badgeClass = 'bg-success';
                } else if (p.estado && p.estado.includes('Rechazado')) {
                    badgeClass = 'bg-danger';
                }

                tbody.innerHTML += `
                    <tr>
                        <td><strong>#${p.id}</strong></td>
                        <td>Solicitud #${p.solicitud_id || 'N/A'}</td>
                        <td>${p.detalle}</td>
                        <td>${p.destino}</td>
                        <td><span class="badge ${badgeClass}">${p.estado}</span></td>
                        <td>${p.observaciones || 'Sin observaciones'}</td>
                        <td>
                            ${p.estado === 'Enviado' ? `
                                <button class="btn btn-sm btn-success" onclick="cerrarCircuito(${p.id})">
                                    <i class="fas fa-check-circle"></i> Registrar Retorno
                                </button>
                            ` : `<span class="text-muted small">Cerrado</span>`}
                        </td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No hay provisiones registradas en tránsito.</td></tr>`;
        }
    } catch (err) {
        console.error("Error al cargar provisiones:", err);
    }
}

// Función para registrar el retorno y cerrar el circuito de provisión
async function cerrarCircuito(id) {
    const observaciones = prompt("Ingrese el resultado del retorno (Ej: Entregado correctamente, firmó el remito, etc.):");
    if (observaciones === null) return; // Si el usuario cancela el prompt

    try {
        const res = await fetch(`/api/provisiones/${id}/cerrar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                estado_retorno: 'Cerrado / Entregado', 
                observaciones: observaciones || 'Entregado sin novedades' 
            })
        });
        
        const data = await res.json();
        if (data.success) {
            alert('¡Circuito cerrado correctamente!');
            cargarProvisiones(); // Recargamos la tabla para ver reflejado el cambio
        } else {
            alert('Error al cerrar el circuito.');
        }
    } catch (error) {
        console.error('Error de red al intentar cerrar la provisión:', error);
        alert('Ocurrió un error de red.');
    }
}