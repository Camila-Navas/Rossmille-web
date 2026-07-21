// ============================================================
// i18n -- diccionario ES/EN + aplicacion de traducciones
// ============================================================
// Los textos de la interfaz viven aqui (no escritos a mano en el HTML).
// Cada pantalla marca sus nodos con data-i18n="clave" (texto),
// data-i18n-placeholder="clave" (placeholder) o data-i18n-aria="clave"
// (aria-label/title) y applyTranslations() los llena. Agregar un idioma
// nuevo = agregar una entrada mas en RM_I18N, sin tocar el HTML.
(function () {
    'use strict';

    var STORAGE_KEY = 'rm_lang';

    var RM_I18N = {
        es: {
            // Comunes
            'common.save': 'Guardar',
            'common.cancel': 'Cancelar',
            'common.close': 'Cerrar',
            'common.delete': 'Eliminar',
            'common.search': 'Buscar',
            'common.clear': 'Limpiar',
            'common.new': 'Nuevo',
            'common.actions': 'Acciones',
            'common.loading': 'Cargando...',
            'common.password': 'Contrasena',
            'common.id': 'ID',
            'common.name': 'Nombre',
            'common.email': 'Correo',
            'common.phone': 'Telefono',

            // Sidebar / navegacion
            'nav.dashboard': 'Inicio',
            'nav.vender': 'Vender',
            'nav.productos': 'Productos',
            'nav.clientes': 'Clientes',
            'nav.pedidos': 'Pedidos',
            'nav.usuarios': 'Usuarios',
            'nav.reporte': 'Reporte',
            'nav.configuracion': 'Configuracion',
            'nav.admin': 'Admin',
            'nav.brandSub': 'Punto de Venta',
            'nav.logout': 'Cerrar sesion',
            'nav.ariaMain': 'Navegacion principal',

            // Topbar
            'topbar.openMenu': 'Abrir menu de navegacion',
            'topbar.closeMenu': 'Cerrar menu de navegacion',
            'topbar.theme': 'Tema',
            'topbar.mode': 'Modo',
            'topbar.modeClaro': 'Claro',
            'topbar.modeOscuro': 'Oscuro',
            'topbar.accent': 'Color de acento',
            'topbar.accentIndigo': 'Indigo',
            'topbar.accentEsmeralda': 'Esmeralda',
            'topbar.accentBorgona': 'Borgona',
            'topbar.language': 'Idioma',
            'topbar.langEs': 'Espanol',
            'topbar.langEn': 'English',

            // Footer
            'footer.rights': 'Todos los derechos reservados.',
            'footer.madeBy': 'Desarrollado por Camila Navas.',

            // Login
            'login.title': 'ROSS MILLE',
            'login.subtitle': 'Sistema de Punto de Venta',
            'login.id': 'ID de Usuario',
            'login.idPlaceholder': 'Ingrese su ID',
            'login.role': 'Cargo',
            'login.rolePlaceholder': 'Seleccionar cargo',
            'login.roleAdmin': 'Administrador',
            'login.roleEmployee': 'Empleado',
            'login.password': 'Contrasena',
            'login.passwordPlaceholder': 'Ingrese su contrasena',
            'login.submit': 'Iniciar Sesion',
            'login.submitting': 'Verificando...',
            'login.errorRequired': 'Todos los campos son obligatorios.',
            'login.errorConnection': 'No se pudo conectar con el servidor.',
            'login.skip': 'Saltar al formulario',

            // Encabezados de pagina
            'page.dashboard.subtitle': '',
            'page.vender.title': 'Vender',
            'page.vender.subtitle': 'Registra una nueva venta y gestiona el carrito',
            'page.productos.title': 'Productos',
            'page.productos.subtitle': 'Catalogo, stock y precios del inventario',
            'page.clientes.title': 'Clientes',
            'page.clientes.subtitle': 'Base de datos de clientes e historial de compras',
            'page.pedidos.title': 'Pedidos',
            'page.pedidos.subtitle': 'Encargos activos e historial de pedidos atendidos',
            'page.usuarios.title': 'Usuarios',
            'page.usuarios.subtitle': 'Gestion de cuentas y roles del sistema',
            'page.reporte.title': 'Reporte de Ventas',
            'page.reporte.subtitle': 'Analiza el desempeno del negocio por periodo',
            'page.configuracion.title': 'Configuracion',
            'page.configuracion.subtitle': 'Administra los parametros y ajustes del sistema ROSS MILLE',

            // Skip link
            'a11y.skipToContent': 'Saltar al contenido principal'
        },
        en: {
            'common.save': 'Save',
            'common.cancel': 'Cancel',
            'common.close': 'Close',
            'common.delete': 'Delete',
            'common.search': 'Search',
            'common.clear': 'Clear',
            'common.new': 'New',
            'common.actions': 'Actions',
            'common.loading': 'Loading...',
            'common.password': 'Password',
            'common.id': 'ID',
            'common.name': 'Name',
            'common.email': 'Email',
            'common.phone': 'Phone',

            'nav.dashboard': 'Home',
            'nav.vender': 'Sell',
            'nav.productos': 'Products',
            'nav.clientes': 'Customers',
            'nav.pedidos': 'Orders',
            'nav.usuarios': 'Users',
            'nav.reporte': 'Reports',
            'nav.configuracion': 'Settings',
            'nav.admin': 'Admin',
            'nav.brandSub': 'Point of Sale',
            'nav.logout': 'Log out',
            'nav.ariaMain': 'Main navigation',

            'topbar.openMenu': 'Open navigation menu',
            'topbar.closeMenu': 'Close navigation menu',
            'topbar.theme': 'Theme',
            'topbar.mode': 'Mode',
            'topbar.modeClaro': 'Light',
            'topbar.modeOscuro': 'Dark',
            'topbar.accent': 'Accent color',
            'topbar.accentIndigo': 'Indigo',
            'topbar.accentEsmeralda': 'Emerald',
            'topbar.accentBorgona': 'Burgundy',
            'topbar.language': 'Language',
            'topbar.langEs': 'Espanol',
            'topbar.langEn': 'English',

            'footer.rights': 'All rights reserved.',
            'footer.madeBy': 'Built by Camila Navas.',

            'login.title': 'ROSS MILLE',
            'login.subtitle': 'Point of Sale System',
            'login.id': 'User ID',
            'login.idPlaceholder': 'Enter your ID',
            'login.role': 'Role',
            'login.rolePlaceholder': 'Select a role',
            'login.roleAdmin': 'Administrator',
            'login.roleEmployee': 'Employee',
            'login.password': 'Password',
            'login.passwordPlaceholder': 'Enter your password',
            'login.submit': 'Sign In',
            'login.submitting': 'Verifying...',
            'login.errorRequired': 'All fields are required.',
            'login.errorConnection': 'Could not connect to the server.',
            'login.skip': 'Skip to form',

            'page.dashboard.subtitle': '',
            'page.vender.title': 'Sell',
            'page.vender.subtitle': 'Register a new sale and manage the cart',
            'page.productos.title': 'Products',
            'page.productos.subtitle': 'Catalog, stock and pricing for your inventory',
            'page.clientes.title': 'Customers',
            'page.clientes.subtitle': 'Customer database and purchase history',
            'page.pedidos.title': 'Orders',
            'page.pedidos.subtitle': 'Active orders and history of completed orders',
            'page.usuarios.title': 'Users',
            'page.usuarios.subtitle': 'Manage system accounts and roles',
            'page.reporte.title': 'Sales Report',
            'page.reporte.subtitle': 'Analyze business performance by period',
            'page.configuracion.title': 'Settings',
            'page.configuracion.subtitle': 'Manage ROSS MILLE system parameters and preferences',

            'a11y.skipToContent': 'Skip to main content'
        }
    };

    function detectInitialLang() {
        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            if (stored && RM_I18N[stored]) return stored;
        } catch (e) { /* ignorar */ }
        var nav = (navigator.language || navigator.userLanguage || 'es').toLowerCase();
        return nav.indexOf('en') === 0 ? 'en' : 'es';
    }

    var currentLang = detectInitialLang();

    function t(key) {
        var dict = RM_I18N[currentLang] || RM_I18N.es;
        if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
        return RM_I18N.es[key] || key;
    }

    function applyTranslations(root) {
        var scope = root || document;
        scope.querySelectorAll('[data-i18n]').forEach(function (el) {
            el.textContent = t(el.getAttribute('data-i18n'));
        });
        scope.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
        });
        scope.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
            el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
        });
        scope.querySelectorAll('[data-i18n-title]').forEach(function (el) {
            el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
        });
    }

    function setLang(lang) {
        if (!RM_I18N[lang]) return;
        currentLang = lang;
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignorar */ }
        document.documentElement.lang = lang;
        applyTranslations(document);
        document.dispatchEvent(new CustomEvent('rm:langchange', { detail: { lang: lang } }));
    }

    document.documentElement.lang = currentLang;

    window.RMI18n = {
        t: t,
        getLang: function () { return currentLang; },
        setLang: setLang,
        applyTranslations: applyTranslations,
        SUPPORTED: Object.keys(RM_I18N)
    };
})();
