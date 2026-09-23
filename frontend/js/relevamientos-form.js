// frontend/js/relevamientos-form.js
import { mostrarNotificacion } from './ui.js';
import { cargarVistaDinamica } from './utils.js';

// Portapapeles global y blindado para que nunca se pierda al cambiar de vista
window.dtArchivosFamiliaGlobal = new DataTransfer();
let listaTemporalMateriales = [];

function renderizarListaVisual(tipo, arreglo) {
    const ul = document.getElementById(`lista-dinamica-${tipo}`);
    if (!ul) return;

    if (arreglo.length === 0) {
        ul.innerHTML = `<li class="list-group-item text-muted text-center py-3 bg-light opacity-75 small">Ninguno agregado</li>`;
        return;
    }

    ul.innerHTML = arreglo.map((item, index) => `
        <li class="list-group-item d-flex justify-content-between align-items-center p-1 ps-2 bg-light border-secondary-subtle mb-1 rounded">
            <span><strong>${item.cantidad}</strong> x ${item.nombre}</span>
            <button type="button" class="btn btn-sm btn-link text-danger p-0 me-1" onclick="eliminarItemLista('${tipo}', ${index})">
                <i class="bi bi-trash-fill"></i>
            </button>
        </li>
    `).join('');
}

export function renderizarListaArchivosPendientes() {
    const ul = document.getElementById('lista-archivos-pendientes');
    if (!ul) return;

    ul.innerHTML = '';

    if (!window.dtArchivosFamiliaGlobal || window.dtArchivosFamiliaGlobal.files.length === 0) {
        const liVacio = document.createElement('li');
        liVacio.className = "list-group-item text-muted text-center py-2 bg-transparent border-0 small";
        liVacio.textContent = "Ningún archivo adjuntado";
        ul.appendChild(liVacio);
        return;
    }

    Array.from(window.dtArchivosFamiliaGlobal.files).forEach((file, index) => {
        const li = document.createElement('li');
        li.className = "list-group-item p-1 d-flex justify-content-between align-items-center bg-dark border border-secondary rounded mb-1 text-light small";
        li.innerHTML = `
            <span class="text-truncate" style="max-width: 80%;">📎 ${file.name}</span>
            <button type="button" class="btn btn-sm btn-link text-danger p-0 me-1" onclick="window.eliminarArchivoDeListaGlobal(${index})">
                <i class="bi bi-trash-fill"></i>
            </button>
        `;
        ul.appendChild(li);
    });
}

// Función global auxiliar para el botón de borrar
window.eliminarArchivoDeListaGlobal = function(index) {
    const nuevoDt = new DataTransfer();
    Array.from(window.dtArchivosFamiliaGlobal.files).forEach((file, i) => {
        if (i !== index) nuevoDt.items.add(file);
    });
    window.dtArchivosFamiliaGlobal = nuevoDt;
    renderizarListaArchivosPendientes();
};

function renderizarDocumentosGuardados(documentos) {
    const contenedor = document.getElementById('lista-archivos-guardados');
    if (!contenedor) return;

    if (!documentos || documentos.length === 0) {
        contenedor.innerHTML = ''; 
        return;
    }

    contenedor.innerHTML = documentos.map(doc => `
        <div class="d-flex justify-content-between align-items-center p-2 mb-2 bg-dark border border-secondary rounded shadow-sm">
            <a href="${doc.ruta_archivo}" target="_blank" class="text-decoration-none text-info text-truncate fw-medium" style="max-width: 80%;" title="${doc.nombre_archivo}">
                <i class="bi bi-file-earmark-pdf-fill text-danger me-2"></i> ${doc.nombre_archivo}
            </a>
            <span class="badge text-bg-success" style="font-size: 0.7em;">En Nube</span>
        </div>
    `).join('');
}

