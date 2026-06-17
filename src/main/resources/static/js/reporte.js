var reporteActual = [];
var tabActual = 'tabla';
var chartDias = null;
var chartMetodos = null;

// Colores de Chart.js alineados con la paleta del sistema
var COLORES_METODO = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#ef4444'];

// ----------------------------------------------------------------
// Inicializar fechas al cargar
// ----------------------------------------------------------------
function initFechas() {
    var hoy = new Date();
    var primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    document.getElementById('inputDesde').value = fmtInput(primerDia);
    document.getElementById('inputHasta').value  = fmtInput(hoy);
}

function fmtInput(d) {
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

// ----------------------------------------------------------------
// Cambiar tab
// ----------------------------------------------------------------
function cambiarTab(tab, btn) {
    tabActual = tab;
    document.querySelectorAll('.rp-tab').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    document.getElementById('tabTabla').style.display    = tab === 'tabla'    ? '' : 'none';
    document.getElementById('tabGraficas').style.display = tab === 'graficas' ? '' : 'none';
    if (tab === 'graficas' && reporteActual.length >= 0) {
        var desde = document.getElementById('inputDesde').value;
        var hasta = document.getElementById('inputHasta').value;
        cargarGraficas(desde, hasta);
    }
}

// ----------------------------------------------------------------
// Generar reporte completo
// ----------------------------------------------------------------
async function generarReporte() {
    var desde = document.getElementById('inputDesde').value;
    var hasta  = document.getElementById('inputHasta').value;
    var errorDiv = document.getElementById('errorMsg');
    errorDiv.style.display = 'none';

    if (!desde || !hasta) {
        errorDiv.textContent = 'Selecciona el rango de fechas';
        errorDiv.style.display = 'block';
        return;
    }
    if (desde > hasta) {
        errorDiv.textContent = 'La fecha "Desde" no puede ser posterior a "Hasta"';
        errorDiv.style.display = 'block';
        return;
    }

    document.getElementById('estadoInicial').style.display = 'none';
    document.getElementById('rpLoading').style.display = '';
    document.getElementById('rpTabs').style.display = 'none';
    document.getElementById('tabTabla').style.display = 'none';
    document.getElementById('tabGraficas').style.display = 'none';
    document.getElementById('btnPdf').disabled = true;

    try {
        var res = await apiFetch('/reporte?desde=' + desde + '&hasta=' + hasta);
        if (!res.ok) {
            errorDiv.textContent = res.message || 'Error al generar reporte';
            errorDiv.style.display = 'block';
            document.getElementById('rpLoading').style.display = 'none';
            document.getElementById('estadoInicial').style.display = '';
            return;
        }

        reporteActual = res.data || [];
        renderTabla(reporteActual);
        renderKpisTabla(reporteActual);

        document.getElementById('rpLoading').style.display = 'none';
        document.getElementById('rpTabs').style.display = '';

        // Mostrar tab activo
        document.getElementById('tabTabla').style.display    = tabActual === 'tabla'    ? '' : 'none';
        document.getElementById('tabGraficas').style.display = tabActual === 'graficas' ? '' : 'none';

        document.getElementById('btnPdf').disabled = reporteActual.length === 0;

        if (tabActual === 'graficas') {
            cargarGraficas(desde, hasta);
        }

    } catch (e) {
        errorDiv.textContent = 'Error de conexion';
        errorDiv.style.display = 'block';
        document.getElementById('rpLoading').style.display = 'none';
        document.getElementById('estadoInicial').style.display = '';
    }
}

// ----------------------------------------------------------------
// Tabla de ventas
// ----------------------------------------------------------------
function renderTabla(filas) {
    var tbody = document.getElementById('tablaBody');
    if (!filas || filas.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="7">Sin ventas en el rango seleccionado</td></tr>';
        return;
    }
    tbody.innerHTML = filas.map(function (f) {
        return '<tr>' +
            '<td>' + esc(String(f.ventaId)) + '</td>' +
            '<td>' + esc(f.fecha || '') + '</td>' +
            '<td>' + esc(f.idCliente || '') + '</td>' +
            '<td>' + esc(f.nombreCliente || '') + '</td>' +
            '<td>' + esc(f.nombreEmpleado || '') + '</td>' +
            '<td class="total-col">$' + fmtNum(f.total) + '</td>' +
            '<td>' + esc(f.metodoPago || '') + '</td>' +
        '</tr>';
    }).join('');
}

function renderKpisTabla(filas) {
    var total = filas.reduce(function (s, f) { return s + (parseFloat(f.total) || 0); }, 0);
    var promedio = filas.length > 0 ? total / filas.length : 0;
    document.getElementById('kpiCantidad').textContent = filas.length;
    document.getElementById('kpiTotal').textContent    = '$' + fmtNum(total);
    document.getElementById('kpiPromedio').textContent = '$' + fmtNum(promedio);
}

// ----------------------------------------------------------------
// Graficas
// ----------------------------------------------------------------
async function cargarGraficas(desde, hasta) {
    try {
        var res = await apiFetch('/reporte/graficas?desde=' + desde + '&hasta=' + hasta);
        if (!res.ok) return;
        var datos = res.data;
        renderKpisGraficas(datos);
        renderChartDias(datos.ventasPorDia || []);
        renderTopProductos(datos.topProductos || []);
        renderChartMetodos(datos.metodosPago || []);
    } catch (e) {
        showToast('Error al cargar graficas', 'error');
    }
}

function renderKpisGraficas(datos) {
    // Totales de la tabla (ya cargados)
    var total = reporteActual.reduce(function (s, f) { return s + (parseFloat(f.total) || 0); }, 0);
    document.getElementById('gKpiCantidad').textContent = reporteActual.length;
    document.getElementById('gKpiTotal').textContent    = '$' + fmtNum(total);

    // Top producto
    var prods = datos.topProductos || [];
    if (prods.length > 0) {
        document.getElementById('gKpiTopProd').textContent        = prods[0].nombre;
        document.getElementById('gKpiTopProdUnidades').textContent = prods[0].unidades + ' unidades vendidas';
    } else {
        document.getElementById('gKpiTopProd').textContent        = '--';
        document.getElementById('gKpiTopProdUnidades').textContent = '';
    }

    // Top metodo
    var mets = datos.metodosPago || [];
    if (mets.length > 0) {
        document.getElementById('gKpiTopMetodo').textContent      = mets[0].metodo;
        document.getElementById('gKpiTopMetodoCount').textContent  = mets[0].cantidad + ' transacciones';
    } else {
        document.getElementById('gKpiTopMetodo').textContent      = '--';
        document.getElementById('gKpiTopMetodoCount').textContent  = '';
    }
}

// Chart: Ingresos por dia
function renderChartDias(dias) {
    var canvas = document.getElementById('chartDias');
    var sinDias = document.getElementById('sinDias');

    if (!dias || dias.length === 0) {
        canvas.style.display = 'none';
        sinDias.style.display = '';
        return;
    }
    canvas.style.display = '';
    sinDias.style.display = 'none';

    if (chartDias) { chartDias.destroy(); chartDias = null; }

    var labels  = dias.map(function (d) { return d.fecha; });
    var totales = dias.map(function (d) { return parseFloat(d.total) || 0; });

    chartDias = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Ingresos',
                data: totales,
                backgroundColor: 'rgba(99,102,241,0.8)',
                hoverBackgroundColor: '#4f46e5',
                borderRadius: 5,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (ctx) { return ' $' + fmtNum(ctx.raw); }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { size: 11 },
                        callback: function (v) { return '$' + fmtNumCompacto(v); }
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' }
                }
            }
        }
    });
}

