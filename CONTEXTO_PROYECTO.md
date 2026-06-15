# Contexto del Proyecto — ROSS MILLE Web

## Que es

Migracion del prototipo ROSS MILLE POS (Java Swing) a una aplicacion web profesional con
Spring Boot REST API y frontend HTML/CSS/Vanilla JS.
Objetivo: pieza de portafolio que demuestra manejo profesional de Java backend moderno.

- Prototipo Swing original: `/home/camil/proyectos/prototype-java` (repo: Rossmille_pos)
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
| PDF | Apache PDFBox 2.0.34 (uso en Fase 6) |
| Build | Maven Wrapper (mvnw) |

---

## Base de datos

La BD es la misma del prototipo Swing. Spring usa `ddl-auto: validate` — no modifica el schema.

- Contenedor Docker: `rossmille_mysql`
- Puerto: 3306 / BD: `rossmille_db`
- Usuario app: `RossMille` / `RossMillB01`
- Levantar: `docker compose up -d` (desde `/home/camil/proyectos/prototype-java/`)

### Schema (7 tablas)

```
usuarios        id_usuario(varchar 10 PK), nombre_usuario, rol_usuarios,
                correo_usuario, telefono_usuario, contrasena(bcrypt)

clientes        id_clientes(varchar 10 PK), nombre, correo, telefono, direccion

productos       id(int AI PK), nombre, descripcion, talla, precio(decimal),
                stock(int), genero, categoria, color

ventas          id(int AI PK), id_cliente(FK nullable), id_empleado(FK),
                fecha(datetime), total(decimal), metodo_pago

detalle_venta   id(int AI PK), venta_id(FK), producto_id(FK),
                cantidad, precio_unitario(decimal)

pedidos         id(int AI PK), id_cliente(FK), fecha_pedido, estado,
                total_estimado, observaciones

detalle_pedido  id(int AI PK), pedido_id(FK), producto_id(FK nullable),
                nombre_producto_personalizado, cantidad,
                precio_unitario_estimado, descripcion_personalizada
```

### Roles de usuario
- `Administrador` — acceso total
- `Empleado` — sin acceso a Usuarios ni Reporte

### Credenciales de prueba (BD local Docker)
- ID: 1234567 / Cargo: Administrador / Contrasena: Admin123

---

## Como correr el proyecto

```bash
# 1. Levantar la BD (desde el proyecto Swing)
cd /home/camil/proyectos/prototype-java
docker compose up -d

# 2. Correr la app Spring Boot
cd /home/camil/proyectos/rossmille-web
./mvnw spring-boot:run

# 3. Abrir en el navegador
http://localhost:8080/login.html
```

Si Maven no esta en PATH: `sudo apt install maven` en WSL2.

---

## Estructura completa del proyecto (estado actual — Fases 1-3 completas, Fase 4 en progreso)

```
rossmille-web/
├── pom.xml
├── mvnw
├── .gitignore
├── CONTEXTO_PROYECTO.md          (este archivo)
├── PLAN_TRABAJO.md               (plan de fases con estado)
└── src/main/
    ├── java/com/rossmille/
    │   ├── RossmilleApplication.java
    │   ├── config/
    │   │   └── SecurityConfig.java           Chain stateless, CSRF off, rutas publicas
    │   ├── controller/
    │   │   ├── AuthController.java           POST /api/auth/login
    │   │   ├── ProductoController.java       GET/POST/PUT/DELETE /api/productos
    │   │   ├── ClienteController.java        GET/POST/PUT/DELETE /api/clientes
    │   │   └── VentaController.java          POST /api/ventas  [PENDIENTE]
    │   ├── dto/
    │   │   ├── ApiResponse.java              Wrapper { ok, message, data }
    │   │   ├── LoginRequest.java
    │   │   ├── LoginResponse.java
    │   │   ├── ProductoDTO.java
    │   │   ├── EliminarRequest.java          Reutilizable para DELETE con contrasena
    │   │   ├── ClienteDTO.java
    │   │   ├── HistorialComprasDTO.java
    │   │   ├── ItemCompraDTO.java
    │   │   ├── VentaRequest.java             [CREADO - Fase 4]
    │   │   ├── VentaResponse.java            [CREADO - Fase 4]
    │   │   ├── ItemVentaRequest.java         [CREADO - Fase 4]
    │   │   └── ItemVentaResponse.java        [CREADO - Fase 4]
    │   ├── entity/
    │   │   ├── Usuario.java
    │   │   ├── Producto.java
    │   │   ├── Cliente.java
    │   │   ├── Venta.java                    [CREADO - Fase 4]
    │   │   └── DetalleVenta.java             [CREADO - Fase 4]
    │   ├── exception/
    │   │   ├── GlobalExceptionHandler.java   @ControllerAdvice centralizado
    │   │   └── StockInsuficienteException.java  [CREADO - Fase 4]
    │   ├── repository/
    │   │   ├── UsuarioRepository.java
    │   │   ├── ProductoRepository.java       buscar() + findByStockLessThanEqual()
    │   │   ├── ClienteRepository.java        buscar()
    │   │   ├── VentaRepository.java          [CREADO - Fase 4]
    │   │   └── DetalleVentaRepository.java   [CREADO - Fase 4]
    │   ├── security/
    │   │   ├── JwtAuthenticationFilter.java
    │   │   ├── JwtTokenProvider.java
    │   │   └── UserDetailsServiceImpl.java
    │   └── service/
    │       ├── AuthService.java
    │       ├── ProductoService.java          CRUD + stock bajo + verify password
    │       ├── ClienteService.java           CRUD + historial compras (JdbcTemplate)
    │       └── VentaService.java             [PENDIENTE - Fase 4]
    └── resources/
        ├── application.yml
        └── static/
            ├── login.html
            ├── dashboard.html
            ├── productos.html
            ├── clientes.html
            └── vender.html                   [PENDIENTE - Fase 4]
            └── js/
                ├── auth.js
                ├── api.js                    fetch wrapper con JWT automatico
                ├── productos.js
                ├── clientes.js
                └── vender.js                 [PENDIENTE - Fase 4]
```

