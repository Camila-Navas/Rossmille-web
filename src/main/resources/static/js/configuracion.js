(function () {
    'use strict';

    var cfgCache = {};
    var temaActual = 'claro';
    var logoBase64 = '';

    // ----------------------------------------------------------------
    // Tabs
    // ----------------------------------------------------------------
    document.querySelectorAll('.cfg-tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.cfg-tab-btn').forEach(function (b) { b.classList.remove('active'); });
            document.querySelectorAll('.cfg-pane').forEach(function (p) { p.classList.remove('active'); });
            btn.classList.add('active');
            var pane = document.getElementById('pane-' + btn.dataset.pane);
            if (pane) pane.classList.add('active');
        });
    });

    // ----------------------------------------------------------------
    // Cargar toda la configuracion al iniciar
    // ----------------------------------------------------------------
    window.cargarConfiguracion = function () {
        apiFetch('/configuracion').then(function (res) {
            if (!res.ok) { showToast('Error al cargar configuracion', 'error'); return; }
            cfgCache = res.data || {};
            poblarFormularios();
        }).catch(function () {
            showToast('No se pudo conectar con el servidor', 'error');
        });
    };

    function poblarFormularios() {
        // Texto e inputs normales
        Object.keys(cfgCache).forEach(function (clave) {
            var el = document.getElementById('cfg-' + clave);
            if (!el) return;
            if (el.tagName === 'SELECT' || el.tagName === 'TEXTAREA' || el.type === 'text'
                    || el.type === 'email' || el.type === 'number' || el.type === 'color'
                    || el.type === 'range') {
                el.value = cfgCache[clave];
            }
        });

        // Checkboxes de metodos de pago
        var metodos = (cfgCache['ventas.metodos_pago'] || '').split(',').map(function (s) { return s.trim(); });
        document.querySelectorAll('.metodo-pago-chk').forEach(function (chk) {
            chk.checked = metodos.indexOf(chk.value) >= 0;
        });

        // Toggles de notificaciones
        setToggle('cfg-notificaciones.alertas_sistema', cfgCache['notificaciones.alertas_sistema'] === 'true');
        setToggle('cfg-notificaciones.alertas_correo', cfgCache['notificaciones.alertas_correo'] === 'true');

        // Logo
        logoBase64 = cfgCache['empresa.logo_base64'] || '';
        mostrarLogoPreview(logoBase64);

        // Apariencia
        temaActual = cfgCache['apariencia.tema'] || 'claro';
        actualizarUiTema(temaActual);

        var color = cfgCache['apariencia.color_principal'] || '#6366f1';
        actualizarColorPreview(color);

        var fuente = cfgCache['apariencia.tamano_fuente'] || '15';
        document.getElementById('fontSizeLabel').textContent = fuente + 'px';

        // Aplicar apariencia guardada al cargar
        aplicarAparienciaLocal(temaActual, color, fuente);
    }

    // ----------------------------------------------------------------
    // Guardar grupo de configuracion
    // ----------------------------------------------------------------
    window.guardarGrupo = function (grupo) {
        var cambios = {};

        // Recolectar todos los inputs del grupo
        document.querySelectorAll('[id^="cfg-' + grupo + '."]').forEach(function (el) {
            var clave = el.id.replace('cfg-', '');
            if (el.type === 'checkbox') {
                cambios[clave] = el.checked ? 'true' : 'false';
            } else {
                cambios[clave] = el.value;
            }
        });

        // Caso especial: metodos de pago (checkboxes por valor)
        if (grupo === 'ventas') {
            var seleccionados = [];
            document.querySelectorAll('.metodo-pago-chk:checked').forEach(function (chk) {
                seleccionados.push(chk.value);
            });
            if (seleccionados.length === 0) {
                showToast('Debes seleccionar al menos un metodo de pago', 'error');
                return;
            }
            cambios['ventas.metodos_pago'] = seleccionados.join(',');
        }

        // Caso especial: logo
        if (grupo === 'empresa') {
            cambios['empresa.logo_base64'] = logoBase64;
        }

        // Caso especial: tema (no tiene input en el DOM, se toma de la variable)
        if (grupo === 'apariencia') {
            cambios['apariencia.tema'] = temaActual;
        }

        // Validaciones basicas
        var error = validarGrupo(grupo, cambios);
        if (error) { showToast(error, 'error'); return; }

        apiFetch('/configuracion', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cambios)
        }).then(function (res) {
            if (res.ok) {
                Object.assign(cfgCache, cambios);

                // Aplicar apariencia de inmediato al guardar
                if (grupo === 'apariencia') {
                    guardarAparienciaLocalStorage(cambios);
                }

                showToast('Configuracion guardada correctamente', 'success');
                var ahora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
                document.getElementById('lastSavedText').textContent = 'Guardado a las ' + ahora;
                document.getElementById('headerStatus').style.display = '';
            } else {
                showToast(res.message || 'Error al guardar', 'error');
            }
        }).catch(function () {
            showToast('Error de conexion al guardar', 'error');
        });
    };

    function validarGrupo(grupo, cambios) {
        if (grupo === 'empresa') {
            if (!cambios['empresa.nombre'] || !cambios['empresa.nombre'].trim()) {
                return 'El nombre de la empresa es obligatorio';
            }
            var correo = cambios['empresa.correo'];
            if (correo && correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
                return 'El correo electronico no es valido';
            }
        }
        if (grupo === 'sistema') {
            var iva = parseFloat(cambios['sistema.iva_porcentaje']);
            if (isNaN(iva) || iva < 0 || iva > 100) return 'El IVA debe estar entre 0 y 100';
        }
        if (grupo === 'ventas') {
            var desc = parseInt(cambios['ventas.descuento_maximo'], 10);
            if (isNaN(desc) || desc < 0 || desc > 100) return 'El descuento maximo debe estar entre 0 y 100';
        }
        if (grupo === 'seguridad') {
            var h = parseInt(cambios['seguridad.tiempo_sesion_horas'], 10);
            if (isNaN(h) || h < 1) return 'El tiempo de sesion debe ser al menos 1 hora';
            var m = parseInt(cambios['seguridad.max_intentos_login'], 10);
            if (isNaN(m) || m < 1) return 'El numero de intentos debe ser al menos 1';
        }
        if (grupo === 'notificaciones') {
            var u = parseInt(cambios['notificaciones.stock_umbral'], 10);
            if (isNaN(u) || u < 1) return 'El umbral de stock debe ser al menos 1';
        }
        return null;
    }

    // ----------------------------------------------------------------
    // Logo
    // ----------------------------------------------------------------
    document.getElementById('logoInput').addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            showToast('El logo no puede superar 2 MB', 'error');
            return;
        }
        var reader = new FileReader();
        reader.onload = function (ev) {
            logoBase64 = ev.target.result;
            mostrarLogoPreview(logoBase64);
        };
        reader.readAsDataURL(file);
    });

    function mostrarLogoPreview(dataUrl) {
        var img = document.getElementById('logoPreviewImg');
        var placeholder = document.getElementById('logoPlaceholder');
        var btnEliminar = document.getElementById('btnEliminarLogo');
        if (dataUrl && dataUrl.startsWith('data:')) {
            img.src = dataUrl;
            img.style.display = 'block';
            placeholder.style.display = 'none';
            btnEliminar.style.display = '';
        } else {
            img.src = '';
            img.style.display = 'none';
            placeholder.style.display = '';
            btnEliminar.style.display = 'none';
        }
    }

    window.eliminarLogo = function () {
        logoBase64 = '';
        mostrarLogoPreview('');
        document.getElementById('logoInput').value = '';
    };

    // ----------------------------------------------------------------
    // Respaldo - Exportar
    // ----------------------------------------------------------------
    window.descargarBackup = function () {
        var btn = document.getElementById('btnDescargar');
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Generando...';

        var token = localStorage.getItem('rm_token');
        fetch('/api/configuracion/backup', {
            headers: { 'Authorization': 'Bearer ' + token }
        }).then(function (res) {
            if (!res.ok) throw new Error('Error del servidor');
            return res.blob();
        }).then(function (blob) {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            var ahora = new Date();
            var ts = ahora.getFullYear()
                + pad(ahora.getMonth() + 1) + pad(ahora.getDate())
                + '_' + pad(ahora.getHours()) + pad(ahora.getMinutes());
            a.href = url;
            a.download = 'rossmille_backup_' + ts + '.sql';
            a.click();
            URL.revokeObjectURL(url);
            showToast('Respaldo descargado correctamente', 'success');
        }).catch(function () {
            showToast('Error al generar el respaldo', 'error');
        }).finally(function () {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-download me-2"></i>Descargar respaldo .sql';
        });
    };

    // ----------------------------------------------------------------
    // Respaldo - Restaurar
    // ----------------------------------------------------------------
    document.getElementById('restoreInput').addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (!file) return;
        document.getElementById('restoreFileName').textContent = file.name + ' (' + formatBytes(file.size) + ')';
        document.getElementById('btnRestaurar').disabled = false;
    });

    window.restaurarBackup = function () {
        var input = document.getElementById('restoreInput');
        if (!input.files[0]) return;

        if (!confirm('Confirma la restauracion del respaldo. Los registros existentes no seran eliminados, solo se agregaran los que no existan.')) return;

        var formData = new FormData();
        formData.append('archivo', input.files[0]);

        var btn = document.getElementById('btnRestaurar');
        btn.disabled = true;
        btn.textContent = 'Restaurando...';

        var token = localStorage.getItem('rm_token');
        fetch('/api/configuracion/restaurar', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        }).then(function (res) { return res.json(); }).then(function (res) {
            if (res.ok) {
                showToast(res.message || 'Restauracion completada', 'success');
                input.value = '';
                document.getElementById('restoreFileName').textContent = 'Clic para seleccionar archivo .sql de respaldo';
                btn.disabled = true;
            } else {
                showToast(res.message || 'Error en la restauracion', 'error');
                btn.disabled = false;
            }
        }).catch(function () {
            showToast('Error de conexion durante la restauracion', 'error');
            btn.disabled = false;
        }).finally(function () {
            btn.textContent = '';
            btn.innerHTML = '<i class="bi bi-upload me-1"></i>Restaurar';
        });
    };

    // ----------------------------------------------------------------
    // Apariencia - Tiempo real
    // ----------------------------------------------------------------
    window.setTema = function (tema) {
        temaActual = tema;
        actualizarUiTema(tema);
        if (tema === 'oscuro') {
            document.documentElement.setAttribute('data-theme', 'oscuro');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    };

    function actualizarUiTema(tema) {
        document.getElementById('themeClaro').classList.toggle('active', tema !== 'oscuro');
        document.getElementById('themeOscuro').classList.toggle('active', tema === 'oscuro');
    }

    var colorInput = document.getElementById('cfg-apariencia.color_principal');
    colorInput.addEventListener('input', function () {
        actualizarColorPreview(this.value);
        document.documentElement.style.setProperty('--rm-accent', this.value);
        document.documentElement.style.setProperty('--rm-accent-h', ajustarBrillo(this.value, -20));
    });

    function actualizarColorPreview(color) {
        document.getElementById('colorPreviewBox').style.background = color;
        document.getElementById('colorHexLabel').textContent = color;
    }

    var fontInput = document.getElementById('cfg-apariencia.tamano_fuente');
    fontInput.addEventListener('input', function () {
        var val = this.value;
        document.getElementById('fontSizeLabel').textContent = val + 'px';
        document.documentElement.style.fontSize = val + 'px';
    });

    window.resetApariencia = function () {
        setTema('claro');
        colorInput.value = '#6366f1';
        actualizarColorPreview('#6366f1');
        document.documentElement.style.setProperty('--rm-accent', '#6366f1');
        document.documentElement.style.setProperty('--rm-accent-h', '#4f46e5');
        fontInput.value = '15';
        document.getElementById('fontSizeLabel').textContent = '15px';
        document.documentElement.style.fontSize = '15px';
        document.documentElement.removeAttribute('data-theme');
    };

    function guardarAparienciaLocalStorage(cambios) {
        localStorage.setItem('rm_apariencia', JSON.stringify({
            tema: cambios['apariencia.tema'] || temaActual,
            color: cambios['apariencia.color_principal'] || '#6366f1',
            fuente: cambios['apariencia.tamano_fuente'] || '15'
        }));
    }

    function aplicarAparienciaLocal(tema, color, fuente) {
        if (tema === 'oscuro') {
            document.documentElement.setAttribute('data-theme', 'oscuro');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        if (color) {
            document.documentElement.style.setProperty('--rm-accent', color);
            document.documentElement.style.setProperty('--rm-accent-h', ajustarBrillo(color, -20));
        }
        if (fuente) {
            document.documentElement.style.fontSize = fuente + 'px';
        }
    }

    // ----------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------
    function setToggle(id, value) {
        var el = document.getElementById(id);
        if (el) el.checked = value;
    }

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
})();
