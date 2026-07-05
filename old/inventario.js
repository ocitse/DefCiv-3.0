import { Storage } from './storage.js';

export function cargarInventario() {
    const data = Storage.getData();
    const inv = data.inventario || {};

    // Mapeo dinámico de IDs de tu HTML antiguo
    const mapeoDOM = {
        alimentos: 'stock-alimentos',
        agua: 'stock-agua',
        colchones: 'stock-colchones',
        kit_higiene: 'stock-kits',
        ropa: 'stock-ropa',
        medicamentos: 'stock-meds',
        frazadas: 'stock-frazadas'
    };

    Object.keys(mapeoDOM).forEach(key => {
        const elemento = document.getElementById(mapeoDOM[key]);
        if (elemento) {
            elemento.textContent = inv[key] ? `${inv[key].stock}` : '0';
        }
    });
}