// frontend/js/relevamientos-form.js
import { mostrarNotificacion } from './ui.js';
import { cargarVistaDinamica } from './utils.js';

// Inicialización global única para los archivos
if (typeof window.archivosTemporalesFamiliaGlobal === 'undefined') {
    window.archivosTemporalesFamiliaGlobal = [];
}

let archivosTemporalesFamilia = window.archivosTemporalesFamiliaGlobal; 
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
    // Buscamos el elemento directamente por su ID en el DOM actual
    const ul = document.getElementById('lista-archivos-pendientes');
    if (!ul) return;

    ul.replaceChildren();

    const archivos = window.archivosTemporalesFamiliaGlobal || [];

    if (archivos.length === 0) {
        const liVacio = document.createElement('li');
        liVacio.className = "list-group-item text-muted text-center py-2 bg-transparent border-0 small";
        liVacio.textContent = "Ningún archivo adjuntado";
        ul.appendChild(liVacio);
        return;
    }

    archivos.forEach((file, index) => {
        const li = document.createElement('li');
        li.className = "list-group-item p-1 d-flex justify-content-between align-items-center bg-dark border border-secondary rounded mb-1 text-light small";
        li.innerHTML = `
            <span class="text-truncate" style="max-width: 80%;">📎 ${file.name}</span>
            <button type="button" class="btn btn-sm btn-link text-danger p-0 me-1" onclick="eliminarArchivoDeLista(${index})">
                <i class="bi bi-trash-fill"></i>
            </button>
        `;
        ul.appendChild(li);
    });
}

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
    if (!window.archivosTemporalesFamiliaGlobal) {
        window.archivosTemporalesFamiliaGlobal = [];
    }

    const input = document.getElementById('inputArchivo');
    if (!input || input.files.length === 0) {
        mostrarNotificacion("Por favor, seleccione un archivo válido para adjuntar.", "error");
        return;
    }

    const archivo = input.files[0];
    const yaExiste = window.archivosTemporalesFamiliaGlobal.some(f => f.name === archivo.name);

    if (!yaExiste) {
        // Guardamos el archivo en la memoria global
        window.archivosTemporalesFamiliaGlobal.push(archivo);
        
        // ¡IMPORTANTE! Actualizamos la interfaz para que dibuje el archivo y borre el texto de "Ninguno"
        renderizarListaArchivosPendientes();
        
        mostrarNotificacion(`Archivo "${archivo.name}" listo para enviar.`, "success");
        input.value = ""; // Limpiamos el input visualmente
    } else {
        mostrarNotificacion("Ese archivo ya está en la lista.", "error");
    }
}

