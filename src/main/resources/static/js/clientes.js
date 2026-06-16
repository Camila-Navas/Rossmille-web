var clientesCache = [];
var clienteEditandoId = null;
var eliminarClienteId = null;
var esAdmin = false;
var busquedaTimer = null;
var paginaActualClientes = 1;
var PAGE_SIZE_CLIENTES = 10;

var AVATAR_COLORS = ['#1a1a2e','#2196F3','#4CAF50','#C62828','#6A1B9A','#00796B','#E65100','#0277BD'];

function iniciales(nombre) {
    if (!nombre) return '?';
    var p = nombre.trim().split(/\s+/);
    if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
    return nombre.substring(0, 2).toUpperCase();
}

function avatarColor(nombre) {
    if (!nombre) return AVATAR_COLORS[0];
    var h = 0;
    for (var i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) & 0xffff;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function formatNum(n) {
    var num = parseFloat(n);
    if (isNaN(num)) return '0';
    return num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

var modalCliente = null;
var modalHistorial = null;
var modalEliminar = null;

function init(session) {
    esAdmin = session && session.rol === 'Administrador';

    modalCliente = new bootstrap.Modal(document.getElementById('modalCliente'));
    modalHistorial = new bootstrap.Modal(document.getElementById('modalHistorial'));
    modalEliminar = new bootstrap.Modal(document.getElementById('modalEliminar'));

    document.getElementById('inputBuscar').addEventListener('input', function () {
        clearTimeout(busquedaTimer);
        var q = this.value.trim();
        busquedaTimer = setTimeout(function () { cargarClientes(q); }, 300);
    });

    document.getElementById('btnBuscar').addEventListener('click', function () {
        clearTimeout(busquedaTimer);
        cargarClientes(document.getElementById('inputBuscar').value.trim());
    });

    document.getElementById('inputBuscar').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            clearTimeout(busquedaTimer);
            cargarClientes(this.value.trim());
        }
    });

    document.getElementById('btnLimpiar').addEventListener('click', function () {
        clearTimeout(busquedaTimer);
        document.getElementById('inputBuscar').value = '';
        cargarClientes('');
    });

    document.getElementById('btnNuevo').addEventListener('click', abrirModalCrear);
    document.getElementById('btnGuardar').addEventListener('click', guardarCliente);
    document.getElementById('btnConfirmarEliminar').addEventListener('click', ejecutarEliminar);

    cargarClientes('');
}

async function cargarClientes(q) {
    var tbody = document.getElementById('tbodyClientes');
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">Cargando...</td></tr>';

    var path = q ? '/clientes?q=' + encodeURIComponent(q) : '/clientes';
    var res = await apiFetch(path);
    if (!res) return;

    var body = await res.json();
    if (!body.ok) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="5">' +
            esc(body.message || 'Error al cargar clientes') + '</td></tr>';
        return;
    }

    paginaActualClientes = 1;
    clientesCache = body.data || [];
    renderClientes(clientesCache);
}

function irAPaginaClientes(n) {
    paginaActualClientes = n;
    renderClientes(clientesCache);
}

function renderClientes(lista) {
    var tbody = document.getElementById('tbodyClientes');

    if (!lista || lista.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No se encontraron clientes.</td></tr>';
        renderPaginacion('paginacionClientes', 0, 1, PAGE_SIZE_CLIENTES, 'irAPaginaClientes');
        return;
    }

    var inicio = (paginaActualClientes - 1) * PAGE_SIZE_CLIENTES;
    var pagina = lista.slice(inicio, inicio + PAGE_SIZE_CLIENTES);

    var html = '';
    pagina.forEach(function (c) {
        var ini = iniciales(c.nombre);
        var color = avatarColor(c.nombre);
        html += '<tr>' +
            '<td class="td-id">' + esc(c.id) + '</td>' +
            '<td class="td-nombre">' +
                '<div class="cliente-nombre-wrap">' +
                    '<span class="avatar-ini" style="background:' + color + '">' + ini + '</span>' +
                    esc(c.nombre) +
                '</div>' +
            '</td>' +
            '<td class="td-muted">' + esc(c.correo || '—') + '</td>' +
            '<td class="td-muted">' + esc(c.telefono || '—') + '</td>' +
            '<td><div class="acciones">' +
            '<button class="btn-accion btn-editar" onclick="abrirModalEditar(\'' + esc(c.id) + '\')">Editar</button>' +
            '<button class="btn-accion btn-compras" onclick="abrirModalHistorial(\'' + esc(c.id) + '\', \'' + esc(c.nombre) + '\')">Ver Compras</button>' +
            (esAdmin ? '<button class="btn-accion btn-eliminar" onclick="abrirModalEliminar(\'' + esc(c.id) + '\')">Eliminar</button>' : '') +
            '</div></td>' +
            '</tr>';
    });
    tbody.innerHTML = html;
    renderPaginacion('paginacionClientes', lista.length, paginaActualClientes, PAGE_SIZE_CLIENTES, 'irAPaginaClientes');
}