---

## API implementada

### Autenticacion (publica)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/auth/login | Login con ID + cargo + contrasena, retorna JWT |

### Productos (cualquier rol autenticado)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/productos | Listar todos o buscar con ?q= |
| GET | /api/productos/stock-bajo | Productos con stock <= 5 |
| GET | /api/productos/{id} | Obtener uno |
| POST | /api/productos | Crear |
| PUT | /api/productos/{id} | Actualizar |
| DELETE | /api/productos/{id} | Eliminar (requiere contrasena en body) |

### Clientes (cualquier rol autenticado, DELETE solo Administrador)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/clientes | Listar todos o buscar con ?q= |
| GET | /api/clientes/{id} | Obtener uno |
| POST | /api/clientes | Crear |
| PUT | /api/clientes/{id} | Actualizar |
| DELETE | /api/clientes/{id} | Eliminar — solo Administrador + contrasena |
| GET | /api/clientes/{id}/compras | Historial de compras con detalle |

### Ventas (pendiente — Fase 4)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/ventas | Crear venta con transaccion ACID |

---

## Decisiones tecnicas

### Autenticacion
- Login: ID + cargo + contrasena (igual que Swing)
- JWT: claims sub (idUsuario), nombre, rol. Expiracion 8h.
- `cargo` se valida contra `rol_usuarios` en BD para evitar escalada de privilegios.

### Seguridad
- Spring Security 6: STATELESS, CSRF off
- Rutas publicas: `POST /api/auth/login`, `/*.html`, `/js/**`, `/css/**`
- `@EnableMethodSecurity` activo: se usa `@PreAuthorize("hasRole('ADMINISTRADOR')")` en ClienteController DELETE

### Base de datos y JPA
- `ddl-auto: validate` — Hibernate solo verifica, no modifica el schema
- `@Lock(LockModeType.PESSIMISTIC_WRITE)` en ProductoRepository para SELECT FOR UPDATE en ventas (Fase 4)
- JdbcTemplate para queries complejas (historial de compras) — mas limpio que JPQL con JOINs multitabla

### Frontend
- JWT en `localStorage` (rm_token / rm_session)
- `guardRoute()` en auth.js protege todas las paginas de modulos
- `apiFetch()` en api.js agrega Authorization header automaticamente en cada request
- Bootstrap 5 via CDN
- Cards para Productos, tabla para Clientes, POS para Vender

### Patrones de respuesta API
```json
{ "ok": true, "message": null, "data": { ... } }
{ "ok": false, "message": "Descripcion del error", "data": null }
```

### Eliminaciones con contrasena
Usan `EliminarRequest` (DTO reutilizable). El service obtiene el usuario del
`SecurityContextHolder` y verifica BCrypt contra la BD antes de eliminar.

---

## Commits en git (rama main)

| Hash | Descripcion |
|------|-------------|
| 72a027a | Fase 1 y 2 completas: Auth JWT + modulo Productos |
| ad992d9 | Fase 3 completa: modulo Clientes |
| (pendiente) | Fase 4 parcial: entidades, DTOs y repositories de Venta |
