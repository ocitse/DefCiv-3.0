import { Storage } from './storage.js';
import { mostrarNotificacion } from './ui.js';

export function mostrarListaUsuarios() {
    const data = Storage.getData();
    const tbody = document.getElementById('tabla-usuarios');
    if (!tbody) return;

    if (!data.usuarios || data.usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-3">No hay usuarios en el sistema</td></tr>';
        return;
    }

    tbody.innerHTML = data.usuarios.map(u => `
        <tr class="align-middle">
            <td><strong>${u.username || u.usuario}</strong></td>
            <td>${u.nombre_completo || (u.nombre + ' ' + u.apellido)}</td>
            <td>${u.email}</td>
            <td><span class="badge bg-secondary">${u.rol}</span></td>
            <td><span class="badge bg-success">${u.estado}</span></td>
            <td class="text-center">
                <button class="btn btn-sm btn-danger btn-eliminar-usuario" data-id="${u.id}"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

export function eliminarUsuario(id) {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return;
    const data = Storage.getData();
    data.usuarios = data.usuarios.filter(u => u.id !== id);
    Storage.setData(data);
    mostrarNotificacion('Usuario eliminado correctamente.');
    mostrarListaUsuarios();
}