package com.rossmille.controller;

import com.rossmille.dto.ApiResponse;
import com.rossmille.dto.EliminarRequest;
import com.rossmille.dto.UsuarioDTO;
import com.rossmille.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UsuarioDTO>>> listar() {
        return ResponseEntity.ok(ApiResponse.success(usuarioService.listar()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UsuarioDTO>> crear(
            @RequestBody UsuarioDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Usuario creado", usuarioService.crear(dto)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UsuarioDTO>> actualizar(
            @PathVariable String id,
            @RequestBody UsuarioDTO dto) {
        return ResponseEntity.ok(ApiResponse.success("Usuario actualizado",
                usuarioService.actualizar(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminar(
            @PathVariable String id,
            @RequestBody EliminarRequest request) {
        usuarioService.eliminar(id, request.getContrasena());
        return ResponseEntity.ok(ApiResponse.success("Usuario eliminado", null));
    }
}
