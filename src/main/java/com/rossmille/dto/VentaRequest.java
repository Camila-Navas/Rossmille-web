package com.rossmille.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class VentaRequest {

    @NotEmpty(message = "El carrito no puede estar vacio")
    @Valid
    private List<ItemVentaRequest> items;

    private String idCliente;

    @DecimalMin(value = "0.00", message = "El descuento no puede ser negativo")
    private BigDecimal descuento;

    @NotBlank(message = "El metodo de pago es obligatorio")
    private String metodoPago;
}