// Tabla top productos con barra mini
function renderTopProductos(productos) {
    var contenedor = document.getElementById('tablaTopProductos');
    var sinProductos = document.getElementById('sinProductos');

    if (!productos || productos.length === 0) {
        contenedor.style.display = 'none';
        sinProductos.style.display = '';
        return;
    }
    contenedor.style.display = '';
    sinProductos.style.display = 'none';

    var maxUnidades = productos[0].unidades;

    contenedor.innerHTML = '<table class="top-table">' +
        '<thead><tr>' +
        '<th style="width:36px">#</th>' +
        '<th>Producto</th>' +
        '<th>Categoria</th>' +
        '<th>Talla</th>' +
        '<th style="width:90px">Unidades</th>' +
        '<th style="width:110px">Ingresos</th>' +
        '</tr></thead><tbody>' +
        productos.map(function (p, i) {
            var rank = i + 1;
            var pct = maxUnidades > 0 ? Math.round((p.unidades / maxUnidades) * 100) : 0;
            var badgeClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-n';
            return '<tr>' +
                '<td><span class="rank-badge ' + badgeClass + '">' + rank + '</span></td>' +
                '<td>' +
                    '<div style="font-weight:600;color:var(--rm-text)">' + esc(p.nombre) + '</div>' +
                    '<div style="margin-top:5px;width:100%;max-width:180px">' +
                        '<div class="bar-mini" style="width:' + pct + '%"></div>' +
                    '</div>' +
                '</td>' +
                '<td style="color:var(--rm-text-2);font-size:0.8rem">' + esc(p.categoria || '--') + '</td>' +
                '<td style="color:var(--rm-text-2);font-size:0.8rem">' + esc(p.talla || '--') + '</td>' +
                '<td><span class="units-badge">' + p.unidades + '</span></td>' +
                '<td style="font-weight:600">$' + fmtNum(p.totalVendido) + '</td>' +
            '</tr>';
        }).join('') +
        '</tbody></table>';
}

