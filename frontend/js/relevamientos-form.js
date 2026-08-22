// frontend/js/relevamientos-form.js
import { mostrarNotificacion } from './ui.js';
import { cargarVistaDinamica } from './utils.js';

let listaTemporalMateriales = [];
let archivosTemporalesFamilia = []; // 🌟 Array para almacenar los archivos pendientes de adjuntar

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

// 🌟 Renderizar la lista visual de archivos pendientes en el HTML provisto
function renderizarListaArchivosPendientes() {
    const ul = document.getElementById('lista-archivos-pendientes');
    if (!ul) return;

    if (archivosTemporalesFamilia.length === 0) {
        ul.innerHTML = `<li class="list-group-item text-muted text-center py-2 bg-light opacity-75 small border-0">Ningún archivo adjuntado</li>`;
        return;
    }

    ul.innerHTML = archivosTemporalesFamilia.map((file, index) => `
        <li class="list-group-item d-flex justify-content-between align-items-center p-1 ps-2 bg-light border-secondary-subtle mb-1 rounded">
            <span class="text-truncate" style="max-width: 80%;">📎 ${file.name}</span>
            <button type="button" class="btn btn-sm btn-link text-danger p-0 me-1" onclick="eliminarArchivoDeLista(${index})">
                <i class="bi bi-trash-fill"></i>
            </button>
        </li>
    `).join('');
}

export function agregarArchivoALista() {
    const input = document.getElementById('inputArchivo');
    if (!input || input.files.length === 0) {
        mostrarNotificacion("Por favor, seleccione un archivo válido para adjuntar.", "error");
        return;
    }

    // Añadimos el archivo al array temporal
    const archivo = input.files[0];

    // 🌟 Guardamos el archivo de forma segura en un espacio global de la ventana del navegador
    if (!window.archivosSegurosParaGuardar) {
        window.archivosSegurosParaGuardar = [];
    }
    window.archivosSegurosParaGuardar.push(archivo);
    archivosTemporalesFamilia.push(archivo);

    // 🟢 ESTA LÍNEA AQUÍ:
    console.log("🟢 1. Archivo añadido. Elementos en caja fuerte ahora:", window.archivosSegurosParaGuardar);

    renderizarListaArchivosPendientes();

    console.log("📁 Archivo agregado al array temporal:", archivo.name);
    console.log("📁 Total archivos en array temporal:", archivosTemporalesFamilia.length);

    input.value = "";
    //input.value = ""; // Limpiar el input para permitir elegir otro
}

