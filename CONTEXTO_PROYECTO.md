# Contexto del Proyecto -- ROSS MILLE Web

Ultima actualizacion: 2026-06-17

Migracion del prototipo ROSS MILLE POS (Java Swing) a aplicacion web profesional con
Spring Boot REST API y frontend HTML/CSS/Vanilla JS.
Objetivo: pieza de portafolio que demuestra manejo profesional de Java backend moderno.

- Prototipo Swing original: `/home/camil/proyectos/prototype-java` (repo: Rossmille_pos) -- ARCHIVADO
- Este proyecto: `/home/camil/proyectos/rossmille-web` (repo: rossmille-web)

---

## Stack tecnologico

| Capa | Tecnologia |
|------|-----------|
| Lenguaje | Java 21 |
| Framework | Spring Boot 3.3.5 |
| ORM | Spring Data JPA + Hibernate 6 |
| Seguridad | Spring Security 6 + JWT (jjwt 0.11.5) |
| Contrasenas | BCryptPasswordEncoder |
| Frontend | HTML + Bootstrap 5.3.2 + Bootstrap Icons 1.11.3 + Chart.js 4.4.4 + Vanilla JS |
| Fuente | Inter (Google Fonts via @import en rossmille.css) |
| BD | MySQL 8.0 en Docker (mismo schema del prototipo) |
| PDF | Apache PDFBox 2.0.34 |
| Build | Maven Wrapper (mvnw) |

---

## Como correr el proyecto

```bash
# 1. Levantar la BD (Docker Desktop debe estar corriendo en Windows)
docker compose up -d   # desde /home/camil/proyectos/prototype-java

# 2. Correr la app Spring Boot
cd /home/camil/proyectos/rossmille-web
export JAVA_HOME=/home/camil/.vscode-server/extensions/redhat.java-1.54.0-linux-x64/jre/21.0.10-linux-x86_64
export PATH=$JAVA_HOME/bin:$PATH
./mvnw spring-boot:run

# 3. Abrir en el navegador (mismo equipo)
http://localhost:8080/login.html

# 4. Abrir desde otro equipo en la misma red Wi-Fi
http://192.168.10.167:8080/login.html
```

### IMPORTANTE: reiniciar la app para aplicar cambios de archivos estaticos

Spring Boot en modo `spring-boot:run` sirve estaticos desde `target/` compilado.
Cualquier cambio a `.html`, `.js` o `.css` requiere reiniciar la app para verse reflejado.
El navegador ademas debe hacer recarga forzada: Ctrl+Shift+R.

### Acceso en red Wi-Fi (configurado el 2026-06-17, permanente)

- `C:\Users\camil\.wslconfig`: `networkingMode=mirrored`
- Regla firewall Windows "ROSS MILLE Web" puerto 8080 (ya creada)
- No requiere reconfiguracion. Solo volver a correr la app.

---

## Credenciales de prueba (BD local Docker)

| Campo | Valor |
|-------|-------|
| ID | 1234567 |
| Cargo | Administrador |
| Contrasena | Admin123 |

Nota: hash BCrypt regenerado el 2026-06-16 con Python bcrypt. Si se reinicia la BD desde
cero, correr `python3 db/setup_admin.py` desde el proyecto prototipo.

---

## Estado de fases del proyecto

| Fase | Descripcion | Estado | Commit |
|------|-------------|--------|--------|
| 1 | Auth JWT + base del proyecto | COMPLETADA | 72a027a |
| 2 | Modulo Productos | COMPLETADA | 72a027a |
| 3 | Modulo Clientes | COMPLETADA | ad992d9 |
| 4 | Modulo Vender (POS ACID) | COMPLETADA | 75fe27c |
| 5 | Modulo Pedidos | COMPLETADA | a068b51 |
| 6 | Usuarios + Reporte + Dashboard | COMPLETADA | 0bd750c |
| 7 | Calidad y cierre | COMPLETADA | aa904e5 |
| A | Sistema de diseno + Sidebar | COMPLETADA | d889fce |
| B | Dashboard KPIs + Chart.js | COMPLETADA | d889fce |
| C | UX por modulo (debounce, avatar, contadores) | COMPLETADA | d889fce |
| D | Sidebar colapsable + paginacion + favicon | COMPLETADA | d889fce |
| E | Rediseno visual paleta indigo/gold + dashboard v2 | COMPLETADA | 3298859 |
| F | Modulo Configuracion completo (7 secciones) | COMPLETADA | f062546 |
| G | Reporte con graficas (top productos, metodos pago, ingresos/dia) | COMPLETADA | 4870e40 |