// Chart doughnut metodos de pago
function renderChartMetodos(metodos) {
    var canvas = document.getElementById('chartMetodos');
    var sinMetodos = document.getElementById('sinMetodos');
    var leyenda = document.getElementById('leyendaMetodos');

    if (!metodos || metodos.length === 0) {
        canvas.style.display = 'none';
        sinMetodos.style.display = '';
        leyenda.innerHTML = '';
        return;
    }
    canvas.style.display = '';
    sinMetodos.style.display = 'none';

    if (chartMetodos) { chartMetodos.destroy(); chartMetodos = null; }

    var labels   = metodos.map(function (m) { return m.metodo; });
    var valores  = metodos.map(function (m) { return m.cantidad; });
    var colores  = metodos.map(function (_, i) { return COLORES_METODO[i % COLORES_METODO.length]; });
    var totalTx  = metodos.reduce(function (s, m) { return s + m.cantidad; }, 0);

    chartMetodos = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: valores,
                backgroundColor: colores,
                borderWidth: 2,
                borderColor: '#fff',
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            cutout: '68%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (ctx) {
                            var pct = totalTx > 0 ? Math.round((ctx.raw / totalTx) * 100) : 0;
                            return ' ' + ctx.raw + ' ventas (' + pct + '%)';
                        }
                    }
                }
            }
        }
    });

    // Leyenda manual
    leyenda.innerHTML = metodos.map(function (m, i) {
        var pct = totalTx > 0 ? Math.round((m.cantidad / totalTx) * 100) : 0;
        return '<div style="display:flex;align-items:center;justify-content:space-between;' +
            'padding:5px 0;border-bottom:1px solid var(--rm-border);font-size:0.8rem">' +
            '<div style="display:flex;align-items:center;gap:8px">' +
                '<span style="width:10px;height:10px;border-radius:3px;background:' + colores[i] + ';display:inline-block"></span>' +
                '<span style="color:var(--rm-text)">' + esc(m.metodo) + '</span>' +
            '</div>' +
            '<div style="color:var(--rm-text-2)">' + m.cantidad + ' <span style="color:var(--rm-accent);font-weight:600">(' + pct + '%)</span></div>' +
        '</div>';
    }).join('');
}

// ----------------------------------------------------------------
// Exportar PDF (sin cambios)
// ----------------------------------------------------------------
function exportarPdf() {
    var desde = document.getElementById('inputDesde').value;
    var hasta  = document.getElementById('inputHasta').value;
    if (!desde || !hasta) return;

    var token = getToken();
    fetch('/api/reporte/pdf?desde=' + desde + '&hasta=' + hasta, {
        headers: { 'Authorization': 'Bearer ' + token }
    }).then(function (res) {
        if (res.status === 401 || res.status === 403) {
            clearSession(); window.location.replace('/login.html'); return null;
        }
        return res.blob();
    }).then(function (blob) {
        if (!blob) return;
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'reporte_ventas_' + desde + '_' + hasta + '.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }).catch(function () {
        showToast('Error al descargar el PDF', 'error');
    });
}

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function fmtNum(n) {
    var num = parseFloat(n);
    if (isNaN(num)) return '0';
    return num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function fmtNumCompacto(v) {
    if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
    if (v >= 1000)    return (v / 1000).toFixed(0) + 'K';
    return String(v);
}

function esc(val) {
    if (val == null) return '';
    return String(val)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
