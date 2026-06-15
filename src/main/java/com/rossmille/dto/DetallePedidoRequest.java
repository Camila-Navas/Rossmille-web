package com.rossmille.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class DetallePedidoRequest {

    private Integer productoId;

    private String nombreProductoPersonalizado;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    private Integer cantidad;

    @NotNull(message = "El precio estimado es obligatorio")
    @DecimalMin(value = "0.00", message = "El precio estimado no puede ser negativo")
    private BigDecimal precioUnitarioEstimado;

    private String descripcionPersonalizada;
}