---

## Fase G -- Reporte con graficas (2026-06-17, commit 4870e40)

### Nuevos DTOs

| Clase | Campos |
|-------|--------|
| `ProductoVentaDTO` | nombre, genero, categoria, talla, unidades (int), totalVendido (BigDecimal) |
| `MetodoPagoDTO` | metodo, cantidad (int), total (BigDecimal) |
| `GraficaReporteDTO` | topProductos (List), metodosPago (List), ventasPorDia (List\<DiaVentasDTO\>) |

### Nuevo endpoint

```
GET /api/reporte/graficas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
   -> ApiResponse<GraficaReporteDTO>
   Solo ADMINISTRADOR (@PreAuthorize a nivel de clase)
```

### Queries SQL (en ReporteService.obtenerGraficas)

```sql
-- Top 10 productos por unidades vendidas
SELECT p.nombre, p.genero, p.categoria, p.talla,
       SUM(dv.cantidad) AS unidades,
       SUM(dv.cantidad * dv.precio_unitario) AS total_vendido
FROM detalle_venta dv
JOIN productos p ON p.id = dv.producto_id
JOIN ventas v ON v.id = dv.venta_id
WHERE v.fecha BETWEEN ? AND ?
GROUP BY p.id, p.nombre, p.genero, p.categoria, p.talla
ORDER BY unidades DESC LIMIT 10

-- Distribucion por metodo de pago
SELECT metodo_pago, COUNT(*) AS cantidad, SUM(total) AS total
FROM ventas WHERE fecha BETWEEN ? AND ?
GROUP BY metodo_pago ORDER BY cantidad DESC

-- Ingresos agrupados por dia
SELECT DATE(fecha) AS dia, COUNT(*) AS cantidad, SUM(total) AS total
FROM ventas WHERE fecha BETWEEN ? AND ?
GROUP BY DATE(fecha) ORDER BY dia
```

### Frontend reporte.html / reporte.js

**Dos tabs:**

| Tab | Contenido |
|-----|-----------|
| Tabla de ventas | 3 KPIs (cantidad, ingresos, ticket promedio) + tabla existente + PDF |
| Graficas y analisis | 4 KPIs + 3 visualizaciones |

**4 KPIs en tab Graficas:**
- Total ventas (conteo)
- Ingresos totales
- Producto mas vendido (nombre + unidades)
- Metodo preferido (nombre + transacciones)

**3 visualizaciones:**
1. Bar chart Chart.js -- Ingresos por dia en el periodo (color indigo, compact Y axis: K/M)
2. Tabla de ranking con medallas -- Top 10 productos: oro/plata/bronce para los 3 primeros,
   barra de progreso relativa al #1, columna unidades (badge indigo), total COP
3. Doughnut chart + leyenda manual -- Distribucion por metodo de pago con porcentajes

---

## Fase F -- Modulo Configuracion (2026-06-17, commit f062546)

### Tabla BD

```sql
-- archivo: prototype-java/db/add_configuracion.sql (ejecutado en BD existente)
-- agregado a: prototype-java/db/init.sql (para instalaciones nuevas)
CREATE TABLE configuracion (
    clave       VARCHAR(100) NOT NULL,
    valor       TEXT NULL,
    grupo       VARCHAR(50)  NOT NULL DEFAULT 'general',
    descripcion VARCHAR(255) NULL,
    actualizado TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (clave)
);
```

