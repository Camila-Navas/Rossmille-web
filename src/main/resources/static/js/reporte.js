var reporteActual = [];

function initFechas() {
    var hoy = new Date();
    var primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    document.getElementById('inputDesde').value = formatFechaInput(primerDiaMes);
    document.getElementById('inputHasta').value  = formatFechaInput(hoy);
}

function formatFechaInput(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
}

async function generarReporte() {
    var desde = document.getElementById('inputDesde').value;
    var hasta = document.getElementById('inputHasta').value;
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

    document.getElementById('tablaWrapper').style.display = 'none';
    document.getElementById('resumenPanel').style.display = 'none';
    document.getElementById('btnPdf').disabled = true;

    var res = await apiFetch('/reporte?desde=' + desde + '&hasta=' + hasta);
    if (!res) return;

    var body = await res.json();
    if (!body.ok) {
        errorDiv.textContent = body.message || 'Error al generar reporte';
        errorDiv.style.display = 'block';
        return;
    }

    reporteActual = body.data || [];
    renderTabla(reporteActual);
    renderResumen(reporteActual);

    document.getElementById('tablaWrapper').style.display = '';
    document.getElementById('resumenPanel').style.display = '';
    document.getElementById('btnPdf').disabled = reporteActual.length === 0;
}

function renderTabla(filas) {
    var tbody = document.getElementById('tablaBody');
    if (filas.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="7">' +
            'Sin ventas en el rango seleccionado</td></tr>';
        return;
    }
    tbody.innerHTML = filas.map(function (f) {
        return '<tr>' +
            '<td>' + esc(String(f.ventaId)) + '</td>' +
            '<td>' + esc(f.fecha || '') + '</td>' +
            '<td>' + esc(f.idCliente || '') + '</td>' +
            '<td>' + esc(f.nombreCliente || '') + '</td>' +
            '<td>' + esc(f.nombreEmpleado || '') + '</td>' +
            '<td class="total-col">$' + formatNum(f.total) + '</td>' +
            '<td>' + esc(f.metodoPago || '') + '</td>' +
        '</tr>';
    }).join('');
}

function renderResumen(filas) {
    var total = filas.reduce(function (acc, f) {
        return acc + (parseFloat(f.total) || 0);
    }, 0);
    document.getElementById('resumenCantidad').textContent = filas.length;
    document.getElementById('resumenTotal').textContent = '$' + formatNum(total);
}

function exportarPdf() {
    var desde = document.getElementById('inputDesde').value;
    var hasta = document.getElementById('inputHasta').value;
    if (!desde || !hasta) return;

    var token = getToken();
    var url = '/api/reporte/pdf?desde=' + desde + '&hasta=' + hasta;

    var a = document.createElement('a');
    a.href = url;
    a.download = 'reporte_ventas_' + desde + '_' + hasta + '.pdf';

    // Descarga via fetch para incluir el header de autorizacion
    fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(function (res) {
        if (res.status === 401 || res.status === 403) {
            clearSession();
            window.location.replace('/login.html');
            return null;
        }
        return res.blob();
    })
    .then(function (blob) {
        if (!blob) return;
        var objUrl = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = objUrl;
        link.download = 'reporte_ventas_' + desde + '_' + hasta + '.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objUrl);
    })
    .catch(function () {
        alert('Error al descargar el PDF');
    });
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
