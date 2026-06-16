# Contexto del Proyecto — ROSS MILLE Web

Ultima actualizacion: 2026-06-16

Migracion del prototipo ROSS MILLE POS (Java Swing) a aplicacion web profesional con
Spring Boot REST API y frontend HTML/CSS/Vanilla JS.
Objetivo: pieza de portafolio que demuestra manejo profesional de Java backend moderno.

- Prototipo Swing original: `/home/camil/proyectos/prototype-java` (repo: Rossmille_pos) — ARCHIVADO
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

# 3. Abrir en el navegador
http://localhost:8080/login.html
```

Nota: en WSL2 el comando `docker compose` requiere que Docker Desktop este activo en Windows
con integracion WSL2 habilitada. MySQL corre en el puerto 3306 del contenedor `rossmille_mysql`.

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

### Fases originales — TODAS COMPLETADAS

| Fase | Descripcion | Estado | Commit |
|------|-------------|--------|--------|
| 1 | Base del proyecto + Autenticacion JWT | COMPLETADA | 72a027a |
| 2 | Modulo Productos | COMPLETADA | 72a027a |
| 3 | Modulo Clientes | COMPLETADA | ad992d9 |
| 4 | Modulo Vender (POS) ACID | COMPLETADA | 75fe27c |
| 5 | Modulo Pedidos | COMPLETADA | a068b51 |
| 6 | Usuarios + Reporte PDF + Dashboard | COMPLETADA | 0bd750c |
| 7 | Calidad y cierre | COMPLETADA | aa904e5 |

### Fases de mejoras visuales — TODAS COMPLETADAS

| Fase | Descripcion | Estado |
|------|-------------|--------|
| A | Sistema de diseno compartido + Sidebar | COMPLETADA 2026-06-16 |
| B | Dashboard con KPIs reales + Chart.js | COMPLETADA 2026-06-16 |
| C | Mejoras UX por modulo | COMPLETADA 2026-06-16 |
| D | Pulido final | COMPLETADA 2026-06-16 |

---

## Fase A — COMPLETADA

**Archivos creados:**
- `src/main/resources/static/css/rossmille.css`
  - Variables CSS: `--rm-dark #1a1a2e`, `--rm-sidebar-w 220px`, `--rm-bg #f4f4f8`, etc.
  - Fuente Inter via `@import url(Google Fonts)`
  - Sidebar lateral fijo: `.rm-sidebar`, `.rm-nav`, `.rm-nav-link`, `.rm-nav-link.active`, `.rm-sidebar-footer`, `.rm-btn-logout`
  - Layout: `.rm-has-sidebar { margin-left: var(--rm-sidebar-w); }`
  - Toast: `.rm-toast-wrap`, `.rm-toast`, `.rm-toast.show`, `.rm-toast.success`, `.rm-toast.error`
  - Overrides globales: `.form-control`, `.form-select`, `.form-label`, `.modal-error`

- `src/main/resources/static/js/rossmille.js`
  - `showToast(msg, type)` — notificacion flotante (success/error/info), auto-dismiss 3.5s
  - `initSidebar(session)` — rellena `#sb-name` y `#sb-role`; oculta `.rm-nav-admin` si rol != Administrador

**Archivos modificados (los 8 HTML):**
- Todos: Bootstrap Icons 1.11.3 CDN, rossmille.css, topbar eliminado, sidebar HTML, `initSidebar(session)` en script
- `login.html` — solo rossmille.css (sin sidebar)
- `vender.html` — layout especial: body con `height:100vh; display:flex; flex-direction:column; margin-left:var(--rm-sidebar-w)` en bloque style (no usa rm-has-sidebar)
- Los otros 6 modulos — body con `class="rm-has-sidebar"`

**Navegacion del sidebar:**
```
Inicio       bi-house-door      /dashboard.html
Vender       bi-cart3           /vender.html
Productos    bi-box-seam        /productos.html
Clientes     bi-people          /clientes.html
Pedidos      bi-clipboard2-list /pedidos.html
--- separador (rm-nav-admin, oculto para Empleado) ---
Usuarios     bi-person-gear     /usuarios.html
Reporte      bi-bar-chart-line  /reporte.html
```

---

## Fase B — COMPLETADA

### Endpoint creado

`GET /api/dashboard/resumen` — autenticado, cualquier rol

Respuesta `ApiResponse<DashboardDTO>`:
```json
{
  "ok": true,
  "data": {
    "ventasHoy": 3,
    "ingresosHoy": 150000.00,
    "stockBajo": 5,
    "pedidosPendientes": 2,
    "ventasPorDia": [
      { "fecha": "10/06", "total": 0, "cantidad": 0 },
      { "fecha": "16/06", "total": 80000, "cantidad": 1 }
    ]
  }
}
```

