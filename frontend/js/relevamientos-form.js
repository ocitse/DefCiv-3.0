// frontend/js/relevamientos-form.js
import { mostrarNotificacion } from './ui.js';
import { cargarVistaDinamica } from './utils.js';

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

    const nuevoItem = { nombre, cantidad };

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

    // Usar oninput directo previene duplicación de listeners si se llama varias veces
    inputMayores.oninput = calcular;
    inputMenores.oninput = calcular;
    
    // Calcular por defecto al iniciar
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

        const datosFamilia = {
            id_relevamiento: window.idRelevamientoActivo,
            jefe_familia: `${document.getElementById('f_apellido').value.trim()}, ${document.getElementById('f_nombre').value.trim()}`,
            dni_jefe: document.getElementById('f_dni').value.trim(),
            telefono: document.getElementById('f_telefono').value.trim(),
            direccion: document.getElementById('f_direccion').value.trim(),
            mayores: parseInt(document.getElementById('f_mayores').value) || 1,
            menores: parseInt(document.getElementById('f_menores').value) || 0,
            cantidad_integrantes: parseInt(document.getElementById('f_total').value) || 1,
            urgencia_familiar: document.getElementById('f_urgencia_familiar').value,
            
            // Daños
            dano_techo: !!document.getElementById('f_dano_techo')?.checked,
            dano_paredes: !!document.getElementById('f_dano_paredes')?.checked,
            dano_pisos: !!document.getElementById('f_dano_pisos')?.checked,
            dano_instalaciones: !!document.getElementById('f_dano_instalaciones')?.checked,
            danos_estructurales: !!document.getElementById('f_dano_perdida_completa')?.checked,
            requiere_evacuacion: !!document.getElementById('f_dano_perdida_completa')?.checked,

            // Necesidades
            unidades_alimentarias: parseInt(document.getElementById('f_need_alimentos')?.value) || 0,
            abrigos: parseInt(document.getElementById('f_need_abrigos')?.value) || 0,
            frazadas: parseInt(document.getElementById('f_need_frazadas')?.value) || 0,
            bidones_agua: parseInt(document.getElementById('f_need_agua')?.value) || 0,
            kits_higiene: parseInt(document.getElementById('f_need_higiene')?.value) || 0,
            ropa: parseInt(document.getElementById('f_need_ropa')?.value) || 0,
            colchones: parseInt(document.getElementById('f_need_colchones')?.value) || 0,

            // Materiales y Observaciones
            materiales: listaTemporalMateriales,
            observaciones: document.getElementById('f_observaciones').value.trim()
        };

        const url = idFamiliaEdicion ? `/api/familias/${idFamiliaEdicion}` : '/api/familias';
        const metodo = idFamiliaEdicion ? 'PUT' : 'POST';

        const respuesta = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosFamilia)
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
        const titulo = document.getElementById('titulo-form-familia');
        if (titulo) titulo.innerHTML = `<i class="bi bi-pencil-square text-warning me-2"></i> Editar Datos de la Familia`;

        const inputIdEdicion = document.getElementById('f_id_edicion');
        if (inputIdEdicion) inputIdEdicion.value = idFamilia;

        inicializarCalculoIntegrantes();

        try {
            const respuesta = await fetch(`/api/familias/${idFamilia}`);
            if (!respuesta.ok) throw new Error("No se pudo obtener la información de la familia.");
            
            const fam = await respuesta.json();
            
            // 1. Datos personales y de contacto
            if (document.getElementById('f_dni')) document.getElementById('f_dni').value = fam.dni_jefe || fam.dni || '';
            if (fam.jefe_familia) {
                const partes = fam.jefe_familia.split(',');
                if (document.getElementById('f_apellido')) document.getElementById('f_apellido').value = partes[0]?.trim() || '';
                if (document.getElementById('f_nombre')) document.getElementById('f_nombre').value = partes[1]?.trim() || '';
            }
            if (document.getElementById('f_telefono')) document.getElementById('f_telefono').value = fam.telefono || '';
            if (document.getElementById('f_direccion')) document.getElementById('f_direccion').value = fam.direccion || '';
            
            // 2. Composición familiar
            if (document.getElementById('f_mayores')) document.getElementById('f_mayores').value = fam.mayores ?? 1;
            if (document.getElementById('f_menores')) document.getElementById('f_menores').value = fam.menores ?? 0;
            if (document.getElementById('f_total')) document.getElementById('f_total').value = fam.cantidad_integrantes || fam.total_personas || 1;
            
            // 3. Prioridad de Atención
            const selectPrioridad = document.getElementById('f_urgencia_familiar');
            if (selectPrioridad) selectPrioridad.value = fam.urgencia_familiar || fam.prioridad || '';

            // 4. Evaluación de Daños en Vivienda (Switches)
            if (document.getElementById('f_dano_techo')) document.getElementById('f_dano_techo').checked = Boolean(fam.dano_techo);
            if (document.getElementById('f_dano_paredes')) document.getElementById('f_dano_paredes').checked = Boolean(fam.dano_paredes);
            if (document.getElementById('f_dano_pisos')) document.getElementById('f_dano_pisos').checked = Boolean(fam.dano_pisos);
            if (document.getElementById('f_dano_instalaciones')) document.getElementById('f_dano_instalaciones').checked = Boolean(fam.dano_instalaciones || fam.instalaciones_afectadas);
            if (document.getElementById('f_dano_perdida_completa')) document.getElementById('f_dano_perdida_completa').checked = Boolean(fam.danos_estructurales || fam.requiere_evacuacion);

            // 5. Necesidades Detectadas (Inputs numéricos)
            if (document.getElementById('f_need_alimentos')) document.getElementById('f_need_alimentos').value = fam.unidades_alimentarias || fam.alimentos || 0;
            if (document.getElementById('f_need_abrigos')) document.getElementById('f_need_abrigos').value = fam.abrigos || 0;
            if (document.getElementById('f_need_frazadas')) document.getElementById('f_need_frazadas').value = fam.frazadas || 0;
            if (document.getElementById('f_need_agua')) document.getElementById('f_need_agua').value = fam.bidones_agua || fam.agua || 0;
            if (document.getElementById('f_need_higiene')) document.getElementById('f_need_higiene').value = fam.kits_higiene || 0;
            if (document.getElementById('f_need_ropa')) document.getElementById('f_need_ropa').value = fam.ropa || 0;
            if (document.getElementById('f_need_colchones')) document.getElementById('f_need_colchones').value = fam.colchones || 0;

            // 6. Materiales de Construcción (Mapeando la relación nueva `necesidades`)
            const materialesBrutos = fam.necesidades || fam.provisiones || fam.materiales || [];
            listaTemporalMateriales = materialesBrutos.map(m => ({
                nombre: m.tipo_material || m.nombre,
                cantidad: m.cantidad || 1
            }));
            renderizarListaVisual('mat', listaTemporalMateriales);

            // 7. Observaciones
            if (document.getElementById('f_observaciones')) document.getElementById('f_observaciones').value = fam.observaciones || '';

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
    // Validar campos obligatorios del paso 1 antes de pasar al paso 2
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

    // Ocultar todos los pasos
    document.querySelectorAll('.wizard-step').forEach(el => el.classList.add('d-none'));
    
    // Mostrar el paso seleccionado
    const pasoActivo = document.getElementById(`step-${paso}`);
    if (pasoActivo) pasoActivo.classList.remove('d-none');

    // Actualizar la barra de progreso
    const barra = document.getElementById('wizard-progress-bar');
    if (barra) {
        const porcentajes = { 1: '33%', 2: '66%', 3: '100%' };
        barra.style.width = porcentajes[paso];
        barra.setAttribute('aria-valuenow', parseInt(porcentajes[paso]));
    }

    // Subir el scroll suavemente al inicio del formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
}