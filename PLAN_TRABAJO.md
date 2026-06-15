# Plan de Trabajo — ROSS MILLE Web

Migracion del prototipo Swing a aplicacion web con Spring Boot REST API + HTML/Bootstrap 5.
La BD MySQL 8.0 en Docker se reutiliza sin cambios de schema.

---

## Estado general

| Fase | Descripcion | Estado | Fecha |
|------|-------------|--------|-------|
| Fase 1 | Base del proyecto + Autenticacion JWT | COMPLETADA | 2026-06-12 |
| Fase 2 | Modulo Productos | COMPLETADA | 2026-06-15 |
| Fase 3 | Modulo Clientes | COMPLETADA | 2026-06-15 |
| Fase 4 | Modulo Vender (POS) | COMPLETADA | 2026-06-15 |
| Fase 5 | Modulo Pedidos | COMPLETADA | 2026-06-15 |
| Fase 6 | Usuarios + Reportes + Dashboard final | COMPLETADA | 2026-06-15 |
| Fase 7 | Calidad y cierre | Pendiente | — |

---

## FASE 1 — Base del proyecto + Autenticacion [COMPLETADA]

**Criterio de exito:** Login con Admin_Camila / Admin123 retorna JWT y redirige al dashboard.

### Tareas completadas

- [x] 1.1 Crear proyecto Maven Spring Boot 3.3.5 en `/home/camil/proyectos/rossmille-web`
- [x] 1.2 `pom.xml` con dependencias: web, jpa, security, mysql, jjwt 0.11.5, validation, lombok, pdfbox
- [x] 1.3 `application.yml` apuntando al Docker MySQL existente (`ddl-auto: validate`)
- [x] 1.4 Entidad `Usuario` + `UsuarioRepository` (mapeados al schema existente)
- [x] 1.5 `UserDetailsServiceImpl` — carga usuario por ID para Spring Security
- [x] 1.6 `JwtTokenProvider` — genera tokens HS256, valida, extrae claims (id, nombre, rol)
- [x] 1.7 `JwtAuthenticationFilter` — intercepta requests y valida Bearer token
- [x] 1.8 `SecurityConfig` — chain stateless, CSRF off, rutas publicas vs protegidas
- [x] 1.9 `AuthService` + `AuthController` — POST /api/auth/login
- [x] 1.10 `GlobalExceptionHandler` — @ControllerAdvice para errores de validacion y generales
- [x] 1.11 `ApiResponse<T>` — wrapper { ok, message, data } en todas las respuestas
- [x] 1.12 `login.html` — formulario Bootstrap 5 (ID, cargo dropdown, contrasena)
- [x] 1.13 `auth.js` — fetch login, guarda JWT en localStorage, redirige por rol, guardRoute()
- [x] 1.14 `dashboard.html` — hub de modulos placeholder, oculta admin-only por rol
- [x] 1.15 `mvnw` — Maven Wrapper para correr sin Maven instalado globalmente

---

## FASE 2 — Modulo Productos [COMPLETADA 2026-06-15]

**Criterio de exito:** CRUD completo de productos funciona desde el navegador.

### Tareas

- [x] 2.1 Entidad `Producto` + `ProductoRepository`
  - findAll, findById, buscar (JPQL LIKE por nombre/descripcion/genero/categoria/color)
  - findByStockLessThanEqual(5) para alertas de stock bajo
- [x] 2.2 `ProductoDTO` — no exponer entidad JPA directamente
- [x] 2.3 `ProductoService` — CRUD + verificacion de contrasena del usuario logueado al eliminar
- [x] 2.4 `ProductoController` — endpoints:
  - GET /api/productos (con param opcional ?q= para busqueda)
  - GET /api/productos/{id}
  - GET /api/productos/stock-bajo
  - POST /api/productos
  - PUT /api/productos/{id}
  - DELETE /api/productos/{id} — requiere { contrasena } en body
