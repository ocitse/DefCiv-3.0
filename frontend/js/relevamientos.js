// frontend/js/relevamientos.js

// 1. Importamos todas las funciones desde los tres módulos separados
import { editarRelevamientoGeneral, verPanelPrincipal } from './relevamientos-general.js';
import { eliminarFamiliar, verFichaNecesidades } from './relevamientos-familias.js';
import { agregarItemLista, eliminarItemLista, guardarDatosFamiliaDefinitivo, editarDatosFamilia } from './relevamientos-form.js';

// 2. Las exponemos al objeto global window para que los eventos inline (onclick) y vistas HTML sigan funcionando sin cambios
if (typeof window !== 'undefined') {
    window.editarRelevamientoGeneral = editarRelevamientoGeneral;
    window.verPanelPrincipal = verPanelPrincipal;
    
    window.eliminarFamiliar = eliminarFamiliar;
    window.verFichaNecesidades = verFichaNecesidades;
    
    window.agregarItemLista = agregarItemLista;
    window.eliminarItemLista = eliminarItemLista;
    window.guardarDatosFamiliaDefinitivo = guardarDatosFamiliaDefinitivo;
    window.editarDatosFamilia = editarDatosFamilia;

    // Redirecciones y alias útiles que ya usabas
    window.regresarAListaFamilias = () => { if (window.idRelevamientoActivo && typeof ingresarARelevamiento === 'function') ingresarARelevamiento(window.idRelevamientoActivo); };
}