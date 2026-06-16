package com.rossmille.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class DiaVentasDTO {
    private String fecha;
    private BigDecimal total;
    private int cantidad;
}
