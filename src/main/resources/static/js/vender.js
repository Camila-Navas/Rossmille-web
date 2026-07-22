var carrito = []; // { productoId, nombre, precio, cantidad, stock }
var resultadosCache = []; // guarda los productos de la ultima busqueda para usar por indice
var busquedaTimer = null;

var modalTicket = null;
var modalError = null;

document.addEventListener('DOMContentLoaded', function () {
    modalTicket = new bootstrap.Modal(document.getElementById('modalTicket'));
    modalError  = new bootstrap.Modal(document.getElementById('modalError'));

    document.getElementById('inputBusqueda').addEventListener('input', function () {
        clearTimeout(busquedaTimer);
        var q = this.value.trim();
        if (!q) {
            document.getElementById('resultadoLista').innerHTML =
                '<div class="carrito-vacio">Escribe para buscar un producto</div>';
            return;
        }
        busquedaTimer = setTimeout(function () { buscarProductos(q); }, 280);
    });

    document.getElementById('inputDescuento').addEventListener('input', actualizarTotales);
});

async function buscarProductos(q) {
    var lista = document.getElementById('resultadoLista');
    lista.innerHTML = '<div class="carrito-vacio">Buscando...</div>';

    var res = await apiFetch('/productos?q=' + encodeURIComponent(q));
    if (!res) return;

    var body = await res.json();
    if (!body.ok || !body.data || body.data.length === 0) {
        resultadosCache = [];
        lista.innerHTML = '<div class="carrito-vacio">Sin resultados</div>';
        return;
    }

    resultadosCache = body.data;
    lista.innerHTML = body.data.map(function (p, idx) {
        var agotado = p.stock === 0;
        var stockBajo = p.stock > 0 && p.stock <= 5;
        var badge = agotado
            ? '<span class="badge-agotado">AGOTADO</span>'
            : stockBajo
                ? '<span class="badge-stock-bajo">Stock: ' + p.stock + '</span>'
                : '';
        var claseItem = agotado ? 'resultado-item sin-stock' : 'resultado-item';
        var onclick = agotado ? '' : 'onclick="agregarPorIndice(' + idx + ')"';
        return '<div class="' + claseItem + '" ' + onclick + '>' +
            '<span class="precio">$' + formatNum(p.precio) + '</span>' +
            '<div class="nombre">' + esc(p.nombre) + badge + '</div>' +
            '<div class="detalle">' +
                (p.talla ? 'Talla: ' + esc(p.talla) + ' &nbsp;' : '') +
                (p.color ? 'Color: ' + esc(p.color) + ' &nbsp;' : '') +
                (p.categoria ? esc(p.categoria) : '') +
            '</div>' +
        '</div>';
    }).join('');
}

function agregarPorIndice(idx) {
    var p = resultadosCache[idx];
    if (!p || p.stock === 0) return;
    agregarAlCarrito(p.id, p.nombre, parseFloat(p.precio), p.stock);
}

function agregarAlCarrito(id, nombre, precio, stock) {
    var existente = carrito.find(function (i) { return i.productoId === id; });
    if (existente) {
        if (existente.cantidad >= existente.stock) {
            mostrarError('No hay mas stock disponible para "' + existente.nombre + '"');
            return;
        }
        existente.cantidad++;
    } else {
        carrito.push({ productoId: id, nombre: nombre, precio: precio, cantidad: 1, stock: stock });
    }
    renderCarrito();
}

function cambiarCantidad(idx, delta) {
    var item = carrito[idx];
    var nueva = item.cantidad + delta;
    if (nueva < 1) {
        carrito.splice(idx, 1);
    } else if (nueva > item.stock) {
        mostrarError('Stock maximo disponible: ' + item.stock);
        return;
    } else {
        item.cantidad = nueva;
    }
    renderCarrito();
}

function quitarItem(idx) {
    carrito.splice(idx, 1);
    renderCarrito();
}

function limpiarCarrito() {
    carrito = [];
    document.getElementById('inputCliente').value = '';
    document.getElementById('inputDescuento').value = '0';
    renderCarrito();
}