export function agregarArchivoALista() {
    const input = document.getElementById('inputArchivo');
    if (!input || input.files.length === 0) {
        mostrarNotificacion("Por favor, seleccione un archivo válido para adjuntar.", "error");
        return;
    }

    const archivo = input.files[0];
    
    if (!window.dtArchivosFamiliaGlobal) {
        window.dtArchivosFamiliaGlobal = new DataTransfer();
    }

    let yaExiste = false;
    for (let i = 0; i < window.dtArchivosFamiliaGlobal.files.length; i++) {
        if (window.dtArchivosFamiliaGlobal.files[i].name === archivo.name) {
            yaExiste = true;
            break;
        }
    }

    if (!yaExiste) {
        window.dtArchivosFamiliaGlobal.items.add(archivo);
        renderizarListaArchivosPendientes();
        mostrarNotificacion(`Archivo "${archivo.name}" listo para enviar.`, "success");
        input.value = ""; 
    } else {
        mostrarNotificacion("Ese archivo ya está en la lista.", "error");
    }
}

export function eliminarArchivoDeLista(index) {
    const nuevoDt = new DataTransfer();
    Array.from(dtArchivosFamilia.files).forEach((file, i) => {
        if (i !== index) nuevoDt.items.add(file);
    });
    dtArchivosFamilia = nuevoDt;
    renderizarListaArchivosPendientes();
}

export function agregarItemLista(tipo) {
    const inputItem = document.getElementById(`input-item-${tipo}`);
    const inputCant = document.getElementById(`input-cant-${tipo}`);
    
    if (!inputItem || !inputCant) return;

    const nombre = inputItem.value.trim();
    const cantidad = parseInt(inputCant.value) || 1;

    if (nombre === "") {
        mostrarNotificacion("Por favor, ingrese una descripción válida.", "error");
        return;
    }

    const nuevoItem = { tipo_material: nombre, nombre: nombre, cantidad };

    listaTemporalMateriales.push(nuevoItem);
    renderizarListaVisual('mat', listaTemporalMateriales);

    inputItem.value = "";
    inputCant.value = "";
    inputItem.focus();
}

export function eliminarItemLista(tipo, index) {
    listaTemporalMateriales.splice(index, 1);
    renderizarListaVisual('mat', listaTemporalMateriales);
}

export function inicializarCalculoIntegrantes() {
    const inputMayores = document.getElementById('f_mayores');
    const inputMenores = document.getElementById('f_menores');
    const inputTotal = document.getElementById('f_total');

    if (!inputMayores || !inputMenores || !inputTotal) return;

    const calcular = () => {
        const mayores = parseInt(inputMayores.value) || 0;
        const menores = parseInt(inputMenores.value) || 0;
        inputTotal.value = mayores + menores;
    };

    inputMayores.oninput = calcular;
    inputMenores.oninput = calcular;
    
    calcular();
}

