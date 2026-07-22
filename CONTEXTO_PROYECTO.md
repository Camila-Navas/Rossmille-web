# Contexto del Proyecto -- ROSS MILLE Web

Ultima actualizacion: 2026-07-21

Migracion del prototipo ROSS MILLE POS (Java Swing) a aplicacion web profesional con
Spring Boot REST API y frontend HTML/CSS/Vanilla JS.
Objetivo: pieza de portafolio que demuestra manejo profesional de Java backend moderno.

- Prototipo Swing original: `/home/camil/proyectos/prototype-java` (repo: Rossmille_pos) -- ARCHIVADO
- Este proyecto: `/home/camil/proyectos/rossmille-web` (repo: rossmille-web)
- Desde el 2026-07-21 este repo es autocontenido: `docker-compose.yml`, `db/init.sql`
  y `db/setup_admin.py` se copiaron aqui (antes solo vivian en `prototype-java`,
  lo que obligaba a clonar ambos repos para levantar la BD). Ver seccion mas abajo.

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
docker compose up -d   # desde este repo (rossmille-web) -- ver docker-compose.yml

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
| H | Rediseno frontend: design tokens, temas (modo + 3 acentos), i18n ES/EN, layout responsive mobile-first, accesibilidad | COMPLETADA | 3629bc3 |
| I | Preparacion para despliegue en Railway: Dockerfile multi-stage, railway.toml, variables de entorno | COMPLETADA | 3629bc3 |

---

## Fase I -- Preparacion para Railway (2026-07-20)

### Archivos nuevos

| Archivo | Proposito |
|---------|-----------|
| `Dockerfile` | Build multi-stage: JDK 21 compila con `mvnw`, JRE 21 corre el jar. Usuario no-root. Normaliza CRLF de `mvnw` antes de ejecutarlo (rompe el shebang en Linux si se clono en Windows). Respeta `JAVA_OPTS` y `PORT` en runtime. |
| `.dockerignore` | Excluye `target/`, `.git`, docs y metadatos de IDE del contexto de build. |
| `railway.toml` | Fuerza a Railway a usar el `Dockerfile` (`builder = "DOCKERFILE"`) en vez de autodetectar con Nixpacks. Restart policy `ON_FAILURE`. |

### Cambios en `application.yml`

Host/puerto/usuario/clave de MySQL y el puerto del servidor ahora se leen de variables
de entorno con los valores locales de Docker como default (`${MYSQLHOST:localhost}`,
`${PORT:8080}`, etc.). Railway inyecta `MYSQLHOST/MYSQLPORT/MYSQLDATABASE/MYSQLUSER/MYSQLPASSWORD`
automaticamente al vincular su plugin de MySQL, y `PORT` en tiempo de ejecucion. En local,
sin esas variables definidas, el comportamiento es identico al de antes (`./mvnw spring-boot:run`
no requiere ningun cambio).

`jwt.secret` tambien es configurable via `JWT_SECRET` -- en Railway debe sobrescribirse
con un valor propio, ya que el default del repo es publico en el historial de git.

### Pasos manuales que Railway no resuelve solo (documentados en README.md)

1. Cargar `db/init.sql` (vive en este repo) contra la BD de Railway --
   el plugin de MySQL arranca vacio, `ddl-auto: validate` no crea tablas.
2. Crear el primer administrador con `setup_admin.py` apuntando a esa BD, o INSERT manual.
3. Configurar `JWT_SECRET` en las variables de entorno del servicio antes de exponer la app.

### Pendiente / no verificado

El build de Docker no se probo localmente en esta sesion (Docker Desktop no estaba
corriendo). Se referencia por nombre/version pero no se corrio `docker build` de punta
a punta -- validar antes de confiar en produccion.

---

## Fase H -- Rediseno frontend completo (2026-07-20)

Objetivo: llevar el frontend de "funcional" a nivel portafolio (moderno, coherente,
responsive, accesible), sin cambiar el stack (sigue siendo HTML + Bootstrap 5 + Vanilla JS,
sin frameworks nuevos) y sin tocar el backend.

### Arquitectura nueva

