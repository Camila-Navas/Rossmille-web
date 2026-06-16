package com.rossmille.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class DashboardDTO {
    private int ventasHoy;
    private BigDecimal ingresosHoy;
    private int stockBajo;
    private int pedidosPendientes;
    private List<DiaVentasDTO> ventasPorDia;
}
