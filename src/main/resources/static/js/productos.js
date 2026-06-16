var productosCache = [];
var productoEditandoId = null;
var eliminarProductoId = null;
var busquedaTimer = null;
var filtroGenero = '';
var paginaActualProductos = 1;
var PAGE_SIZE_PRODUCTOS = 12;

var modalProducto = null;
var modalEliminar = null;

function init() {
    modalProducto = new bootstrap.Modal(document.getElementById('modalProducto'));
    modalEliminar = new bootstrap.Modal(document.getElementById('modalEliminar'));

    document.getElementById('inputBuscar').addEventListener('input', function () {
        clearTimeout(busquedaTimer);
        var q = this.value.trim();
        busquedaTimer = setTimeout(function () { cargarProductos(q); }, 300);
    });

    document.getElementById('btnBuscar').addEventListener('click', function () {
        clearTimeout(busquedaTimer);
        cargarProductos(document.getElementById('inputBuscar').value.trim());
    });

    document.getElementById('inputBuscar').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            clearTimeout(busquedaTimer);
            cargarProductos(this.value.trim());
        }
    });

    document.getElementById('btnLimpiar').addEventListener('click', function () {
        clearTimeout(busquedaTimer);
        document.getElementById('inputBuscar').value = '';
        filtroGenero = '';
        actualizarChips();
        cargarProductos('');
    });

    document.getElementById('btnNuevo').addEventListener('click', abrirModalCrear);
    document.getElementById('btnGuardar').addEventListener('click', guardarProducto);
    document.getElementById('btnConfirmarEliminar').addEventListener('click', ejecutarEliminar);

    cargarProductos('');
}

function setFiltroGenero(g) {
    filtroGenero = (filtroGenero === g) ? '' : g;
    paginaActualProductos = 1;
    actualizarChips();
    aplicarFiltros();
}

function actualizarChips() {
    document.querySelectorAll('.filtro-chip').forEach(function (chip) {
        chip.classList.toggle('active', chip.dataset.genero === filtroGenero);
    });
}

function aplicarFiltros() {
    var lista = productosCache;
    if (filtroGenero) {
        lista = lista.filter(function (p) { return p.genero === filtroGenero; });
    }
    actualizarContadorStockBajo(lista);
    var inicio = (paginaActualProductos - 1) * PAGE_SIZE_PRODUCTOS;
    renderProductos(lista.slice(inicio, inicio + PAGE_SIZE_PRODUCTOS));
    renderPaginacion('paginacionProductos', lista.length, paginaActualProductos, PAGE_SIZE_PRODUCTOS, 'irAPaginaProductos');
}

function irAPaginaProductos(n) {
    paginaActualProductos = n;
    aplicarFiltros();
}

async function cargarProductos(q) {
    paginaActualProductos = 1;
    var grid = document.getElementById('productosGrid');
    grid.innerHTML = '<div class="col-12 text-center text-muted py-5">Cargando...</div>';

    var path = q ? '/productos?q=' + encodeURIComponent(q) : '/productos';
    var res = await apiFetch(path);
    if (!res) return;

    var body = await res.json();
    if (!body.ok) {
        grid.innerHTML = '<div class="col-12 text-center text-danger py-5">' +
            esc(body.message || 'Error al cargar productos') + '</div>';
        return;
    }

    productosCache = body.data || [];
    aplicarFiltros();
}

function actualizarContadorStockBajo(lista) {
    var UMBRAL = 5;
    var conAlerta = lista.filter(function (p) { return p.stock <= UMBRAL; }).length;
    var label = document.getElementById('labelStockBajo');
    if (conAlerta > 0) {
        label.textContent = conAlerta + ' producto(s) con stock bajo';
        label.className = 'badge-stock-alerta';
    } else {
        label.textContent = '';
        label.className = '';
    }
}

function renderProductos(lista) {
    var grid = document.getElementById('productosGrid');
    if (!lista || lista.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center text-muted py-5">No se encontraron productos.</div>';
        return;
    }
    var html = '';
    lista.forEach(function (p) { html += cardHtml(p); });
    grid.innerHTML = html;
}

