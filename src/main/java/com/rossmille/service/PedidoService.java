package com.rossmille.service;

import com.rossmille.dto.DetallePedidoDTO;
import com.rossmille.dto.PedidoDTO;
import com.rossmille.dto.PedidoRequest;
import com.rossmille.entity.DetallePedido;
import com.rossmille.entity.Pedido;
import com.rossmille.entity.Usuario;
import com.rossmille.repository.ClienteRepository;
import com.rossmille.repository.DetallePedidoRepository;
import com.rossmille.repository.PedidoRepository;
import com.rossmille.repository.ProductoRepository;
import com.rossmille.repository.UsuarioRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PedidoService {

    private static final DateTimeFormatter FECHA_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private static final List<String> ESTADOS_ACTIVOS =
            List.of("Pendiente", "En Proceso");

    private final PedidoRepository pedidoRepository;
    private final DetallePedidoRepository detallePedidoRepository;
    private final ClienteRepository clienteRepository;
    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public PedidoService(PedidoRepository pedidoRepository,
                         DetallePedidoRepository detallePedidoRepository,
                         ClienteRepository clienteRepository,
                         ProductoRepository productoRepository,
                         UsuarioRepository usuarioRepository,
                         PasswordEncoder passwordEncoder) {
        this.pedidoRepository = pedidoRepository;
        this.detallePedidoRepository = detallePedidoRepository;
        this.clienteRepository = clienteRepository;
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<PedidoDTO> listar(String tipo) {
        List<Pedido> pedidos = "historial".equalsIgnoreCase(tipo)
                ? pedidoRepository.findByEstadoOrderByFechaPedidoDesc("Atendido")
                : pedidoRepository.findByEstadoInOrderByFechaPedidoAsc(ESTADOS_ACTIVOS);
        return pedidos.stream().map(this::toDto).toList();
    }

    @Transactional
    public PedidoDTO crear(PedidoRequest request) {
        if (!clienteRepository.existsById(request.getIdCliente())) {
            throw new IllegalArgumentException("Cliente con ID " +
                    request.getIdCliente() + " no encontrado");
        }

        for (var item : request.getItems()) {
            if (item.getProductoId() == null &&
                    (item.getNombreProductoPersonalizado() == null ||
                            item.getNombreProductoPersonalizado().isBlank())) {
                throw new IllegalArgumentException(
                        "Cada item debe tener un producto del catalogo o un nombre personalizado");
            }
        }

        BigDecimal totalEstimado = request.getItems().stream()
                .map(i -> i.getPrecioUnitarioEstimado()
                        .multiply(BigDecimal.valueOf(i.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Pedido pedido = new Pedido();
        pedido.setIdCliente(request.getIdCliente().trim());
        pedido.setFechaPedido(LocalDateTime.now());
        pedido.setEstado("Pendiente");
        pedido.setTotalEstimado(totalEstimado);
        pedido.setObservaciones(request.getObservaciones());
        Pedido guardado = pedidoRepository.save(pedido);

        for (var item : request.getItems()) {
            DetallePedido detalle = new DetallePedido();
            detalle.setPedidoId(guardado.getId());
            detalle.setCantidad(item.getCantidad());
            detalle.setPrecioUnitarioEstimado(item.getPrecioUnitarioEstimado());
            detalle.setDescripcionPersonalizada(item.getDescripcionPersonalizada());

            if (item.getProductoId() != null) {
                detalle.setProductoId(item.getProductoId());
                productoRepository.findById(item.getProductoId())
                        .ifPresent(p -> detalle.setNombreProductoPersonalizado(p.getNombre()));
            } else {
                detalle.setNombreProductoPersonalizado(
                        item.getNombreProductoPersonalizado().trim());
            }
            detallePedidoRepository.save(detalle);
        }

        return toDto(guardado);
    }

    @Transactional
    public PedidoDTO avanzar(Integer id) {
        Pedido pedido = findOrThrow(id);
        String estadoActual = pedido.getEstado();

        if ("Pendiente".equals(estadoActual)) {
            pedido.setEstado("En Proceso");
        } else if ("En Proceso".equals(estadoActual)) {
            pedido.setEstado("Atendido");
        } else {
            throw new IllegalArgumentException("El pedido ya se encuentra Atendido");
        }

        return toDto(pedidoRepository.save(pedido));
    }

    @Transactional
    public void eliminar(Integer id, String contrasena) {
        String idUsuario = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        Usuario usuario = usuarioRepository.findByIdUsuario(idUsuario)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        if (!passwordEncoder.matches(contrasena, usuario.getContrasena())) {
            throw new IllegalArgumentException("Contrasena incorrecta");
        }
        findOrThrow(id);
        pedidoRepository.deleteById(id);
    }

    private Pedido findOrThrow(Integer id) {
        return pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado"));
    }

    private PedidoDTO toDto(Pedido p) {
        PedidoDTO dto = new PedidoDTO();
        dto.setId(p.getId());
        dto.setIdCliente(p.getIdCliente());
        dto.setFechaPedido(p.getFechaPedido().format(FECHA_FMT));
        dto.setEstado(p.getEstado());
        dto.setTotalEstimado(p.getTotalEstimado());
        dto.setObservaciones(p.getObservaciones());

        clienteRepository.findById(p.getIdCliente())
                .ifPresent(c -> dto.setNombreCliente(c.getNombre()));

        List<DetallePedidoDTO> items = detallePedidoRepository
                .findByPedidoIdOrderById(p.getId())
                .stream().map(this::toItemDto).toList();
        dto.setItems(items);

        return dto;
    }

    private DetallePedidoDTO toItemDto(DetallePedido d) {
        DetallePedidoDTO dto = new DetallePedidoDTO();
        dto.setId(d.getId());
        dto.setProductoId(d.getProductoId());
        dto.setCantidad(d.getCantidad());
        dto.setPrecioUnitarioEstimado(d.getPrecioUnitarioEstimado());
        dto.setDescripcionPersonalizada(d.getDescripcionPersonalizada());

        if (d.getNombreProductoPersonalizado() != null) {
            dto.setNombreProducto(d.getNombreProductoPersonalizado());
        } else if (d.getProductoId() != null) {
            productoRepository.findById(d.getProductoId())
                    .ifPresent(prod -> dto.setNombreProducto(prod.getNombre()));
        }
        return dto;
    }
}
