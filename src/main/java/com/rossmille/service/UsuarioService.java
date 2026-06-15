package com.rossmille.service;

import com.rossmille.dto.UsuarioDTO;
import com.rossmille.entity.Usuario;
import com.rossmille.repository.UsuarioRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UsuarioService {

    private static final List<String> ROLES_VALIDOS = List.of("Administrador", "Empleado");

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository,
                          PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UsuarioDTO> listar() {
        return usuarioRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public UsuarioDTO crear(UsuarioDTO dto) {
        validarCamposObligatorios(dto, true);

        if (usuarioRepository.existsById(dto.getId())) {
            throw new IllegalArgumentException("Ya existe un usuario con ese ID");
        }
        if (!ROLES_VALIDOS.contains(dto.getRol())) {
            throw new IllegalArgumentException("Rol invalido. Debe ser Administrador o Empleado");
        }

        Usuario u = new Usuario();
        u.setIdUsuario(dto.getId().trim());
        u.setNombreUsuario(dto.getNombre().trim());
        u.setRolUsuarios(dto.getRol());
        u.setCorreoUsuario(dto.getCorreo() != null ? dto.getCorreo().trim() : null);
        u.setTelefonoUsuario(dto.getTelefono() != null ? dto.getTelefono().trim() : null);
        u.setContrasena(passwordEncoder.encode(dto.getContrasena()));
        return toDto(usuarioRepository.save(u));
    }

    @Transactional
    public UsuarioDTO actualizar(String id, UsuarioDTO dto) {
        validarCamposObligatorios(dto, false);

        Usuario u = findOrThrow(id);

        if (!ROLES_VALIDOS.contains(dto.getRol())) {
            throw new IllegalArgumentException("Rol invalido. Debe ser Administrador o Empleado");
        }

        u.setNombreUsuario(dto.getNombre().trim());
        u.setRolUsuarios(dto.getRol());
        u.setCorreoUsuario(dto.getCorreo() != null ? dto.getCorreo().trim() : null);
        u.setTelefonoUsuario(dto.getTelefono() != null ? dto.getTelefono().trim() : null);

        if (dto.getContrasena() != null && !dto.getContrasena().isBlank()) {
            u.setContrasena(passwordEncoder.encode(dto.getContrasena()));
        }

        return toDto(usuarioRepository.save(u));
    }

    @Transactional
    public void eliminar(String id, String contrasena) {
        String idAdmin = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        Usuario admin = findOrThrow(idAdmin);

        if (!passwordEncoder.matches(contrasena, admin.getContrasena())) {
            throw new IllegalArgumentException("Contrasena incorrecta");
        }
        if (idAdmin.equals(id)) {
            throw new IllegalArgumentException("No puedes eliminar tu propio usuario");
        }
        findOrThrow(id);
        usuarioRepository.deleteById(id);
    }

    private void validarCamposObligatorios(UsuarioDTO dto, boolean esCreacion) {
        if (esCreacion && (dto.getId() == null || dto.getId().isBlank())) {
            throw new IllegalArgumentException("El ID del usuario es obligatorio");
        }
        if (dto.getNombre() == null || dto.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        if (dto.getRol() == null || dto.getRol().isBlank()) {
            throw new IllegalArgumentException("El rol es obligatorio");
        }
        if (esCreacion && (dto.getContrasena() == null || dto.getContrasena().isBlank())) {
            throw new IllegalArgumentException("La contrasena es obligatoria");
        }
    }

    private Usuario findOrThrow(String id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    }

    private UsuarioDTO toDto(Usuario u) {
        UsuarioDTO dto = new UsuarioDTO();
        dto.setId(u.getIdUsuario());
        dto.setNombre(u.getNombreUsuario());
        dto.setRol(u.getRolUsuarios());
        dto.setCorreo(u.getCorreoUsuario());
        dto.setTelefono(u.getTelefonoUsuario());
        return dto;
    }
}
