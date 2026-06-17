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
| Frontend | HTML + Bootstrap 5.3.2 + Bootstrap Icons 1.11.3 + Vanilla JS |
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

### Requisito para acceso en red (configurado el 2026-06-17)

WSL2 tiene modo `networkingMode=mirrored` activo via `C:\Users\camil\.wslconfig`.
Esto hace que la app sea accesible en la red local sin port forwarding.
Se requirio ejecutar una sola vez como Administrador el script del Escritorio
`rossmille_habilitar_red.ps1` para agregar la regla de firewall Windows en puerto 8080.
La configuracion es permanente -- solo hay que volver a correr la app.

---

## Credenciales de prueba (BD local Docker)

| Campo | Valor |
|-------|-------|
| ID | 1234567 |
| Cargo | Administrador |
| Contrasena | Admin123 |

Nota: el hash BCrypt del admin fue regenerado el 2026-06-16 con Python bcrypt porque el original
estaba corrupto (54 chars sin prefijo $2a$). Si la BD se reinicia desde cero, correr
`python3 db/setup_admin.py` desde el proyecto prototipo y usar el SQL generado.

---

## Estado de fases del proyecto

### Fases originales -- TODAS COMPLETADAS

| Fase | Descripcion | Estado | Commit |
|------|-------------|--------|--------|
| 1 | Base del proyecto + Autenticacion JWT | COMPLETADA | 72a027a |
| 2 | Modulo Productos | COMPLETADA | 72a027a |
| 3 | Modulo Clientes | COMPLETADA | ad992d9 |
| 4 | Modulo Vender (POS) ACID | COMPLETADA | 75fe27c |
| 5 | Modulo Pedidos | COMPLETADA | a068b51 |
| 6 | Usuarios + Reporte PDF + Dashboard | COMPLETADA | 0bd750c |
| 7 | Calidad y cierre | COMPLETADA | aa904e5 |

### Fases de mejoras visuales -- TODAS COMPLETADAS

| Fase | Descripcion | Estado | Commit |
|------|-------------|--------|--------|
| A | Sistema de diseno compartido + Sidebar | COMPLETADA 2026-06-16 | d889fce |
| B | Dashboard con KPIs reales + Chart.js | COMPLETADA 2026-06-16 | d889fce |
| C | Mejoras UX por modulo | COMPLETADA 2026-06-16 | d889fce |
| D | Sidebar colapsable + paginacion + favicon | COMPLETADA 2026-06-16 | d889fce |
| E | Rediseno visual: paleta indigo/gold + dashboard v2 | COMPLETADA 2026-06-17 | 3298859 |
| F | Modulo Configuracion completo (7 secciones) | COMPLETADA 2026-06-17 | f062546 |

---

## Fase F -- Modulo Configuracion (2026-06-17)

### Tabla nueva en BD

```sql
-- Archivo: db/add_configuracion.sql (ya ejecutado en BD existente)
-- Agregado tambien a: db/init.sql (para instalaciones nuevas)
CREATE TABLE configuracion (
    clave       VARCHAR(100) NOT NULL,
    valor       TEXT         NULL,
    grupo       VARCHAR(50)  NOT NULL DEFAULT 'general',
    descripcion VARCHAR(255) NULL,
    actualizado TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (clave)
);
```

### Defaults sembrados al arrancar (28 claves)

| Grupo | Clave | Valor por defecto |
|-------|-------|-------------------|
| empresa | empresa.nombre | ROSS MILLE |
| empresa | empresa.nit | (vacio) |
| empresa | empresa.direccion | (vacio) |
| empresa | empresa.telefono | (vacio) |
| empresa | empresa.correo | (vacio) |
| empresa | empresa.sitio_web | (vacio) |
| empresa | empresa.ciudad | (vacio) |
| empresa | empresa.pais | Colombia |
| empresa | empresa.logo_base64 | (vacio -- data URL cuando se sube imagen) |
| sistema | sistema.moneda_simbolo | $ |
| sistema | sistema.iva_porcentaje | 19 |
| sistema | sistema.formato_fecha | dd/MM/yyyy |
| sistema | sistema.idioma | es |
| sistema | sistema.zona_horaria | America/Bogota |
| ventas | ventas.consecutivo_inicial | 1 |
| ventas | ventas.prefijo_facturas | FAC- |
| ventas | ventas.pie_pagina | Gracias por su compra en ROSS MILLE. |
| ventas | ventas.metodos_pago | Efectivo,Tarjeta,Transferencia |
| ventas | ventas.descuento_maximo | 50 |
| seguridad | seguridad.tiempo_sesion_horas | 8 |
| seguridad | seguridad.contrasena_min_longitud | 6 |
| seguridad | seguridad.max_intentos_login | 5 |
| notificaciones | notificaciones.stock_umbral | 5 |
| notificaciones | notificaciones.alertas_correo | false |
| notificaciones | notificaciones.alertas_sistema | true |
| apariencia | apariencia.tema | claro |
| apariencia | apariencia.color_principal | #6366f1 |
| apariencia | apariencia.tamano_fuente | 15 |

