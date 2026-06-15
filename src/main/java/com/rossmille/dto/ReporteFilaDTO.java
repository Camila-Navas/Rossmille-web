package com.rossmille.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ReporteFilaDTO {

    private Integer ventaId;
    private String fecha;
    private String idCliente;
    private String nombreCliente;
    private String idEmpleado;
    private String nombreEmpleado;
    private BigDecimal total;
    private String metodoPago;
}
