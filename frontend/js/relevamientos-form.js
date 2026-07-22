import { mostrarNotificacion } from './ui.js';

let listaTemporalMedicamentos = [];
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

    if (tipo === 'med') {
        listaTemporalMedicamentos.push(nuevoItem);
        renderizarListaVisual('med', listaTemporalMedicamentos);
    } else {
        listaTemporalMateriales.push(nuevoItem);
        renderizarListaVisual('mat', listaTemporalMateriales);
    }

    inputItem.value = "";
    inputCant.value = "";
    inputItem.focus();
}

export function eliminarItemLista(tipo, index) {
    if (tipo === 'med') {
        listaTemporalMedicamentos.splice(index, 1);
        renderizarListaVisual('med', listaTemporalMedicamentos);
    } else {
        listaTemporalMateriales.splice(index, 1);
        renderizarListaVisual('mat', listaTemporalMateriales);
    }
}

export function guardarDatosFamiliaDefinitivo(e) {
    if (e) e.preventDefault();

    const form = e.target;
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        mostrarNotificacion("Por favor, complete los datos obligatorios de la familia.", "error");
        return;
    }

    try {
        const data = Storage.getData();
        const relIdx = data.relevamientos.findIndex(r => r.id_relevamiento === idRelevamientoActivo);
        
        if (relIdx === -1) throw new Error("Relevamiento de destino no encontrado.");

        const idFamiliaEdicion = document.getElementById('f_id_edicion')?.value;

        const nuevaFamilia = {
            id_familia: idFamiliaEdicion ? idFamiliaEdicion : `FAM-${Math.floor(10000 + Math.random() * 90000)}`,
            apellido: document.getElementById('f_apellido').value.trim(),
            nombre: document.getElementById('f_nombre').value.trim(),
            dni: document.getElementById('f_dni').value.trim(),
            telefono: document.getElementById('f_telefono').value.trim(),
            direccion: document.getElementById('f_direccion').value.trim(),
            urgencia_familiar: document.getElementById('f_urgencia_familiar').value,
            estado_asistencia: 'Pendiente',
            mayores: parseInt(document.getElementById('f_mayores').value) || 0,
            menores: parseInt(document.getElementById('f_menores').value) || 0,
            total_personas: parseInt(document.getElementById('f_total').value) || 0,
            
            danos_estructurales: {
                techo: !!document.getElementById('f_dano_techo')?.checked,
                paredes: !!document.getElementById('f_dano_paredes')?.checked,
                pisos: !!document.getElementById('f_dano_pisos')?.checked,
                instalaciones: !!document.getElementById('f_dano_instalaciones')?.checked,
                perdida_completa: !!document.getElementById('f_dano_perdida_completa')?.checked
            },
            necesidades_detectadas: {
                alimentos_cant: parseInt(document.getElementById('f_need_alimentos').value) || 0,
                abrigos_cant: parseInt(document.getElementById('f_need_abrigos').value) || 0,
                frazadas_cant: parseInt(document.getElementById('f_need_frazadas').value) || 0,
                bidones_agua_cant: parseInt(document.getElementById('f_need_agua').value) || 0,
                kit_higiene_cant: parseInt(document.getElementById('f_need_higiene').value) || 0,
                ropa_cant: parseInt(document.getElementById('f_need_ropa').value) || 0,
                colchones_cant: parseInt(document.getElementById('f_need_colchones').value) || 0,
                
                medicamentos_lista: listaTemporalMedicamentos || [],
                materiales_lista: listaTemporalMateriales || []
            },
            observaciones: document.getElementById('f_observaciones').value.trim()
        };

        if (!data.relevamientos[relIdx].familias) data.relevamientos[relIdx].familias = [];

        if (idFamiliaEdicion) {
            const fIdx = data.relevamientos[relIdx].familias.findIndex(f => f.id_familia === idFamiliaEdicion);
            if (fIdx !== -1) data.relevamientos[relIdx].familias[fIdx] = nuevaFamilia;
            mostrarNotificacion("Datos familiares actualizados.");
        } else {
            data.relevamientos[relIdx].familias.push(nuevaFamilia);
            mostrarNotificacion("Familia agregada exitosamente al registro.");
        }

        Storage.setData(data);
        
        if (typeof verListaFamilias === 'function') {
            verListaFamilias(idRelevamientoActivo);
        } else if (typeof ingresarARelevamiento === 'function') {
            ingresarARelevamiento(idRelevamientoActivo);
            window.idRelevamientoActivo = idRelevamientoActivo;
        }

    } catch (error) {
        console.error("Error al guardar familia:", error);
    }
}

export function editarDatosFamilia(idFamilia) {
    cargarVistaDinamica('/frontend/pages/form-familia.html', () => {
        const data = Storage.getData();
        const rel = data.relevamientos.find(r => r.id_relevamiento === idRelevamientoActivo);
        const fam = rel?.familias?.find(f => f.id_familia === idFamilia);

        if (!fam) {
            mostrarNotificacion("No se encontraron los datos de la familia.", "error");
            if (idRelevamientoActivo) ingresarARelevamiento(idRelevamientoActivo);
            return;
        }

        const titulo = document.getElementById('titulo-form-familia');
        if (titulo) titulo.innerHTML = `<i class="bi bi-pencil-square text-warning me-2"></i> Editar Datos de la Familia`;

        document.getElementById('f_id_edicion').value = fam.id_family || fam.id_familia;

        document.getElementById('f_apellido').value = fam.apellido;
        document.getElementById('f_nombre').value = fam.nombre;
        document.getElementById('f_dni').value = fam.dni;
        document.getElementById('f_telefono').value = fam.telefono;
        document.getElementById('f_direccion').value = fam.direccion;
        document.getElementById('f_urgencia_familiar').value = fam.urgencia_familiar;

        document.getElementById('f_mayores').value = fam.mayores;
        document.getElementById('f_menores').value = fam.menores;
        document.getElementById('f_total').value = fam.total_personas;

        document.getElementById('f_dano_techo').checked = fam.danos_estructurales?.techo || false;
        document.getElementById('f_dano_paredes').checked = fam.danos_estructurales?.paredes || false;
        document.getElementById('f_dano_pisos').checked = fam.danos_estructurales?.pisos || false;
        document.getElementById('f_dano_instalaciones').checked = fam.danos_estructurales?.instalaciones || false;
        document.getElementById('f_dano_perdida_completa').checked = fam.danos_estructurales?.perdida_completa || false;

        document.getElementById('f_need_alimentos').value = fam.necesidades_detectadas.alimentos_cant;
        document.getElementById('f_need_abrigos').value = fam.necesidades_detectadas.abrigos_cant;
        document.getElementById('f_need_frazadas').value = fam.necesidades_detectadas.frazadas_cant;
        document.getElementById('f_need_agua').value = fam.necesidades_detectadas.bidones_agua_cant;
        document.getElementById('f_need_higiene').value = fam.necesidades_detectadas.kit_higiene_cant;
        document.getElementById('f_need_ropa').value = fam.necesidades_detectadas.ropa_cant;
        document.getElementById('f_need_colchones').value = fam.necesidades_detectadas.colchones_cant;

        document.getElementById('f_observaciones').value = fam.observaciones;

        const form = document.getElementById('form-nueva-familia');
        if (form) {
            form.addEventListener('submit', guardarDatosFamiliaDefinitivo);
        }
    });
}