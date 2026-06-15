package com.rossmille.service;

import com.rossmille.dto.ReporteFilaDTO;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
public class ReporteService {

    private static final DateTimeFormatter FECHA_FMT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private static final Color VERDE = Color.decode("#41634C");
    private static final Color BLANCO = Color.WHITE;

    private static final float[] COL_WIDTHS = { 38f, 82f, 52f, 88f, 52f, 88f, 58f };
    private static final String[] COL_HEADERS =
            { "ID", "Fecha", "ID Cliente", "Cliente", "ID Empleado", "Empleado", "Total" };

    private final JdbcTemplate jdbcTemplate;

    public ReporteService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ReporteFilaDTO> listar(LocalDate desde, LocalDate hasta) {
        LocalDateTime inicio = desde.atStartOfDay();
        LocalDateTime fin = hasta.atTime(LocalTime.MAX);

        String sql = "SELECT v.id, v.fecha, v.id_cliente," +
                " COALESCE(c.nombre, '') AS nombre_cliente," +
                " v.id_empleado, u.nombre_usuario, v.total, v.metodo_pago" +
                " FROM ventas v" +
                " LEFT JOIN clientes c ON c.id_clientes = v.id_cliente" +
                " JOIN usuarios u ON u.id_usuario = v.id_empleado" +
                " WHERE v.fecha BETWEEN ? AND ?" +
                " ORDER BY v.fecha DESC";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, inicio, fin);

