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

    function renderChart(ventasPorDia) {
        var labels  = ventasPorDia.map(function (x) { return x.fecha; });
        var totales = ventasPorDia.map(function (x) { return x.total; });

        var ctx = document.getElementById('chartVentas').getContext('2d');
        if (chartInstance) { chartInstance.destroy(); }

        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: totales,
                    backgroundColor: '#1a1a2e',
                    hoverBackgroundColor: '#2d2d4e',
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
                            color: '#aaa'
                        }
                    },
                    y: {
                        grid: { color: '#f0f0f0' },
                        border: { display: false },
                        ticks: {
                            font: { family: "'Inter', 'Segoe UI', sans-serif", size: 11 },
                            color: '#aaa',
                            callback: function (val) { return fmtCOP(val); }
                        }
                    }
                }
            }
        });
    }

    cargarDashboard();
})();