### Archivos Java creados

| Archivo | Descripcion |
|---------|-------------|
| `entity/Configuracion.java` | Entidad JPA, PK = clave (String), campos: valor, grupo, descripcion, actualizado |
| `repository/ConfiguracionRepository.java` | JpaRepository<Configuracion, String> + findByGrupo |
| `service/ConfiguracionService.java` | @PostConstruct seedDefaults(), get(clave), getInt(clave, default), getAll(), guardar(Map), generarBackup() -> byte[], restaurar(sql) -> int |
| `controller/ConfiguracionController.java` | @PreAuthorize ADMINISTRADOR a nivel de clase |

### Endpoints de Configuracion (solo ADMINISTRADOR)

```
GET  /api/configuracion              -> Map<String,String> con las 28 claves
PUT  /api/configuracion              -> guarda Map<String,String> parcial (body JSON)
GET  /api/configuracion/backup       -> descarga rossmille_backup_YYYYMMDD_HHmmss.sql
POST /api/configuracion/restaurar    -> multipart archivo=.sql, ejecuta INSERT IGNORE
```

### Archivos frontend creados/modificados

**Nuevo:**
- `configuracion.html` -- 7 secciones con tabs (Empresa, Sistema, Ventas, Seguridad, Notificaciones, Respaldo, Apariencia)
- `js/configuracion.js` -- carga al entrar, guarda por grupo, validaciones, logo base64, backup download, restore upload, apariencia en tiempo real

**Modificados:**
- `js/rossmille.js` -- agrega `window.aplicarApariencia()`: lee `localStorage` clave `rm_apariencia` y aplica CSS variables `--rm-accent`, `--rm-accent-h`, `font-size`, `data-theme` en toda pagina que llame `initSidebar()`
- `css/rossmille.css` -- agrega bloque `[data-theme="oscuro"]` con overrides de fondo, texto, bordes, formularios, modales, tablas y componentes de la pagina de configuracion
- Los 7 HTML de modulos -- link Configuracion agregado al sidebar admin: `<li class="rm-nav-admin"><a href="/configuracion.html" class="rm-nav-link"><i class="bi bi-gear"></i> Configuracion</a></li>`

**Otros cambios:**
- `SecurityConfig.java` -- agrega `/*.svg` a rutas publicas (fix favicon)
- `application.yml` -- `spring.servlet.multipart.max-file-size: 50MB`
- `service/ProductoService.java` -- `stockBajo()` ahora lee umbral de `configuracionService.getInt("notificaciones.stock_umbral", 5)` en lugar de constante hardcodeada

### Descripcion de las 7 secciones de la pagina

| Seccion | Campos configurables |
|---------|---------------------|
| Empresa | nombre, NIT, direccion, telefono, correo, sitio web, ciudad, pais, logo (upload base64) |
| Sistema | simbolo moneda, IVA %, formato fecha, idioma, zona horaria |
| Ventas | consecutivo inicial, prefijo facturas, pie de pagina, metodos de pago (checkboxes), descuento maximo % |
| Seguridad | tabla permisos por rol (lectura), tiempo sesion horas, longitud min contrasena, max intentos login |
| Notificaciones | umbral stock bajo (conectado a ProductoService), toggle alertas sistema, toggle alertas correo |
| Respaldo | boton descargar .sql (exporta INSERT IGNORE de todas las tablas), subir .sql para restaurar |
| Apariencia | tema claro/oscuro (data-theme), color principal (color picker, aplica --rm-accent en tiempo real), tamano fuente 12-20px (slider) |

