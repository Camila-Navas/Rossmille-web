package com.rossmille.service;

import com.rossmille.entity.Configuracion;
import com.rossmille.repository.ConfiguracionRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ConfiguracionService {

    private static final Map<String, String[]> DEFAULTS = new LinkedHashMap<>();

    static {
        // [valor, grupo]
        DEFAULTS.put("empresa.nombre",        new String[]{"ROSS MILLE", "empresa"});
        DEFAULTS.put("empresa.nit",           new String[]{"", "empresa"});
        DEFAULTS.put("empresa.direccion",     new String[]{"", "empresa"});
        DEFAULTS.put("empresa.telefono",      new String[]{"", "empresa"});
        DEFAULTS.put("empresa.correo",        new String[]{"", "empresa"});
        DEFAULTS.put("empresa.sitio_web",     new String[]{"", "empresa"});
        DEFAULTS.put("empresa.ciudad",        new String[]{"", "empresa"});
        DEFAULTS.put("empresa.pais",          new String[]{"Colombia", "empresa"});
        DEFAULTS.put("empresa.logo_base64",   new String[]{"", "empresa"});

        DEFAULTS.put("sistema.moneda_simbolo",  new String[]{"$", "sistema"});
        DEFAULTS.put("sistema.iva_porcentaje",  new String[]{"19", "sistema"});
        DEFAULTS.put("sistema.formato_fecha",   new String[]{"dd/MM/yyyy", "sistema"});
        DEFAULTS.put("sistema.idioma",          new String[]{"es", "sistema"});
        DEFAULTS.put("sistema.zona_horaria",    new String[]{"America/Bogota", "sistema"});

        DEFAULTS.put("ventas.consecutivo_inicial", new String[]{"1", "ventas"});
        DEFAULTS.put("ventas.prefijo_facturas",    new String[]{"FAC-", "ventas"});
        DEFAULTS.put("ventas.pie_pagina",          new String[]{"Gracias por su compra en ROSS MILLE.", "ventas"});
        DEFAULTS.put("ventas.metodos_pago",        new String[]{"Efectivo,Tarjeta,Transferencia", "ventas"});
        DEFAULTS.put("ventas.descuento_maximo",    new String[]{"50", "ventas"});

        DEFAULTS.put("seguridad.tiempo_sesion_horas",      new String[]{"8", "seguridad"});
        DEFAULTS.put("seguridad.contrasena_min_longitud",  new String[]{"6", "seguridad"});
        DEFAULTS.put("seguridad.max_intentos_login",       new String[]{"5", "seguridad"});

        DEFAULTS.put("notificaciones.stock_umbral",     new String[]{"5", "notificaciones"});
        DEFAULTS.put("notificaciones.alertas_correo",   new String[]{"false", "notificaciones"});
        DEFAULTS.put("notificaciones.alertas_sistema",  new String[]{"true", "notificaciones"});

        DEFAULTS.put("apariencia.tema",            new String[]{"claro", "apariencia"});
        DEFAULTS.put("apariencia.color_principal", new String[]{"#6366f1", "apariencia"});
        DEFAULTS.put("apariencia.tamano_fuente",   new String[]{"15", "apariencia"});
    }

    private final ConfiguracionRepository repositorio;
    private final JdbcTemplate jdbcTemplate;

    public ConfiguracionService(ConfiguracionRepository repositorio, JdbcTemplate jdbcTemplate) {
        this.repositorio = repositorio;
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void seedDefaults() {
        DEFAULTS.forEach((clave, meta) -> {
            if (!repositorio.existsById(clave)) {
                repositorio.save(new Configuracion(clave, meta[0], meta[1]));
            }
        });
    }

    public String get(String clave) {
        return repositorio.findById(clave)
                .map(Configuracion::getValor)
                .orElse("");
    }

    public int getInt(String clave, int defaultValue) {
        try {
            return Integer.parseInt(get(clave));
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public Map<String, String> getAll() {
        return repositorio.findAll().stream()
                .collect(Collectors.toMap(
                        Configuracion::getClave,
                        c -> c.getValor() != null ? c.getValor() : "",
                        (a, b) -> a,
                        LinkedHashMap::new
                ));
    }

    @Transactional
    public void guardar(Map<String, String> cambios) {
        cambios.forEach((clave, valor) -> {
            Configuracion c = repositorio.findById(clave)
                    .orElse(new Configuracion(clave, valor, resolverGrupo(clave)));
            c.setValor(valor);
            repositorio.save(c);
        });
    }

    public byte[] generarBackup() {
        StringBuilder sb = new StringBuilder();
        String ahora = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        sb.append("-- ============================================================\n");
        sb.append("-- ROSS MILLE - Respaldo de base de datos\n");
        sb.append("-- Generado: ").append(ahora).append("\n");
        sb.append("-- ADVERTENCIA: Solo restaurar en una base de datos ROSS MILLE\n");
        sb.append("-- ============================================================\n\n");
        sb.append("SET FOREIGN_KEY_CHECKS=0;\n\n");

        String[] tablas = {
            "configuracion", "usuarios", "clientes", "productos",
            "ventas", "detalle_venta", "pedidos", "detalle_pedido"
        };

        for (String tabla : tablas) {
            sb.append(exportarTabla(tabla));
        }

        sb.append("SET FOREIGN_KEY_CHECKS=1;\n");
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Transactional
    public int restaurar(String contenidoSql) {
        int ejecutados = 0;
        String[] lineas = contenidoSql.split("\n");
        StringBuilder sentencia = new StringBuilder();

        for (String linea : lineas) {
            String trim = linea.trim();
            if (trim.isEmpty() || trim.startsWith("--")) continue;

            sentencia.append(linea).append(" ");

            if (trim.endsWith(";")) {
                String sql = sentencia.toString().trim();
                String sqlUpper = sql.toUpperCase();
                if (sqlUpper.startsWith("INSERT") || sqlUpper.startsWith("SET FOREIGN_KEY_CHECKS")) {
                    try {
                        jdbcTemplate.execute(sql);
                        ejecutados++;
                    } catch (Exception ignored) {
                        // INSERT IGNORE falla silenciosamente en duplicados
                    }
                }
                sentencia.setLength(0);
            }
        }
        return ejecutados;
    }

    private String exportarTabla(String tabla) {
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM `" + tabla + "`");
            if (rows.isEmpty()) {
                return "-- " + tabla + ": sin registros\n\n";
            }
            StringBuilder sb = new StringBuilder();
            sb.append("-- ").append(tabla).append(" (").append(rows.size()).append(" registros)\n");
            for (Map<String, Object> row : rows) {
                sb.append("INSERT IGNORE INTO `").append(tabla).append("` (");
                sb.append(row.keySet().stream().map(k -> "`" + k + "`").collect(Collectors.joining(", ")));
                sb.append(") VALUES (");
                sb.append(row.values().stream()
                        .map(v -> {
                            if (v == null) return "NULL";
                            return "'" + v.toString()
                                    .replace("\\", "\\\\")
                                    .replace("'", "\\'")
                                    .replace("\n", "\\n")
                                    .replace("\r", "\\r") + "'";
                        })
                        .collect(Collectors.joining(", ")));
                sb.append(");\n");
            }
            sb.append("\n");
            return sb.toString();
        } catch (Exception e) {
            return "-- Error exportando " + tabla + ": " + e.getMessage() + "\n\n";
        }
    }

    private String resolverGrupo(String clave) {
        int idx = clave.indexOf('.');
        return idx > 0 ? clave.substring(0, idx) : "general";
    }
}
