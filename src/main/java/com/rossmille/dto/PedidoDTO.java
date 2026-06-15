package com.rossmille.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class PedidoDTO {

    private Integer id;
    private String idCliente;
    private String nombreCliente;
    private String fechaPedido;
    private String estado;
    private BigDecimal totalEstimado;
    private String observaciones;
    private List<DetallePedidoDTO> items;
}
