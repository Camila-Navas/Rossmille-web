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
| Frontend | HTML + Bootstrap 5.3.2 + Vanilla JS |
| BD | MySQL 8.0 en Docker (mismo schema del prototipo) |
| PDF | Apache PDFBox 2.0.34 |
| Build | Maven Wrapper (mvnw) |

---

## Estado de fases — TODAS COMPLETADAS

| Fase | Descripcion | Estado | Commit |
|------|-------------|--------|--------|
| 1 | Base del proyecto + Autenticacion JWT | COMPLETADA | 72a027a |
| 2 | Modulo Productos | COMPLETADA | 72a027a |
| 3 | Modulo Clientes | COMPLETADA | ad992d9 |
| 4 | Modulo Vender (POS) ACID | COMPLETADA | 75fe27c |
| 5 | Modulo Pedidos | COMPLETADA | a068b51 |
| 6 | Usuarios + Reporte PDF + Dashboard | COMPLETADA | 0bd750c |
| 7 | Calidad y cierre | COMPLETADA | aa904e5 |

---

## Como correr el proyecto

```bash
# 1. Levantar la BD (Docker Desktop debe estar corriendo en Windows)
# Desde Windows o desde WSL si Docker Desktop esta integrado:
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

## Estructura completa del proyecto (estado final Fase 7)

```
rossmille-web/
├── pom.xml
├── mvnw
├── README.md
├── CONTEXTO_PROYECTO.md          (este archivo)
├── PLAN_TRABAJO.md               (todas las fases completadas)
└── src/main/
    ├── java/com/rossmille/
    │   ├── RossmilleApplication.java
    │   ├── config/
    │   │   └── SecurityConfig.java           Chain stateless, CSRF off, @EnableMethodSecurity
    │   ├── controller/
    │   │   ├── AuthController.java           POST /api/auth/login
    │   │   ├── ProductoController.java       GET/POST/PUT/DELETE /api/productos
    │   │   ├── ClienteController.java        GET/POST/PUT/DELETE /api/clientes + /compras
    │   │   ├── VentaController.java          POST /api/ventas
    │   │   ├── PedidoController.java         GET/POST/PUT/DELETE /api/pedidos
    │   │   ├── UsuarioController.java        CRUD — solo ADMINISTRADOR
    │   │   └── ReporteController.java        JSON + PDF — solo ADMINISTRADOR
    │   ├── dto/
    │   │   ├── ApiResponse.java              Wrapper { ok, message, data }
    │   │   ├── LoginRequest.java / LoginResponse.java
    │   │   ├── ProductoDTO.java
    │   │   ├── ClienteDTO.java / HistorialComprasDTO.java / ItemCompraDTO.java
    │   │   ├── VentaRequest.java / VentaResponse.java
    │   │   ├── ItemVentaRequest.java / ItemVentaResponse.java
    │   │   ├── PedidoDTO.java / PedidoRequest.java
    │   │   ├── DetallePedidoDTO.java / DetallePedidoRequest.java
    │   │   ├── UsuarioDTO.java
    │   │   ├── ReporteFilaDTO.java
    │   │   └── EliminarRequest.java          DTO reutilizable para DELETE con contrasena
    │   ├── entity/
    │   │   ├── Usuario.java
    │   │   ├── Producto.java
    │   │   ├── Cliente.java
    │   │   ├── Venta.java / DetalleVenta.java
    │   │   ├── Pedido.java / DetallePedido.java
    │   │   └── (no hay entidad para ventas/reporte — se usa JdbcTemplate)
    │   ├── exception/
    │   │   ├── GlobalExceptionHandler.java   Maneja: 400, 403, 409, 500 con ApiResponse
    │   │   └── StockInsuficienteException.java
    │   ├── repository/
    │   │   ├── UsuarioRepository.java
    │   │   ├── ProductoRepository.java       buscar() JPQL + findByStockLessThanEqual()
    │   │   ├── ClienteRepository.java        buscar() JPQL
    │   │   ├── VentaRepository.java / DetalleVentaRepository.java
    │   │   └── PedidoRepository.java / DetallePedidoRepository.java
    │   ├── security/
    │   │   ├── JwtAuthenticationFilter.java
    │   │   ├── JwtTokenProvider.java         HS256, claims: sub/nombre/rol, exp 8h
    │   │   └── UserDetailsServiceImpl.java   Autoridades: ROLE_ADMINISTRADOR / ROLE_EMPLEADO
    │   └── service/
    │       ├── AuthService.java              Login: ID + cargo + BCrypt
    │       ├── ProductoService.java          CRUD + verify contrasena al eliminar
    │       ├── ClienteService.java           CRUD + historial JdbcTemplate + verify
    │       ├── VentaService.java             @Transactional ACID + SELECT FOR UPDATE
    │       ├── PedidoService.java
    │       ├── UsuarioService.java
    │       └── ReporteService.java           JdbcTemplate JOIN + PDFBox byte[]
    └── resources/
        ├── application.yml
        └── static/
            ├── login.html
            ├── dashboard.html
            ├── productos.html
            ├── clientes.html
            ├── vender.html
            ├── pedidos.html
            ├── usuarios.html
            ├── reporte.html
            └── js/
                ├── auth.js       login / logout / guardRoute() / saveSession()
                ├── api.js        apiFetch() con Authorization header y redireccion 401/403
                ├── productos.js
                ├── clientes.js
                ├── vender.js
                ├── pedidos.js
                ├── usuarios.js
                └── reporte.js
