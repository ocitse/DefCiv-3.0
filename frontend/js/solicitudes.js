// frontend/js/solicitudes.js

const CONTENEDOR_APP = 'content-principal';

let solicitandoVista = false;

/**
 * Muestra la vista principal de Solicitudes inyectando el HTML sin recargar la URL
 */
export async function verListaSolicitudes() {
    const contenedor = document.querySelector('.content-principal');
    if (!contenedor) return;

    if (document.getElementById('seccion-nueva-solicitud')) {
        return; 
    }

    if (solicitandoVista) return;
    solicitandoVista = true;

    try {
        const respuesta = await fetch('/frontend/pages/tabla-solicitudes.html');
        if (!respuesta.ok) throw new Error('No se pudo cargar la página de solicitudes.');
        
        const htmlTexto = await respuesta.text();
        contenedor.innerHTML = htmlTexto;
        
        inicializarSolapasSolicitudes();
        await cargarRelevamientosEnEspera();
        inicializarFormularioSolicitud();
    } catch (error) {
        console.error("Error al cargar la vista de solicitudes:", error);
        contenedor.innerHTML = `<div class="p-4 text-center text-danger fw-bold"><i class="bi bi-exclamation-triangle-fill me-2"></i> Error al cargar el módulo de Solicitudes.</div>`;
    } finally {
        solicitandoVista = false;
    }
}

function inicializarSolapasSolicitudes() {
    const tabNueva = document.getElementById('tab-nueva-solicitud');
    const tabHistorial = document.getElementById('tab-ver-historial');
    const secNueva = document.getElementById('seccion-nueva-solicitud');
    const secHistorial = document.getElementById('seccion-historial');
    
    if (!tabNueva || !tabHistorial) return;

    const nuevoTabNueva = tabNueva.cloneNode(true);
    const nuevoTabHistorial = tabHistorial.cloneNode(true);
    tabNueva.parentNode.replaceChild(nuevoTabNueva, tabNueva);
    tabHistorial.parentNode.replaceChild(nuevoTabHistorial, tabHistorial);

    nuevoTabNueva.addEventListener('click', (e) => {
        e.preventDefault();
        nuevoTabNueva.classList.add('btn-primary', 'active');
        nuevoTabNueva.classList.remove('btn-outline-primary', 'btn-outline-secondary');
        nuevoTabHistorial.classList.add('btn-outline-secondary');
        nuevoTabHistorial.classList.remove('btn-primary', 'active');
        if (secNueva) secNueva.classList.remove('d-none');
        if (secHistorial) secHistorial.classList.add('d-none');
    });

    nuevoTabHistorial.addEventListener('click', (e) => {
        e.preventDefault();
        nuevoTabHistorial.classList.add('btn-primary', 'active');
        nuevoTabHistorial.classList.remove('btn-outline-secondary');
        nuevoTabNueva.classList.add('btn-outline-secondary');
        nuevoTabNueva.classList.remove('btn-primary', 'active');
        if (secHistorial) secHistorial.classList.remove('d-none');
        if (secNueva) secNueva.classList.add('d-none');
        verHistorialSolicitudes();
    });
}

