package com.rossmille.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class PedidoRequest {

    @NotBlank(message = "El ID del cliente es obligatorio")
    private String idCliente;

    private String observaciones;

    @NotEmpty(message = "El pedido debe tener al menos un item")
    @Valid
    private List<DetallePedidoRequest> items;
}