### Logica de apariencia

1. Admin cambia color/tema/fuente en /configuracion.html -> cambio visual inmediato en la pagina
2. Al guardar -> se envian al backend Y se guardan en `localStorage` clave `rm_apariencia`
3. Cualquier otra pagina del sistema -> `initSidebar()` llama `aplicarApariencia()` que lee localStorage y aplica las variables CSS

---

## Estructura completa del proyecto (estado final)

```
rossmille-web/
+-- pom.xml
+-- mvnw
+-- README.md
+-- CONTEXTO_PROYECTO.md          (este archivo)
+-- PLAN_TRABAJO.md
L-- src/main/
    +-- java/com/rossmille/
    |   +-- RossmilleApplication.java
    |   +-- config/
    |   |   L-- SecurityConfig.java               [fix /*.svg publico]
    |   +-- controller/
    |   |   +-- AuthController.java
    |   |   +-- ConfiguracionController.java      GET+PUT /api/configuracion, backup, restaurar
    |   |   +-- DashboardController.java          GET /api/dashboard/resumen
    |   |   +-- ProductoController.java
    |   |   +-- ClienteController.java
    |   |   +-- VentaController.java
    |   |   +-- PedidoController.java
    |   |   +-- UsuarioController.java            @PreAuthorize clase (ADMINISTRADOR)
    |   |   L-- ReporteController.java            @PreAuthorize clase (ADMINISTRADOR)
    |   +-- dto/
    |   |   +-- ApiResponse.java
    |   |   +-- DashboardDTO.java / DiaVentasDTO.java
    |   |   +-- LoginRequest.java / LoginResponse.java
    |   |   +-- ProductoDTO.java
    |   |   +-- ClienteDTO.java / HistorialComprasDTO.java / ItemCompraDTO.java
    |   |   +-- VentaRequest.java / VentaResponse.java / ItemVentaRequest.java / ItemVentaResponse.java
    |   |   +-- PedidoDTO.java / PedidoRequest.java / DetallePedidoDTO.java / DetallePedidoRequest.java
    |   |   +-- UsuarioDTO.java / ReporteFilaDTO.java / EliminarRequest.java
    |   +-- entity/
    |   |   +-- Configuracion.java                [NUEVO Fase F]
    |   |   +-- Usuario.java / Producto.java / Cliente.java
    |   |   +-- Venta.java / DetalleVenta.java
    |   |   L-- Pedido.java / DetallePedido.java
    |   +-- exception/
    |   |   +-- GlobalExceptionHandler.java
    |   |   L-- StockInsuficienteException.java
    |   +-- repository/
    |   |   +-- ConfiguracionRepository.java      [NUEVO Fase F]
    |   |   +-- UsuarioRepository.java / ProductoRepository.java / ClienteRepository.java
    |   |   +-- VentaRepository.java / DetalleVentaRepository.java
    |   |   L-- PedidoRepository.java / DetallePedidoRepository.java
    |   +-- security/
    |   |   +-- JwtAuthenticationFilter.java
    |   |   +-- JwtTokenProvider.java
    |   |   L-- UserDetailsServiceImpl.java
    |   L-- service/
    |       +-- ConfiguracionService.java          [NUEVO Fase F]
    |       +-- AuthService.java
    |       +-- DashboardService.java
    |       +-- ProductoService.java               [umbral stock desde BD]
    |       +-- ClienteService.java
    |       +-- VentaService.java
    |       +-- PedidoService.java
    |       +-- UsuarioService.java
    |       L-- ReporteService.java
    L-- resources/
        +-- application.yml                        [multipart 50MB]
        L-- static/
            +-- favicon.svg
            +-- css/
            |   L-- rossmille.css                  [E+F: paleta, sidebar, dark mode]
            +-- login.html
            +-- dashboard.html                     [B+E+F: KPIs, chart, sidebar link config]
            +-- configuracion.html                 [NUEVO Fase F -- 7 secciones]
            +-- productos.html                     [C+D+E+F: debounce, chips, paginacion, sidebar link]
            +-- clientes.html                      [C+D+E+F: debounce, avatar, paginacion, sidebar link]
            +-- vender.html                        [E+F: brand gold, sidebar link]
            +-- pedidos.html                       [C+E+F: contadores tab, sidebar link]
            +-- usuarios.html                      [D+E+F: paginacion, sidebar link]
            +-- reporte.html                       [E+F: sidebar link]
            L-- js/
                +-- rossmille.js                   [A+D+F: showToast, initSidebar, toggle, paginacion, aplicarApariencia]
                +-- auth.js
                +-- api.js
                +-- dashboard.js                   [B+E]
                +-- configuracion.js               [NUEVO Fase F]
                +-- productos.js                   [C+D]
                +-- clientes.js                    [C+D]
                +-- vender.js
                +-- pedidos.js                     [C]
                +-- usuarios.js                    [D]
                L-- reporte.js
```

