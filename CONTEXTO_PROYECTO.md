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
| D | Pulido final | COMPLETADA 2026-06-16 | d889fce |
| E | Rediseno visual: nueva paleta + brand gold + dashboard v2 | COMPLETADA 2026-06-17 | (ver abajo) |

---

## Fase A -- COMPLETADA

**Archivos creados:**
- `src/main/resources/static/css/rossmille.css`
- `src/main/resources/static/js/rossmille.js`

**Que hace:** sidebar lateral fijo, `showToast()`, `initSidebar()`, Bootstrap Icons.
Ver historial completo en commits anteriores.

---

## Fase B -- COMPLETADA

**Endpoint:** `GET /api/dashboard/resumen` -- KPIs + ventas 7 dias.
**Archivos Java:** `DashboardDTO`, `DiaVentasDTO`, `DashboardService`, `DashboardController`.
**Frontend:** `dashboard.js` con Chart.js 4.4.4.

---

## Fase C -- COMPLETADA

- Productos: debounce 300ms + filtros chip de genero (client-side)
- Clientes: debounce 300ms + avatar con iniciales + formatNum COP
- Pedidos: contador por tab

---

## Fase D -- COMPLETADA

- Sidebar colapsable (60px icono-only, estado en localStorage)
- Paginacion client-side: Productos 12/pag, Clientes 10/pag, Usuarios 10/pag
- `renderPaginacion()` global en rossmille.js
- formatNum(n) en productos.js
- favicon.svg (RM sobre fondo #1a1a2e)

---

## Fase E -- COMPLETADA 2026-06-17

Rediseno visual completo: nueva paleta de colores, brand gold, dashboard v2.

### Cambios en rossmille.css

**Nueva paleta de variables:**
```css
--rm-dark:      #0f172a   (antes #1a1a2e)
--rm-dark-2:    #1e293b   (antes #2d2d4e)
--rm-accent:    #6366f1   (NUEVO -- indigo)
--rm-accent-h:  #4f46e5
--rm-gold:      #c9a96e   (NUEVO -- dorado para brand)
--rm-bg:        #f1f5f9   (antes #f4f4f8)
--rm-border:    #e2e8f0   (antes #e0e0e8)
--rm-text:      #1e293b   (NUEVO -- texto principal)
--rm-text-2:    #64748b   (NUEVO -- texto secundario)
--rm-success:   #10b981   (antes #198754)
--rm-success-h: #059669   (NUEVO)
--rm-warning:   #f59e0b   (NUEVO)
--rm-danger:    #ef4444   (antes #dc3545)
--rm-danger-h:  #dc2626   (NUEVO)
--rm-info:      #3b82f6   (NUEVO)
--rm-purple:    #8b5cf6   (NUEVO)
--rm-shadow-md: 0 4px 20px rgba(0,0,0,0.09)  (NUEVO)
```

**Sidebar:**
- Fondo: gradiente `linear-gradient(175deg, #0f172a 0%, #1a1246 100%)` (antes color plano)
- Links de navegacion: `border-radius: 8px` + `margin: 2px 10px` (antes border-left)
- Link activo: fondo `rgba(99,102,241,0.18)` + icono color `#818cf8`
- Logout hover: tinte rojo (`rgba(239,68,68,0.15)`) en lugar de blanco
- Toggle btn hover: indigo en lugar de dark-2

**Utilidades nuevas en rossmille.css:**
- `.page-header`, `.page-title`, `.page-subtitle` -- encabezado de pagina
- `.section-title` -- titulo de seccion (reemplaza .section-label)
- `.modal-content`, `.modal-header`, `.modal-title`, `.modal-body`, `.modal-footer` -- overrides de modal Bootstrap
- Focus ring: `border-color: var(--rm-accent)` + `box-shadow: 0 0 0 3px rgba(99,102,241,0.12)`
- Toast info: indigo en lugar de dark

**Brand gold (todos los HTML de modulos):**
```html
<div class="brand-name">ROSS <span class="brand-gold">MILLE</span></div>
```
La palabra MILLE aparece en dorado (#c9a96e) en el sidebar de los 8 modulos.

### Cambios en dashboard.html

**KPI cards (v2):**
- Borde superior de 3px de color por tipo (`.kpi-indigo`, `.kpi-emerald`, `.kpi-amber`, `.kpi-purple`)
- Icon wrap de 48x48px con fondo coloreado (`.kpi-icon-wrap`)
- Hover: `translateY(-2px)` + `box-shadow-md`

**Grafico (v2):**
- Card con header + subtitulo + badge "Semanal"
- Color de barras: indigo `rgba(99,102,241,0.82)` (antes `#1a1a2e`)

**Module cards (v2):**
- Icon wrap 52x52px con fondo coloreado por modulo
  - Vender: emerald | Productos: indigo | Clientes: blue | Pedidos: purple | Usuarios: teal | Reporte: amber
- Hover border: indigo en lugar de oscuro

**Saludo dinamico:**
- "Buenos dias / Buenas tardes / Buenas noches, {nombre}" segun hora del dia
- Fecha completa debajo: "Martes, 17 de junio de 2026"

### Cambios en dashboard.js

- `backgroundColor`: `rgba(99,102,241,0.82)` (antes `#1a1a2e`)
- `hoverBackgroundColor`: `#4f46e5` (antes `#2d2d4e`)

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
    |   |   L-- SecurityConfig.java
    |   +-- controller/
    |   |   +-- AuthController.java
    |   |   +-- DashboardController.java      GET /api/dashboard/resumen
    |   |   +-- ProductoController.java
    |   |   +-- ClienteController.java
    |   |   +-- VentaController.java
    |   |   +-- PedidoController.java
    |   |   +-- UsuarioController.java        @PreAuthorize clase (solo ADMINISTRADOR)
    |   |   L-- ReporteController.java        @PreAuthorize clase (solo ADMINISTRADOR)
    |   +-- dto/
    |   |   +-- ApiResponse.java
    |   |   +-- DashboardDTO.java / DiaVentasDTO.java
    |   |   +-- LoginRequest.java / LoginResponse.java
    |   |   +-- ProductoDTO.java
    |   |   +-- ClienteDTO.java / HistorialComprasDTO.java / ItemCompraDTO.java
    |   |   +-- VentaRequest.java / VentaResponse.java / ItemVentaRequest.java / ItemVentaResponse.java
    |   |   +-- PedidoDTO.java / PedidoRequest.java / DetallePedidoDTO.java / DetallePedidoRequest.java
    |   |   +-- UsuarioDTO.java
    |   |   +-- ReporteFilaDTO.java
    |   |   L-- EliminarRequest.java
    |   +-- entity/
    |   |   +-- Usuario.java / Producto.java / Cliente.java
    |   |   +-- Venta.java / DetalleVenta.java
    |   |   L-- Pedido.java / DetallePedido.java
    |   +-- exception/
    |   |   +-- GlobalExceptionHandler.java
    |   |   L-- StockInsuficienteException.java
    |   +-- repository/
    |   |   +-- UsuarioRepository.java / ProductoRepository.java / ClienteRepository.java
    |   |   +-- VentaRepository.java / DetalleVentaRepository.java
    |   |   L-- PedidoRepository.java / DetallePedidoRepository.java
    |   +-- security/
    |   |   +-- JwtAuthenticationFilter.java
    |   |   +-- JwtTokenProvider.java
    |   |   L-- UserDetailsServiceImpl.java
    |   L-- service/
    |       +-- AuthService.java
    |       +-- DashboardService.java
    |       +-- ProductoService.java
    |       +-- ClienteService.java
    |       +-- VentaService.java
    |       +-- PedidoService.java
    |       +-- UsuarioService.java
    |       L-- ReporteService.java
    L-- resources/
        +-- application.yml
        L-- static/
            +-- favicon.svg
            +-- css/
            |   L-- rossmille.css             [A+D+E: paleta, sidebar, paginacion, nueva paleta indigo/gold]
            +-- login.html
            +-- dashboard.html                [B+E: KPIs, chart, module cards v2, saludo dinamico]
            +-- productos.html                [C+D+E: debounce, chips genero, paginacion, brand gold]
            +-- clientes.html                 [C+D+E: debounce, avatar, paginacion, brand gold]
            +-- vender.html                   [E: brand gold]
            +-- pedidos.html                  [C+E: contadores tab, brand gold]
            +-- usuarios.html                 [D+E: paginacion, brand gold]
            +-- reporte.html                  [E: brand gold]
            L-- js/
                +-- rossmille.js              [A+D: showToast, initSidebar, toggle sidebar, renderPaginacion]
                +-- auth.js                   guardRoute(), logout(), getToken(), clearSession()
                +-- api.js                    apiFetch() con Authorization header automatico
                +-- dashboard.js              [B+E: Chart.js, KPIs, color indigo]
                +-- productos.js              [C+D: debounce, filtros genero, paginacion, formatNum]
                +-- clientes.js               [C+D: debounce, avatar, formatNum, paginacion]
                +-- vender.js
                +-- pedidos.js                [C: contadores por tab]
                +-- usuarios.js               [D: paginacion]
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
GET /api/dashboard/resumen   -> DashboardDTO { ventasHoy, ingresosHoy, stockBajo, pedidosPendientes, ventasPorDia[] }
```

### Productos (cualquier rol autenticado)
```
GET    /api/productos              ?q= busqueda por nombre/desc/genero/cat/color
GET    /api/productos/stock-bajo   stock <= 5
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
GET    /api/clientes/{id}/compras  historial JOIN ventas+detalle+productos
```

### Ventas (cualquier rol)
```
POST   /api/ventas   { items:[{productoId,cantidad,precioUnitario}], idCliente, descuento, metodoPago }
```

### Pedidos (cualquier rol; DELETE solo Administrador)
```
GET    /api/pedidos?tipo=activos    estado IN (Pendiente, En Proceso)
GET    /api/pedidos?tipo=historial  estado = Atendido
POST   /api/pedidos
PUT    /api/pedidos/{id}/avanzar    Pendiente->En Proceso->Atendido
DELETE /api/pedidos/{id}            body: { contrasena }
```

### Usuarios (solo Administrador -- @PreAuthorize clase)
```
GET    /api/usuarios
POST   /api/usuarios
PUT    /api/usuarios/{id}
DELETE /api/usuarios/{id}   body: { contrasena }
```

### Reporte (solo Administrador -- @PreAuthorize clase)
```
GET /api/reporte?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
GET /api/reporte/pdf?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
```

---

## Decisiones tecnicas

### Autenticacion
- Login: ID + cargo + contrasena
- JWT claims: sub (idUsuario), nombre, rol. Expiracion 8h
- JWT en localStorage: claves `rm_token` y `rm_session`

### Seguridad
- Spring Security 6 STATELESS, CSRF off
- Rutas publicas: POST /api/auth/login, /*.html, /js/**, /css/**, /favicon.svg
- `@PreAuthorize("hasRole('ADMINISTRADOR')")` a nivel de clase en UsuarioController y ReporteController
- Autoridades: ROLE_ADMINISTRADOR / ROLE_EMPLEADO
- AccessDeniedException -> HTTP 403 (handler especifico en GlobalExceptionHandler)

### Base de datos
- `ddl-auto: validate` -- Hibernate verifica, no modifica el schema
- `@Lock(LockModeType.PESSIMISTIC_WRITE)` en ProductoRepository para ventas ACID
- JdbcTemplate para queries con JOIN (historial compras, reporte, dashboard)
- MySQL Connector 8 retorna LocalDateTime para DATETIME -- usar instanceof pattern matching

### Patron de respuesta API
```json
{ "ok": true, "message": null, "data": { ... } }
{ "ok": false, "message": "Descripcion del error", "data": null }
```

### Frontend
- `apiFetch(url, options)` en api.js -- fetch con Authorization header automatico, redireccion en 401/403
- `guardRoute()` en auth.js -- protege todas las paginas, retorna session o redirige a login
- `initSidebar(session)` en rossmille.js -- rellena sidebar, oculta items admin, inyecta boton toggle
- `showToast(msg, type)` en rossmille.js -- notificaciones flotantes (success/error/info)
- `renderPaginacion(wrapId, total, pagina, pageSize, fnNombre)` en rossmille.js -- controles reutilizables
- `formatNum(n)` en cada modulo JS -- formato `es-CO` (punto como separador de miles)

### Sidebar colapsable (Fase D)
- Estado en `localStorage` clave `rm_sidebar_collapsed` ('1' o '0')
- Colapsado: 60px, solo iconos. Expandido: 220px, texto completo
- CSS usa `body.sidebar-collapsed` como selector padre
- El boton toggle se inyecta via JS en `initSidebar`, no en HTML estatico

### Paginacion (Fase D)
- Toda la paginacion es client-side sobre el cache ya cargado
- Al hacer nueva busqueda o cambiar filtro se resetea a pagina 1
- Si el total es <= pageSize, los controles no se muestran

### Paleta de colores (Fase E)
- Primario oscuro: slate `#0f172a` / `#1e293b`
- Accent: indigo `#6366f1` / `#4f46e5`
- Brand gold: `#c9a96e` (solo para "MILLE" en el sidebar)
- Fondo: `#f1f5f9`
- Texto: `#1e293b` (principal) / `#64748b` (secundario)
- Exito: emerald `#10b981`, Advertencia: `#f59e0b`, Peligro: `#ef4444`, Info: `#3b82f6`, Morado: `#8b5cf6`

---

## Configuracion de red (WSL2 -- configurado 2026-06-17)

### Acceso desde la misma red Wi-Fi

URL desde otro equipo: `http://192.168.10.167:8080/login.html`
IP del equipo Windows (Wi-Fi): `192.168.10.167`

### Archivos creados para habilitar acceso en red

| Archivo | Descripcion |
|---------|-------------|
| `C:\Users\camil\.wslconfig` | `networkingMode=mirrored` -- WSL2 comparte interfaz de red con Windows |
| `C:\Users\camil\Desktop\rossmille_habilitar_red.ps1` | Script Admin: agrega regla firewall puerto 8080 + reinicia WSL |

### Pasos para reactivar (si el equipo se reinicia)

Solo necesitas volver a correr la app:
```bash
export JAVA_HOME=/home/camil/.vscode-server/extensions/redhat.java-1.54.0-linux-x64/jre/21.0.10-linux-x86_64
export PATH=$JAVA_HOME/bin:$PATH
cd ~/proyectos/rossmille-web && ./mvnw spring-boot:run
```
El `.wslconfig` y la regla de firewall son permanentes. No necesitas volver a ejecutar el script admin.

---

## Convenciones de codigo

- Solo ASCII en archivos fuente (.java, .html, .js, .css, .yml) -- sin tildes ni caracteres especiales
- `ddl-auto: validate` -- nunca modificar el schema desde la app
- DTOs separados de entidades JPA -- nunca exponer entidad directamente en API
- Eliminaciones protegidas con contrasena del usuario logueado (BCrypt verify en service)
- Precio/moneda: usar `formatNum(n)` con locale `es-CO` en todos los modulos JS
- Colores: usar variables CSS `var(--rm-*)`, nunca valores hexadecimales directos en HTML inline

---

## Bugs corregidos en Fase 7

- Hash BCrypt del admin estaba corrupto en BD (54 chars) -- regenerado con python bcrypt
- ReporteService y ClienteService: cast Timestamp fallaba con MySQL Connector 8 (retorna LocalDateTime) -- corregido con instanceof pattern matching
- GlobalExceptionHandler: AccessDeniedException era atrapada por catch-all Exception -> 500 -- handler especifico -> 403
- GlobalExceptionHandler: sin logging de errores 500 -- agregado Logger SLF4J

---

## Commits del proyecto

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
| d889fce | Fases A-D completadas: sistema de diseno, dashboard, UX y pulido final |
| (nuevo) | Fase E: rediseno visual paleta indigo/gold + dashboard v2 + acceso en red |