```

---

## API REST completa

### Autenticacion (publica)
```
POST /api/auth/login   { id, cargo, contrasena } -> { token, nombre, rol }
```

### Productos (cualquier rol autenticado)
```
GET    /api/productos              ?q= para busqueda por nombre/desc/genero/cat/color
GET    /api/productos/stock-bajo   stock <= 5
GET    /api/productos/{id}
POST   /api/productos
PUT    /api/productos/{id}
DELETE /api/productos/{id}         body: { contrasena }
```

### Clientes (cualquier rol; DELETE solo Administrador)
```
GET    /api/clientes               ?q= para busqueda
GET    /api/clientes/{id}
POST   /api/clientes
PUT    /api/clientes/{id}
DELETE /api/clientes/{id}          body: { contrasena } — @PreAuthorize ADMINISTRADOR
GET    /api/clientes/{id}/compras  historial con JOIN ventas+detalle+productos
```

### Ventas (cualquier rol)
```
POST   /api/ventas   { items:[{productoId,cantidad,precioUnitario}], idCliente, descuento, metodoPago }
                     -> { ventaId, fecha, subtotal, descuento, total, metodoPago, items[] }
```

### Pedidos (cualquier rol; DELETE solo Administrador)
```
GET    /api/pedidos?tipo=activos    estado IN (Pendiente, En Proceso)
GET    /api/pedidos?tipo=historial  estado = Atendido
POST   /api/pedidos
PUT    /api/pedidos/{id}/avanzar    Pendiente->En Proceso->Atendido
DELETE /api/pedidos/{id}            body: { contrasena } — @PreAuthorize ADMINISTRADOR
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
GET /api/reporte?desde=YYYY-MM-DD&hasta=YYYY-MM-DD        JSON List<ReporteFilaDTO>
GET /api/reporte/pdf?desde=YYYY-MM-DD&hasta=YYYY-MM-DD    byte[] PDF descargable
```

---

## Decisiones tecnicas

### Autenticacion
- Login: ID + cargo + contrasena (igual interfaz que Swing)
- JWT claims: sub (idUsuario), nombre, rol. Expiracion 8h.
- `cargo` en el login se valida contra `rol_usuarios` en BD (evita escalada de privilegios)
- JWT almacenado en localStorage: claves `rm_token` y `rm_session`

### Seguridad
- Spring Security 6 STATELESS, CSRF off
- Rutas publicas: POST /api/auth/login, /*.html, /js/**, /css/**, /*.ico
- `@EnableMethodSecurity` activo
- `@PreAuthorize("hasRole('ADMINISTRADOR')")` a nivel de clase en UsuarioController y ReporteController
- Autoridades cargadas como `ROLE_ADMINISTRADOR` / `ROLE_EMPLEADO` en UserDetailsServiceImpl
- AccessDeniedException tiene handler especifico en GlobalExceptionHandler (retorna HTTP 403 + ApiResponse)

### Base de datos
- `ddl-auto: validate` — Hibernate verifica, no modifica el schema
- `@Lock(LockModeType.PESSIMISTIC_WRITE)` en ProductoRepository para SELECT FOR UPDATE en ventas
- JdbcTemplate para queries con JOIN multitabla (historial de compras, reporte)
- Columnas DATETIME retornan LocalDateTime con MySQL Connector 8 (no Timestamp)

### Patron de respuesta API
```json
{ "ok": true, "message": null, "data": { ... } }
{ "ok": false, "message": "Descripcion del error", "data": null }
```

### Eliminaciones con contrasena
DTO reutilizable `EliminarRequest`. El service obtiene el usuario del SecurityContextHolder
y verifica BCrypt contra la BD antes de eliminar. No se pasa el hash al frontend.

---

## Bugs encontrados y corregidos (Fase 7)

| Bug | Archivo | Causa | Solucion |
|-----|---------|-------|----------|
| Hash admin corrupto | BD | setup_admin.py genera el SQL pero no lo ejecuta; hash tenia 54 chars sin prefijo $2a$ | UPDATE con hash nuevo generado por Python bcrypt |
| ClassCastException en reporte | ReporteService.java | MySQL Connector 8 retorna LocalDateTime para DATETIME, no Timestamp | instanceof pattern matching para ambos tipos |
| Mismo cast incorrecto | ClienteService.java | Historial de compras tenia el mismo cast | Misma solucion |
| AccessDeniedException -> 500 | GlobalExceptionHandler.java | El catch-all de Exception atrapaba el 403 antes que Spring Security | Handler especifico para AccessDeniedException (HTTP 403) |
| Sin logging de errores 500 | GlobalExceptionHandler.java | El handler general no logueaba la excepcion | Logger SLF4J agregado |

---

## Proxima etapa — Plan de mejoras visuales (pendiente)

El sistema funciona correctamente. La siguiente etapa es mejorar el diseno visual
y la experiencia de usuario. Ver detalle en la sesion del 2026-06-16.

### Fases de mejoras aprobadas

**FASE A — Sistema de diseno compartido**
- Crear `rossmille.css` con variables CSS, componentes reutilizables
- Fuente Inter (Google Fonts) + Bootstrap Icons (CDN)
- Sidebar lateral fijo que reemplaza el topbar de navegacion actual
- Toast notifications que reemplazan mensajes inline
- Refactorizar los 8 HTML para usar el CSS compartido

**FASE B — Dashboard con datos reales**
- Nuevo endpoint `GET /api/dashboard/resumen` (ventas hoy, ingresos hoy, stock bajo, pedidos pendientes, ultimas ventas)
- 4 cards KPI con datos en tiempo real
- Grafico de ventas 7 dias con Chart.js (CDN)

**FASE C — Mejoras UX por modulo**
- Vender: busqueda en tiempo real (debounce 300ms), ticket mejorado
- Productos: busqueda en tiempo real, toggle grilla/lista, filtros rapidos por genero/categoria
- Clientes: busqueda en tiempo real, avatar con iniciales, timeline de historial
- Pedidos: timeline visual de estado, contador por tab
- Reporte: grafico de barras por dia, formato moneda COP
- Usuarios: avatar con iniciales, badge de rol con color

**FASE D — Pulido final**
- Sidebar colapsable en pantallas medianas
- Paginacion en tablas grandes
- Formato moneda COP consistente
- Favicon

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