function renderCarrito() {
    var contenedor = document.getElementById('carritoItems');
    var vacio = document.getElementById('carritoVacio');

    if (carrito.length === 0) {
        contenedor.innerHTML = '<div class="carrito-vacio" id="carritoVacio">El carrito esta vacio</div>';
        document.getElementById('btnFinalizar').disabled = true;
        actualizarTotales();
        return;
    }

    contenedor.innerHTML = carrito.map(function (item, idx) {
        var sub = item.precio * item.cantidad;
        return '<div class="carrito-item">' +
            '<div class="ci-nombre">' + esc(item.nombre) + '</div>' +
            '<div class="ci-qty">' +
                '<button onclick="cambiarCantidad(' + idx + ', -1)">-</button>' +
                '<span class="qty-val">' + item.cantidad + '</span>' +
                '<button onclick="cambiarCantidad(' + idx + ', 1)">+</button>' +
            '</div>' +
            '<div class="ci-precio">$' + formatNum(item.precio) + ' c/u</div>' +
            '<div class="ci-subtotal">$' + formatNum(sub) + '</div>' +
            '<button class="btn-quitar" onclick="quitarItem(' + idx + ')" title="Quitar">&#10005;</button>' +
        '</div>';
    }).join('');

    document.getElementById('btnFinalizar').disabled = false;
    actualizarTotales();
}

function actualizarTotales() {
    var subtotal = carrito.reduce(function (acc, i) { return acc + i.precio * i.cantidad; }, 0);
    var inputDescuento = document.getElementById('inputDescuento');
    var descuento = parseFloat(inputDescuento.value) || 0;
    if (descuento < 0) descuento = 0;
    var excedeSubtotal = descuento > subtotal;
    var total = Math.max(0, subtotal - descuento);
    document.getElementById('subtotalVal').textContent = '$' + formatNum(subtotal);
    document.getElementById('totalVal').textContent    = '$' + formatNum(total);
    inputDescuento.style.borderColor = excedeSubtotal ? 'var(--rm-danger)' : '';
    inputDescuento.title = excedeSubtotal ? 'El descuento no puede ser mayor al subtotal' : '';
}

async function finalizarVenta() {
    var btn = document.getElementById('btnFinalizar');
    if (carrito.length === 0) return;

    var descuento = parseFloat(document.getElementById('inputDescuento').value) || 0;
    if (descuento < 0) descuento = 0;
    var subtotal = carrito.reduce(function (acc, i) { return acc + i.precio * i.cantidad; }, 0);
    if (descuento > subtotal) {
        mostrarError('El descuento no puede ser mayor al subtotal ($' + formatNum(subtotal) + ')');
        return;
    }
    var metodoPago = document.getElementById('selectPago').value;
    var idCliente  = document.getElementById('inputCliente').value.trim() || null;

    var payload = {
        items: carrito.map(function (i) {
            return {
                productoId: i.productoId,
                cantidad: i.cantidad,
                precioUnitario: i.precio
            };
        }),
        idCliente: idCliente,
        descuento: descuento,
        metodoPago: metodoPago
    };

    btn.disabled = true;
    btn.textContent = 'Procesando...';

    var res = await apiFetch('/ventas', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    btn.disabled = false;
    btn.textContent = 'FINALIZAR VENTA';

    if (!res) return;

    var body = await res.json();
    if (!body.ok) {
        mostrarError(body.message || 'Error al registrar la venta');
        return;
    }

    mostrarTicket(body.data);
}

function mostrarTicket(venta) {
    var sep = '--------------------------------';
    var lineas = [
        'ROSS MILLE',
        sep,
        'Venta #' + venta.ventaId,
        'Fecha:  ' + venta.fecha,
        venta.nombreCliente ? 'Cliente: ' + venta.nombreCliente : '',
        sep,
    ];

    venta.items.forEach(function (it) {
        var nombre = it.nombreProducto.length > 20
            ? it.nombreProducto.substring(0, 19) + '.'
            : it.nombreProducto;
        var linea = nombre;
        var cantPrecio = it.cantidad + ' x $' + formatNum(it.precioUnitario);
        var sub = '$' + formatNum(it.subtotal);
        lineas.push(linea);
        lineas.push('  ' + cantPrecio + padLeft(sub, 32 - cantPrecio.length - 2));
    });

    lineas.push(sep);
    lineas.push('Subtotal:' + padLeft('$' + formatNum(venta.subtotal), 23));

    if (parseFloat(venta.descuento) > 0) {
        lineas.push('Descuento:' + padLeft('-$' + formatNum(venta.descuento), 22));
    }

    lineas.push('TOTAL:   ' + padLeft('$' + formatNum(venta.total), 23));
    lineas.push(sep);
    lineas.push('Pago: ' + venta.metodoPago);
    lineas.push(sep);
    lineas.push('   Gracias por su compra!');

    document.getElementById('ticketBody').textContent = lineas.filter(function (l) {
        return l !== null && l !== undefined;
    }).join('\n');
    modalTicket.show();
}

function mostrarError(msg) {
    document.getElementById('errorMsg').textContent = msg;
    modalError.show();
}

function formatNum(n) {
    var num = parseFloat(n);
    if (isNaN(num)) return '0';
    return num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function padLeft(str, total) {
    while (str.length < total) str = ' ' + str;
    return str;
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