export async function cargarRelevamientosEnEspera() {
    const tbody = document.querySelector('#tabla-relevamientos-espera tbody');
    if (!tbody) return;
    
    try {
        const respuesta = await fetch('/api/solicitudes/en-espera');
        const data = await respuesta.json();
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">No hay relevamientos nuevos disponibles</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => `
            <tr>
                <td>
                    <input class="form-check-input radio-relevamiento" type="radio" name="relevamientoSeleccionado" value="${item.id_relevamiento}">
                </td>
                <td>#${item.id_relevamiento}</td>
                <td>${item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Sin fecha'}</td>
                <td>${item.departamento} - ${item.localidad}</td>
                <td>${item.tipo_evento}</td>
                <td>${item.relevador_asignado}</td>
                <td><span class="badge bg-warning text-dark">${item.urgencia_general}</span></td>
            </tr>
        `).join('');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-3">Error al cargar relevamientos en espera</td></tr>`;
    }
}

export async function verHistorialSolicitudes() {
    const tbody = document.querySelector('#tabla-historial-solicitudes tbody');
    if (!tbody) return;
    
    try {
        const respuesta = await fetch('/api/solicitudes/historial');
        const data = await respuesta.json();
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">No hay solicitudes enviadas registradas</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(item => `
            <tr>
                <td>#${item.id_relevamiento}</td>
                <td>${item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'Sin fecha'}</td>
                <td>${item.departamento} - ${item.localidad}</td>
                <td>${item.tipo_evento}</td>
                <td>${item.relevador_asignado}</td>
                <td><span class="badge bg-info text-dark">${item.estado}</span></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Error al cargar historial:", error);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3">Error al cargar el historial de solicitudes</td></tr>`;
    }
}

/**
 * Inicializa el evento del formulario para enviar el relevamiento seleccionado
 */
export function inicializarFormularioSolicitud() {
    const botonOriginal = document.getElementById('btn-enviar-solicitud');
    if (!botonOriginal) return;

    const nuevoBoton = botonOriginal.cloneNode(true);
    botonOriginal.parentNode.replaceChild(nuevoBoton, botonOriginal);

    nuevoBoton.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const seleccionado = document.querySelector('input[name="relevamientoSeleccionado"]:checked');
        if (!seleccionado) {
            alert('Por favor, seleccione un relevamiento de la lista.');
            return;
        }

        const idRelevamiento = seleccionado.value;
        const observaciones = document.querySelector('#seccion-nueva-solicitud textarea')?.value || '';

        // Buscamos la fila completa en la tabla para extraer los datos visuales y armar el mensaje de WhatsApp
        const fila = seleccionado.closest('tr');
        const fecha = fila.cells[2]?.innerText || 'Sin fecha';
        const ubicacion = fila.cells[3]?.innerText || 'Sin ubicación';
        const evento = fila.cells[4]?.innerText || 'Sin evento';
        const relevador = fila.cells[5]?.innerText || 'Sin relevador';
        const urgencia = fila.cells[6]?.innerText || 'Media';

        try {
            const respuesta = await fetch('/api/solicitudes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    relevamientoId: idRelevamiento,
                    observaciones: observaciones
                })
            });

            const resultado = await respuesta.json();

            // Dentro de tu evento 'click' del botón de envío en solicitudes.js:
if (respuesta.ok && resultado.success) {
    alert('¡Solicitud enviada correctamente a Desarrollo Social!');
    
    // Definición del diseño del PDF oficial
    const docDefinition = {
        content: [
            { text: 'DEFENSA CIVIL - PROVINCIA DE SANTIAGO DEL ESTERO', style: 'header', alignment: 'center' },
            { text: 'INFORME DE SOLICITUD DE PROVISIÓN', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 20] },
            
            { text: `ID Relevamiento: #${idRelevamiento}`, bold: true },
            { text: `Fecha de Emisión: ${fecha}` },
            { text: `Ubicación: ${ubicacion}` },
            { text: `Tipo de Evento: ${evento}` },
            { text: `Relevador Asignado: ${relevador}` },
            { text: `Nivel de Urgencia: ${urgencia}`, margin: [0, 0, 0, 15] },
            
            { text: 'Observaciones / Justificación:', bold: true },
            { text: observaciones || 'Sin observaciones adicionales.', margin: [0, 0, 0, 30] },
            
            {
                columns: [
                    { text: '___________________________\nFirma Operativo / Defensa Civil', alignment: 'center' },
                    { text: '___________________________\nRecibe Desarrollo Social', alignment: 'center' }
                ],
                margin: [0, 50, 0, 0]
            }
        ],
        styles: {
            header: { fontSize: 16, bold: true, color: '#0d6efd' },
            subheader: { fontSize: 12, italics: true, color: '#6c757d' }
        }
    };

    // Generar y descargar el PDF automáticamente
    pdfMake.createPdf(docDefinition).download(`Solicitud-Relevamiento-${idRelevamiento}.pdf`);

    // Armar el texto para WhatsApp avisando que el PDF fue generado
    const textoWhatsApp = `*SOLICITUD DE PROVISIÓN - DEFENSA CIVIL*\n` +
        `----------------------------------\n` +
        `*ID Relevamiento:* #${idRelevamiento}\n` +
        `*Ubicación:* ${ubicacion}\n` +
        `*Evento:* ${evento}\n` +
        `*Urgencia:* ${urgencia}\n` +
        `*Observaciones:* ${observaciones || 'Ninguna'}\n` +
        `----------------------------------\n` +
        `_Se ha generado el documento PDF correspondiente en el sistema._`;

    const urlWhatsApp = `https://wa.me/?text=${encodeURIComponent(textoWhatsApp)}`;
    window.open(urlWhatsApp, '_blank');

    await cargarRelevamientosEnEspera();
} else {
                alert(resultado.error || 'Error al enviar la solicitud.');
            }
        } catch (error) {
            console.error('Error de red al enviar la solicitud:', error);
            alert('Error de conexión con el servidor.');
        }
    });
}

if (typeof window !== 'undefined') {
    window.verListaSolicitudes = verListaSolicitudes;
    window.cargarRelevamientosEnEspera = cargarRelevamientosEnEspera;
    window.verHistorialSolicitudes = verHistorialSolicitudes;
}