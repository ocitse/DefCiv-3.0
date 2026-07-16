/**
 * Función global y centralizada para cargar vistas HTML de forma dinámica
 * en el contenedor principal del index.html
 */
export async function cargarVistaDinamica(rutaHtml, callback) {
    try {
        const respuesta = await fetch(rutaHtml);
        if (!respuesta.ok) throw new Error(`No se pudo cargar la página: ${rutaHtml}`);
        
        const htmlTexto = await respuesta.text();
        
        // Buscamos el contenedor principal universal del esqueleto
        const contenedor = document.querySelector('.content-principal');
        
        if (contenedor) {
            contenedor.innerHTML = htmlTexto;
        } else {
            console.warn("No se encontró el contenedor .content-principal en el DOM.");
        }

        // Si la vista requiere lógica adicional, ejecutamos su función asociada
        if (callback) callback();
        
    } catch (error) {
        console.error("Error crítico en ruteo dinámico:", error);
        if (typeof mostrarNotificacion === 'function') {
            mostrarNotificacion("Error al cargar la interfaz visual.", "error");
        }
    }
}