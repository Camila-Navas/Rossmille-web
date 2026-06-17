package com.rossmille.service;

import com.rossmille.dto.ProductoDTO;
import com.rossmille.entity.Producto;
import com.rossmille.entity.Usuario;
import com.rossmille.repository.ProductoRepository;
import com.rossmille.repository.UsuarioRepository;
import com.rossmille.service.ConfiguracionService;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final ConfiguracionService configuracionService;

    public ProductoService(ProductoRepository productoRepository,
                           UsuarioRepository usuarioRepository,
                           PasswordEncoder passwordEncoder,
                           ConfiguracionService configuracionService) {
        this.productoRepository = productoRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.configuracionService = configuracionService;
    }

    public List<ProductoDTO> listar() {
        return productoRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    public List<ProductoDTO> buscar(String q) {
        String pattern = "%" + q.toLowerCase() + "%";
        return productoRepository.buscar(pattern).stream()
                .map(this::toDto)
                .toList();
    }

    public List<ProductoDTO> stockBajo() {
        int umbral = configuracionService.getInt("notificaciones.stock_umbral", 5);
        return productoRepository.findByStockLessThanEqual(umbral).stream()
                .map(this::toDto)
                .toList();
    }

    public ProductoDTO obtener(Integer id) {
        return toDto(findOrThrow(id));
    }

    @Transactional
    public ProductoDTO crear(ProductoDTO dto) {
        Producto p = new Producto();
        aplicarCambios(p, dto);
        return toDto(productoRepository.save(p));
    }

    @Transactional
    public ProductoDTO actualizar(Integer id, ProductoDTO dto) {
        Producto p = findOrThrow(id);
        aplicarCambios(p, dto);
        return toDto(productoRepository.save(p));
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
        productoRepository.deleteById(id);
    }

    private Producto findOrThrow(Integer id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));
    }

    private void aplicarCambios(Producto p, ProductoDTO dto) {
        p.setNombre(dto.getNombre());
        p.setDescripcion(dto.getDescripcion());
        p.setTalla(dto.getTalla());
        p.setPrecio(dto.getPrecio());
        p.setStock(dto.getStock());
        p.setGenero(dto.getGenero());
        p.setCategoria(dto.getCategoria());
        p.setColor(dto.getColor());
    }

    private ProductoDTO toDto(Producto p) {
        ProductoDTO dto = new ProductoDTO();
        dto.setId(p.getId());
        dto.setNombre(p.getNombre());
        dto.setDescripcion(p.getDescripcion());
        dto.setTalla(p.getTalla());
        dto.setPrecio(p.getPrecio());
        dto.setStock(p.getStock());
        dto.setGenero(p.getGenero());
        dto.setCategoria(p.getCategoria());
        dto.setColor(p.getColor());
        return dto;
    }
}
