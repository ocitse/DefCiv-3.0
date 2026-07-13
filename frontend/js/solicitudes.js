document.addEventListener('DOMContentLoaded', () => {
    const tabNueva = document.getElementById('tab-nueva-solicitud');
    const tabHistorial = document.getElementById('tab-ver-historial');
    const secNueva = document.getElementById('seccion-nueva-solicitud');
    const secHistorial = document.getElementById('seccion-historial');
    
    // Cambio entre solapas
    tabNueva.addEventListener('click', () => {
        tabNueva.classList.add('btn-primary', 'active');
        tabNueva.classList.remove('btn-outline-primary', 'btn-outline-secondary');
        tabHistorial.classList.add('btn-outline-secondary');
        tabHistorial.classList.remove('btn-primary', 'active');
        secNueva.classList.remove('d-none');
        secHistorial.classList.add('d-none');
    });

    tabHistorial.addEventListener('click', () => {
        tabHistorial.classList.add('btn-primary', 'active');
        tabHistorial.classList.remove('btn-outline-secondary');
        tabNueva.classList.add('btn-outline-secondary');
        tabNueva.classList.remove('btn-primary', 'active');
        secHistorial.classList.remove('d-none');
        secNueva.classList.add('d-none');
        cargarHistorialSolicitudes();
    });

    cargarRelevamientosEnEspera();
});

async function cargarRelevamientosEnEspera() {
    const tbody = document.querySelector('#tabla-relevamientos-espera tbody');
    try {
        const respuesta = await fetch('/api/relevamientos/en-espera');
        const data = await respuesta.json();
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">No hay relevamientos nuevos disponibles</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => `
            <tr>
                <td><input class="form-check-input radio-relevamiento" type="radio" name="relevamientoSeleccionado" value="${item.id}"></td>
                <td>#${item.id}</td>
                <td>${new Date(item.fecha).toLocaleDateString()}</td>
                <td>${item.beneficiario}</td>
                <td>${item.localidad}</td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3">Error al cargar relevamientos en espera</td></tr>`;
    }
}

async function cargarHistorialSolicitudes() {
    // Función para obtener las solicitudes enviadas previamente
}