### 28 claves defaults (sembradas al arrancar por @PostConstruct en ConfiguracionService)

Grupos: empresa (9 claves), sistema (5), ventas (5), seguridad (3), notificaciones (3), apariencia (3)

Claves relevantes:
- `notificaciones.stock_umbral` -- leida por ProductoService en lugar de constante hardcodeada
- `apariencia.tema` / `apariencia.color_principal` / `apariencia.tamano_fuente` -- CSS vars en tiempo real
- `empresa.logo_base64` -- data URL de imagen, almacenada en TEXT de la BD

### Endpoints Configuracion (solo ADMINISTRADOR)

```
GET  /api/configuracion              -> Map<String,String> con las 28 claves
PUT  /api/configuracion              -> guarda Map parcial (body JSON)
GET  /api/configuracion/backup       -> descarga .sql con INSERT IGNORE de todas las tablas
POST /api/configuracion/restaurar    -> multipart archivo=.sql, ejecuta INSERT IGNORE
```

### Frontend configuracion.html

7 tabs: Empresa, Sistema, Ventas, Seguridad, Notificaciones, Respaldo, Apariencia.
Guardar por seccion. Apariencia aplica cambios en tiempo real sin guardar.

### Fix bugs configuracion.js (commit f929c59)

3 bugs que crasheaban toda la pagina:
1. `actualizarUiTema` hacia `.value` sobre `getElementById('cfg-apariencia.tema')` que es null
   -> TypeError propagaba, crasheaba `poblarFormularios`, mostraba falso "No se pudo conectar"
2. `setTema` usaba `setAttribute('data-theme','')` en lugar de `removeAttribute`
3. `apariencia.tema` nunca se incluia en `cambios` al guardar (no habia input DOM con ese id)

### Apariencia persistente

- Al guardar: backend BD + `localStorage` clave `rm_apariencia` = `{tema, color, fuente}`
- Al cargar cualquier pagina: `initSidebar()` llama `aplicarApariencia()` en `rossmille.js`
  que lee localStorage y aplica `--rm-accent`, `--rm-accent-h`, `font-size`, `data-theme`

---

## Docker fix (2026-06-17, commit 884122d en prototype-java)

Eliminado bind mount `./db/init.sql:/docker-entrypoint-initdb.d/init.sql` del
`docker-compose.yml`. Causaba error "OCI runtime create failed" al reiniciar Docker
Desktop en WSL2 porque las rutas de bind mount cambian entre reinicios.
- El archivo `db/init.sql` sigue en el repo para documentacion e instalaciones nuevas.
- Los datos persisten en el volumen nombrado `rossmille_data`.
- Desde ese commit, `docker compose up -d` arranca sin errores tras cualquier reinicio.

---

## Estructura del proyecto (estado final)

