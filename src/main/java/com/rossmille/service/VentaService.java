package com.rossmille.service;

import com.rossmille.dto.ItemVentaResponse;
import com.rossmille.dto.VentaRequest;
import com.rossmille.dto.VentaResponse;
import com.rossmille.entity.DetalleVenta;
import com.rossmille.entity.Producto;
import com.rossmille.entity.Venta;
import com.rossmille.exception.StockInsuficienteException;
import com.rossmille.repository.ClienteRepository;
import com.rossmille.repository.DetalleVentaRepository;
import com.rossmille.repository.ProductoRepository;
import com.rossmille.repository.VentaRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class VentaService {

    private static final DateTimeFormatter FORMATO_FECHA =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final VentaRepository ventaRepository;
    private final DetalleVentaRepository detalleVentaRepository;
    private final ProductoRepository productoRepository;
    private final ClienteRepository clienteRepository;

    public VentaService(VentaRepository ventaRepository,
                        DetalleVentaRepository detalleVentaRepository,
                        ProductoRepository productoRepository,
                        ClienteRepository clienteRepository) {
        this.ventaRepository = ventaRepository;
        this.detalleVentaRepository = detalleVentaRepository;
        this.productoRepository = productoRepository;
        this.clienteRepository = clienteRepository;
    }

    @Transactional
    public VentaResponse registrar(VentaRequest request) {
        String idEmpleado = SecurityContextHolder.getContext()
                .getAuthentication().getName();

        BigDecimal descuento = request.getDescuento() != null
                ? request.getDescuento()
                : BigDecimal.ZERO;

        List<ItemVentaResponse> itemsRespuesta = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        // Bloqueo pesimista uno a uno para evitar race conditions en stock
        List<Producto> productosLocked = new ArrayList<>();
        for (var item : request.getItems()) {
            Producto p = productoRepository.findByIdForUpdate(item.getProductoId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Producto con id " + item.getProductoId() + " no encontrado"));
            if (p.getStock() < item.getCantidad()) {
                throw new StockInsuficienteException(p.getNombre(), p.getStock(), item.getCantidad());
            }
            productosLocked.add(p);
        }

        // Construir items de respuesta y calcular subtotal
        for (int i = 0; i < request.getItems().size(); i++) {
            var item = request.getItems().get(i);
            Producto p = productosLocked.get(i);

            BigDecimal subItem = item.getPrecioUnitario()
                    .multiply(BigDecimal.valueOf(item.getCantidad()));
            subtotal = subtotal.add(subItem);

            ItemVentaResponse ir = new ItemVentaResponse();
            ir.setNombreProducto(p.getNombre());
            ir.setCantidad(item.getCantidad());
            ir.setPrecioUnitario(item.getPrecioUnitario());
            ir.setSubtotal(subItem);
            itemsRespuesta.add(ir);
        }

        if (descuento.compareTo(subtotal) > 0) {
            throw new IllegalArgumentException(
                    "El descuento no puede ser mayor al subtotal de la venta");
        }

        BigDecimal total = subtotal.subtract(descuento);

        // Insertar venta
        Venta venta = new Venta();
        venta.setIdEmpleado(idEmpleado);
        venta.setIdCliente(request.getIdCliente());
        venta.setFecha(LocalDateTime.now());
        venta.setTotal(total);
        venta.setMetodoPago(request.getMetodoPago());
        Venta ventaGuardada = ventaRepository.save(venta);

        // Insertar detalle y descontar stock
        for (int i = 0; i < request.getItems().size(); i++) {
            var item = request.getItems().get(i);
            Producto p = productosLocked.get(i);

            DetalleVenta detalle = new DetalleVenta();
            detalle.setVentaId(ventaGuardada.getId());
            detalle.setProductoId(p.getId());
            detalle.setCantidad(item.getCantidad());
            detalle.setPrecioUnitario(item.getPrecioUnitario());
            detalleVentaRepository.save(detalle);

            p.setStock(p.getStock() - item.getCantidad());
            productoRepository.save(p);
        }

        // Construir respuesta
        String nombreCliente = null;
        if (request.getIdCliente() != null && !request.getIdCliente().isBlank()) {
            nombreCliente = clienteRepository.findById(request.getIdCliente())
                    .map(c -> c.getNombre())
                    .orElse(null);
        }

        VentaResponse response = new VentaResponse();
        response.setVentaId(ventaGuardada.getId());
        response.setFecha(ventaGuardada.getFecha().format(FORMATO_FECHA));
        response.setNombreCliente(nombreCliente);
        response.setSubtotal(subtotal);
        response.setDescuento(descuento);
        response.setTotal(total);
        response.setMetodoPago(request.getMetodoPago());
        response.setItems(itemsRespuesta);
        return response;
    }
}