| Archivo | Responsabilidad |
|---------|------------------|
| `js/theme.js` | `RMTheme` -- unica fuente de verdad para el tema: modo claro/oscuro + 3 acentos (indigo/esmeralda/borgona) + color personalizado + tamano de fuente. Persiste en `localStorage` (`rm_theme`), migra el formato anterior (`rm_apariencia`), respeta `prefers-color-scheme` como valor inicial. |
| `js/i18n.js` | `RMI18n` -- diccionario ES/EN por claves (`data-i18n="clave"`), `applyTranslations()`, persistencia en `localStorage` (`rm_lang`), valor inicial desde `navigator.language`. |
| `js/layout.js` | Sidebar/topbar/footer generados desde un array de datos (`RM_MODULES`) en vez de estar copiados en las 9 paginas HTML. Maneja el drawer movil (sidebar fuera de pantalla + hamburguesa + backdrop, accesible por teclado), el colapso de sidebar en escritorio, y el scroll-reveal (`IntersectionObserver`, respeta `prefers-reduced-motion`). Expone `initApp()` como punto de entrada unico por pagina. |

`configuracion.js` (panel Apariencia, Fase F) se refactorizo para delegar la aplicacion
de tema/color/fuente a `RMTheme` en vez de duplicar la logica -- el selector rapido de la
topbar (todas las paginas, todos los roles) y el panel de Configuracion (solo Admin,
persistido en BD) ahora comparten una sola implementacion.

### `css/rossmille.css` -- reescrito con sistema de tokens

Escalas nuevas: espaciado (`--rm-space-1..10`), radios, sombras, tipografia
(`--rm-font-heading` = Sora para titulos, `--rm-font-body` = Inter se mantiene para UI).
Tokens de color por tema via `[data-mode="oscuro"]` y `[data-accent="esmeralda|borgona"]`.
Tintes de acento calculados con `color-mix()` (`--rm-accent-tint`) en vez de hex sueltos
hardcodeados -- requiere navegadores 2023+ (Chrome 111+, Firefox 113+, Safari 16.4+).

Se reemplazaron ~90 valores hex hardcodeados (`#1a1a2e`, `#6366f1`, etc.) repartidos en
las 9 paginas por variables, incluyendo botones que antes eran casi-negros en unas paginas
e indigo en otras -- ahora hay un solo color primario coherente en toda la app.

### Layout / responsive / accesibilidad

- Sidebar fija -> drawer fuera de pantalla debajo de 960px, con hamburguesa en la topbar.
- `vender.html` (POS): panel de busqueda + carrito de layout fijo -> se apilan en movil.
- Contenedor unificado (`.rm-page`, max-width 1280px) reemplaza los anchos ad-hoc que
  tenia cada pagina (`.main`, `.cfg-page`, `.rp-page` con 900-1280px sueltos).
- Footer y topbar (con selector de tema/idioma) agregados a las 9 paginas -- antes no
  existia footer en ninguna, y el selector de tema solo era accesible desde Configuracion
  (solo Admin); ahora cualquier Empleado tambien puede cambiar tema/idioma.
- `<h1>` agregado a paginas que no tenian encabezado semantico (`productos`, `clientes`,
  `pedidos`, `usuarios`, `vender`). Skip-link, `aria-label`/`aria-hidden` en iconos,
  `:focus-visible` global, contraste del boton de cerrar de los modales de Bootstrap
  corregido para modo oscuro (`.btn-close` invertido).

### Alcance no cubierto (documentado, no silencioso)

La traduccion (`data-i18n`) cubre la navegacion, topbar, footer, login y encabezados/botones
comunes de las 9 paginas, pero **no** el contenido generado dinamicamente por cada modulo
JS (filas de tablas, tickets, toasts) -- traducirlo requiere tocar los ~2500 lineas de JS
de los modulos y quedo fuera de esta fase.

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

## Autocontencion de BD + fix descuento + build Docker validado (2026-07-21)

### Repo autocontenido (`docker-compose.yml`, `db/init.sql`, `db/setup_admin.py`)

Estos 3 archivos vivian unicamente en `prototype-java` (el prototipo Swing archivado),
lo que obligaba a tener ambos repos clonados para poder levantar la BD de `rossmille-web`
-- un problema real para un proyecto de portafolio pensado para clonarse solo.
Se copiaron tal cual a este repo (mismo `container_name: rossmille_mysql` y
`volumes: rossmille_data`, asi que reutilizan el mismo contenedor/volumen si ya
existian). `prototype-java` no se modifico ni se borro, sigue archivado.
README.md actualizado para reflejar el nuevo flujo (`docker compose up -d` desde
este repo, sin mencionar `prototype-java`).

### Fix: descuento sin limite superior en Vender (commit 0d4a36a)

`VentaService.registrar()` calculaba `total = subtotal.subtract(descuento).max(ZERO)`
sin validar que `descuento <= subtotal` -- una venta con descuento mayor al subtotal
se aceptaba igual (HTTP 201), descontaba stock real, y guardaba `total: 0` con el
`descuento` invalido en la BD, distorsionando ingresos en Reporte. Reproducido y
confirmado navegando la app vendida en vivo (no solo por inspeccion de codigo).
Corregido en `VentaService.java` (lanza `IllegalArgumentException` -> HTTP 400 antes
de tocar stock/BD si `descuento > subtotal`) y en `vender.js` (misma validacion en
frontend + borde rojo en el input cuando excede el subtotal).

