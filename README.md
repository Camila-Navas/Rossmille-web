# ROSS MILLE Web

Sistema de punto de venta (POS) web para la tienda de ropa ROSS MILLE.
Migracion del prototipo Java Swing a una aplicacion web con Spring Boot REST API y frontend HTML/Bootstrap 5.

---

## Tecnologias

| Capa | Tecnologia |
|------|-----------|
| Lenguaje | Java 21 |
| Framework | Spring Boot 3.3.5 |
| ORM | Spring Data JPA + Hibernate 6 |
| Seguridad | Spring Security 6 + JWT (jjwt 0.11.5) |
| Contrasenas | BCryptPasswordEncoder |
| Frontend | HTML + Bootstrap 5.3.2 + Vanilla JS |
| Base de datos | MySQL 8.0 en Docker |
| PDF | Apache PDFBox 2.0.34 |
| Build | Maven Wrapper (mvnw) |

---

## Requisitos previos

- Java 21 (JDK)
- Docker y Docker Compose
- Git

No se requiere Maven instalado globalmente: el proyecto incluye `mvnw`.

---

## Setup

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd rossmille-web
```

### 2. Levantar la base de datos

El repo incluye su propio `docker-compose.yml`:

```bash
docker compose up -d
```

Verificar que el contenedor este corriendo:

```bash
docker ps
```

Si la BD es nueva (volumen recien creado), no hace falta cargar nada a mano:
Flyway crea las 8 tablas solo al arrancar la app (paso 4). Para verificarlo
manualmente de todos modos:

```bash
docker exec rossmille_mysql mysql -uRossMille -pRossMillB01 rossmille_db -e "SHOW TABLES;"
```

Deben aparecer: `usuarios`, `clientes`, `productos`, `ventas`, `detalle_venta`, `pedidos`, `detalle_pedido`, `configuracion`.

### 3. Crear el primer administrador

Si defines `ADMIN_ID`, `ADMIN_NOMBRE` y `ADMIN_PASSWORD` como variables de entorno
antes de correr la app, se crea solo al arrancar (si la tabla `usuarios` esta
vacia). Alternativa manual/interactiva sin tocar variables de entorno:

```bash
python3 db/setup_admin.py
```

El script pedira ID, nombre y contrasena del administrador.

### 4. Correr la aplicacion

```bash
cd rossmille-web
./mvnw spring-boot:run
```

La app queda disponible en: `http://localhost:8080/login.html`

---

## Credenciales de prueba (BD local Docker)

| Campo | Valor |
|-------|-------|
| ID | 1234567 |
| Cargo | Administrador |
| Contrasena | Admin123 |

---

## Modulos

| Modulo | Ruta | Acceso |
|--------|------|--------|
| Login | /login.html | Publico |
| Dashboard | /dashboard.html | Todos |
| Vender (POS) | /vender.html | Todos |
| Productos | /productos.html | Todos |
| Clientes | /clientes.html | Todos |
| Pedidos | /pedidos.html | Todos |
| Usuarios | /usuarios.html | Solo Administrador |
| Reporte | /reporte.html | Solo Administrador |

---

## API REST

### Autenticacion (publica)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/auth/login | Login — retorna JWT |

Body: `{ "id": "...", "cargo": "...", "contrasena": "..." }`
Respuesta: `{ "ok": true, "data": { "token": "...", "nombre": "...", "rol": "..." } }`

### Productos

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/productos | Listar (con ?q= para buscar) |
| GET | /api/productos/stock-bajo | Stock <= 5 |
| GET | /api/productos/{id} | Obtener uno |
| POST | /api/productos | Crear |
| PUT | /api/productos/{id} | Actualizar |
| DELETE | /api/productos/{id} | Eliminar (requiere contrasena) |

### Clientes

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/clientes | Listar (con ?q= para buscar) |
| GET | /api/clientes/{id} | Obtener uno |
| POST | /api/clientes | Crear |
| PUT | /api/clientes/{id} | Actualizar |
| DELETE | /api/clientes/{id} | Eliminar — solo Administrador |
| GET | /api/clientes/{id}/compras | Historial de compras |

### Ventas

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/ventas | Crear venta con transaccion ACID |

### Pedidos

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/pedidos?tipo=activos | Pendiente + En Proceso |
| GET | /api/pedidos?tipo=historial | Atendidos |
| POST | /api/pedidos | Crear pedido |
| PUT | /api/pedidos/{id}/avanzar | Avanzar estado |
| DELETE | /api/pedidos/{id} | Eliminar — solo Administrador |

### Usuarios — solo Administrador

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/usuarios | Listar |
| POST | /api/usuarios | Crear |
| PUT | /api/usuarios/{id} | Actualizar |
| DELETE | /api/usuarios/{id} | Eliminar |

### Reporte — solo Administrador

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/reporte?desde=YYYY-MM-DD&hasta=YYYY-MM-DD | Ventas en JSON |
| GET | /api/reporte/pdf?desde=YYYY-MM-DD&hasta=YYYY-MM-DD | Descargar PDF |

---

## Estructura del proyecto

