(function () {
    var chartInstance = null;

    function fmtCOP(value) {
        if (value >= 1000000) {
            return '$' + (value / 1000000).toFixed(1).replace('.0', '') + 'M';
        }
        if (value >= 1000) {
            return '$' + (value / 1000).toFixed(0) + 'k';
        }
        return '$' + value;
    }

    function fmtCOPFull(value) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
        }).format(value);
    }

    function setText(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    async function cargarDashboard() {
        try {
            var res = await apiFetch('/dashboard/resumen');
            if (!res) return;

            var body = await res.json();
            if (!body.ok) return;

            var d = body.data;

            setText('kpiVentasHoy', d.ventasHoy);
            setText('kpiIngresosHoy', fmtCOP(d.ingresosHoy));
            setText('kpiStockBajo', d.stockBajo);
            setText('kpiPedidosPendientes', d.pedidosPendientes);

            renderChart(d.ventasPorDia);
        } catch (e) {
            // si falla el endpoint el dashboard de modulos sigue funcionando
        }
    }

    var ultimoVentasPorDia = null;

    // Lee los colores actuales del tema (reacciona a acento y modo claro/oscuro)
    function colorTema(varName) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    function renderChart(ventasPorDia) {
        ultimoVentasPorDia = ventasPorDia;
        var labels  = ventasPorDia.map(function (x) { return x.fecha; });
        var totales = ventasPorDia.map(function (x) { return x.total; });

        var ctx = document.getElementById('chartVentas').getContext('2d');
        if (chartInstance) { chartInstance.destroy(); }

        var accent = colorTema('--rm-accent') || '#6366f1';
        var accentHover = colorTema('--rm-accent-h') || '#4f46e5';
        var textMuted = colorTema('--rm-text-2') || '#94a3b8';
        var gridColor = colorTema('--rm-border') || '#e2e8f0';

        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: totales,
                    backgroundColor: accent,
                    hoverBackgroundColor: accentHover,
                    borderRadius: 5,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function (ctx) {
                                return '  ' + fmtCOPFull(ctx.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: {
                            font: { family: "'Inter', 'Segoe UI', sans-serif", size: 11 },
                            color: textMuted
                        }
                    },
                    y: {
                        grid: { color: gridColor },
                        border: { display: false },
                        ticks: {
                            font: { family: "'Inter', 'Segoe UI', sans-serif", size: 11 },
                            color: textMuted,
                            callback: function (val) { return fmtCOP(val); }
                        }
                    }
                }
            }
        });
    }

    cargarDashboard();

    // Si el usuario cambia de tema/acento, el grafico se vuelve a pintar con los nuevos colores
    document.addEventListener('rm:themechange', function () {
        if (ultimoVentasPorDia) renderChart(ultimoVentasPorDia);
    });
})();
