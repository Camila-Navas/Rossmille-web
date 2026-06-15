package com.rossmille.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "detalle_pedido")
@Getter
@Setter
@NoArgsConstructor
public class DetallePedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "pedido_id", nullable = false)
    private Integer pedidoId;

    @Column(name = "producto_id")
    private Integer productoId;

    @Column(name = "nombre_producto_personalizado", length = 200)
    private String nombreProductoPersonalizado;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "precio_unitario_estimado", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitarioEstimado;

    @Column(name = "descripcion_personalizada", columnDefinition = "TEXT")
    private String descripcionPersonalizada;
}
