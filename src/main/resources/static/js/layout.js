// ============================================================
// layout.js -- shell de la aplicacion (sidebar + topbar + footer)
// ============================================================
// La navegacion se describe una sola vez como datos (RM_MODULES) y se
// renderiza igual en las 9 paginas: evita tener el mismo <nav> de 20
// lineas copiado y pegado en cada .html (y desincronizado con el tiempo).
// Cada pagina solo necesita:
//   <div id="rmSidebarMount"></div>
//   <div id="rmDrawerBackdrop" class="rm-drawer-backdrop"></div>
//   <div id="rmTopbarMount"></div>
//   ... <main id="main"> contenido </main>
//   <div id="rmFooterMount"></div>
//   <script>initApp({ activeKey: 'productos', titleKey: 'page.productos.title', subtitleKey: 'page.productos.subtitle' });</script>
(function () {
    'use strict';

    var RM_MODULES = [
        { key: 'dashboard',     icon: 'bi-house-door',        href: '/dashboard.html',     labelKey: 'nav.dashboard' },
        { key: 'vender',        icon: 'bi-cart3',              href: '/vender.html',        labelKey: 'nav.vender' },
        { key: 'productos',     icon: 'bi-box-seam',           href: '/productos.html',     labelKey: 'nav.productos' },
        { key: 'clientes',      icon: 'bi-people',             href: '/clientes.html',      labelKey: 'nav.clientes' },
        { key: 'pedidos',       icon: 'bi-clipboard2-list',    href: '/pedidos.html',       labelKey: 'nav.pedidos' },
        { key: 'usuarios',      icon: 'bi-person-gear',        href: '/usuarios.html',      labelKey: 'nav.usuarios',      adminOnly: true, sepBefore: true },
        { key: 'reporte',       icon: 'bi-bar-chart-line',     href: '/reporte.html',       labelKey: 'nav.reporte',       adminOnly: true },
        { key: 'configuracion', icon: 'bi-gear',               href: '/configuracion.html', labelKey: 'nav.configuracion', adminOnly: true }
    ];

    function iniciales(nombre) {
        if (!nombre) return '?';
        var partes = nombre.trim().split(/\s+/);
        var ini = partes[0].charAt(0);
        if (partes.length > 1) ini += partes[partes.length - 1].charAt(0);
        return ini.toUpperCase();
    }

    // ------------------------------------------------------------
    // Sidebar
    // ------------------------------------------------------------
    function renderSidebar(activeKey, session) {
        var mount = document.getElementById('rmSidebarMount');
        if (!mount) return;

        var items = RM_MODULES.map(function (m) {
            var sep = m.sepBefore ? '<li class="rm-nav-admin"><div class="rm-nav-sep"></div></li>' : '';
            var adminCls = m.adminOnly ? ' rm-nav-admin' : '';
            var active = m.key === activeKey ? ' active' : '';
            return sep +
                '<li class="' + adminCls.trim() + '">' +
                '<a href="' + m.href + '" class="rm-nav-link' + active + '"' + (active ? ' aria-current="page"' : '') + '>' +
                '<i class="bi ' + m.icon + '"></i> <span data-i18n="' + m.labelKey + '"></span>' +
                (m.adminOnly ? '<span class="rm-nav-badge" data-i18n="nav.admin"></span>' : '') +
                '</a></li>';
        }).join('');

        mount.outerHTML =
            '<nav class="rm-sidebar" id="rmSidebarMount" aria-label="">' +
                '<button type="button" class="rm-sidebar-close" id="rmSidebarClose" data-i18n-aria="topbar.closeMenu">' +
                    '<i class="bi bi-x-lg" aria-hidden="true"></i>' +
                '</button>' +
                '<div class="rm-sidebar-brand">' +
                    '<div class="brand-name">ROSS <span class="brand-gold">MILLE</span></div>' +
                    '<span class="brand-sub" data-i18n="nav.brandSub"></span>' +
                '</div>' +
                '<ul class="rm-nav">' + items + '</ul>' +
                '<div class="rm-sidebar-footer">' +
                    '<div class="sf-name" id="sb-name"></div>' +
                    '<div class="sf-role" id="sb-role"></div>' +
                    '<button class="rm-btn-logout" onclick="logout()">' +
                        '<i class="bi bi-box-arrow-right" aria-hidden="true"></i> <span data-i18n="nav.logout"></span>' +
                    '</button>' +
                '</div>' +
            '</nav>';

        if (session) {
            var n = document.getElementById('sb-name');
            var r = document.getElementById('sb-role');
            if (n) n.textContent = session.nombre;
            if (r) r.textContent = session.rol;
            if (session.rol !== 'Administrador') {
                document.querySelectorAll('.rm-nav-admin').forEach(function (el) { el.style.display = 'none'; });
            }
        }
    }

    // ------------------------------------------------------------
    // Topbar
    // ------------------------------------------------------------
    function renderTopbar(titleKey, subtitleKey, session) {
        var mount = document.getElementById('rmTopbarMount');
        if (!mount) return;

        var lang = window.RMI18n ? window.RMI18n.getLang() : 'es';
        var themeState = window.RMTheme ? window.RMTheme.getState() : { mode: 'claro', accent: 'indigo' };

        mount.outerHTML =
            '<header class="rm-topbar" id="rmTopbarMount">' +
                '<button type="button" class="rm-topbar-hamburger" id="rmHamburger" aria-expanded="false" aria-controls="rmSidebarMount" data-i18n-aria="topbar.openMenu">' +
                    '<i class="bi bi-list" aria-hidden="true"></i>' +
                '</button>' +
                '<div class="rm-topbar-titles">' +
                    '<p class="rm-topbar-title" data-i18n="' + titleKey + '"></p>' +
                    (subtitleKey ? '<p class="rm-topbar-subtitle" data-i18n="' + subtitleKey + '"></p>' : '') +
                '</div>' +
                '<div class="rm-topbar-actions">' +

                    '<div class="rm-switcher" id="switchTheme">' +
                        '<button type="button" class="rm-icon-btn" aria-haspopup="true" aria-expanded="false" data-i18n-aria="topbar.theme">' +
                            '<i class="bi ' + (themeState.mode === 'oscuro' ? 'bi-moon-stars' : 'bi-sun') + '" aria-hidden="true"></i>' +
                        '</button>' +
                        '<div class="rm-switcher-menu" role="menu">' +
                            '<div class="rm-switcher-heading" data-i18n="topbar.mode"></div>' +
                            '<button type="button" class="rm-switcher-item" role="menuitemradio" data-mode="claro">' +
                                '<i class="bi bi-sun" aria-hidden="true"></i><span data-i18n="topbar.modeClaro"></span></button>' +
                            '<button type="button" class="rm-switcher-item" role="menuitemradio" data-mode="oscuro">' +
                                '<i class="bi bi-moon-stars" aria-hidden="true"></i><span data-i18n="topbar.modeOscuro"></span></button>' +
                            '<div class="rm-switcher-heading" data-i18n="topbar.accent"></div>' +
                            '<button type="button" class="rm-switcher-item" role="menuitemradio" data-accent="indigo">' +
                                '<span class="swatch" style="background:#6366f1"></span><span data-i18n="topbar.accentIndigo"></span></button>' +
                            '<button type="button" class="rm-switcher-item" role="menuitemradio" data-accent="esmeralda">' +
                                '<span class="swatch" style="background:#059669"></span><span data-i18n="topbar.accentEsmeralda"></span></button>' +
                            '<button type="button" class="rm-switcher-item" role="menuitemradio" data-accent="borgona">' +
                                '<span class="swatch" style="background:#9f1239"></span><span data-i18n="topbar.accentBorgona"></span></button>' +
                        '</div>' +
                    '</div>' +

                    '<div class="rm-switcher" id="switchLang">' +
                        '<button type="button" class="rm-icon-btn" aria-haspopup="true" aria-expanded="false" data-i18n-aria="topbar.language">' +
                            '<i class="bi bi-translate" aria-hidden="true"></i>' +
                        '</button>' +
                        '<div class="rm-switcher-menu" role="menu">' +
                            '<div class="rm-switcher-heading" data-i18n="topbar.language"></div>' +
                            '<button type="button" class="rm-switcher-item" role="menuitemradio" data-lang="es">' +
                                '<span data-i18n="topbar.langEs"></span></button>' +
                            '<button type="button" class="rm-switcher-item" role="menuitemradio" data-lang="en">' +
                                '<span data-i18n="topbar.langEn"></span></button>' +
                        '</div>' +
                    '</div>' +

                    '<div class="rm-user-chip">' +
                        '<span class="rm-user-avatar" id="rmUserAvatar"></span>' +
                        '<span class="rm-user-meta"><span class="u-name" id="rmUserName"></span><br><span class="u-role" id="rmUserRole"></span></span>' +
                    '</div>' +
                '</div>' +
            '</header>';

        if (session) {
            var avatar = document.getElementById('rmUserAvatar');
            var name = document.getElementById('rmUserName');
            var role = document.getElementById('rmUserRole');
            if (avatar) avatar.textContent = iniciales(session.nombre);
            if (name) name.textContent = session.nombre;
            if (role) role.textContent = session.rol;
        }

        wireSwitcher('switchTheme', function (menu) {
            markActive('switchTheme', 'data-mode', themeState.mode);
            markActive('switchTheme', 'data-accent', themeState.accent);
            menu.addEventListener('click', function (e) {
                var target = e.target.closest('[data-mode], [data-accent]');
                if (!target) return;
                if (target.hasAttribute('data-mode')) window.RMTheme.setMode(target.getAttribute('data-mode'));
                if (target.hasAttribute('data-accent')) window.RMTheme.setAccentPreset(target.getAttribute('data-accent'));
                refreshThemeIcon();
                markActive('switchTheme', 'data-mode', window.RMTheme.getState().mode);
                markActive('switchTheme', 'data-accent', window.RMTheme.getState().accent);
            });
        });

        wireSwitcher('switchLang', function (menu) {
            markActive('switchLang', 'data-lang', lang);
            menu.addEventListener('click', function (e) {
                var target = e.target.closest('[data-lang]');
                if (!target) return;
                window.RMI18n.setLang(target.getAttribute('data-lang'));
                markActive('switchLang', 'data-lang', target.getAttribute('data-lang'));
            });
        });
    }

    function refreshThemeIcon() {
        var icon = document.querySelector('#switchTheme > .rm-icon-btn i');
        if (!icon) return;
        var mode = window.RMTheme.getState().mode;
        icon.className = 'bi ' + (mode === 'oscuro' ? 'bi-moon-stars' : 'bi-sun');
    }

    function markActive(mountId, attr, value) {
        var mount = document.getElementById(mountId);
        if (!mount) return;
        mount.querySelectorAll('[' + attr + ']').forEach(function (el) {
            el.setAttribute('aria-checked', el.getAttribute(attr) === value ? 'true' : 'false');
        });
    }

    function wireSwitcher(mountId, wireClickHandler) {
        var wrap = document.getElementById(mountId);
        if (!wrap) return;
        var btn = wrap.querySelector('.rm-icon-btn');
        var menu = wrap.querySelector('.rm-switcher-menu');

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var isOpen = wrap.classList.toggle('open');
            btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            document.querySelectorAll('.rm-switcher.open').forEach(function (other) {
                if (other !== wrap) { other.classList.remove('open'); }
            });
        });
        document.addEventListener('click', function (e) {
            if (!wrap.contains(e.target)) { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { wrap.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
        });

        wireClickHandler(menu);
    }

    // ------------------------------------------------------------
    // Footer
    // ------------------------------------------------------------
    function renderFooter() {
        var mount = document.getElementById('rmFooterMount');
        if (!mount) return;
        var year = new Date().getFullYear();
        mount.outerHTML =
            '<footer class="rm-footer" id="rmFooterMount">' +
                '<span class="rm-footer-brand">ROSS <span class="brand-gold">MILLE</span> &copy; ' + year + '</span>' +
                '<span data-i18n="footer.madeBy"></span>' +
            '</footer>';
    }

    // ------------------------------------------------------------
    // Drawer movil (sidebar como panel deslizante en pantallas chicas)
    // ------------------------------------------------------------
    function initMobileDrawer() {
        var hamburger = document.getElementById('rmHamburger');
        var backdrop = document.getElementById('rmDrawerBackdrop');
        var sidebar = document.querySelector('.rm-sidebar');
        if (!hamburger || !sidebar) return;

        function openDrawer() {
            sidebar.classList.add('open');
            if (backdrop) backdrop.classList.add('show');
            hamburger.setAttribute('aria-expanded', 'true');
        }
        function closeDrawer() {
            sidebar.classList.remove('open');
            if (backdrop) backdrop.classList.remove('show');
            hamburger.setAttribute('aria-expanded', 'false');
            hamburger.focus();
        }

        hamburger.addEventListener('click', function () {
            sidebar.classList.contains('open') ? closeDrawer() : openDrawer();
        });
        if (backdrop) backdrop.addEventListener('click', closeDrawer);
        var closeBtn = document.getElementById('rmSidebarClose');
        if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && sidebar.classList.contains('open')) closeDrawer();
        });
        sidebar.querySelectorAll('.rm-nav-link').forEach(function (link) {
            link.addEventListener('click', closeDrawer);
        });
    }

    // ------------------------------------------------------------
    // Colapsar sidebar en escritorio (preferencia persistida)
    // ------------------------------------------------------------
    function initDesktopCollapse() {
        var sidebar = document.querySelector('.rm-sidebar');
        if (!sidebar) return;

        var btn = document.createElement('button');
        btn.className = 'rm-sidebar-toggle-btn';
        btn.setAttribute('title', 'Contraer menu');
        btn.innerHTML = '<i class="bi bi-chevron-left" aria-hidden="true"></i>';
        document.body.appendChild(btn);

        if (localStorage.getItem('rm_sidebar_collapsed') === '1') {
            document.body.classList.add('sidebar-collapsed');
            btn.innerHTML = '<i class="bi bi-chevron-right" aria-hidden="true"></i>';
            btn.setAttribute('title', 'Expandir menu');
        }

        btn.addEventListener('click', function () {
            var collapsed = document.body.classList.toggle('sidebar-collapsed');
            localStorage.setItem('rm_sidebar_collapsed', collapsed ? '1' : '0');
            btn.innerHTML = collapsed
                ? '<i class="bi bi-chevron-right" aria-hidden="true"></i>'
                : '<i class="bi bi-chevron-left" aria-hidden="true"></i>';
            btn.setAttribute('title', collapsed ? 'Expandir menu' : 'Contraer menu');
        });
    }

    // ------------------------------------------------------------
    // Revelado suave al hacer scroll (IntersectionObserver)
    // ------------------------------------------------------------
    function initScrollReveal() {
        var targets = document.querySelectorAll('.reveal');
        if (!targets.length) return;

        var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion || !('IntersectionObserver' in window)) {
            targets.forEach(function (el) { el.classList.add('in-view'); });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

        targets.forEach(function (el) { observer.observe(el); });
    }

    // ------------------------------------------------------------
    // Punto de entrada unico por pagina
    // ------------------------------------------------------------
    window.initApp = function (opts) {
        opts = opts || {};
        var session = window.guardRoute ? guardRoute() : null;
        if (!session) return null;

        renderSidebar(opts.activeKey, session);
        renderTopbar(opts.titleKey || 'nav.dashboard', opts.subtitleKey, session);
        renderFooter();

        if (window.RMI18n) window.RMI18n.applyTranslations(document);

        initMobileDrawer();
        initDesktopCollapse();
        initScrollReveal();

        document.addEventListener('rm:langchange', function () {
            // Re-render de textos generados dinamicamente por JS de cada modulo
            renderSidebar(opts.activeKey, session);
            renderTopbar(opts.titleKey || 'nav.dashboard', opts.subtitleKey, session);
            renderFooter();
            window.RMI18n.applyTranslations(document);
            initMobileDrawer();
        });

        return session;
    };
})();