export function eliminarArchivoDeLista(index) {
    archivosTemporalesFamilia.splice(index, 1);
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

// 1. Autocálculo de integrantes (mayores + menores = total)
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

        // 🌟 Usamos FormData para soportar campos de texto y múltiples archivos adjuntos simultáneamente
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

        // Necesidades/Materiales (enviado como string JSON para que el backend los procese)
        formData.append('necesidades', JSON.stringify(listaTemporalMateriales));
        formData.append('observaciones', document.getElementById('f_observaciones').value.trim());

        console.log("🚨 CONTENIDO EXACTO DE ARCHIVOS EN CAJA FUERTE:", window.archivosSegurosParaGuardar);

    // 🌟 Leer directamente desde la caja fuerte global del navegador
    const archivosAEnviar = window.archivosSegurosParaGuardar || archivosTemporalesFamilia;
    
    if (archivosAEnviar && archivosAEnviar.length > 0) {
        archivosAEnviar.forEach(archivo => {
            formData.append('documentos', archivo);
        });
        console.log("🚀 ARCHIVOS ADJUNTADOS EXITOSAMENTE AL FORMDATA:", archivosAEnviar.length);
    } else {
        console.log("⚠️ No hay archivos para adjuntar en este envío.");
    }

    // 2. BLINDAJE TOTAL: Si hay un archivo seleccionado en el input en este mismo instante, lo agregamos sí o sí
    const inputArchivoDirecto = document.getElementById('inputArchivo');
    if (inputArchivoDirecto && inputArchivoDirecto.files && inputArchivoDirecto.files.length > 0) {
        for (let i = 0; i < inputArchivoDirecto.files.length; i++) {
            const archivoInput = inputArchivoDirecto.files[i];
            // Verificamos que no esté duplicado con los de la lista temporal
            const yaExiste = archivosTemporalesFamilia.some(f => f.name === archivoInput.name);
            if (!yaExiste) {
                formData.append('documentos', archivoInput);
            }
        }
    }

        const url = idFamiliaEdicion ? `/api/familias/${idFamiliaEdicion}` : '/api/familias';
        const metodo = idFamiliaEdicion ? 'PUT' : 'POST';

        for (let pair of formData.entries()) {
            console.log('CAMPO FORMING ->', pair[0], pair[1]);
        }

        const inputPrueba = document.getElementById('inputArchivo');
console.log("🔍 ¿Cual es el valor del input en el DOM?", inputPrueba);
console.log("🔍 ¿Cuántos archivos tiene el input?", inputPrueba ? inputPrueba.files.length : "No existe");
if (inputPrueba && inputPrueba.files.length > 0) {
    console.log("🔍 Nombre del archivo en el input:", inputPrueba.files[0].name);
}

// --- INSPECCIÓN DE ÚLTIMO MOMENTO ---
console.log("🔍 ¿Qué contiene FormData realmente?");
for (let pair of formData.entries()) {
    console.log("👉 CAMPO:", pair[0], "VALOR:", pair[1]);
}
// -------------------------------------

        const respuesta = await fetch(url, {
            method: metodo,
            body: formData // ⚠️ No especificar 'Content-Type', el navegador asigna automáticamente multipart/form-data
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
        // 🌟 PUNTO 3: Limpiar la caja fuerte al empezar a editar
        window.archivosSegurosParaGuardar = [];
        archivosTemporalesFamilia = []; 
        renderizarListaArchivosPendientes();
        const titulo = document.getElementById('titulo-form-familia');
        if (titulo) titulo.innerHTML = `<i class="bi bi-pencil-square text-warning me-2"></i> Editar Datos de la Familia`;

        const inputIdEdicion = document.getElementById('f_id_edicion');
        if (inputIdEdicion) inputIdEdicion.value = idFamilia;

        inicializarCalculoIntegrantes();
        archivosTemporalesFamilia = []; 
        renderizarListaArchivosPendientes();

        try {
            const respuesta = await fetch(`/api/familias/${idFamilia}`);
            if (!respuesta.ok) throw new Error("No se pudo obtener la información de la familia.");
            
            const fam = await respuesta.json();
            console.log("📦 DATOS COMPLETOS RECIBIDOS DE LA FAMILIA:", fam);
            
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

            // 🌟 Procesar materiales de forma segura desde la relación Sequelize
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

            const contenedorDocs = document.getElementById('lista-archivos-guardados') || document.getElementById('lista-archivos-pendientes');
            if (contenedorDocs && fam.documentacion && fam.documentacion.length > 0) {
                fam.documentacion.forEach(doc => {
                    contenedorDocs.innerHTML += `
                        <div class="d-flex align-items-center justify-content-between p-2 mb-1 bg-light border rounded small">
                            <a href="${doc.ruta_archivo}" target="_blank" class="text-decoration-none text-primary text-truncate">
                                <i class="bi bi-file-earmark-text me-1"></i> ${doc.nombre_archivo}
                            </a>
                            <span class="badge bg-success">Guardado</span>
                        </div>
                    `;
                });
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
    // 🌟 PUNTO 3: Limpiar la caja fuerte al registrar nueva familia
    window.archivosSegurosParaGuardar = [];
    listaTemporalMateriales = []; // Reiniciamos la lista temporal al crear una nueva
    archivosTemporalesFamilia = []; // Reiniciamos los archivos temporales
    
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
window.mostrarFormularioNuevaFamilia = mostrarFormularioNuevaFamilia;
window.agregarItemLista = agregarItemLista;
window.eliminarItemLista = eliminarItemLista;
window.agregarArchivoALista = agregarArchivoALista;
window.eliminarArchivoDeLista = eliminarArchivoDeLista;
