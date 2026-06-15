package com.rossmille.controller;

import com.rossmille.dto.ApiResponse;
import com.rossmille.dto.EliminarRequest;
import com.rossmille.dto.PedidoDTO;
import com.rossmille.dto.PedidoRequest;
import com.rossmille.service.PedidoService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PedidoService pedidoService;

    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PedidoDTO>>> listar(
            @RequestParam(required = false, defaultValue = "activos") String tipo) {
        return ResponseEntity.ok(ApiResponse.success(pedidoService.listar(tipo)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PedidoDTO>> crear(
            @Valid @RequestBody PedidoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Pedido creado", pedidoService.crear(request)));
    }

    @PutMapping("/{id}/avanzar")
    public ResponseEntity<ApiResponse<PedidoDTO>> avanzar(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.success("Estado actualizado",
                pedidoService.avanzar(id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<Void>> eliminar(
            @PathVariable Integer id,
            @Valid @RequestBody EliminarRequest request) {
        pedidoService.eliminar(id, request.getContrasena());
        return ResponseEntity.ok(ApiResponse.success("Pedido eliminado", null));
    }
}
