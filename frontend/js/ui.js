// frontend/js/ui.js

/**
 * Muestra una notificación visual en la esquina superior derecha de la pantalla
 * @param {string} mensaje - El texto a mostrar
 * @param {string} tipo - 'success' (verde) o 'error' (rojo)
 */
export function mostrarNotificacion(mensaje, tipo = 'success') {
    // Eliminamos si ya existe una alerta vieja para no acumularlas
    const alertaVieja = document.getElementById('alerta-flotante-app');
    if (alertaVieja) alertaVieja.remove();

    const colorBg = tipo === 'success' ? 'bg-success' : 'bg-danger';
    const icono = tipo === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';

    // Creamos el contenedor de la alerta con clases de Bootstrap
    const alertaHtml = `
        <div id="alerta-flotante-app" class="animate__animated animate__fadeInRight" style="position: fixed; top: 20px; right: 20px; z-index: 9999;">
            <div class="toast show align-items-center text-white ${colorBg} border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body d-flex align-items-center gap-2">
                        <i class="bi ${icono} fs-5"></i>
                        <span>${mensaje}</span>
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close" onclick="document.getElementById('alerta-flotante-app').remove()"></button>
                </div>
            </div>
        </div>
    `;

    // Lo inyectamos al final del documento
    document.body.insertAdjacentHTML('beforeend', alertaHtml);

    // Hacemos que se desvanezca sola a los 4 segundos
    setTimeout(() => {
        const alerta = document.getElementById('alerta-flotante-app');
        if (alerta) {
            alerta.classList.replace('animate__fadeInRight', 'animate__fadeOutRight');
            setTimeout(() => alerta.remove(), 500);
        }
    }, 4000);
}

// =========================================================================
// 📱 INTERACCIONES GLOBALES DE LA INTERFAZ MÓVIL
// =========================================================================

// Cierra automáticamente el menú hamburguesa al hacer clic en cualquier lugar externo o en el usuario
document.addEventListener('click', function (event) {
    const menuMobile = document.getElementById('sidebar-mobile');
    if (!menuMobile) return; // Si no está la barra móvil en el DOM (como en PC), no hace nada

    const botonHamburguesa = menuMobile.querySelector('.navbar-toggler');
    const contenidoMenu = menuMobile.querySelector('.navbar-collapse');

    // Si el menú móvil está desplegado en pantalla (Bootstrap le añade la clase 'show')
    if (contenidoMenu && contenidoMenu.classList.contains('show')) {
        
        // Evaluamos si el clic ocurrió AFUERA de la hamburguesa Y AFUERA del propio rectángulo del menú
        if (!botonHamburguesa.contains(event.target) && !contenidoMenu.contains(event.target)) {
            
            // Intentamos cerrarlo limpiamente usando la API nativa de Bootstrap 5
            if (typeof bootstrap !== 'undefined' && bootstrap.Collapse) {
                const collapseInstance = bootstrap.Collapse.getInstance(contenidoMenu);
                if (collapseInstance) {
                    collapseInstance.hide();
                    return;
                }
            }
            
            // Alternativa manual de respaldo (fallback) por seguridad si la instancia no responde
            contenidoMenu.classList.remove('show');
            botonHamburguesa.classList.add('collapsed');
            botonHamburguesa.setAttribute('aria-expanded', 'false');
        }
    }
});