```
rossmille-web/
+-- pom.xml / mvnw / README.md / CONTEXTO_PROYECTO.md / PLAN_TRABAJO.md
L-- src/main/
    +-- java/com/rossmille/
    |   +-- config/SecurityConfig.java             [/*.svg publico, @EnableMethodSecurity]
    |   +-- controller/
    |   |   +-- AuthController.java
    |   |   +-- ConfiguracionController.java       GET+PUT /api/configuracion, backup, restaurar
    |   |   +-- DashboardController.java           GET /api/dashboard/resumen
    |   |   +-- ProductoController.java
    |   |   +-- ClienteController.java
    |   |   +-- VentaController.java
    |   |   +-- PedidoController.java
    |   |   +-- UsuarioController.java             @PreAuthorize ADMINISTRADOR clase
    |   |   L-- ReporteController.java             @PreAuthorize ADMINISTRADOR clase + /graficas
    |   +-- dto/
    |   |   +-- ApiResponse.java
    |   |   +-- DashboardDTO.java / DiaVentasDTO.java
    |   |   +-- GraficaReporteDTO.java             [NUEVO Fase G]
    |   |   +-- MetodoPagoDTO.java                 [NUEVO Fase G]
    |   |   +-- ProductoVentaDTO.java              [NUEVO Fase G]
    |   |   +-- LoginRequest.java / LoginResponse.java
    |   |   +-- ProductoDTO.java
    |   |   +-- ClienteDTO.java / HistorialComprasDTO.java / ItemCompraDTO.java
    |   |   +-- VentaRequest.java / VentaResponse.java / ItemVentaRequest.java / ItemVentaResponse.java
    |   |   +-- PedidoDTO.java / PedidoRequest.java / DetallePedidoDTO.java / DetallePedidoRequest.java
    |   |   +-- UsuarioDTO.java / ReporteFilaDTO.java / EliminarRequest.java
    |   +-- entity/
    |   |   +-- Configuracion.java                 [Fase F -- clave-valor]
    |   |   +-- Usuario.java / Producto.java / Cliente.java
    |   |   +-- Venta.java / DetalleVenta.java
    |   |   L-- Pedido.java / DetallePedido.java
    |   +-- exception/
    |   |   +-- GlobalExceptionHandler.java / StockInsuficienteException.java
    |   +-- repository/
    |   |   +-- ConfiguracionRepository.java       [Fase F]
    |   |   +-- UsuarioRepository.java / ProductoRepository.java / ClienteRepository.java
    |   |   +-- VentaRepository.java / DetalleVentaRepository.java
    |   |   L-- PedidoRepository.java / DetallePedidoRepository.java
    |   +-- security/
    |   |   +-- JwtAuthenticationFilter.java / JwtTokenProvider.java / UserDetailsServiceImpl.java
    |   L-- service/
    |       +-- ConfiguracionService.java          [Fase F -- seedDefaults, get, guardar, backup, restaurar]
    |       +-- AuthService.java / DashboardService.java
    |       +-- ProductoService.java               [umbral stock desde BD via ConfiguracionService]
    |       +-- ClienteService.java / VentaService.java / PedidoService.java
    |       +-- UsuarioService.java
    |       L-- ReporteService.java                [Fase G -- +obtenerGraficas()]
    L-- resources/
        +-- application.yml                        [multipart 50MB]
        L-- static/
            +-- favicon.svg
            +-- css/rossmille.css                  [paleta, sidebar, dark mode, apariencia]
            +-- login.html
            +-- dashboard.html                     [KPIs, chart, sidebar config]
            +-- configuracion.html                 [Fase F -- 7 secciones]
            +-- productos.html / clientes.html / vender.html / pedidos.html
            +-- usuarios.html
            +-- reporte.html                       [Fase G -- 2 tabs, 3 charts]
            L-- js/
                +-- rossmille.js                   [showToast, initSidebar, toggle, paginacion, aplicarApariencia]
                +-- auth.js / api.js
                +-- dashboard.js                   [Chart.js barras, KPIs]
                +-- configuracion.js               [Fase F -- 7 secciones, apariencia tiempo real]
                +-- productos.js / clientes.js / vender.js / pedidos.js / usuarios.js
                L-- reporte.js                     [Fase G -- tabs, bar chart, ranking, doughnut]
```

---

## API REST completa

### Publica
```
POST /api/auth/login   { id, cargo, contrasena } -> { token, nombre, rol }
```

### Cualquier rol autenticado
```
GET /api/dashboard/resumen
GET /api/productos  ?q=
GET /api/productos/stock-bajo   (umbral desde BD: notificaciones.stock_umbral)
GET /api/productos/{id}
POST/PUT /api/productos/{id}
DELETE /api/productos/{id}   body:{contrasena}
GET /api/clientes  ?q=
GET /api/clientes/{id}
GET /api/clientes/{id}/compras
POST/PUT /api/clientes/{id}
POST /api/ventas
GET /api/pedidos?tipo=activos|historial
POST /api/pedidos
PUT /api/pedidos/{id}/avanzar
```

