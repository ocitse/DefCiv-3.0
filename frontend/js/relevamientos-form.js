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

    inputMayores.addEventListener('input', calcular);
    inputMenores.addEventListener('input', calcular);
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
            cantidad_integrantes: parseInt(document.getElementById('f_total').value) || 1,
            danos_estructurales: !!document.getElementById('f_dano_perdida_completa')?.checked,
            requiere_evacuacion: !!document.getElementById('f_dano_perdida_completa')?.checked,
            observaciones: document.getElementById('f_observaciones').value.trim()
        };

        const url = idFamiliaEdicion ? `/api/familias/${idFamiliaEdicion}` : '/api/familias';
        const metodo = idFamiliaEdicion ? 'PUT' : 'POST';

        const respuesta = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json'
            },
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

        // Inicializar el autocalculo al cargar el formulario de edición
        inicializarCalculoIntegrantes();

        try {
            const respuesta = await fetch(`/api/familias/${idFamilia}`);
            if (respuesta.ok) {
                const fam = await respuesta.json();
                
                // Cargar datos básicos y de contacto
                if (document.getElementById('f_dni')) document.getElementById('f_dni').value = fam.dni_jefe || fam.dni || '';
                if (fam.jefe_familia) {
                    const partes = fam.jefe_familia.split(',');
                    if (document.getElementById('f_apellido')) document.getElementById('f_apellido').value = partes[0]?.trim() || '';
                    if (document.getElementById('f_nombre')) document.getElementById('f_nombre').value = partes[1]?.trim() || '';
                }
                if (document.getElementById('f_telefono')) document.getElementById('f_telefono').value = fam.telefono || '';
                if (document.getElementById('f_direccion')) document.getElementById('f_direccion').value = fam.direccion || '';
                
                // Integrantes
                if (document.getElementById('f_total')) document.getElementById('f_total').value = fam.cantidad_integrantes || fam.total_personas || 1;
                
                // Prioridad / Urgencia familiar
                const selectPrioridad = document.getElementById('urgencia_familiar') || document.getElementById('f_prioridad');
                if (selectPrioridad) selectPrioridad.value = fam.urgencia_familiar || fam.prioridad || 'Baja';

                // Daños y evacuación (según el checkbox que uses en tu form)
                const checkDanos = document.getElementById('f_dano_perdida_completa');
                if (checkDanos) {
                    checkDanos.checked = Boolean(fam.danos_estructurales || fam.requiere_evacuacion);
                }

                // Observaciones
                if (document.getElementById('f_observaciones')) document.getElementById('f_observaciones').value = fam.observaciones || '';
            }
        } catch (error) {
            console.error("Error al cargar datos para editar:", error);
        }

        const form = document.getElementById('form-nueva-familia');
        if (form) {
            form.removeEventListener('submit', guardarDatosFamiliaDefinitivo);
            form.addEventListener('submit', guardarDatosFamiliaDefinitivo);
        }
    });
}