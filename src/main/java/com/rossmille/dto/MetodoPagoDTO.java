package com.rossmille.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class MetodoPagoDTO {
    private String metodo;
    private int cantidad;
    private BigDecimal total;
}
