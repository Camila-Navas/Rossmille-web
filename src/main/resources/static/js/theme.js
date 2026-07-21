// ============================================================
// RMTheme -- motor unico de temas (modo claro/oscuro + acento)
// ============================================================
// Fuente de verdad para TODO cambio visual de color/tipografia en la app:
//  - el selector rapido de la topbar (todas las paginas, todos los roles)
//  - el panel Configuracion > Apariencia (solo Admin, persiste en la BD)
// Ambos llaman a las mismas funciones para no duplicar logica ni
// terminar con dos "temas" desincronizados.
//
// Persistencia: localStorage 'rm_theme' = { mode, accent, customHex, fontSize }
// Migra automaticamente el formato anterior ('rm_apariencia') si existe.
(function () {
    'use strict';

    var STORAGE_KEY = 'rm_theme';
    var LEGACY_KEY = 'rm_apariencia';

    var ACCENTS = {
        indigo:    { label: 'Indigo',    hex: '#6366f1' },
        esmeralda: { label: 'Esmeralda', hex: '#059669' },
        borgona:   { label: 'Borgona',   hex: '#9f1239' }
    };

    function readPrefs() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) { /* localStorage invalido */ }

        // Migracion desde el formato anterior (Fase E/F)
        try {
            var legacy = localStorage.getItem(LEGACY_KEY);
            if (legacy) {
                var ap = JSON.parse(legacy);
                var migrated = {
                    mode: ap.tema === 'oscuro' ? 'oscuro' : 'claro',
                    accent: 'custom',
                    customHex: ap.color || ACCENTS.indigo.hex,
                    fontSize: ap.fuente ? parseInt(ap.fuente, 10) : 15
                };
                savePrefs(migrated);
                return migrated;
            }
        } catch (e) { /* ignorar */ }

        return null;
    }

    function savePrefs(prefs) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch (e) { /* ignorar */ }
    }

    function ajustarBrillo(hex, delta) {
        var r = parseInt(hex.slice(1, 3), 16);
        var g = parseInt(hex.slice(3, 5), 16);
        var b = parseInt(hex.slice(5, 7), 16);
        r = Math.max(0, Math.min(255, r + delta));
        g = Math.max(0, Math.min(255, g + delta));
        b = Math.max(0, Math.min(255, b + delta));
        return '#' + [r, g, b].map(function (v) { return v.toString(16).padStart(2, '0'); }).join('');
    }

    var current = {
        mode: 'claro',
        accent: 'indigo',
        customHex: ACCENTS.indigo.hex,
        fontSize: 15
    };

    function applyToDom() {
        var root = document.documentElement;

        if (current.mode === 'oscuro') root.setAttribute('data-mode', 'oscuro');
        else root.removeAttribute('data-mode');

        if (current.accent === 'custom') {
            root.setAttribute('data-accent', 'custom');
            root.style.setProperty('--rm-accent', current.customHex);
            root.style.setProperty('--rm-accent-h', ajustarBrillo(current.customHex, -20));
        } else {
            root.setAttribute('data-accent', current.accent);
            root.style.removeProperty('--rm-accent');
            root.style.removeProperty('--rm-accent-h');
        }

        root.style.fontSize = current.fontSize + 'px';
    }

    function setMode(mode) {
        current.mode = mode === 'oscuro' ? 'oscuro' : 'claro';
        applyToDom();
        savePrefs(current);
        document.dispatchEvent(new CustomEvent('rm:themechange', { detail: getState() }));
    }

    function toggleMode() {
        setMode(current.mode === 'oscuro' ? 'claro' : 'oscuro');
    }

    function setAccentPreset(name) {
        if (!ACCENTS[name]) return;
        current.accent = name;
        applyToDom();
        savePrefs(current);
        document.dispatchEvent(new CustomEvent('rm:themechange', { detail: getState() }));
    }

    function setCustomAccent(hex) {
        current.accent = 'custom';
        current.customHex = hex;
        applyToDom();
        savePrefs(current);
        document.dispatchEvent(new CustomEvent('rm:themechange', { detail: getState() }));
    }

    function setFontSize(px) {
        current.fontSize = parseInt(px, 10) || 15;
        applyToDom();
        savePrefs(current);
    }

    function getState() {
        return {
            mode: current.mode,
            accent: current.accent,
            customHex: current.customHex,
            fontSize: current.fontSize,
            accentHex: current.accent === 'custom' ? current.customHex : ACCENTS[current.accent].hex
        };
    }

    function init() {
        var stored = readPrefs();
        if (stored) {
            current.mode = stored.mode || current.mode;
            current.accent = stored.accent || current.accent;
            current.customHex = stored.customHex || current.customHex;
            current.fontSize = stored.fontSize || current.fontSize;
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            // Sin preferencia guardada: respeta la preferencia del sistema operativo
            current.mode = 'oscuro';
        }
        applyToDom();
    }

    // Aplicar lo antes posible (antes de pintar) para evitar parpadeo de tema
    init();

    window.RMTheme = {
        ACCENTS: ACCENTS,
        getState: getState,
        setMode: setMode,
        toggleMode: toggleMode,
        setAccentPreset: setAccentPreset,
        setCustomAccent: setCustomAccent,
        setFontSize: setFontSize,
        resetToDefault: function () {
            current = { mode: 'claro', accent: 'indigo', customHex: ACCENTS.indigo.hex, fontSize: 15 };
            applyToDom();
            savePrefs(current);
            document.dispatchEvent(new CustomEvent('rm:themechange', { detail: getState() }));
        }
    };
})();
