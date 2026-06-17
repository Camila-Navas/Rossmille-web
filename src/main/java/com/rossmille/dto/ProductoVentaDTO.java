package com.rossmille.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProductoVentaDTO {
    private String nombre;
    private String genero;
    private String categoria;
    private String talla;
    private int unidades;
    private BigDecimal totalVendido;
}