export function eliminarArchivoDeLista(index) {
    if (window.archivosTemporalesFamiliaGlobal) {
        window.archivosTemporalesFamiliaGlobal.splice(index, 1);
        renderizarListaArchivosPendientes();
    }
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
        const formData = new FormData();

        formData.append('id_relevamiento', window.idRelevamientoActivo);
        formData.append('jefe_familia', `${document.getElementById('f_apellido').value.trim()}, ${document.getElementById('f_nombre').value.trim()}`);
        formData.append('dni_jefe', document.getElementById('f_dni').value.trim());
        formData.append('telefono', document.getElementById('f_telefono').value.trim());
        formData.append('direccion', document.getElementById('f_direccion').value.trim());
        formData.append('mayores', parseInt(document.getElementById('f_mayores').value) || 1);
        formData.append('menores', parseInt(document.getElementById('f_menores').value) || 0);
        formData.append('cantidad_integrantes', parseInt(document.getElementById('f_total').value) || 1);
        formData.append('urgencia_familiar', document.getElementById('f_urgencia_familiar').value);
        
        // Daños
        formData.append('dano_techo', !!document.getElementById('f_dano_techo')?.checked);
        formData.append('dano_paredes', !!document.getElementById('f_dano_paredes')?.checked);
        formData.append('dano_pisos', !!document.getElementById('f_dano_pisos')?.checked);
        formData.append('dano_instalaciones', !!document.getElementById('f_dano_instalaciones')?.checked);
        formData.append('danos_estructurales', !!document.getElementById('f_dano_perdida_completa')?.checked);
        formData.append('requiere_evacuacion', !!document.getElementById('f_dano_perdida_completa')?.checked);

        // Necesidades
        formData.append('unidades_alimentarias', parseInt(document.getElementById('f_need_alimentos')?.value) || 0);
        formData.append('abrigos', parseInt(document.getElementById('f_need_abrigos')?.value) || 0);
        formData.append('frazadas', parseInt(document.getElementById('f_need_frazadas')?.value) || 0);
        formData.append('bidones_agua', parseInt(document.getElementById('f_need_agua')?.value) || 0);
        formData.append('kits_higiene', parseInt(document.getElementById('f_need_higiene')?.value) || 0);
        formData.append('ropa', parseInt(document.getElementById('f_need_ropa')?.value) || 0);
        formData.append('colchones', parseInt(document.getElementById('f_need_colchones')?.value) || 0);

        formData.append('necesidades', JSON.stringify(listaTemporalMateriales));
        formData.append('observaciones', document.getElementById('f_observaciones').value.trim());

        // Adjuntar archivos desde la lista temporal global
        if (window.archivosTemporalesFamiliaGlobal && window.archivosTemporalesFamiliaGlobal.length > 0) {
            window.archivosTemporalesFamiliaGlobal.forEach(archivo => {
                formData.append('documentos', archivo);
            });
        }

        // NUEVO: Salvavidas por si el usuario seleccionó un archivo pero olvidó presionar "+ Agregar"
        const inputArchivo = document.getElementById('inputArchivo');
        if (inputArchivo && inputArchivo.files.length > 0) {
            // Verificamos que no lo hayamos agregado ya desde la lista global
            const yaAgregado = window.archivosTemporalesFamiliaGlobal.some(f => f.name === inputArchivo.files[0].name);
            if (!yaAgregado) {
                formData.append('documentos', inputArchivo.files[0]);
            }
        }

        const url = idFamiliaEdicion ? `/api/familias/${idFamiliaEdicion}` : '/api/familias';
        const metodo = idFamiliaEdicion ? 'PUT' : 'POST';

        // Recuperamos el token de seguridad
        const token = localStorage.getItem('token');

        // --- CÁMARA DE SEGURIDAD ---
        console.log("📦 VERIFICANDO QUÉ HAY EN EL PAQUETE ANTES DE ENVIAR:");
        for (let [key, value] of formData.entries()) {
            console.log(key + ':', value instanceof File ? `📄 ARCHIVO ENCONTRADO: ${value.name}` : value);
        }
        console.log("Lista global temporal tiene:", window.archivosTemporalesFamiliaGlobal.length, "archivos");
        // -----------------------------

        // Enviamos el FormData CON el token de autorización
        const respuesta = await fetch(url, {
            method: metodo,
            headers: {
                'Authorization': `Bearer ${token}` // ¡Faltaba esto!
            },
            body: formData
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || 'Error al guardar la familia en el servidor.');
        }

        mostrarNotificacion(resultado.mensaje || "Familia guardada exitosamente en la base de datos.");

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
        window.archivosTemporalesFamiliaGlobal = [];
        archivosTemporalesFamilia = window.archivosTemporalesFamiliaGlobal;
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

            // --- INICIO CÓDIGO NUEVO: Dibujar los archivos guardados en Cloudinary ---
            if (fam.documentacion && Array.isArray(fam.documentacion)) {
                renderizarDocumentosGuardados(fam.documentacion);
            } else {
                renderizarDocumentosGuardados([]);
            }
            // --- FIN CÓDIGO NUEVO ---

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
    window.archivosTemporalesFamiliaGlobal = [];
    archivosTemporalesFamilia = window.archivosTemporalesFamiliaGlobal;
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

// Exponer funciones globales necesarias para eventos onclick en HTML
window.cambiarPasoWizard = cambiarPasoWizard;
window.agregarArchivoALista = agregarArchivoALista;
window.eliminarArchivoDeLista = eliminarArchivoDeLista;
window.agregarItemLista = agregarItemLista;
window.eliminarItemLista = eliminarItemLista;
window.mostrarFormularioNuevaFamilia = mostrarFormularioNuevaFamilia;