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

Si la BD es nueva (volumen recien creado), cargar el schema:

```bash
docker exec -i rossmille_mysql mysql -uRossMille -pRossMillB01 rossmille_db < db/init.sql
```

Verificar que las tablas existan:

```bash
docker exec rossmille_mysql mysql -uRossMille -pRossMillB01 rossmille_db -e "SHOW TABLES;"
```

Deben aparecer las 8 tablas: `usuarios`, `clientes`, `productos`, `ventas`, `detalle_venta`, `pedidos`, `detalle_pedido`, `configuracion`.

### 3. Crear el primer administrador

Si la tabla `usuarios` esta vacia, ejecutar:

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
│   ├── init.sql
│   └── setup_admin.py
├── src/main/
│   ├── java/com/rossmille/
│   │   ├── config/
│   │   │   └── SecurityConfig.java
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

La app usa `ddl-auto: validate` — Hibernate verifica que las entidades coincidan con el schema
pero no lo modifica. El schema se crea desde `db/init.sql` de este repo.

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

### 2. Agregar MySQL

1. En el mismo proyecto: New → Database → Add MySQL.
2. Railway inyecta automaticamente `MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`,
   `MYSQLUSER` y `MYSQLPASSWORD` al servicio de la app (variable reference, se
   configura solo si ambos servicios estan en el mismo proyecto).

### 3. Cargar el schema

El servicio de MySQL arranca vacio. Antes del primer login necesitas correr el
`db/init.sql` de este repo contra la base de Railway: usa el boton "Connect" del
plugin MySQL en Railway para obtener credenciales/URL publicas y ejecuta el script
con un cliente MySQL (`mysql -h ... -u ... -p ... < db/init.sql`) o desde la
pestana "Data" del propio Railway.

### 4. Crear el primer administrador

Corre `db/setup_admin.py` apuntando a la base de Railway (mismo mecanismo que en
local, solo cambia el host/credenciales), o inserta el registro manualmente en la
tabla `usuarios` con una contrasena hasheada en BCrypt.

### 5. Variables de entorno de la app

En el servicio de la app (Settings → Variables), agrega al menos:

| Variable | Valor sugerido |
|----------|----------------|
| `JWT_SECRET` | una cadena aleatoria propia (no uses el valor por defecto del repo en produccion) |

`PORT` la define Railway automaticamente — no la configures a mano.

### 6. Deploy

Railway construye la imagen con el `Dockerfile` y la publica. La app queda disponible
en el dominio que Railway asigna, en `/login.html`.

---

Desarrollado por Camila Navas.
