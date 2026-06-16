var tabActual = 'activos';
var pedidoEliminarId = null;
var contadorItems = 0;
var contadoresTab = { activos: null, historial: null };

var modalNuevo = null;
var modalEliminar = null;

document.addEventListener('DOMContentLoaded', function () {
    modalNuevo    = new bootstrap.Modal(document.getElementById('modalNuevo'));
    modalEliminar = new bootstrap.Modal(document.getElementById('modalEliminar'));
    cargarPedidos();
    cargarContadorTab('historial');
});

async function cargarContadorTab(tab) {
    var res = await apiFetch('/pedidos?tipo=' + tab);
    if (!res) return;
    var body = await res.json();
    if (body.ok) {
        contadoresTab[tab] = (body.data || []).length;
        refrescarEtiquetasTab();
    }
}

function refrescarEtiquetasTab() {
    var n = contadoresTab.activos;
    document.getElementById('tabActivos').textContent =
        'Activos' + (n > 0 ? ' (' + n + ')' : '');
    var h = contadoresTab.historial;
    document.getElementById('tabHistorial').textContent =
        'Historial' + (h > 0 ? ' (' + h + ')' : '');
}

function cambiarTab(tab) {
    tabActual = tab;
    document.getElementById('tabActivos').classList.toggle('active', tab === 'activos');
    document.getElementById('tabHistorial').classList.toggle('active', tab === 'historial');
    cargarPedidos();
}

async function cargarPedidos() {
    var lista = document.getElementById('listaPedidos');
    lista.innerHTML = '<div class="empty-msg">Cargando...</div>';

    var res = await apiFetch('/pedidos?tipo=' + tabActual);
    if (!res) return;

    var body = await res.json();
    if (!body.ok) {
        lista.innerHTML = '<div class="empty-msg text-danger">' +
            esc(body.message || 'Error al cargar pedidos') + '</div>';
        return;
    }

    var pedidos = body.data || [];
    contadoresTab[tabActual] = pedidos.length;
    refrescarEtiquetasTab();

    if (pedidos.length === 0) {
        lista.innerHTML = '<div class="empty-msg">Sin pedidos ' +
            (tabActual === 'activos' ? 'activos' : 'en historial') + '</div>';
        return;
    }

    lista.innerHTML = pedidos.map(function (p) { return renderCard(p); }).join('');
}

function renderCard(p) {
    var badgeClass = p.estado === 'Pendiente'
        ? 'estado-pendiente'
        : p.estado === 'En Proceso'
            ? 'estado-en-proceso'
            : 'estado-atendido';

    var itemsHtml = '';
    if (p.items && p.items.length > 0) {
        itemsHtml = '<table class="items-table">' +
            '<thead><tr><th>Producto</th><th>Cant.</th><th>Precio est.</th><th>Descripcion</th></tr></thead><tbody>' +
            p.items.map(function (it) {
                return '<tr>' +
                    '<td>' + esc(it.nombreProducto) + '</td>' +
                    '<td>' + it.cantidad + '</td>' +
                    '<td>$' + formatNum(it.precioUnitarioEstimado) + '</td>' +
                    '<td>' + esc(it.descripcionPersonalizada || '') + '</td>' +
                    '</tr>';
            }).join('') +
            '</tbody></table>';
    }

    var acciones = '';
    if (tabActual === 'activos') {
        if (p.estado === 'Pendiente') {
            acciones += '<button class="btn-avanzar btn-avanzar-pendiente" ' +
                'onclick="avanzar(' + p.id + ', event)">Marcar En Proceso</button>';
        } else if (p.estado === 'En Proceso') {
            acciones += '<button class="btn-avanzar btn-avanzar-proceso" ' +
                'onclick="avanzar(' + p.id + ', event)">Marcar Atendido</button>';
        }
    }

    if (window._esAdmin) {
        acciones += '<button class="btn-eliminar" ' +
            'onclick="confirmarEliminar(' + p.id + ', ' + JSON.stringify(p.nombreCliente || p.idCliente) + ', event)">' +
            'Eliminar</button>';
    }

    var obsHtml = p.observaciones
        ? '<div class="card-obs">"' + esc(p.observaciones) + '"</div>'
        : '';

    return '<div class="pedido-card" id="card-' + p.id + '">' +
        '<div class="card-header-row" onclick="toggleCard(' + p.id + ')">' +
            '<span class="card-id">Pedido #' + p.id + '</span>' +
            '<span class="card-cliente">' + esc(p.nombreCliente || p.idCliente) + '</span>' +
            '<span class="badge-estado ' + badgeClass + '">' + esc(p.estado) + '</span>' +
            '<span class="card-fecha">' + esc(p.fechaPedido) + '</span>' +
        '</div>' +
        '<div class="card-body-row" id="body-' + p.id + '">' +
            '<div class="card-total">Total estimado: <strong>$' + formatNum(p.totalEstimado) + '</strong>' +
            ' &nbsp; Items: ' + (p.items ? p.items.length : 0) + '</div>' +
            obsHtml +
            itemsHtml +
            (acciones ? '<div class="card-actions">' + acciones + '</div>' : '') +
        '</div>' +
    '</div>';
}

