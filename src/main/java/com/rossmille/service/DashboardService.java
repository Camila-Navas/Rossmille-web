package com.rossmille.service;

import com.rossmille.dto.DashboardDTO;
import com.rossmille.dto.DiaVentasDTO;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private static final DateTimeFormatter FMT_LABEL = DateTimeFormatter.ofPattern("dd/MM");

    private final JdbcTemplate jdbc;

    public DashboardService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public DashboardDTO obtenerResumen() {

        Integer ventasHoy = jdbc.queryForObject(
                "SELECT COUNT(*) FROM ventas WHERE DATE(fecha) = CURDATE()",
                Integer.class);

        BigDecimal ingresosHoy = jdbc.queryForObject(
                "SELECT COALESCE(SUM(total), 0) FROM ventas WHERE DATE(fecha) = CURDATE()",
                BigDecimal.class);

        Integer stockBajo = jdbc.queryForObject(
                "SELECT COUNT(*) FROM productos WHERE stock <= 5",
                Integer.class);

        Integer pedidosPendientes = jdbc.queryForObject(
                "SELECT COUNT(*) FROM pedidos WHERE estado IN ('Pendiente', 'En Proceso')",
                Integer.class);

        List<DiaVentasDTO> ventasPorDia = obtenerVentasPorDia();

        DashboardDTO dto = new DashboardDTO();
        dto.setVentasHoy(ventasHoy != null ? ventasHoy : 0);
        dto.setIngresosHoy(ingresosHoy != null ? ingresosHoy : BigDecimal.ZERO);
        dto.setStockBajo(stockBajo != null ? stockBajo : 0);
        dto.setPedidosPendientes(pedidosPendientes != null ? pedidosPendientes : 0);
        dto.setVentasPorDia(ventasPorDia);
        return dto;
    }

    private List<DiaVentasDTO> obtenerVentasPorDia() {
        LocalDate hoy = LocalDate.now();
        LocalDate inicio = hoy.minusDays(6);

        Map<LocalDate, DiaVentasDTO> mapa = new LinkedHashMap<>();
        for (int i = 0; i <= 6; i++) {
            LocalDate d = inicio.plusDays(i);
            DiaVentasDTO item = new DiaVentasDTO();
            item.setFecha(d.format(FMT_LABEL));
            item.setTotal(BigDecimal.ZERO);
            item.setCantidad(0);
            mapa.put(d, item);
        }

        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT DATE(fecha) AS dia, SUM(total) AS total_dia, COUNT(*) AS cantidad" +
                " FROM ventas WHERE DATE(fecha) >= ? GROUP BY DATE(fecha) ORDER BY dia ASC",
                inicio);

        for (Map<String, Object> row : rows) {
            Object diaObj = row.get("dia");
            LocalDate d;
            if (diaObj instanceof java.sql.Date sd) {
                d = sd.toLocalDate();
            } else if (diaObj instanceof LocalDate ld) {
                d = ld;
            } else {
                continue;
            }
            DiaVentasDTO item = mapa.get(d);
            if (item != null) {
                Object totalObj = row.get("total_dia");
                item.setTotal(totalObj instanceof BigDecimal bd ? bd : BigDecimal.ZERO);
                item.setCantidad(((Number) row.get("cantidad")).intValue());
            }
        }

        return new ArrayList<>(mapa.values());
    }
}