```
rossmille-web/
├── pom.xml
├── mvnw
├── docker-compose.yml
├── db/
│   ├── init.sql              (referencia historica, ver Flyway abajo)
│   └── setup_admin.py        (alternativa manual, ver AdminSeeder abajo)
├── src/main/
│   ├── java/com/rossmille/
│   │   ├── config/
│   │   │   ├── SecurityConfig.java
│   │   │   └── AdminSeeder.java   (crea el primer admin si usuarios esta vacia)
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   ├── ProductoController.java
│   │   │   ├── ClienteController.java
│   │   │   ├── VentaController.java
│   │   │   ├── PedidoController.java
│   │   │   ├── UsuarioController.java
│   │   │   └── ReporteController.java
│   │   ├── dto/
│   │   ├── entity/
│   │   ├── exception/
│   │   │   └── GlobalExceptionHandler.java
│   │   ├── repository/
│   │   ├── security/
│   │   └── service/
│   └── resources/
│       ├── application.yml
│       ├── db/migration/
│       │   └── V1__init.sql      (Flyway -- crea el schema al arrancar)
│       └── static/
│           ├── login.html
│           ├── dashboard.html
│           ├── productos.html
│           ├── clientes.html
│           ├── vender.html
│           ├── pedidos.html
│           ├── usuarios.html
│           ├── reporte.html
│           └── js/
│               ├── auth.js
│               ├── api.js
│               ├── productos.js
│               ├── clientes.js
│               ├── vender.js
│               ├── pedidos.js
│               ├── usuarios.js
│               └── reporte.js
```

---

## Seguridad

- Contrasenas almacenadas con hash BCrypt
- Autenticacion stateless con JWT (expiracion 8 horas)
- Control de acceso por rol con `@PreAuthorize` en backend y guard de rutas en frontend
- Ventas con bloqueo pesimista (`SELECT FOR UPDATE`) para evitar condiciones de carrera en stock

---

## Base de datos

El schema lo crea y versiona **Flyway** (`src/main/resources/db/migration/`) al arrancar
la app, en local y en Railway por igual. `ddl-auto: validate` sigue activo -- Hibernate
solo verifica que las entidades coincidan con lo que Flyway ya creo, nunca lo modifica.
`db/init.sql` se conserva como referencia historica y para levantar la BD local sin
pasar por la app (`docker exec -i rossmille_mysql mysql ... < db/init.sql`).

Configuracion en `src/main/resources/application.yml`.

---

## Despliegue en Railway

El repo incluye `Dockerfile`, `.dockerignore` y `railway.toml` listos para desplegar.
`application.yml` ya lee host/puerto/usuario/clave de la base de datos y el puerto del
servidor desde variables de entorno (con los valores locales como default), asi que no
hace falta tocar codigo para desplegar.

### 1. Crear el proyecto en Railway

1. New Project → Deploy from GitHub repo → selecciona este repositorio.
2. Railway detecta `railway.toml` y construye con el `Dockerfile` (no usa Nixpacks).

### 2. Agregar MySQL y enlazar las variables (paso critico)

1. En el mismo proyecto: New → Database → Add MySQL.
2. Railway **no enlaza las variables solo** -- hay que hacerlo a mano una vez:
   en el servicio de la app → pestana **Variables** → agregar referencias al
   servicio de MySQL con la sintaxis `${{NombreServicio.VARIABLE}}`:

   ```
   MYSQLHOST=${{MySQL.MYSQLHOST}}
   MYSQLPORT=${{MySQL.MYSQLPORT}}
   MYSQLDATABASE=${{MySQL.MYSQLDATABASE}}
   MYSQLUSER=${{MySQL.MYSQLUSER}}
   MYSQLPASSWORD=${{MySQL.MYSQLPASSWORD}}
   ```

   Si el servicio de la app queda con "0 Variables", `application.yml` usa sus
   defaults locales (`localhost:3306`) y la app **crashea al arrancar** con
   `Connection refused` -- no hay ningun default valido dentro del contenedor
   de Railway. Este paso es obligatorio, no opcional.

### 3. El schema se crea solo (Flyway)

Ya no hace falta correr `db/init.sql` a mano. Al arrancar, Flyway
(`src/main/resources/db/migration/V1__init.sql`) crea las 8 tablas si la base
esta vacia. `db/init.sql` se conserva en el repo solo como referencia
historica / para levantar la BD local sin pasar por la app.

### 4. Crear el primer administrador (automatico)

`AdminSeeder` (`com.rossmille.config.AdminSeeder`) crea el primer Administrador
al arrancar si la tabla `usuarios` esta vacia, usando estas variables:

| Variable | Ejemplo |
|----------|---------|
| `ADMIN_ID` | `1234567` |
| `ADMIN_NOMBRE` | `Admin Principal` |
| `ADMIN_PASSWORD` | contrasena propia, minimo 6 caracteres |

Si no estan configuradas y la tabla esta vacia, la app arranca igual pero deja
un `WARN` en el log y nadie podra iniciar sesion hasta que se configuren y se
reinicie el servicio (o se inserte un usuario manualmente).
`db/setup_admin.py` se conserva como alternativa manual/interactiva si se
prefiere no usar estas variables.

### 5. Variables de entorno de la app -- resumen completo

En el servicio de la app (Settings → Variables):

| Variable | Origen | Obligatoria |
|----------|--------|-------------|
| `MYSQLHOST` / `MYSQLPORT` / `MYSQLDATABASE` / `MYSQLUSER` / `MYSQLPASSWORD` | Referencia al servicio MySQL (paso 2) | Si |
| `JWT_SECRET` | Valor propio, aleatorio | Si -- el default del repo es publico |
| `ADMIN_ID` / `ADMIN_NOMBRE` / `ADMIN_PASSWORD` | Valores propios | Solo la primera vez (BD vacia) |

`PORT` la define Railway automaticamente — no la configures a mano.

### 6. Deploy

Railway construye la imagen con el `Dockerfile` y la publica. La app queda disponible
en el dominio que Railway asigna, en `/login.html`.

---

Desarrollado por Camila Navas.