### Solo Empleados propios o Admin
```
DELETE /api/clientes/{id}   body:{contrasena}   (solo Admin)
DELETE /api/pedidos/{id}    body:{contrasena}   (solo Admin)
```

### Solo ADMINISTRADOR
```
GET    /api/usuarios
POST   /api/usuarios
PUT    /api/usuarios/{id}
DELETE /api/usuarios/{id}   body:{contrasena}

GET /api/reporte?desde=&hasta=
GET /api/reporte/graficas?desde=&hasta=       [NUEVO Fase G]
GET /api/reporte/pdf?desde=&hasta=

GET  /api/configuracion
PUT  /api/configuracion
GET  /api/configuracion/backup
POST /api/configuracion/restaurar
```

---

## Decisiones tecnicas clave

- JWT 8h, claims: sub (idUsuario), nombre, rol
- `ddl-auto: validate` -- Hibernate NO modifica el schema
- `@PreAuthorize("hasRole('ADMINISTRADOR')")` a nivel de CLASE: UsuarioController, ReporteController, ConfiguracionController
- Autoridades: ROLE_ADMINISTRADOR / ROLE_EMPLEADO
- Respuestas: `{ ok: bool, message: str, data: obj }`
- JdbcTemplate para JOIN multitabla (reporte, graficas, historial, dashboard, backup)
- Tabla `configuracion`: clave-valor con grupo, seedDefaults @PostConstruct
- Logo empresa: data URL base64 en columna TEXT de `configuracion`
- Apariencia: localStorage `rm_apariencia` + `aplicarApariencia()` en `initSidebar()`
- Paginacion client-side: Productos 12, Clientes 10, Usuarios 10
- Sidebar colapsable: localStorage `rm_sidebar_collapsed`
- Spring Boot sirve estaticos desde `target/` compilado -- reiniciar app para ver cambios
- Chart.js 4.4.4 via CDN: usado en dashboard.js y reporte.js

---

## Paleta de colores (Fase E -- vigente)

```
--rm-dark:      #0f172a    --rm-dark-2:    #1e293b
--rm-accent:    #6366f1    --rm-accent-h:  #4f46e5   (indigo)
--rm-gold:      #c9a96e    (brand "MILLE" en sidebar)
--rm-bg:        #f1f5f9    --rm-white:     #ffffff
--rm-border:    #e2e8f0    --rm-text:      #1e293b    --rm-text-2: #64748b
--rm-success:   #10b981    --rm-warning:   #f59e0b
--rm-danger:    #ef4444    --rm-info:      #3b82f6    --rm-purple: #8b5cf6
```

Tema oscuro: `[data-theme="oscuro"]` en `documentElement`, override de variables CSS.

---

## Historial de commits (estado final)

| Hash | Descripcion |
|------|-------------|
| 72a027a | Fase 1 y 2: Auth JWT + Productos |
| ad992d9 | Fase 3: Clientes |
| 0f62ba8 | Fase 4 en progreso |
| 75fe27c | Fase 4: Vender POS |
| a068b51 | Fase 5: Pedidos |
| 0bd750c | Fase 6: Usuarios + Reporte + Dashboard |
| aa904e5 | Fase 7: calidad y cierre |
| 2021f50 | docs: CONTEXTO_PROYECTO.md v1 |
| d889fce | Fases A-D: sistema de diseno, UX, paginacion, favicon |
| 3298859 | Fase E: paleta indigo/gold, dashboard v2, config red Wi-Fi |
| f062546 | Fase F: Modulo Configuracion (7 secciones) |
| f929c59 | fix: 3 bugs en configuracion.js (null.value, removeAttribute, tema en cambios) |
| c2b118d | docs: contexto con Fase F y fix Docker |
| 580b3e5 | docs: contexto Docker bind mount |
| 4870e40 | Fase G: Reporte con graficas (top productos, metodos pago, ingresos/dia) |