- [x] 2.5 `productos.html` — grilla de tarjetas con colores de alerta de stock, barra de busqueda
- [x] 2.6 `productos.js` — carga, filtra, crea, actualiza, elimina con confirmacion de contrasena
- [x] 2.7 `api.js` — fetch wrapper con header Authorization automatico (reutilizable en Fases 3+)
- [x] 2.8 `EliminarRequest.java` — DTO reutilizable para eliminaciones con contrasena (Fases 3+)
- [x] `SecurityConfig` — cambiado a /*.html para cubrir todas las paginas de modulos
- [x] `GlobalExceptionHandler` — agregado handler para DataIntegrityViolationException

### Notas de implementacion
- La eliminacion requiere confirmacion de contrasena del usuario logueado (igual que en Swing)
- Las tarjetas deben mostrar alerta visual si stock <= 5
- La busqueda puede ser client-side si el catalogo no es enorme, o server-side con query param

---

## FASE 3 — Modulo Clientes [COMPLETADA 2026-06-15]

**Criterio de exito:** CRUD de clientes funciona y se puede ver el historial de compras en modal.

### Tareas

- [x] 3.1 Entidad `Cliente` + `ClienteRepository`
- [x] 3.2 `ClienteDTO` + `HistorialComprasDTO`
- [x] 3.3 `ClienteService` — CRUD + historial de compras (JOIN ventas + detalle_venta + productos)
- [x] 3.4 `ClienteController` — endpoints:
  - GET /api/clientes
  - GET /api/clientes/{id}
  - POST /api/clientes
  - PUT /api/clientes/{id}
  - DELETE /api/clientes/{id} — solo Administrador + { contrasena }
  - GET /api/clientes/{id}/compras
- [x] 3.5 `clientes.html` + `clientes.js`

### Notas de implementacion
- El historial de compras se obtiene con JOIN: ventas + detalle_venta + productos WHERE id_cliente = ?
- Ordenado DESC por fecha
- Mostrar en modal: venta #ID, fecha, total, metodo_pago, lista de productos

---

## FASE 4 — Modulo Vender (POS) [COMPLETADA 2026-06-15]

**Criterio de exito:** Venta completa procesada, stock descontado en BD, ticket mostrado.

Esta es la pieza tecnica mas importante del portafolio (transaccion ACID con bloqueo pesimista).

### Tareas

- [x] 4.1 Entidades `Venta` + `DetalleVenta`
- [x] 4.2 `VentaRequest` + `VentaResponse` + `ItemVentaRequest` + `ItemVentaResponse`
- [x] 4.2b `VentaRepository` + `DetalleVentaRepository`
- [x] 4.2c `StockInsuficienteException`
- [x] 4.3 `VentaService` con `@Transactional`:
  - Recibe: lista de items ({ productoId, cantidad, precioUnitario }), idCliente, descuento, metodoPago
  - Para cada producto: SELECT stock FROM productos WHERE id = ? FOR UPDATE (bloqueo pesimista)
  - Valida stock suficiente — si no alcanza: rollback automatico + StockInsuficienteException
  - INSERT INTO ventas
  - INSERT INTO detalle_venta (batch)
  - UPDATE productos SET stock = stock - cantidad (batch)
  - COMMIT automatico al salir del metodo @Transactional
- [x] 4.4 `VentaController` — POST /api/ventas
- [x] 4.5 `GlobalExceptionHandler` — handler para StockInsuficienteException (HTTP 409)
- [x] 4.6 `vender.html` — interfaz POS:
  - Buscador de productos (por nombre)
  - Carrito con cantidad, precio unitario, subtotal
  - Campo de descuento
  - Selector de metodo de pago (Efectivo / Tarjeta / Transferencia)
  - Buscador opcional de cliente
  - Boton Finalizar Venta
- [x] 4.7 `vender.js` — carrito en memoria, llamada a la API, ticket en modal

### Notas de implementacion
- El SELECT FOR UPDATE requiere que la transaccion sea isolation level READ_COMMITTED o mayor (MySQL por defecto: REPEATABLE_READ — compatible)
- Para el SELECT FOR UPDATE con JPA usar @Query nativo o EntityManager con PESSIMISTIC_WRITE
- El ticket del modal debe mostrar: numero de venta, productos, descuento, total, metodo de pago

---

## FASE 5 — Modulo Pedidos [COMPLETADA 2026-06-15]

**Criterio de exito:** Crear pedido, marcarlo como Atendido, verificar que aparece en historial.

### Tareas

- [x] 5.1 Entidades `Pedido` + `DetallePedido`
- [x] 5.2 `PedidoDTO` + `DetallePedidoDTO` + `PedidoRequest` + `DetallePedidoRequest`
- [x] 5.3 `PedidoService` + `PedidoController` — endpoints:
  - GET /api/pedidos?tipo=activos (estado IN Pendiente, En Proceso)
  - GET /api/pedidos?tipo=historial (estado = Atendido)
  - POST /api/pedidos
  - PUT /api/pedidos/{id}/avanzar — Pendiente->En Proceso->Atendido
  - DELETE /api/pedidos/{id} — solo Administrador + { contrasena }
- [x] 5.4 `pedidos.html` + `pedidos.js`
  - Tabs: Activos / Historial
  - Cards expandibles con items del pedido
  - Formulario modal de nuevo pedido con items dinamicos
  - Boton avanzar estado + eliminar (admin)

---

## FASE 6 — Usuarios + Reportes + Dashboard final [COMPLETADA 2026-06-15]

**Criterio de exito:** Admin puede ver reporte y exportarlo a PDF. Empleado no puede acceder a /usuarios ni /reporte.

### Tareas

- [x] 6.1 `UsuarioDTO` (sin exponer hash de contrasena)
- [x] 6.2 `UsuarioService` + `UsuarioController` — @PreAuthorize("hasRole('ADMINISTRADOR')") en toda la clase:
  - GET /api/usuarios
  - POST /api/usuarios
  - PUT /api/usuarios/{id}
  - DELETE /api/usuarios/{id} + verificacion de contrasena del admin
- [x] 6.3 `ReporteService` — JdbcTemplate JOIN ventas+clientes+usuarios, PDF con PDFBox adaptado de Swing
  - generarPdf() retorna byte[] via ByteArrayOutputStream (sin archivos temporales)
  - Texto truncado automaticamente si supera ancho de columna
- [x] 6.4 `ReporteController` — @PreAuthorize en toda la clase:
  - GET /api/reporte?desde=YYYY-MM-DD&hasta=YYYY-MM-DD — JSON
  - GET /api/reporte/pdf?desde=YYYY-MM-DD&hasta=YYYY-MM-DD — descarga PDF con Content-Disposition
- [x] 6.5 `usuarios.html` + `usuarios.js` — tabla CRUD, modales crear/editar/eliminar
- [x] 6.6 `reporte.html` + `reporte.js` — date pickers con mes actual por defecto, tabla, resumen, descarga PDF via fetch con JWT
- [x] 6.7 `dashboard.html` — todas las cards activas (sin coming-soon)

---

## FASE 7 — Calidad y cierre [Pendiente]

**Criterio de exito:** Flujo completo sin errores. Empleado no ve lo que no debe ver.

### Tareas

- [ ] 7.1 Route guard en `auth.js` — redirige a login si JWT expirado o ausente (ya implementado en guardRoute())
- [ ] 7.2 Ocultar elementos de admin en frontend segun rol del JWT (ya implementado en dashboard)
- [ ] 7.3 Loading states y mensajes de error visibles en todas las pantallas
- [ ] 7.4 Respuestas de error consistentes del GlobalExceptionHandler (ya implementado en Fase 1)
- [ ] 7.5 Agregar `@PreAuthorize("hasRole('ADMINISTRADOR')")` en controllers de Usuarios y Reporte
- [ ] 7.6 Prueba de flujo completo: login -> venta -> stock descontado -> reporte PDF
- [ ] 7.7 Prueba de control de acceso: empleado no puede acceder a /usuarios ni /reporte
- [ ] 7.8 README.md del proyecto rossmille-web con instrucciones de setup

---

## Patrones que demuestran nivel profesional

| Patron | Implementado en |
|--------|----------------|
| JWT stateless | JwtTokenProvider + SecurityConfig (Fase 1) |
| @Transactional con rollback automatico | VentaService (Fase 4) |
| DTOs separados de entidades JPA | Capa dto/ — nunca exponer entidad directo |
| @ControllerAdvice centralizado | GlobalExceptionHandler (Fase 1) |
| @PreAuthorize por rol | Controllers de Usuarios y Reporte (Fase 6) |
| Fetch API con token automatico | auth.js + api.js (Fase 1, expandir en Fase 2+) |
| Bloqueo pesimista SELECT FOR UPDATE | VentaService (Fase 4) |
| BCrypt reutilizado del prototipo | AuthService (Fase 1) |

---

## Notas generales

- Convenciones de codigo: solo ASCII en archivos fuente (.java, .properties, .yml), sin emojis ni tildes
- `application.yml` usa `ddl-auto: validate` — Hibernate NO modifica el schema, solo lo verifica
- Las paginas HTML estaticas estan en `src/main/resources/static/` y Spring Boot las sirve directamente
- Para crear `api.js` (wrapper de fetch con header Authorization automatico) — agregar en Fase 2 antes de implementar el primer modulo que consuma endpoints protegidos