        return rows.stream().map(row -> {
            ReporteFilaDTO dto = new ReporteFilaDTO();
            dto.setVentaId(((Number) row.get("id")).intValue());

            Timestamp ts = (Timestamp) row.get("fecha");
            if (ts != null) {
                dto.setFecha(ts.toLocalDateTime().format(FECHA_FMT));
            }

            dto.setIdCliente((String) row.get("id_cliente"));
            dto.setNombreCliente((String) row.get("nombre_cliente"));
            dto.setIdEmpleado((String) row.get("id_empleado"));
            dto.setNombreEmpleado((String) row.get("nombre_usuario"));
            dto.setTotal((BigDecimal) row.get("total"));
            dto.setMetodoPago((String) row.get("metodo_pago"));
            return dto;
        }).toList();
    }

    public byte[] generarPdf(LocalDate desde, LocalDate hasta) {
        List<ReporteFilaDTO> filas = listar(desde, hasta);
        String titulo = "Reporte de Ventas";
        String rango = "Desde: " + desde.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) +
                "   Hasta: " + hasta.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            generarPaginas(document, filas, titulo, rango);
            document.save(out);
            return out.toByteArray();

        } catch (IOException e) {
            throw new RuntimeException("Error al generar el PDF: " + e.getMessage(), e);
        }
    }

    private void generarPaginas(PDDocument document,
                                List<ReporteFilaDTO> filas,
                                String titulo,
                                String rango) throws IOException {

        PDType1Font fontBold  = PDType1Font.HELVETICA_BOLD;
        PDType1Font fontPlain = PDType1Font.HELVETICA;

        float margin    = 40f;
        float rowHeight = 18f;
        float cellPad   = 4f;

        float tableWidth = 0;
        for (float w : COL_WIDTHS) tableWidth += w;

        PDPage page = new PDPage(PDRectangle.A4);
        document.addPage(page);
        float pageHeight = page.getMediaBox().getHeight();
        float yPos = pageHeight - margin;

        PDPageContentStream cs = new PDPageContentStream(document, page);

        // Titulo
        cs.beginText();
        cs.setFont(fontBold, 20);
        cs.setNonStrokingColor(VERDE);
        float titleW = fontBold.getStringWidth(titulo) / 1000f * 20;
        cs.newLineAtOffset((page.getMediaBox().getWidth() - titleW) / 2f, yPos);
        cs.showText(titulo);
        cs.endText();
        yPos -= 26;

        // Rango de fechas
        cs.beginText();
        cs.setFont(fontPlain, 10);
        cs.setNonStrokingColor(VERDE);
        float rangoW = fontPlain.getStringWidth(rango) / 1000f * 10;
        cs.newLineAtOffset((page.getMediaBox().getWidth() - rangoW) / 2f, yPos);
        cs.showText(rango);
        cs.endText();
        yPos -= 24;

        // Cabecera de tabla
        yPos = dibujarCabecera(cs, fontBold, margin, yPos, rowHeight, cellPad, tableWidth);

        for (ReporteFilaDTO fila : filas) {
            if (yPos < margin + rowHeight) {
                cs.close();
                page = new PDPage(PDRectangle.A4);
                document.addPage(page);
                cs = new PDPageContentStream(document, page);
                yPos = page.getMediaBox().getHeight() - margin;
                yPos = dibujarCabecera(cs, fontBold, margin, yPos, rowHeight, cellPad, tableWidth);
            }

            String[] celdas = {
                String.valueOf(fila.getVentaId()),
                fila.getFecha() != null ? fila.getFecha() : "",
                fila.getIdCliente() != null ? fila.getIdCliente() : "",
                fila.getNombreCliente() != null ? fila.getNombreCliente() : "",
                fila.getIdEmpleado() != null ? fila.getIdEmpleado() : "",
                fila.getNombreEmpleado() != null ? fila.getNombreEmpleado() : "",
                fila.getTotal() != null ? "$" + fila.getTotal().toPlainString() : ""
            };

            float xPos = margin;
            cs.setFont(fontPlain, 8);
            cs.setNonStrokingColor(VERDE);

            for (int j = 0; j < celdas.length; j++) {
                String texto = truncar(celdas[j], fontPlain, 8f, COL_WIDTHS[j] - cellPad * 2);
                float textW = fontPlain.getStringWidth(texto) / 1000f * 8f;
                float textX = xPos + (COL_WIDTHS[j] - textW) / 2f;
                cs.beginText();
                cs.newLineAtOffset(textX, yPos - rowHeight + cellPad + 2);
                cs.showText(texto);
                cs.endText();
                xPos += COL_WIDTHS[j];
            }

            cs.setStrokingColor(VERDE);
            cs.setLineWidth(0.4f);
            cs.moveTo(margin, yPos - rowHeight);
            cs.lineTo(margin + tableWidth, yPos - rowHeight);
            cs.stroke();

            yPos -= rowHeight;
        }

        cs.close();
    }

    private float dibujarCabecera(PDPageContentStream cs,
                                   PDType1Font fontBold,
                                   float margin, float yPos,
                                   float rowHeight, float cellPad,
                                   float tableWidth) throws IOException {
        cs.setNonStrokingColor(VERDE);
        cs.addRect(margin, yPos - rowHeight, tableWidth, rowHeight);
        cs.fill();

        cs.setNonStrokingColor(BLANCO);
        cs.setFont(fontBold, 8);
        float xPos = margin;

        for (int i = 0; i < COL_HEADERS.length; i++) {
            float textW = fontBold.getStringWidth(COL_HEADERS[i]) / 1000f * 8f;
            float textX = xPos + (COL_WIDTHS[i] - textW) / 2f;
            cs.beginText();
            cs.newLineAtOffset(textX, yPos - rowHeight + cellPad + 4);
            cs.showText(COL_HEADERS[i]);
            cs.endText();
            xPos += COL_WIDTHS[i];
        }

        return yPos - rowHeight;
    }

    private String truncar(String texto, PDType1Font font, float fontSize, float maxWidth)
            throws IOException {
        if (texto == null) return "";
        String safe = texto.replaceAll("[^\\x00-\\x7E]", "?");
        float w = font.getStringWidth(safe) / 1000f * fontSize;
        if (w <= maxWidth) return safe;

        while (safe.length() > 0) {
            safe = safe.substring(0, safe.length() - 1);
            w = font.getStringWidth(safe + "..") / 1000f * fontSize;
            if (w <= maxWidth) return safe + "..";
        }
        return "";
    }
}