---

## API REST completa

### Autenticacion (publica)
```
POST /api/auth/login   { id, cargo, contrasena } -> { token, nombre, rol }
```

### Dashboard (cualquier rol autenticado)
```
GET /api/dashboard/resumen   -> DashboardDTO
```

### Productos (cualquier rol autenticado)
```
GET    /api/productos              ?q= busqueda
GET    /api/productos/stock-bajo   stock <= notificaciones.stock_umbral (BD)
GET    /api/productos/{id}
POST   /api/productos
PUT    /api/productos/{id}
DELETE /api/productos/{id}         body: { contrasena }
```

### Clientes (cualquier rol; DELETE solo Administrador)
```
GET    /api/clientes               ?q= busqueda
GET    /api/clientes/{id}
POST   /api/clientes
PUT    /api/clientes/{id}
DELETE /api/clientes/{id}          body: { contrasena }
GET    /api/clientes/{id}/compras
```

### Ventas (cualquier rol)
```
POST   /api/ventas   { items, idCliente, descuento, metodoPago }
```

### Pedidos (cualquier rol; DELETE solo Administrador)
```
GET    /api/pedidos?tipo=activos
GET    /api/pedidos?tipo=historial
POST   /api/pedidos
PUT    /api/pedidos/{id}/avanzar
DELETE /api/pedidos/{id}   body: { contrasena }
```

### Usuarios (solo ADMINISTRADOR)
```
GET    /api/usuarios
POST   /api/usuarios
PUT    /api/usuarios/{id}
DELETE /api/usuarios/{id}   body: { contrasena }
```

### Reporte (solo ADMINISTRADOR)
```
GET /api/reporte?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
GET /api/reporte/pdf?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
```

### Configuracion (solo ADMINISTRADOR)
```
GET  /api/configuracion              -> Map<String,String> (28 claves)
PUT  /api/configuracion              -> guarda cambios parciales (body JSON)
GET  /api/configuracion/backup       -> descarga .sql con INSERT IGNORE de todas las tablas
POST /api/configuracion/restaurar    -> multipart archivo=.sql, ejecuta sentencias seguras
```

---

## Decisiones tecnicas

### Autenticacion
- Login: ID + cargo + contrasena
- JWT claims: sub (idUsuario), nombre, rol. Expiracion 8h (configurable en BD: seguridad.tiempo_sesion_horas)
- JWT en localStorage: claves `rm_token` y `rm_session`

