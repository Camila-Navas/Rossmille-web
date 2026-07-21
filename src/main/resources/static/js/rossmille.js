// ============================================================
// Utilidades compartidas: notificaciones toast + paginacion
// ============================================================
// La navegacion (sidebar/topbar/footer) y el tema ahora viven en
// layout.js y theme.js respectivamente -- ver esos archivos.
(function () {
    var toastWrap;

    function getWrap() {
        if (!toastWrap) {
            toastWrap = document.createElement('div');
            toastWrap.className = 'rm-toast-wrap';
            toastWrap.setAttribute('role', 'status');
            toastWrap.setAttribute('aria-live', 'polite');
            document.body.appendChild(toastWrap);
        }
        return toastWrap;
    }

    window.showToast = function (msg, type) {
        var w = getWrap();
        var t = document.createElement('div');
        var cls = type || 'info';
        var icons = { success: 'bi-check-circle', error: 'bi-x-circle', info: 'bi-info-circle' };
        t.className = 'rm-toast ' + cls;
        t.innerHTML = '<i class="bi ' + (icons[cls] || 'bi-info-circle') + '" aria-hidden="true"></i><span>' + msg + '</span>';
        w.appendChild(t);
        setTimeout(function () { t.classList.add('show'); }, 10);
        setTimeout(function () {
            t.classList.remove('show');
            setTimeout(function () { t.remove(); }, 250);
        }, 3500);
    };

    window.renderPaginacion = function (wrapId, total, pagina, pageSize, fnNombre) {
        var el = document.getElementById(wrapId);
        if (!el) return;
        if (!total || total <= pageSize) { el.innerHTML = ''; return; }
        var totalPags = Math.ceil(total / pageSize);
        var inicio = (pagina - 1) * pageSize + 1;
        var fin = Math.min(pagina * pageSize, total);
        el.innerHTML =
            '<div class="pag-info">Mostrando ' + inicio + '-' + fin + ' de ' + total + '</div>' +
            '<div class="pag-controles">' +
                '<button class="pag-btn" aria-label="Pagina anterior"' + (pagina <= 1 ? ' disabled' : '') +
                    ' onclick="' + fnNombre + '(' + (pagina - 1) + ')">&lsaquo;</button>' +
                '<span class="pag-num">Pag. ' + pagina + ' / ' + totalPags + '</span>' +
                '<button class="pag-btn" aria-label="Pagina siguiente"' + (pagina >= totalPags ? ' disabled' : '') +
                    ' onclick="' + fnNombre + '(' + (pagina + 1) + ')">&rsaquo;</button>' +
            '</div>';
    };
})();