### Archivos Java creados

- `dto/DashboardDTO.java` — ventasHoy, ingresosHoy, stockBajo, pedidosPendientes, ventasPorDia
- `dto/DiaVentasDTO.java` — fecha (dd/MM), total, cantidad
- `service/DashboardService.java` — 4 queries SQL, rellena los 7 dias con ceros donde no hay ventas. Maneja java.sql.Date e java.time.LocalDate con instanceof pattern matching
- `controller/DashboardController.java` — GET /api/dashboard/resumen, sin @PreAuthorize

### Archivos frontend creados

- `js/dashboard.js`
  - Llama `apiFetch('/dashboard/resumen')` y puebla los 4 KPI cards
  - Grafico de barras Chart.js 4.4.4, 7 dias, chart oscuro (#1a1a2e), responsive
  - `fmtCOP` (compacto para ejes) y `fmtCOPFull` (tooltip completo)

- `dashboard.html` actualizado:
  - 4 cards KPI: Ventas hoy, Ingresos hoy, Stock bajo, Pedidos pendientes
  - Card de grafico con `<canvas id="chartVentas">`
  - CDN Chart.js 4.4.4 y api.js agregados
  - Cards de acceso rapido debajo del grafico

---

## Fase C — COMPLETADA

### Cambios por modulo

**Vender** — busqueda con debounce 280ms ya estaba implementada desde Fase 5. Sin cambios adicionales.

**Productos** (`productos.js`, `productos.html`):
- Busqueda en tiempo real: debounce 300ms en el evento `input` (ademas de boton y Enter)
- Filtros rapidos de genero: chips Femenino / Masculino / Unisex / Nino / Nina
  - Funcionan client-side sobre `productosCache` (sin nueva peticion al servidor)
  - Toggle: click en chip activo lo desactiva
  - Boton Limpiar resetea busqueda Y filtro de genero
  - Variables: `filtroGenero`, funcion `setFiltroGenero(g)`, `aplicarFiltros()`, `actualizarChips()`

**Clientes** (`clientes.js`, `clientes.html`):
- Busqueda en tiempo real: debounce 300ms en el evento `input`
- Avatar con iniciales: circulo de color junto al nombre del cliente en la tabla
  - Iniciales: primeras dos letras si nombre de una sola palabra, o inicial de cada palabra si tiene dos o mas
  - Color: derivado deterministicamente del nombre via hash (8 colores posibles, consistente entre renders)
  - Funciones: `iniciales(nombre)`, `avatarColor(nombre)`, constante `AVATAR_COLORS`
  - CSS: `.cliente-nombre-wrap` (flex), `.avatar-ini` (circulo 30x30px, color dinamico inline)
- Formato moneda COP en historial de compras: reemplazado `Number().toFixed(2)` por `formatNum()` con locale `es-CO`
  - `formatNum` agregada a `clientes.js`

**Pedidos** (`pedidos.js`):
- Contador por tab: ambos tabs muestran cantidad de pedidos entre parentesis ej. `Activos (3)`
  - Al cargar la pagina: se hacen 2 peticiones en paralelo (`cargarPedidos()` para activos + `cargarContadorTab('historial')`)
  - Al cambiar de tab: se actualiza el contador del tab cargado
  - Si hay 0 pedidos en un tab, no muestra el parentesis
  - Variables: `contadoresTab`, funciones `cargarContadorTab(tab)`, `refrescarEtiquetasTab()`

**Reporte** — ya usaba `formatNum` con locale `es-CO`. Sin cambios.

**Usuarios** — badge de rol con color ya estaba implementado desde Fase 6. Sin cambios.

---

## Fase D — COMPLETADA

### Sidebar colapsable

- **CSS** (`rossmille.css`): transicion `width 0.24s ease` en `.rm-sidebar`, estado colapsado via `body.sidebar-collapsed`
  - Colapsado: sidebar 60px, solo iconos visibles, textos con `font-size:0` o `display:none`
  - `.rm-sidebar-toggle-btn`: boton circular 28px fijo en el borde derecho del sidebar, se desplaza junto al sidebar via `transition: left 0.24s`
  - `.rm-has-sidebar` tiene `transition: margin-left 0.24s ease`
  - `body.sidebar-collapsed` y `body.sidebar-collapsed.rm-has-sidebar`: ambos a `margin-left: 60px` (cubre vender.html que usa inline style y los demas modulos que usan la clase)

- **JS** (`rossmille.js`): logica inyectada en `initSidebar(session)`
  - Crea e inserta `.rm-sidebar-toggle-btn` en `document.body` al iniciar
  - Restaura estado desde `localStorage` (clave `rm_sidebar_collapsed`)
  - Click en boton: toggle de `body.sidebar-collapsed` + actualiza localStorage + cambia icono (chevron-left / chevron-right)

### Paginacion cliente-side

Funcion global `renderPaginacion(wrapId, total, pagina, pageSize, fnNombre)` en `rossmille.js`:
- Inyecta controles en el contenedor con el id indicado
- Muestra "Mostrando X-Y de Z" + botones anterior/siguiente
- Si `total <= pageSize` limpia el contenedor (no muestra nada)
- `fnNombre` es el nombre de la funcion global a llamar al cambiar de pagina (string, usado en onclick)

| Modulo | Contenedor HTML | Funcion de pagina | Items por pagina |
|--------|-----------------|-------------------|-----------------|
| Productos | `#paginacionProductos` | `irAPaginaProductos(n)` | 12 (grid) |
| Clientes | `#paginacionClientes` | `irAPaginaClientes(n)` | 10 (tabla) |
| Usuarios | `#paginacionUsuarios` | `irAPaginaUsuarios(n)` | 10 (tabla) |

La pagina se resetea a 1 en cada nueva busqueda o cambio de filtro de genero.

### Formato moneda COP

- `productos.js`: precio de tarjeta cambiado de `Number().toFixed(2)` a `formatNum()` (locale `es-CO`)
- `formatNum()` agregada a `productos.js` (ya existia en `vender.js`, `pedidos.js`, `reporte.js`, `clientes.js`)
- Formato resultante: `$150.000` (punto como separador de miles, sin decimales para enteros)

### Favicon

- Archivo creado: `src/main/resources/static/favicon.svg`
  - SVG 32x32, fondo `#1a1a2e` con bordes redondeados (rx=7), texto "RM" en blanco centrado
- Agregado a los 8 HTML: `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`

---

## Estructura completa del proyecto (estado final)

```
rossmille-web/
├── pom.xml
├── mvnw
├── README.md
├── CONTEXTO_PROYECTO.md          (este archivo)
└── src/main/
    ├── java/com/rossmille/
    │   ├── RossmilleApplication.java
    │   ├── config/
    │   │   └── SecurityConfig.java
    │   ├── controller/
    │   │   ├── AuthController.java
    │   │   ├── DashboardController.java      GET /api/dashboard/resumen
    │   │   ├── ProductoController.java
    │   │   ├── ClienteController.java
    │   │   ├── VentaController.java
    │   │   ├── PedidoController.java
    │   │   ├── UsuarioController.java        @PreAuthorize clase (solo ADMINISTRADOR)
    │   │   └── ReporteController.java        @PreAuthorize clase (solo ADMINISTRADOR)
    │   ├── dto/
    │   │   ├── ApiResponse.java
    │   │   ├── DashboardDTO.java
    │   │   ├── DiaVentasDTO.java
    │   │   ├── LoginRequest.java / LoginResponse.java
    │   │   ├── ProductoDTO.java
    │   │   ├── ClienteDTO.java / HistorialComprasDTO.java / ItemCompraDTO.java
    │   │   ├── VentaRequest.java / VentaResponse.java / ItemVentaRequest.java / ItemVentaResponse.java
    │   │   ├── PedidoDTO.java / PedidoRequest.java / DetallePedidoDTO.java / DetallePedidoRequest.java
    │   │   ├── UsuarioDTO.java
    │   │   ├── ReporteFilaDTO.java
    │   │   └── EliminarRequest.java
    │   ├── entity/
    │   │   ├── Usuario.java / Producto.java / Cliente.java
    │   │   ├── Venta.java / DetalleVenta.java
    │   │   └── Pedido.java / DetallePedido.java
    │   ├── exception/
    │   │   ├── GlobalExceptionHandler.java
    │   │   └── StockInsuficienteException.java
    │   ├── repository/
    │   │   ├── UsuarioRepository.java / ProductoRepository.java / ClienteRepository.java
    │   │   ├── VentaRepository.java / DetalleVentaRepository.java
    │   │   └── PedidoRepository.java / DetallePedidoRepository.java
    │   ├── security/
    │   │   ├── JwtAuthenticationFilter.java
    │   │   ├── JwtTokenProvider.java
    │   │   └── UserDetailsServiceImpl.java
    │   └── service/
    │       ├── AuthService.java
    │       ├── DashboardService.java
    │       ├── ProductoService.java
    │       ├── ClienteService.java
    │       ├── VentaService.java
    │       ├── PedidoService.java
    │       ├── UsuarioService.java
    │       └── ReporteService.java
    └── resources/
        ├── application.yml
        └── static/
            ├── favicon.svg                   [Fase D]
            ├── css/
            │   └── rossmille.css             [Fase A + D: sidebar colapsable + paginacion CSS]
            ├── login.html
            ├── dashboard.html
            ├── productos.html
            ├── clientes.html
            ├── vender.html
            ├── pedidos.html
            ├── usuarios.html
            ├── reporte.html
            └── js/
                ├── rossmille.js              [Fase A + D: showToast + initSidebar + toggle sidebar + renderPaginacion]
                ├── auth.js                   guardRoute(), logout(), getToken(), clearSession()
                ├── api.js                    apiFetch() con Authorization header automatico
                ├── dashboard.js
                ├── productos.js              [Fase C + D: debounce + filtros genero + paginacion + formatNum]
                ├── clientes.js               [Fase C + D: debounce + avatar + formatNum + paginacion]
                ├── vender.js
                ├── pedidos.js                [Fase C: contadores por tab]
                ├── usuarios.js               [Fase D: paginacion]
                └── reporte.js
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

### Usuarios (solo Administrador — @PreAuthorize clase)
```
GET    /api/usuarios
POST   /api/usuarios
PUT    /api/usuarios/{id}
DELETE /api/usuarios/{id}   body: { contrasena }
```

### Reporte (solo Administrador — @PreAuthorize clase)
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
- `ddl-auto: validate` — Hibernate verifica, no modifica el schema
- `@Lock(LockModeType.PESSIMISTIC_WRITE)` en ProductoRepository para ventas ACID
- JdbcTemplate para queries con JOIN (historial compras, reporte, dashboard)
- MySQL Connector 8 retorna LocalDateTime para DATETIME — usar instanceof pattern matching

### Patron de respuesta API
```json
{ "ok": true, "message": null, "data": { ... } }
{ "ok": false, "message": "Descripcion del error", "data": null }
```

### Frontend
- `apiFetch(url, options)` en api.js — fetch con Authorization header automatico, redireccion en 401/403
- `guardRoute()` en auth.js — protege todas las paginas, retorna session o redirige a login
- `initSidebar(session)` en rossmille.js — rellena sidebar, oculta items admin, inyecta boton toggle
- `showToast(msg, type)` en rossmille.js — notificaciones flotantes (success/error/info)
- `renderPaginacion(wrapId, total, pagina, pageSize, fnNombre)` en rossmille.js — controles de paginacion reutilizables
- `formatNum(n)` en cada modulo JS — formato `es-CO` (punto como separador de miles)

### Sidebar colapsable (Fase D)
- Estado en `localStorage` clave `rm_sidebar_collapsed` ('1' o '0')
- Colapsado: 60px, solo iconos. Expandido: 220px, texto completo
- CSS usa `body.sidebar-collapsed` como selector padre para todas las reglas de estado colapsado
- El boton toggle se inyecta via JS en `initSidebar`, no en HTML estatico

### Paginacion (Fase D)
- Toda la paginacion es client-side sobre el cache ya cargado
- Al hacer nueva busqueda o cambiar filtro se resetea a pagina 1
- Si el total es <= pageSize, los controles no se muestran

---

## Convenciones de codigo

- Solo ASCII en archivos fuente (.java, .html, .js, .css, .yml) — sin tildes ni caracteres especiales
- `ddl-auto: validate` — nunca modificar el schema desde la app
- DTOs separados de entidades JPA — nunca exponer entidad directamente en API
- Eliminaciones protegidas con contrasena del usuario logueado (BCrypt verify en service)
- Precio/moneda: usar `formatNum(n)` con locale `es-CO` en todos los modulos JS

---

## Bugs corregidos en Fase 7

- Hash BCrypt del admin estaba corrupto en BD (54 chars) — regenerado con python bcrypt
- ReporteService y ClienteService: cast Timestamp fallaba con MySQL Connector 8 (retorna LocalDateTime) — corregido con instanceof pattern matching
- GlobalExceptionHandler: AccessDeniedException era atrapada por catch-all Exception -> 500 — handler especifico -> 403
- GlobalExceptionHandler: sin logging de errores 500 — agregado Logger SLF4J

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
| (sin commit) | Fases A y B: sidebar + rossmille.css/js + Dashboard KPIs + Chart.js |
| (sin commit) | Fases C y D: UX mejoras + sidebar colapsable + paginacion + favicon |