export async function guardarDatosFamiliaDefinitivo(e) {
    if (e) e.preventDefault();

    const form = e.target;
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        mostrarNotificacion("Por favor, complete los datos obligatorios de la familia.", "error");
        return;
    }

    try {
        const idFamiliaEdicion = document.getElementById('f_id_edicion')?.value;
        const formData = new FormData(form);

        // Limpiamos y aseguramos los campos que van por fuera
        formData.set('id_relevamiento', window.idRelevamientoActivo);
        formData.set('jefe_familia', `${document.getElementById('f_apellido').value.trim()}, ${document.getElementById('f_nombre').value.trim()}`);
        formData.set('necesidades', JSON.stringify(listaTemporalMateriales));

        // 🌟 ACÁ ESTÁ EL SECRETO: Inyectamos todos los archivos del array global al FormData
        // 🌟 LECTURA CORRECTA DEL DATATRANSFER QUE SÍ TIENE LOS ARCHIVOS
// 🌟 INYECTAMOS LOS ARCHIVOS DEL DATATRANSFER GLOBAL AL FORMULARIO
if (window.dtArchivosFamiliaGlobal && window.dtArchivosFamiliaGlobal.files.length > 0) {
    Array.from(window.dtArchivosFamiliaGlobal.files).forEach(archivo => {
        formData.append('documentos', archivo);
    });
}

        const url = idFamiliaEdicion ? `/api/familias/${idFamiliaEdicion}` : '/api/familias';
        const metodo = idFamiliaEdicion ? 'PUT' : 'POST';
        const token = localStorage.getItem('token');

        const respuesta = await fetch(url, {
            method: metodo,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const resultado = await respuesta.json();
        if (!respuesta.ok) throw new Error(resultado.mensaje || 'Error al guardar la familia.');

        mostrarNotificacion(resultado.mensaje || "Familia guardada exitosamente.");
        // ... redireccionamiento posterior ...

        if (typeof verListaFamilias === 'function') {
            verListaFamilias(window.idRelevamientoActivo);
        } else if (typeof ingresarARelevamiento === 'function') {
            ingresarARelevamiento(window.idRelevamientoActivo);
        }

    } catch (error) {
        console.error("Error al guardar familia:", error);
        mostrarNotificacion(error.message, "error");
    }
}

export async function editarDatosFamilia(idFamilia) {
    cargarVistaDinamica('./frontend/pages/form-familia.html', async () => {
        window.dtArchivosFamiliaGlobal = new DataTransfer();
        renderizarListaArchivosPendientes();

        const titulo = document.getElementById('titulo-form-familia');
        if (titulo) titulo.innerHTML = `<i class="bi bi-pencil-square text-warning me-2"></i> Editar Datos de la Familia`;

        const inputIdEdicion = document.getElementById('f_id_edicion');
        if (inputIdEdicion) inputIdEdicion.value = idFamilia;

        inicializarCalculoIntegrantes();

        try {
            const respuesta = await fetch(`/api/familias/${idFamilia}`);
            if (!respuesta.ok) throw new Error("No se pudo obtener la información de la familia.");
            
            const fam = await respuesta.json();
            
            if (fam.relevamiento_id || fam.id_relevamiento) {
                window.idRelevamientoActivo = fam.relevamiento_id || fam.id_relevamiento;
            }
            
            if (document.getElementById('f_dni')) document.getElementById('f_dni').value = fam.dni_jefe || fam.dni || '';
            if (fam.jefe_familia) {
                const partes = fam.jefe_familia.split(',');
                if (document.getElementById('f_apellido')) document.getElementById('f_apellido').value = partes[0]?.trim() || '';
                if (document.getElementById('f_nombre')) document.getElementById('f_nombre').value = partes[1]?.trim() || '';
            }
            if (document.getElementById('f_telefono')) document.getElementById('f_telefono').value = fam.telefono || '';
            if (document.getElementById('f_direccion')) document.getElementById('f_direccion').value = fam.direccion || '';
            
            if (document.getElementById('f_mayores')) document.getElementById('f_mayores').value = fam.mayores ?? 1;
            if (document.getElementById('f_menores')) document.getElementById('f_menores').value = fam.menores ?? 0;
            if (document.getElementById('f_total')) document.getElementById('f_total').value = fam.cantidad_integrantes || fam.total_personas || 1;
            
            const selectPrioridad = document.getElementById('f_urgencia_familiar');
            if (selectPrioridad) selectPrioridad.value = fam.urgencia_familiar || fam.prioridad || '';

            if (document.getElementById('f_dano_techo')) document.getElementById('f_dano_techo').checked = Boolean(fam.dano_techo);
            if (document.getElementById('f_dano_paredes')) document.getElementById('f_dano_paredes').checked = Boolean(fam.dano_paredes);
            if (document.getElementById('f_dano_pisos')) document.getElementById('f_dano_pisos').checked = Boolean(fam.dano_pisos);
            if (document.getElementById('f_dano_instalaciones')) document.getElementById('f_dano_instalaciones').checked = Boolean(fam.dano_instalaciones || fam.instalaciones_afectadas);
            if (document.getElementById('f_dano_perdida_completa')) document.getElementById('f_dano_perdida_completa').checked = Boolean(fam.danos_estructurales || fam.requiere_evacuacion);

            if (document.getElementById('f_need_alimentos')) document.getElementById('f_need_alimentos').value = fam.unidades_alimentarias || fam.alimentos || 0;
            if (document.getElementById('f_need_abrigos')) document.getElementById('f_need_abrigos').value = fam.abrigos || 0;
            if (document.getElementById('f_need_frazadas')) document.getElementById('f_need_frazadas').value = fam.frazadas || 0;
            if (document.getElementById('f_need_agua')) document.getElementById('f_need_agua').value = fam.bidones_agua || fam.agua || 0;
            if (document.getElementById('f_need_higiene')) document.getElementById('f_need_higiene').value = fam.kits_higiene || 0;
            if (document.getElementById('f_need_ropa')) document.getElementById('f_need_ropa').value = fam.ropa || 0;
            if (document.getElementById('f_need_colchones')) document.getElementById('f_need_colchones').value = fam.colchones || 0;

            let rawNecesidades = [];
            if (fam.necesidades && Array.isArray(fam.necesidades)) {
                rawNecesidades = fam.necesidades;
            } else if (fam.data && fam.data.necesidades && Array.isArray(fam.data.necesidades)) {
                rawNecesidades = fam.data.necesidades;
            }

            listaTemporalMateriales = rawNecesidades.map(m => ({
                tipo_material: m.tipo_material || m.nombre,
                nombre: m.tipo_material || m.nombre,
                cantidad: m.cantidad || 1
            }));

            renderizarListaVisual('mat', listaTemporalMateriales);

            if (document.getElementById('f_observaciones')) document.getElementById('f_observaciones').value = fam.observaciones || '';

            if (fam.documentacion && Array.isArray(fam.documentacion)) {
                renderizarDocumentosGuardados(fam.documentacion);
            } else {
                renderizarDocumentosGuardados([]);
            }

        } catch (error) {
            console.error("Error al cargar datos para editar:", error);
            mostrarNotificacion("Error al recuperar los datos de la ficha.", "error");
        }

        const form = document.getElementById('form-nueva-familia');
        if (form) {
            form.removeEventListener('submit', guardarDatosFamiliaDefinitivo);
            form.addEventListener('submit', guardarDatosFamiliaDefinitivo);
        }
    });
}

export function cambiarPasoWizard(paso) {
    if (paso === 2) {
        const apellido = document.getElementById('f_apellido').value.trim();
        const nombre = document.getElementById('f_nombre').value.trim();
        const dni = document.getElementById('f_dni').value.trim();
        const direccion = document.getElementById('f_direccion').value.trim();

        if (!apellido || !nombre || !dni || !direccion) {
            mostrarNotificacion("Por favor, complete los campos obligatorios del Grupo Familiar.", "error");
            return;
        }
    }

    document.querySelectorAll('.wizard-step').forEach(el => el.classList.add('d-none'));
    
    const pasoActivo = document.getElementById(`step-${paso}`);
    if (pasoActivo) pasoActivo.classList.remove('d-none');

    const barra = document.getElementById('wizard-progress-bar');
    if (barra) {
        const porcentajes = { 1: '33%', 2: '66%', 3: '100%' };
        barra.style.width = porcentajes[paso];
        barra.setAttribute('aria-valuenow', parseInt(porcentajes[paso]));
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function mostrarFormularioNuevaFamilia() {
    window.dtArchivosFamiliaGlobal = new DataTransfer();
    listaTemporalMateriales = [];
    
    cargarVistaDinamica('./frontend/pages/form-familia.html', () => {
        const titulo = document.getElementById('titulo-form-familia');
        if (titulo) {
            titulo.innerHTML = `<i class="bi bi-plus-circle text-primary me-2"></i> Registrar Nueva Familia`;
        }
        
        const inputIdEdicion = document.getElementById('f_id_edicion');
        if (inputIdEdicion) inputIdEdicion.value = '';

        inicializarCalculoIntegrantes();
        renderizarListaVisual('mat', listaTemporalMateriales);
        renderizarListaArchivosPendientes();

        const form = document.getElementById('form-nueva-familia');
        if (form) {
            form.reset();
            form.classList.remove('was-validated');
            form.removeEventListener('submit', guardarDatosFamiliaDefinitivo);
            form.addEventListener('submit', guardarDatosFamiliaDefinitivo);
        }
    });
}

window.cambiarPasoWizard = cambiarPasoWizard;
window.agregarArchivoALista = agregarArchivoALista;
window.eliminarArchivoDeLista = eliminarArchivoDeLista;
window.agregarItemLista = agregarItemLista;
window.eliminarItemLista = eliminarItemLista;
window.mostrarFormularioNuevaFamilia = mostrarFormularioNuevaFamilia;