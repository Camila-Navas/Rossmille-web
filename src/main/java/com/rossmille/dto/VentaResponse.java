package com.rossmille.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class VentaResponse {

    private Integer ventaId;
    private String fecha;
    private String nombreCliente;
    private BigDecimal subtotal;
    private BigDecimal descuento;
    private BigDecimal total;
    private String metodoPago;
    private List<ItemVentaResponse> items;
}