function cardHtml(p) {
    var claseCard = 'producto-card';
    var badgeStock = '';

    if (p.stock === 0) {
        claseCard += ' card-agotado';
        badgeStock = '<span class="badge-agotado">AGOTADO</span>';
    } else if (p.stock <= 5) {
        claseCard += ' card-stock-bajo';
        badgeStock = '<span class="badge-stock-bajo">STOCK BAJO: ' + p.stock + ' und.</span>';
    }

    var categoria = p.categoria ? '<span class="tag-cat">' + esc(p.categoria) + '</span>' : '';
    var talla = p.talla ? '<span class="tag-talla">' + esc(p.talla) + '</span>' : '';
    var descripcion = p.descripcion
        ? '<p class="card-desc">' + esc(p.descripcion) + '</p>'
        : '';
    var meta = [];
    if (p.genero) meta.push('Genero: ' + esc(p.genero));
    if (p.color) meta.push('Color: ' + esc(p.color));
    var metaHtml = meta.length
        ? '<div class="card-meta">' + meta.join(' | ') + '</div>'
        : '';
    var precio = '$' + formatNum(p.precio);

    return '<div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-3">' +
        '<div class="' + claseCard + ' h-100">' +
        '<div class="card-header-tags">' + categoria + talla + '</div>' +
        '<div class="card-nombre">' + esc(p.nombre) + '</div>' +
        descripcion +
        metaHtml +
        '<div class="card-stock-row"><span class="stock-num">Stock: ' + p.stock + '</span> ' + badgeStock + '</div>' +
        '<div class="card-precio">' + precio + '</div>' +
        '<div class="card-acciones">' +
        '<button class="btn-card-editar" onclick="abrirModalEditar(' + p.id + ')">Editar</button>' +
        '<button class="btn-card-eliminar" onclick="abrirModalEliminar(' + p.id + ')">Eliminar</button>' +
        '</div></div></div>';
}

function formatNum(n) {
    var num = parseFloat(n);
    if (isNaN(num)) return '0';
    return num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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
    productoEditandoId = null;
    document.getElementById('modalProductoTitulo').textContent = 'Nuevo Producto';
    document.getElementById('formProducto').reset();
    document.getElementById('modalProductoError').style.display = 'none';
    modalProducto.show();
}

function abrirModalEditar(id) {
    var p = productosCache.find(function (x) { return x.id === id; });
    if (!p) return;

    productoEditandoId = p.id;
    document.getElementById('modalProductoTitulo').textContent = 'Editar Producto';
    document.getElementById('fNombre').value = p.nombre || '';
    document.getElementById('fDescripcion').value = p.descripcion || '';
    document.getElementById('fTalla').value = p.talla || '';
    document.getElementById('fPrecio').value = p.precio != null ? p.precio : '';
    document.getElementById('fStock').value = p.stock != null ? p.stock : 0;
    document.getElementById('fGenero').value = p.genero || '';
    document.getElementById('fCategoria').value = p.categoria || '';
    document.getElementById('fColor').value = p.color || '';
    document.getElementById('modalProductoError').style.display = 'none';
    modalProducto.show();
}

async function guardarProducto() {
    var errorDiv = document.getElementById('modalProductoError');
    errorDiv.style.display = 'none';

    var nombre = document.getElementById('fNombre').value.trim();
    var precioVal = document.getElementById('fPrecio').value.trim();
    var stockVal = document.getElementById('fStock').value.trim();

    if (!nombre || !precioVal || stockVal === '') {
        errorDiv.textContent = 'Nombre, precio y stock son obligatorios.';
        errorDiv.style.display = 'block';
        return;
    }

    var payload = {
        nombre: nombre,
        descripcion: document.getElementById('fDescripcion').value.trim() || null,
        talla: document.getElementById('fTalla').value.trim() || null,
        precio: parseFloat(precioVal),
        stock: parseInt(stockVal, 10),
        genero: document.getElementById('fGenero').value || null,
        categoria: document.getElementById('fCategoria').value.trim() || null,
        color: document.getElementById('fColor').value.trim() || null
    };

    var btn = document.getElementById('btnGuardar');
    btn.disabled = true;
    btn.textContent = 'Guardando...';

    try {
        var res;
        if (productoEditandoId) {
            res = await apiFetch('/productos/' + productoEditandoId, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            res = await apiFetch('/productos', {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }
        if (!res) return;

        var body = await res.json();
        if (body.ok) {
            modalProducto.hide();
            cargarProductos(document.getElementById('inputBuscar').value.trim());
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

function abrirModalEliminar(id) {
    var p = productosCache.find(function (x) { return x.id === id; });
    if (!p) return;

    eliminarProductoId = id;
    document.getElementById('eliminarNombre').textContent = p.nombre;
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
        var res = await apiFetch('/productos/' + eliminarProductoId, {
            method: 'DELETE',
            body: JSON.stringify({ contrasena: contrasena })
        });
        if (!res) return;

        var body = await res.json();
        if (body.ok) {
            modalEliminar.hide();
            cargarProductos(document.getElementById('inputBuscar').value.trim());
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
