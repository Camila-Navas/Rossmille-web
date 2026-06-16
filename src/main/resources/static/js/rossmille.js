(function () {
    var toastWrap;

    function getWrap() {
        if (!toastWrap) {
            toastWrap = document.createElement('div');
            toastWrap.className = 'rm-toast-wrap';
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
        t.innerHTML = '<i class="bi ' + (icons[cls] || 'bi-info-circle') + '"></i><span>' + msg + '</span>';
        w.appendChild(t);
        setTimeout(function () { t.classList.add('show'); }, 10);
        setTimeout(function () {
            t.classList.remove('show');
            setTimeout(function () { t.remove(); }, 250);
        }, 3500);
    };

    window.initSidebar = function (session) {
        if (!session) return;
        var n = document.getElementById('sb-name');
        var r = document.getElementById('sb-role');
        if (n) n.textContent = session.nombre;
        if (r) r.textContent = session.rol;
        if (session.rol !== 'Administrador') {
            document.querySelectorAll('.rm-nav-admin').forEach(function (el) {
                el.style.display = 'none';
            });
        }

        // Sidebar collapse toggle
        var sidebar = document.querySelector('.rm-sidebar');
        if (!sidebar) return;

        var btn = document.createElement('button');
        btn.className = 'rm-sidebar-toggle-btn';
        btn.setAttribute('title', 'Contraer menu');
        btn.innerHTML = '<i class="bi bi-chevron-left"></i>';
        document.body.appendChild(btn);

        if (localStorage.getItem('rm_sidebar_collapsed') === '1') {
            document.body.classList.add('sidebar-collapsed');
            btn.innerHTML = '<i class="bi bi-chevron-right"></i>';
            btn.setAttribute('title', 'Expandir menu');
        }

        btn.addEventListener('click', function () {
            var collapsed = document.body.classList.toggle('sidebar-collapsed');
            localStorage.setItem('rm_sidebar_collapsed', collapsed ? '1' : '0');
            btn.innerHTML = collapsed
                ? '<i class="bi bi-chevron-right"></i>'
                : '<i class="bi bi-chevron-left"></i>';
            btn.setAttribute('title', collapsed ? 'Expandir menu' : 'Contraer menu');
        });
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
                '<button class="pag-btn"' + (pagina <= 1 ? ' disabled' : '') +
                    ' onclick="' + fnNombre + '(' + (pagina - 1) + ')">&lsaquo;</button>' +
                '<span class="pag-num">Pag. ' + pagina + ' / ' + totalPags + '</span>' +
                '<button class="pag-btn"' + (pagina >= totalPags ? ' disabled' : '') +
                    ' onclick="' + fnNombre + '(' + (pagina + 1) + ')">&rsaquo;</button>' +
            '</div>';
    };
})();
