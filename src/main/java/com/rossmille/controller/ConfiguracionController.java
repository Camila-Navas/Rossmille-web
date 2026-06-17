package com.rossmille.controller;

import com.rossmille.dto.ApiResponse;
import com.rossmille.service.ConfiguracionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

@RestController
@RequestMapping("/api/configuracion")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class ConfiguracionController {

    private static final Logger log = LoggerFactory.getLogger(ConfiguracionController.class);

    private final ConfiguracionService servicio;

    public ConfiguracionController(ConfiguracionService servicio) {
        this.servicio = servicio;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> obtenerTodo() {
        return ResponseEntity.ok(ApiResponse.success(servicio.getAll()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Void>> guardar(@RequestBody Map<String, String> cambios) {
        if (cambios == null || cambios.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("No se recibieron datos"));
        }
        servicio.guardar(cambios);
        return ResponseEntity.ok(ApiResponse.success("Configuracion guardada", null));
    }

    @GetMapping("/backup")
    public ResponseEntity<byte[]> generarBackup() {
        try {
            byte[] sql = servicio.generarBackup();
            String nombre = "rossmille_backup_"
                    + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"))
                    + ".sql";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nombre + "\"")
                    .contentType(MediaType.parseMediaType("application/sql"))
                    .body(sql);
        } catch (Exception e) {
            log.error("Error generando backup", e);
            return ResponseEntity.internalServerError()
                    .body(("Error: " + e.getMessage()).getBytes(StandardCharsets.UTF_8));
        }
    }

    @PostMapping("/restaurar")
    public ResponseEntity<ApiResponse<Integer>> restaurar(
            @RequestParam("archivo") MultipartFile archivo) {
        if (archivo.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Archivo vacio"));
        }
        try {
            String contenido = new String(archivo.getBytes(), StandardCharsets.UTF_8);
            int ejecutados = servicio.restaurar(contenido);
            return ResponseEntity.ok(ApiResponse.success(
                    "Restauracion completada: " + ejecutados + " sentencias ejecutadas", ejecutados));
        } catch (Exception e) {
            log.error("Error en restauracion", e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("Error en restauracion: " + e.getMessage()));
        }
    }
}