### Build Docker validado de punta a punta

Quedaba pendiente desde la Fase I: nunca se habia corrido `docker build` real.
Se corrio en esta sesion -- `BUILD SUCCESS`, y se levanto el contenedor resultante
contra la BD real (mismas variables que usaria Railway: `MYSQLHOST`, `MYSQLUSER`, etc.)
-- login y `login.html` respondieron HTTP 200 dentro del contenedor. Contenedor e
imagen de prueba se eliminaron despues de validar; el `Dockerfile` no cambio.

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
+-- Dockerfile / .dockerignore / railway.toml         [Fase I -- listo para Railway]
+-- docker-compose.yml                                [autocontenido desde 2026-07-21]
+-- db/
|   +-- init.sql                                      [autocontenido desde 2026-07-21]
|   L-- setup_admin.py                                [autocontenido desde 2026-07-21]
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
            +-- css/rossmille.css                  [Fase H -- tokens, temas (modo+acento), topbar/footer/drawer]
            +-- login.html
            +-- dashboard.html                     [KPIs, chart, sidebar config]
            +-- configuracion.html                 [Fase F -- 7 secciones]
            +-- productos.html / clientes.html / vender.html / pedidos.html
            +-- usuarios.html
            +-- reporte.html                       [Fase G -- 2 tabs, 3 charts]
            L-- js/
                +-- theme.js                       [Fase H -- RMTheme: modo/acento/fuente, localStorage]
                +-- i18n.js                        [Fase H -- RMI18n: diccionario ES/EN, applyTranslations]
                +-- layout.js                      [Fase H -- sidebar/topbar/footer data-driven, drawer movil, initApp()]
                +-- rossmille.js                   [showToast, renderPaginacion]
                +-- auth.js / api.js
                +-- dashboard.js                   [Chart.js barras, KPIs, reactivo a RMTheme]
                +-- configuracion.js               [Fase F -- 7 secciones; Fase H -- delega tema a RMTheme]
                +-- productos.js / clientes.js / vender.js / pedidos.js / usuarios.js
                L-- reporte.js                     [Fase G -- tabs, bar chart, ranking, doughnut; Fase H -- reactivo a RMTheme]
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
- [Fase H] Tema y acento unicos via `RMTheme` (theme.js): `data-mode` + `data-accent` en
  `<html>`, localStorage `rm_theme`, migra `rm_apariencia` (formato anterior)
- [Fase H] Idioma via `RMI18n` (i18n.js): `data-i18n` + localStorage `rm_lang`
- [Fase H] Sidebar/topbar/footer generados desde `RM_MODULES` (layout.js) en vez de HTML
  copiado en cada pagina -- `initApp()` es el punto de entrada unico
- [Fase H] `color-mix()` en CSS para tintes de acento -- requiere navegadores 2023+
- [Fase I] Variables de entorno para deploy: `PORT`, `MYSQLHOST/PORT/DATABASE/USER/PASSWORD`,
  `JWT_SECRET`, `JWT_EXPIRATION` (todas con default local, no rompen `spring-boot:run`)

---

## Paleta de colores (base Fase E, extendida en Fase H)

```
--rm-dark:      #0f172a    --rm-dark-2:    #1e293b
--rm-accent:    #6366f1    --rm-accent-h:  #4f46e5   (indigo, acento por defecto)
--rm-gold:      #c9a96e    (brand "MILLE" en sidebar, fijo en todos los temas)
--rm-bg:        #f1f5f9    --rm-white:     #ffffff
--rm-border:    #e2e8f0    --rm-text:      #1e293b    --rm-text-2: #64748b
--rm-success:   #10b981    --rm-warning:   #f59e0b
--rm-danger:    #ef4444    --rm-info:      #3b82f6    --rm-purple: #8b5cf6
```

Acentos alternativos seleccionables (Fase H, `[data-accent="..."]`):
esmeralda (`#059669`/`#047857`) y borgona (`#9f1239`/`#831843`).

Tema oscuro: `[data-mode="oscuro"]` en `documentElement` (antes `data-theme`, renombrado
en Fase H), override de variables CSS. Controlado por `RMTheme` (theme.js), no se
manipula directo desde cada pagina.

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
| 3629bc3 | Fases H e I: rediseno frontend (tokens/temas/i18n/responsive/a11y) + Dockerfile/Railway |
