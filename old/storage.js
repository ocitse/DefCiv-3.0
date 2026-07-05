// backend/storage.js
export const Storage = {
    init() {
        if (!localStorage.getItem('dc_data')) {
            localStorage.setItem('dc_data', JSON.stringify({
                relevamientos: [],
                solicitudes: [],
                ordenes: [],
                entregas: [],
                // 🌟 CORREGIDO: Se inicializa como Objeto con propiedades para evitar errores en inventario.js
                inventario: {
                    alimentos: { stock: 0 },
                    agua: { stock: 0 },
                    colchones: { stock: 0 },
                    kit_higiene: { stock: 0 },
                    ropa: { stock: 0 },
                    medicamentos: { stock: 0 },
                    frazadas: { stock: 0 }
                }, 
                usuarios: [
                    { id: 'USR-1', usuario: 'admin', nombre: 'Admin', apellido: 'Sistema', email: 'admin@dc.gov', rol: 'admin', estado: 'activo' }
                ]
            }));
        }
    },
    getData() {
        return JSON.parse(localStorage.getItem('dc_data')) || {};
    },
    setData(data) {
        localStorage.setItem('dc_data', JSON.stringify(data));
    }
};