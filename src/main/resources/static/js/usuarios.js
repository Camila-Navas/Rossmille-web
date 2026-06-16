var usuariosCache = [];
var editandoId = null;
var eliminarId = null;
var paginaActualUsuarios = 1;
var PAGE_SIZE_USUARIOS = 10;

var modalUsuario = null;
var modalEliminar = null;

function init() {
    modalUsuario  = new bootstrap.Modal(document.getElementById('modalUsuario'));
    modalEliminar = new bootstrap.Modal(document.getElementById('modalEliminar'));
    cargarUsuarios();
}

async function cargarUsuarios() {
    var tbody = document.getElementById('tablaBody');
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Cargando...</td></tr>';

    var res = await apiFetch('/usuarios');
    if (!res) return;

    var body = await res.json();
    if (!body.ok) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6" class="text-danger">' +
            esc(body.message || 'Error al cargar usuarios') + '</td></tr>';
        return;
    }

    paginaActualUsuarios = 1;
    usuariosCache = body.data || [];
    renderTabla();
}

function irAPaginaUsuarios(n) {
    paginaActualUsuarios = n;
    renderTabla();
}

function renderTabla() {
    var tbody = document.getElementById('tablaBody');
    if (usuariosCache.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6">Sin usuarios registrados</td></tr>';
        renderPaginacion('paginacionUsuarios', 0, 1, PAGE_SIZE_USUARIOS, 'irAPaginaUsuarios');
        return;
    }
    var inicio = (paginaActualUsuarios - 1) * PAGE_SIZE_USUARIOS;
    var pagina = usuariosCache.slice(inicio, inicio + PAGE_SIZE_USUARIOS);
    tbody.innerHTML = pagina.map(function (u) {
        var badgeClass = u.rol === 'Administrador' ? 'rol-admin' : 'rol-empleado';
        return '<tr>' +
            '<td><code style="font-size:0.82rem;">' + esc(u.id) + '</code></td>' +
            '<td><strong>' + esc(u.nombre) + '</strong></td>' +
            '<td><span class="badge-rol ' + badgeClass + '">' + esc(u.rol) + '</span></td>' +
            '<td>' + esc(u.correo || '') + '</td>' +
            '<td>' + esc(u.telefono || '') + '</td>' +
            '<td>' +
                '<button class="btn-accion btn-editar" onclick="abrirModalEditar(' +
                    JSON.stringify(u.id) + ')">Editar</button>' +
                '<button class="btn-accion btn-eliminar-row" onclick="confirmarEliminar(' +
                    JSON.stringify(u.id) + ', ' + JSON.stringify(u.nombre) + ')">Eliminar</button>' +
            '</td>' +
        '</tr>';
    }).join('');
    renderPaginacion('paginacionUsuarios', usuariosCache.length, paginaActualUsuarios, PAGE_SIZE_USUARIOS, 'irAPaginaUsuarios');
}

function abrirModalCrear() {
    editandoId = null;
    document.getElementById('modalTitulo').textContent = 'Nuevo Usuario';
    document.getElementById('campoId').value = '';
    document.getElementById('campoId').disabled = false;
    document.getElementById('campoNombre').value = '';
    document.getElementById('campoRol').value = 'Empleado';
    document.getElementById('campoCorreo').value = '';
    document.getElementById('campoTelefono').value = '';
    document.getElementById('campoContrasena').value = '';
    document.getElementById('labelContrasena').textContent = 'Contrasena';
    document.getElementById('hintContrasena').style.display = 'none';
    document.getElementById('modalError').style.display = 'none';
    modalUsuario.show();
}

function abrirModalEditar(id) {
    var usuario = usuariosCache.find(function (u) { return u.id === id; });
    if (!usuario) return;

    editandoId = id;
    document.getElementById('modalTitulo').textContent = 'Editar Usuario';
    document.getElementById('campoId').value = usuario.id;
    document.getElementById('campoId').disabled = true;
    document.getElementById('campoNombre').value = usuario.nombre || '';
    document.getElementById('campoRol').value = usuario.rol || 'Empleado';
    document.getElementById('campoCorreo').value = usuario.correo || '';
    document.getElementById('campoTelefono').value = usuario.telefono || '';
    document.getElementById('campoContrasena').value = '';
    document.getElementById('labelContrasena').textContent = 'Nueva contrasena (opcional)';
    document.getElementById('hintContrasena').style.display = 'block';
    document.getElementById('modalError').style.display = 'none';
    modalUsuario.show();
}

async function guardarUsuario() {
    var errorDiv = document.getElementById('modalError');
    errorDiv.style.display = 'none';

    var payload = {
        id:         document.getElementById('campoId').value.trim(),
        nombre:     document.getElementById('campoNombre').value.trim(),
        rol:        document.getElementById('campoRol').value,
        correo:     document.getElementById('campoCorreo').value.trim() || null,
        telefono:   document.getElementById('campoTelefono').value.trim() || null,
        contrasena: document.getElementById('campoContrasena').value || null
    };

    var btn = document.getElementById('btnGuardar');
    btn.disabled = true;

    var esEdicion = editandoId !== null;
    var res = await apiFetch(
        esEdicion ? '/usuarios/' + editandoId : '/usuarios',
        { method: esEdicion ? 'PUT' : 'POST', body: JSON.stringify(payload) }
    );

    btn.disabled = false;
    if (!res) return;

    var body = await res.json();
    if (!body.ok) {
        errorDiv.textContent = body.message || 'Error al guardar';
        errorDiv.style.display = 'block';
        return;
    }

    modalUsuario.hide();
    cargarUsuarios();
}

function confirmarEliminar(id, nombre) {
    eliminarId = id;
    document.getElementById('textoEliminar').textContent =
        'Eliminar al usuario "' + nombre + '" (ID: ' + id + '). Esta accion no se puede deshacer.';
    document.getElementById('inputContrasenaEliminar').value = '';
    document.getElementById('errorEliminar').style.display = 'none';
    modalEliminar.show();
}

async function ejecutarEliminar() {
    var contrasena = document.getElementById('inputContrasenaEliminar').value;
    var errorDiv = document.getElementById('errorEliminar');
    if (!contrasena) {
        errorDiv.textContent = 'Ingresa tu contrasena';
        errorDiv.style.display = 'block';
        return;
    }

    var btn = document.getElementById('btnConfirmarEliminar');
    btn.disabled = true;

    var res = await apiFetch('/usuarios/' + eliminarId, {
        method: 'DELETE',
        body: JSON.stringify({ contrasena: contrasena })
    });

    btn.disabled = false;
    if (!res) return;

    var body = await res.json();
    if (!body.ok) {
        errorDiv.textContent = body.message || 'Error al eliminar';
        errorDiv.style.display = 'block';
        return;
    }

    modalEliminar.hide();
    cargarUsuarios();
}

function esc(val) {
    if (val == null) return '';
    return String(val)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
