// js/ui.js
export function irASeccion(idSeccion) {
    const secciones = ['dashboard', 'relevamientos', 'solicitudes', 'ordenes', 'entregas', 'inventario', 'reportes', 'emergencias', 'usuarios','configuracion'];
    
    secciones.forEach(sec => {
        const el = document.getElementById(sec);
        if (el) el.style.display = 'none';
        
        const navEl = document.getElementById(`nav-${sec}`);
        if (navEl) navEl.classList.remove('active');
    });

    const objetivo = document.getElementById(idSeccion);
    if (objetivo) objetivo.style.display = 'block';

    const navActivo = document.getElementById(`nav-${idSeccion}`);
    if (navActivo) navActivo.classList.add('active');
}

export function mostrarNotificacion(msj, tipo = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const div = document.createElement('div');
    div.className = `alert alert-${tipo === 'error' ? 'danger' : tipo} alert-dismissible fade show shadow-sm small fw-bold`;
    div.innerHTML = `${msj} <button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
    container.appendChild(div);
    setTimeout(() => div.remove(), 3500);
}