function toggleCard(id) {
    var body = document.getElementById('body-' + id);
    if (body) body.classList.toggle('open');
}

async function avanzar(id, event) {
    event.stopPropagation();
    var res = await apiFetch('/pedidos/' + id + '/avanzar', { method: 'PUT' });
    if (!res) return;
    var body = await res.json();
    if (!body.ok) {
        alert(body.message || 'Error al actualizar estado');
        return;
    }
    cargarPedidos();
}

function confirmarEliminar(id, nombreCliente, event) {
    event.stopPropagation();
    pedidoEliminarId = id;
    document.getElementById('textoEliminar').textContent =
        'Eliminar pedido #' + id + ' del cliente "' + nombreCliente + '". Esta accion no se puede deshacer.';
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

    var res = await apiFetch('/pedidos/' + pedidoEliminarId, {
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
    cargarPedidos();
}

// --- Formulario Nuevo Pedido ---

function abrirModalNuevo() {
    contadorItems = 0;
    document.getElementById('nuevoIdCliente').value = '';
    document.getElementById('nuevoObservaciones').value = '';
    document.getElementById('itemsForm').innerHTML = '';
    document.getElementById('totalEstimadoLabel').textContent = '$0';
    document.getElementById('nuevoError').style.display = 'none';
    agregarItemForm();
    modalNuevo.show();
}

function agregarItemForm() {
    var idx = contadorItems++;
    var row = document.createElement('div');
    row.className = 'item-row';
    row.id = 'item-row-' + idx;
    row.innerHTML =
        '<input type="text" placeholder="Nombre del producto" id="item-nombre-' + idx + '">' +
        '<input type="number" placeholder="1" min="1" id="item-cant-' + idx + '" value="1" ' +
            'oninput="recalcularTotal()">' +
        '<input type="number" placeholder="0" min="0" step="1000" id="item-precio-' + idx + '" ' +
            'oninput="recalcularTotal()">' +
        '<input type="text" placeholder="Descripcion (opcional)" id="item-desc-' + idx + '">' +
        '<button type="button" class="btn-remove-item" onclick="quitarItemForm(' + idx + ')">&#10005;</button>';
    document.getElementById('itemsForm').appendChild(row);
}

function quitarItemForm(idx) {
    var row = document.getElementById('item-row-' + idx);
    if (row) row.remove();
    recalcularTotal();
}

function recalcularTotal() {
    var total = 0;
    document.querySelectorAll('[id^="item-cant-"]').forEach(function (cantInput) {
        var idx = cantInput.id.replace('item-cant-', '');
        var precioInput = document.getElementById('item-precio-' + idx);
        var cant = parseInt(cantInput.value) || 0;
        var precio = parseFloat(precioInput ? precioInput.value : 0) || 0;
        total += cant * precio;
    });
    document.getElementById('totalEstimadoLabel').textContent = '$' + formatNum(total);
}

async function crearPedido() {
    var errorDiv = document.getElementById('nuevoError');
    errorDiv.style.display = 'none';

    var idCliente = document.getElementById('nuevoIdCliente').value.trim();
    if (!idCliente) {
        errorDiv.textContent = 'El ID del cliente es obligatorio';
        errorDiv.style.display = 'block';
        return;
    }

    var items = [];
    var rowsIds = [];
    document.querySelectorAll('[id^="item-row-"]').forEach(function (row) {
        rowsIds.push(row.id.replace('item-row-', ''));
    });

    for (var i = 0; i < rowsIds.length; i++) {
        var idx = rowsIds[i];
        var nombre = (document.getElementById('item-nombre-' + idx).value || '').trim();
        var cant = parseInt(document.getElementById('item-cant-' + idx).value) || 0;
        var precio = parseFloat(document.getElementById('item-precio-' + idx).value) || 0;
        var desc = (document.getElementById('item-desc-' + idx).value || '').trim();

        if (!nombre) {
            errorDiv.textContent = 'Todos los items deben tener nombre';
            errorDiv.style.display = 'block';
            return;
        }
        if (cant < 1) {
            errorDiv.textContent = 'La cantidad debe ser al menos 1';
            errorDiv.style.display = 'block';
            return;
        }

        items.push({
            nombreProductoPersonalizado: nombre,
            cantidad: cant,
            precioUnitarioEstimado: precio,
            descripcionPersonalizada: desc || null
        });
    }

    if (items.length === 0) {
        errorDiv.textContent = 'Agrega al menos un item al pedido';
        errorDiv.style.display = 'block';
        return;
    }

    var payload = {
        idCliente: idCliente,
        observaciones: document.getElementById('nuevoObservaciones').value.trim() || null,
        items: items
    };

    var btn = document.getElementById('btnCrearPedido');
    btn.disabled = true;

    var res = await apiFetch('/pedidos', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    btn.disabled = false;
    if (!res) return;

    var body = await res.json();
    if (!body.ok) {
        errorDiv.textContent = body.message || 'Error al crear el pedido';
        errorDiv.style.display = 'block';
        return;
    }

    modalNuevo.hide();
    if (tabActual !== 'activos') cambiarTab('activos');
    else cargarPedidos();
}

function formatNum(n) {
    var num = parseFloat(n);
    if (isNaN(num)) return '0';
    return num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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
