package com.rossmille.repository;

import com.rossmille.entity.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Integer> {

    List<Pedido> findByEstadoInOrderByFechaPedidoAsc(List<String> estados);

    List<Pedido> findByEstadoOrderByFechaPedidoDesc(String estado);
}
