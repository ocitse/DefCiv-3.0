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
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-3">No hay relevamientos nuevos disponibles</td></tr>`;
            return;
        }
        tbody.innerHTML = data.map(item => `
            <tr>
                <td>
                    <input class="form-check-input radio-relevamiento" type="radio" name="relevamientoSeleccionado" value="${item.id || item.id_relevamiento}">
                </td>
                <td>#${item.id || item.id_relevamiento}</td>
                <td class="d-none d-md-table-cell">${item.createdAt || item.created_at ? new Date(item.createdAt || item.created_at).toLocaleDateString() : 'Sin fecha'}</td>
                <td>${item.departamento} - ${item.localidad}</td>
                <td><span class="badge bg-secondary">${item.estado}</span></td>
                <td class="d-none d-md-table-cell">${item.tipo_evento || 'N/D'}</td>
                <td>${item.relevador_asignado || 'N/D'}</td>
                <td><span class="badge bg-warning text-dark">${item.prioridad || item.urgencia_general || 'Normal'}</span></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error("Error al cargar relevamientos en espera:", error);
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-3">Error al cargar relevamientos en espera</td></tr>`;
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
 * Función auxiliar para calcular los totales de insumos y personas
 */
function calcularTotales(familias) {
    return familias.reduce((acc, f) => {
        acc.integrantes += (Number(f.cantidad_integrantes) || 0);
        acc.unidades_alimentarias += (Number(f.unidades_alimentarias) || 0);
        acc.abrigos += (Number(f.abrigos) || 0);
        acc.frazadas += (Number(f.frazadas) || 0);
        acc.bidones_agua += (Number(f.bidones_agua) || 0);
        acc.kits_higiene += (Number(f.kits_higiene) || 0);
        acc.ropa += (Number(f.ropa) || 0);
        acc.colchones += (Number(f.colchones) || 0);
        return acc;
    }, { integrantes: 0, unidades_alimentarias: 0, abrigos: 0, frazadas: 0, bidones_agua: 0, kits_higiene: 0, ropa: 0, colchones: 0 });
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

        const fila = seleccionado.closest('tr');
        const idTexto = fila.cells[1]?.innerText || `#${idRelevamiento}`;
        const fecha = fila.cells[2]?.innerText || 'Sin fecha';
        const ubicacion = fila.cells[3]?.innerText || 'Sin ubicación';
        const estado = fila.cells[4]?.innerText || '';
        const evento = fila.cells[5]?.innerText || 'Sin evento';
        const relevador = fila.cells[6]?.innerText || 'Sin relevador';
        const urgencia = fila.cells[7]?.innerText || 'Media';

        try {
            // 1. Obtenemos las familias reales asociadas a este relevamiento desde la API
            let familiasData = [];
            try {
                const respFamilias = await fetch(`/api/relevamientos/${idRelevamiento}/familias`);
                if (respFamilias.ok) {
                    familiasData = await respFamilias.json();
                }
            } catch (err) {
                console.warn('No se pudieron cargar las familias específicas via API, se procederá con resumen general:', err);
            }

            // 2. Enviar la solicitud principal al backend (crea provisión y actualiza estado)
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

            if (respuesta.ok && resultado.success) {
                alert('¡Solicitud enviada correctamente a Desarrollo Social!');
                
                const campoObservaciones = document.querySelector('#seccion-nueva-solicitud textarea');
                if (campoObservaciones) {
                    campoObservaciones.value = '';
                }

                // 3. Construir las filas de la tabla de familias para el PDF
                let cuerpoTablaFamilias = [
                    [
                        { text: 'DNI', bold: true, fillColor: '#e9ecef', fontSize: 8 },
                        { text: 'Apellido y Nombre', bold: true, fillColor: '#e9ecef', fontSize: 8 },
                        { text: 'Int.', bold: true, fillColor: '#e9ecef', fontSize: 8, alignment: 'center' },
                        { text: 'Alim.', bold: true, fillColor: '#e9ecef', fontSize: 8, alignment: 'center' },
                        { text: 'Fraz.', bold: true, fillColor: '#e9ecef', fontSize: 8, alignment: 'center' },
                        { text: 'Colch.', bold: true, fillColor: '#e9ecef', fontSize: 8, alignment: 'center' },
                        { text: 'Agua', bold: true, fillColor: '#e9ecef', fontSize: 8, alignment: 'center' },
                        { text: 'Kits', bold: true, fillColor: '#e9ecef', fontSize: 8, alignment: 'center' }
                    ]
                ];

                if (familiasData && familiasData.length > 0) {
                    familiasData.forEach(fam => {
                        cuerpoTablaFamilias.push([
                            { text: fam.dni_jefe || fam.dni || 'N/D', fontSize: 7 },
                            { text: fam.apellido_nombre || fam.nombre || 'N/D', fontSize: 7 },
                            { text: String(fam.cantidad_integrantes || fam.integrantes || '1'), fontSize: 7, alignment: 'center' },
                            { text: String(fam.unidades_alimentarias || '0'), fontSize: 7, alignment: 'center' },
                            { text: String(fam.frazadas || '0'), fontSize: 7, alignment: 'center' },
                            { text: String(fam.colchones || '0'), fontSize: 7, alignment: 'center' },
                            { text: String(fam.bidones_agua || '0'), fontSize: 7, alignment: 'center' },
                            { text: String(fam.kits_higiene || '0'), fontSize: 7, alignment: 'center' }
                        ]);
                    });

                    // Añadir la fila de totales al final de la tabla de familias
                    const t = calcularTotales(familiasData);
                    cuerpoTablaFamilias.push([
                        { text: 'TOTALES', bold: true, colSpan: 2, fillColor: '#dee2e6', fontSize: 8 },
                        {},
                        { text: String(t.integrantes), bold: true, fillColor: '#dee2e6', fontSize: 8, alignment: 'center' },
                        { text: String(t.unidades_alimentarias), bold: true, fillColor: '#dee2e6', fontSize: 8, alignment: 'center' },
                        { text: String(t.frazadas), bold: true, fillColor: '#dee2e6', fontSize: 8, alignment: 'center' },
                        { text: String(t.colchones), bold: true, fillColor: '#dee2e6', fontSize: 8, alignment: 'center' },
                        { text: String(t.bidones_agua), bold: true, fillColor: '#dee2e6', fontSize: 8, alignment: 'center' },
                        { text: String(t.kits_higiene), bold: true, fillColor: '#dee2e6', fontSize: 8, alignment: 'center' }
                    ]);

                } else {
                    cuerpoTablaFamilias.push([
                        { text: 'Asistencia y provisión solicitada en base al relevamiento operativo general.', colSpan: 8, alignment: 'center', fontSize: 9, italics: true },
                        {}, {}, {}, {}, {}, {}, {}
                    ]);
                }

                // Definición del documento PDF
                const docDefinition = {
                    pageOrientation: 'portrait',
                    content: [
                        { text: 'DEFENSA CIVIL - PROVINCIA DE SANTIAGO DEL ESTERO', style: 'header', alignment: 'center' },
                        { text: 'INFORME OFICIAL DE SOLICITUD DE PROVISIÓN', style: 'subheader', alignment: 'center', margin: [0, 0, 0, 15] },
                        
                        {
                            style: 'tableExample',
                            table: {
                                widths: ['20%', '30%', '20%', '30%'],
                                body: [
                                    [
                                        { text: 'ID Relevamiento:', bold: true, fontSize: 9 }, { text: idTexto, fontSize: 9 },
                                        { text: 'Fecha Emisión:', bold: true, fontSize: 9 }, { text: fecha, fontSize: 9 }
                                    ],
                                    [
                                        { text: 'Ubicación:', bold: true, fontSize: 9 }, { text: ubicacion, fontSize: 9 },
                                        { text: 'Tipo de Evento:', bold: true, fontSize: 9 }, { text: evento, fontSize: 9 }
                                    ],
                                    [
                                        { text: 'Relevador:', bold: true, fontSize: 9 }, { text: relevador, fontSize: 9 },
                                        { text: 'Nivel Urgencia:', bold: true, fontSize: 9 }, { text: urgencia, fontSize: 9 }
                                    ]
                                ]
                            },
                            layout: 'lightHorizontalLines',
                            margin: [0, 0, 0, 15]
                        },

                        { text: 'Detalle de Familias Damnificadas y Requerimientos:', bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
                        {
                            table: {
                                headerRows: 1,
                                widths: ['18%', '32%', '10%', '10%', '10%', '10%', '10%', '10%'],
                                body: cuerpoTablaFamilias
                            },
                            margin: [0, 0, 0, 15]
                        },
                        
                        { text: 'Observaciones / Justificación:', bold: true, fontSize: 10 },
                        { text: observaciones || 'Sin observaciones adicionales.', fontSize: 9, margin: [0, 0, 0, 30] },
                        
                        {
                            columns: [
                                { text: '___________________________\nFirma Operativo / Defensa Civil', alignment: 'center', fontSize: 9 },
                                { text: '___________________________\nRecibe Desarrollo Social', alignment: 'center', fontSize: 9 }
                            ],
                            margin: [0, 20, 0, 0]
                        }
                    ],
                    styles: {
                        header: { fontSize: 14, bold: true, color: '#0d6efd' },
                        subheader: { fontSize: 10, italics: true, color: '#6c757d' }
                    }
                };

                pdfMake.createPdf(docDefinition).download(`Solicitud-Relevamiento-${idRelevamiento}.pdf`);

                const textoWhatsApp = `*SOLICITUD DE PROVISIÓN - DEF. CIVIL*\n` +
                    `----------------------------------\n` +
                    `*ID Relevamiento:* ${idTexto}\n` +
                    `*Ubicación:* ${ubicacion}\n` +
                    `*Evento:* ${evento}\n` +
                    `*Urgencia:* ${urgencia}\n` +
                    `*Observaciones:* ${observaciones || 'Ninguna'}\n` +
                    `----------------------------------\n` +
                    `_Se ha generado el documento PDF correspondiente._`;

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