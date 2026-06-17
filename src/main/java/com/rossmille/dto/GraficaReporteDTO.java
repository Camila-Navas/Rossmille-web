package com.rossmille.dto;

import lombok.Data;
import java.util.List;

@Data
public class GraficaReporteDTO {
    private List<ProductoVentaDTO> topProductos;
    private List<MetodoPagoDTO> metodosPago;
    private List<DiaVentasDTO> ventasPorDia;
}