### Seguridad
- Spring Security 6 STATELESS, CSRF off
- Rutas publicas: POST /api/auth/login, /*.html, /js/**, /css/**, /*.ico, /*.svg
- @PreAuthorize("hasRole('ADMINISTRADOR')") a nivel de clase: UsuarioController, ReporteController, ConfiguracionController
- Autoridades: ROLE_ADMINISTRADOR / ROLE_EMPLEADO
- AccessDeniedException -> HTTP 403

### Base de datos
- `ddl-auto: validate` -- Hibernate verifica, no modifica el schema
- @Lock(LockModeType.PESSIMISTIC_WRITE) en ProductoRepository para ventas ACID
- JdbcTemplate para queries JOIN y para generacion/restauracion de backups SQL
- MySQL Connector 8 retorna LocalDateTime para DATETIME -- usar instanceof pattern matching
- Tabla configuracion: clave-valor con grupo para agrupar secciones

### Patron de respuesta API
```json
{ "ok": true, "message": null, "data": { ... } }
{ "ok": false, "message": "Descripcion del error", "data": null }
```

### Frontend
- `apiFetch()` en api.js -- fetch con Authorization header automatico, redireccion en 401/403
- `guardRoute()` en auth.js -- protege todas las paginas
- `initSidebar(session)` en rossmille.js -- sidebar, toggle, llama `aplicarApariencia()`
- `aplicarApariencia()` en rossmille.js -- lee `rm_apariencia` de localStorage, aplica CSS vars
- `showToast(msg, type)` en rossmille.js -- notificaciones flotantes
- `renderPaginacion()` en rossmille.js -- controles reutilizables
- `formatNum(n)` en cada modulo JS -- formato es-CO

### Apariencia
- Persistencia: localStorage clave `rm_apariencia` = `{tema, color, fuente}`
- Aplicacion: `aplicarApariencia()` al cargar cada pagina (dentro de initSidebar)
- Tiempo real: color picker y slider actualizan CSS variables sin guardar
- Tema oscuro: [data-theme="oscuro"] en documentElement, override de variables CSS

### Paleta de colores (Fase E)
- Primario oscuro: slate `#0f172a` / `#1e293b`
- Accent: indigo `#6366f1` / `#4f46e5`
- Brand gold: `#c9a96e` (solo para "MILLE" en el sidebar)
- Fondo: `#f1f5f9`, Texto: `#1e293b` / `#64748b`
- Exito: `#10b981`, Advertencia: `#f59e0b`, Peligro: `#ef4444`, Info: `#3b82f6`, Morado: `#8b5cf6`

### Sidebar colapsable (Fase D)
- Estado: localStorage clave `rm_sidebar_collapsed`
- Colapsado: 60px solo iconos. Expandido: 220px texto completo
- Toggle inyectado via JS en initSidebar

### Paginacion (Fase D)
- Client-side sobre cache cargado
- Productos: 12/pag, Clientes: 10/pag, Usuarios: 10/pag

---

## Configuracion de red (WSL2 -- configurado 2026-06-17)

| Item | Valor |
|------|-------|
| URL local | http://localhost:8080/login.html |
| URL en red Wi-Fi | http://192.168.10.167:8080/login.html |
| IP Windows Wi-Fi | 192.168.10.167 |
| WSL2 networkingMode | mirrored (C:\Users\camil\.wslconfig) |
| Firewall | Regla "ROSS MILLE Web" puerto 8080 inbound (permanente) |
| Script admin | C:\Users\camil\Desktop\rossmille_habilitar_red.ps1 (ya ejecutado) |

---

## Convenciones de codigo

- Solo ASCII en archivos fuente (.java, .html, .js, .css, .yml) -- sin tildes ni caracteres especiales
- `ddl-auto: validate` -- nunca modificar el schema desde la app
- DTOs separados de entidades JPA
- Eliminaciones protegidas con contrasena del usuario logueado
- `formatNum(n)` con locale `es-CO` en todos los modulos JS
- Colores: usar variables CSS `var(--rm-*)`, no valores hex directos en HTML inline

---

## Bugs corregidos en Fase 7

- Hash BCrypt del admin corrupto en BD (54 chars) -- regenerado con python bcrypt
- ReporteService / ClienteService: cast Timestamp -> LocalDateTime con instanceof pattern matching
- GlobalExceptionHandler: AccessDeniedException -> handler especifico -> 403
- GlobalExceptionHandler: logging de errores 500 con SLF4J

---

## Historial de commits

| Hash | Descripcion |
|------|-------------|
| 72a027a | Fase 1 y 2: Auth JWT + modulo Productos |
| ad992d9 | Fase 3: modulo Clientes |
| 0f62ba8 | Fase 4 en progreso: entidades y DTOs de Venta |
| 75fe27c | Fase 4 completada: modulo Vender (POS) |
| a068b51 | Fase 5 completada: modulo Pedidos |
| 0bd750c | Fase 6 completada: Usuarios + Reporte + Dashboard |
| aa904e5 | Fase 7 completada: calidad, cierre y bugs corregidos |
| 2021f50 | Actualizar CONTEXTO_PROYECTO.md con estado final del proyecto |
| d889fce | Fases A-D: sistema de diseno, dashboard, UX y pulido final |
| 3298859 | Fase E: rediseno visual paleta indigo/gold + dashboard v2 + config red local |
| f062546 | Fase F: Modulo Configuracion completo -- 7 secciones, backend + frontend |