function esc(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function abrirModalCrear() {
    clienteEditandoId = null;
    document.getElementById('modalClienteTitulo').textContent = 'Nuevo Cliente';
    document.getElementById('formCliente').reset();
    document.getElementById('fId').disabled = false;
    document.getElementById('fIdHelp').style.display = '';
    document.getElementById('modalClienteError').style.display = 'none';
    modalCliente.show();
}

function abrirModalEditar(id) {
    var c = clientesCache.find(function (x) { return x.id === id; });
    if (!c) return;

    clienteEditandoId = c.id;
    document.getElementById('modalClienteTitulo').textContent = 'Editar Cliente';
    document.getElementById('fId').value = c.id;
    document.getElementById('fId').disabled = true;
    document.getElementById('fIdHelp').style.display = 'none';
    document.getElementById('fNombre').value = c.nombre || '';
    document.getElementById('fCorreo').value = c.correo || '';
    document.getElementById('fTelefono').value = c.telefono || '';
    document.getElementById('fDireccion').value = c.direccion || '';
    document.getElementById('modalClienteError').style.display = 'none';
    modalCliente.show();
}

async function guardarCliente() {
    var errorDiv = document.getElementById('modalClienteError');
    errorDiv.style.display = 'none';

    var nombre = document.getElementById('fNombre').value.trim();
    if (!nombre) {
        errorDiv.textContent = 'El nombre es obligatorio.';
        errorDiv.style.display = 'block';
        return;
    }

    var payload = {
        id: document.getElementById('fId').value.trim(),
        nombre: nombre,
        correo: document.getElementById('fCorreo').value.trim() || null,
        telefono: document.getElementById('fTelefono').value.trim() || null,
        direccion: document.getElementById('fDireccion').value.trim() || null
    };

    var btn = document.getElementById('btnGuardar');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
        var res;
        if (clienteEditandoId) {
            res = await apiFetch('/clientes/' + clienteEditandoId, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            res = await apiFetch('/clientes', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }
        if (!res) return;

        var body = await res.json();
        if (body.ok) {
            modalCliente.hide();
            cargarClientes(document.getElementById('inputBuscar').value.trim());
        } else {
            errorDiv.textContent = body.message || 'Error al guardar.';
            errorDiv.style.display = 'block';
        }
    } catch (e) {
        errorDiv.textContent = 'No se pudo conectar con el servidor.';
        errorDiv.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Guardar';
    }
}

async function abrirModalHistorial(id, nombre) {
    document.getElementById('modalHistorialTitulo').textContent = 'Compras de ' + nombre;
    document.getElementById('historialContenido').innerHTML =
        '<div class="sin-compras">Cargando...</div>';
    modalHistorial.show();

    var res = await apiFetch('/clientes/' + id + '/compras');
    if (!res) return;

    var body = await res.json();
    if (!body.ok) {
        document.getElementById('historialContenido').innerHTML =
            '<div class="sin-compras">Error al cargar el historial.</div>';
        return;
    }

    var ventas = body.data;
    if (!ventas || ventas.length === 0) {
        document.getElementById('historialContenido').innerHTML =
            '<div class="sin-compras">Este cliente no tiene compras registradas.</div>';
        return;
    }

    var html = '';
    ventas.forEach(function (v) {
        html += '<div class="venta-card">' +
            '<div class="venta-header">' +
            '<span class="venta-id">Venta #' + v.ventaId + '</span>' +
            '<span class="venta-fecha">' + esc(v.fecha) + '</span>' +
            '<span class="venta-metodo">' + esc(v.metodoPago) + '</span>' +
            '<span class="venta-total">$' + formatNum(v.total) + '</span>' +
            '</div>' +
            '<div class="venta-items">';

        v.items.forEach(function (item) {
            html += '<div class="item-row">' +
                '<span class="item-nombre">' + esc(item.nombreProducto) + '</span>' +
                '<span class="item-detalle">' +
                item.cantidad + ' x $' + formatNum(item.precioUnitario) +
                ' = $' + formatNum(item.subtotal) +
                '</span></div>';
        });

        html += '</div></div>';
    });

    document.getElementById('historialContenido').innerHTML = html;
}

function abrirModalEliminar(id) {
    var c = clientesCache.find(function (x) { return x.id === id; });
    if (!c) return;

    eliminarClienteId = id;
    document.getElementById('eliminarNombre').textContent = c.nombre;
    document.getElementById('eliminarContrasena').value = '';
    document.getElementById('modalEliminarError').style.display = 'none';
    modalEliminar.show();
}

async function ejecutarEliminar() {
    var errorDiv = document.getElementById('modalEliminarError');
    errorDiv.style.display = 'none';

    var contrasena = document.getElementById('eliminarContrasena').value;
    if (!contrasena) {
        errorDiv.textContent = 'Ingresa tu contrasena para confirmar.';
        errorDiv.style.display = 'block';
        return;
    }

    var btn = document.getElementById('btnConfirmarEliminar');
    btn.disabled = true;
    btn.textContent = 'Eliminando...';

    try {
        var res = await apiFetch('/clientes/' + eliminarClienteId, {
            method: 'DELETE',
            body: JSON.stringify({ contrasena: contrasena })
        });
        if (!res) return;

        var body = await res.json();
        if (body.ok) {
            modalEliminar.hide();
            cargarClientes(document.getElementById('inputBuscar').value.trim());
        } else {
            errorDiv.textContent = body.message || 'No se pudo eliminar.';
            errorDiv.style.display = 'block';
        }
    } catch (e) {
        errorDiv.textContent = 'No se pudo conectar con el servidor.';
        errorDiv.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Eliminar';
    }
}
