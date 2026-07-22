# Proceso de Validacion -- ROSS MILLE Web

Registro de la sesion de validacion del proyecto realizada el 2026-07-21.
Objetivo: revisar el estado general del proyecto, levantar el sistema para
verlo funcionando, buscar bugs funcionales navegando la app, y dejarlo listo
para desplegar en Railway.

---

## 1. Puesta en contexto inicial

Se reviso el estado del repo sin ejecutar codigo:

- `git status` / `git log` -- rama `main`, working tree limpio, al dia con
  `origin/main`. Ultimo commit al iniciar: `c198c4c`.
- `CONTEXTO_PROYECTO.md`, `PLAN_TRABAJO.md`, `README.md` -- todas las fases
  documentadas (1-7 y A-I) marcadas COMPLETADA.

### Hallazgos de la revision de documentacion

| Item | Estado |
|------|--------|
| Build Docker (Fase I / Railway) | Documentado como NO probado de punta a punta |
| i18n dinamico (tablas, tickets, toasts generados por JS) | Fuera de alcance, documentado a proposito |
| Checkout WSL (`/home/camil/proyectos/rossmille-web`) | 2 commits atras de origin, con cambios sin commitear (no se toco) |
| `mvnw` con CRLF | Confirmado al intentar correrlo desde WSL -- rompe el shebang en Linux |

---

## 2. Puesta en marcha del sistema (para verlo en el navegador)

Entorno usado: checkout `C:\Users\camil\Validacion_Proyectos\Rossmille-web`
(Windows, sin JDK instalado) ejecutado via WSL Ubuntu (que si tiene JDK 21
embebido en la extension de VS Code) apuntando a la ruta `/mnt/c/...` del
checkout Windows.

Pasos seguidos:

1. `wsl -d Ubuntu` -- distro Ubuntu disponible, con JRE 21 en
   `~/.vscode-server/extensions/redhat.java-1.55.0-linux-x64/jre/21.0.11-linux-x86_64`.
2. `docker compose up -d` desde `prototype-java` (en ese momento el
   `docker-compose.yml` propio de este repo todavia no existia) -- levanto
   `rossmille_mysql` con los datos ya existentes (8 tablas, incluida
   `configuracion`).
3. `mvnw` fallo al ejecutarse desde WSL: tiene fin de linea CRLF (checkout
   clonado en Windows), lo que rompe el shebang en Linux -- mismo problema ya
   anticipado y resuelto dentro del `Dockerfile` (Fase I), pero no para
   ejecucion directa con `mvnw`. Se genero una copia normalizada
   (`sed 's/\r$//' mvnw > /tmp/mvnw_fixed`) sin modificar el archivo original
   del repo.
4. Se arranco la app con `Monitor` (proceso vigilado en segundo plano,
   filtrando por lineas de arranque/error) para no perder la sesion WSL al
   cerrarse el comando que la invoca.
5. Confirmado: `Started RossmilleApplication` + `HTTP 200` en `/login.html`.

App disponible en `http://localhost:8080/login.html` durante toda la sesion.

---

## 3. Busqueda de bugs funcionales

Sin acceso a herramientas de navegador en esta sesion (extension Chrome no
conectada), se opto por un metodo equivalente: pruebas reales contra la API
via `curl` (login, CRUD, flujo de venta, permisos por rol) + revision de
codigo de los modulos JS/Java involucrados.

### Pruebas realizadas y resultado

| Prueba | Resultado |
|--------|-----------|
| Login admin + JWT | OK |
| Permisos por rol (Empleado -> 403 en `/usuarios`, `/reporte`, `/configuracion`; 200 en `/productos`, `/clientes`) | OK |
| Venta normal (descuenta stock correctamente) | OK |
| Venta con stock insuficiente | OK -- HTTP 409 con mensaje claro, no descuenta stock |
| Venta con cantidad 0 o negativa | OK -- HTTP 400 |
| Producto con precio o stock negativo | OK -- HTTP 400 |
| Pedido: Pendiente -> En Proceso -> Atendido -> bloquea avanzar mas | OK |
| Eliminar (producto/pedido/usuario) con contrasena incorrecta | OK -- rechazado |
| Cliente con ID duplicado | OK -- rechazado |
| PDF de reporte | OK -- se genera correctamente |
| Busqueda de productos con caracteres tipo inyeccion SQL | OK -- JPQL parametrizado, sin errores |
| **Venta con descuento mayor al subtotal** | **BUG -- ver seccion 4** |

### Inconsistencia menor de API (no es bug funcional)

`POST /api/auth/login` usa el campo `cargo` para el rol del usuario, mientras
que `POST/PUT /api/usuarios` usa `rol` para el mismo concepto. Cada endpoint
funciona bien por separado, pero es una inconsistencia de nombres en el
diseno de la API que puede confundir a futuro. No se corrigio (cambiar
cualquiera de los dos nombres es breaking change para el otro consumidor).

---

## 4. Bug encontrado y corregido: descuento sin limite superior en Vender

### Descripcion

Ni el frontend (`vender.js`) ni el backend (`VentaService`) validaban que el
descuento no superara el subtotal de la venta:

- Frontend (`vender.js`, funcion `actualizarTotales`/`finalizarVenta`): solo
  validaba `descuento < 0`, nunca `descuento > subtotal`.
- Backend (`VentaService.java`): `total = subtotal.subtract(descuento).max(ZERO)`
  recortaba el total a 0 pero no rechazaba la venta ni corregia el campo
  `descuento` guardado.

### Reproduccion

Venta real contra la API: "Camiseta Test" ($35.000) con descuento de
$999.999. La venta se acepto (HTTP 201), descontro stock real, y quedo
guardada con `total: 0` y `descuento: 999999`. Al consultar
`/api/reporte` esa venta aparecia con **$0 en ingresos** pese a haberse
entregado una prenda -- distorsion directa de los KPIs de ingresos y ticket
promedio en el modulo Reporte.

### Fix aplicado (commit `0d4a36a`)

- `VentaService.java`: se agrego validacion `descuento.compareTo(subtotal) > 0`
  -> lanza `IllegalArgumentException` (HTTP 400 via `GlobalExceptionHandler`)
  antes de tocar stock o guardar la venta. Se elimino el `.max(ZERO)` porque
  ya no es necesario (el total nunca puede ser negativo una vez validado el
  descuento).
- `vender.js`: misma validacion en `finalizarVenta()` (bloquea el envio con
  mensaje de error) + en `actualizarTotales()` el input de descuento se marca
  con borde rojo mientras el valor excede el subtotal.

### Verificacion post-fix

- Venta con descuento excesivo -> ahora HTTP 400, mensaje "El descuento no
  puede ser mayor al subtotal de la venta".
- Venta con descuento valido ($10.000 sobre $90.000) -> HTTP 201, total
  $80.000 correcto.

### Ventas de prueba dejadas en la BD (a peticion del usuario, para verlas)

| Venta | Total | Descripcion |
|-------|-------|-------------|
| #3 | $35.000 | Venta valida sin descuento |
| #4 | $0 | Evidencia del bug original (descuento $999.999) -- ya no reproducible tras el fix |
| #5 | $80.000 | Venta valida con descuento de $10.000 -- ejemplo post-fix |

---

## 5. Build Docker validado de punta a punta

Pendiente desde la Fase I (documentado, nunca se habia corrido `docker build`
real). En esta sesion:

1. `docker build -t rossmille-web:validacion .` -> **BUILD SUCCESS**
   (compila con Maven dentro del propio Dockerfile, empaqueta el jar, imagen
   final basada en `eclipse-temurin:21-jre`, usuario no-root).
2. Contenedor de prueba corrido contra la BD real, en la red de Docker de
   `rossmille_mysql`, con las mismas variables de entorno que inyectaria
   Railway (`MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`,
   `MYSQLPASSWORD`, `JWT_SECRET`) en el puerto 8081 (para no chocar con la
   instancia de desarrollo en 8080).
3. Arranco en 18.8s sin errores. Login real (`POST /api/auth/login`) y
   `login.html` respondieron HTTP 200 dentro del contenedor.
4. Contenedor e imagen de prueba (`rossmille-web:validacion`) eliminados
   despues de validar. El `Dockerfile` no se modifico -- ya estaba correcto.

Conclusion: el proyecto esta listo para desplegarse en Railway en cuanto a la
imagen. Pasos manuales que siguen pendientes de hacer en el propio Railway
(no automatizables desde este repo): cargar `db/init.sql` contra la BD de
Railway, crear el primer administrador, y configurar `JWT_SECRET` propio en
las variables de entorno del servicio.

---

## 6. Repo autocontenido (docker-compose.yml + db/)

### Problema detectado

`docker-compose.yml`, `db/init.sql` y `db/setup_admin.py` vivian unicamente en
`prototype-java` (el prototipo Swing archivado). El README de `rossmille-web`
le pedia a quien clonara el repo que tambien clonara `prototype-java` para
poder levantar la base de datos -- un problema real para un proyecto pensado
como pieza de portafolio autocontenida.

### Cambio aplicado (commit `0431c16`)

- Se copiaron los 3 archivos a `rossmille-web` tal cual (mismo
  `container_name: rossmille_mysql` y `volumes: rossmille_data`, asi que
  reutilizan el contenedor/volumen ya existente sin duplicar nada).
- `prototype-java` no se modifico ni se borro -- sigue archivado, intacto.
- `.dockerignore` actualizado para excluir `db/` y `docker-compose.yml` del
  contexto de build de la imagen (no los necesita el runtime).
- `README.md` y `CONTEXTO_PROYECTO.md` actualizados: ya no mencionan clonar
  `prototype-java`, el flujo completo (`docker compose up -d`, cargar
  `db/init.sql`, `setup_admin.py`) apunta a este mismo repo.

### Verificacion

`docker compose config` desde el nuevo `docker-compose.yml` -- sintaxis
valida, mismo nombre de proyecto/contenedor reconocido correctamente.

---

## 7. Commits generados en esta sesion

| Hash | Mensaje | Contenido |
|------|---------|-----------|
| `0d4a36a` | fix: validar que el descuento no supere el subtotal en Vender | `VentaService.java`, `vender.js` |
| `0431c16` | feat: repo autocontenido para levantar la BD (docker-compose.yml + db/) | `docker-compose.yml`, `db/init.sql`, `db/setup_admin.py`, `.dockerignore`, `README.md`, `CONTEXTO_PROYECTO.md` |

Estado al cerrar esta seccion del proceso: rama `main`, 2 commits adelante de
`origin/main`, **sin pushear** (pendiente de decision del usuario).

---

## 9. Diagnostico y fix del crash real en Railway (deploy fallido)

El usuario reporto que el primer intento de deploy en Railway crasheaba al
arrancar (`CJCommunicationsException: Connection refused` -> cascada hasta
`UnsatisfiedDependencyException`). Trajo un brief con un plan de 5 puntos
para arreglarlo (externalizar config, armar URL JDBC, migrar a Flyway,
reemplazar `setup_admin.py`, perfiles Spring).

### Verificacion contra el repo real (antes de escribir codigo)

El brief asumia cosas que ya estaban resueltas desde la Fase I:
`application.properties` (no existe, es `application.yml`) con credenciales
hardcodeadas (falso, ya usa `${MYSQLHOST:localhost}` etc.) y URL JDBC sin
armar desde variables individuales (falso, ya estaba armada asi). Se leyeron
`pom.xml`, `SecurityConfig.java`, `JwtAuthenticationFilter.java`,
`UserDetailsServiceImpl.java`, `UsuarioRepository.java`, `Usuario.java` y
`AuthService.java` para confirmar el estado real antes de tocar nada.

### Causa raiz real

Confirmada por el propio usuario: el servicio de la app en Railway tenia
**0 Variables** configuradas. Sin `MYSQLHOST` inyectada, `application.yml`
usa su default `localhost`, y el contenedor de Railway no tiene MySQL en
`localhost` -- de ahi el `Connection refused`. Esto se arregla enlazando las
variables del plugin MySQL al servicio de la app en el dashboard de Railway
(`${{MySQL.MYSQLHOST}}`, etc.) -- **ningun cambio de codigo lo resuelve por
si solo**. Instrucciones detalladas quedaron en el README, seccion
"Despliegue en Railway".

### Cambios de codigo aplicados (mejoras reales, mas alla del fix de Railway)

| Cambio | Archivo(s) | Por que |
|--------|-----------|---------|
| Flyway agregado | `pom.xml`, `application.yml`, `src/main/resources/db/migration/V1__init.sql` | Crea/versiona el schema solo al arrancar en cualquier entorno -- elimina el paso manual de correr `db/init.sql` contra la BD de Railway (un paso que se puede olvidar y de hecho pudo no haberse hecho nunca) |
| `AdminSeeder` (CommandLineRunner) | `src/main/java/com/rossmille/config/AdminSeeder.java` | Crea el primer Administrador en el arranque si `usuarios` esta vacia, usando `ADMIN_ID`/`ADMIN_NOMBRE`/`ADMIN_PASSWORD` -- elimina la dependencia de correr `db/setup_admin.py` (interactivo, no funciona en un contenedor sin terminal) |
| Perfiles Spring (`application-prod.yml`) | -- no se agrego -- | El patron `${VAR:default-local}` ya existente logra el mismo objetivo con un solo archivo; agregar perfiles habria duplicado configuracion sin ganancia real |

### Validacion realizada (no solo inspeccion de codigo)

1. **BD local existente** (con 3 usuarios y las ventas de prueba de la
   seccion 4) reiniciada con Flyway activo -> hizo `baseline` en version 0 y
   migro a V1 sin tocar datos. Login y datos verificados intactos despues.
2. **BD completamente vacia** (contenedor MySQL efimero en el puerto 3307,
   simulando el MySQL nuevo de Railway) + `ADMIN_ID`/`ADMIN_NOMBRE`/
   `ADMIN_PASSWORD` configurados -> Flyway creo las 8 tablas desde cero,
   `AdminSeeder` creo el administrador, y el login con esas credenciales
   funciono en el primer intento (HTTP 200).
3. Contenedor e instancia de prueba eliminados despues de validar.

### Documentacion actualizada

`README.md` (seccion "Despliegue en Railway" reescrita con los pasos
correctos de variables + Flyway + AdminSeeder) y `CONTEXTO_PROYECTO.md`
(nueva seccion fechada 2026-07-21 con el mismo detalle tecnico).

---

## 10. Pendientes que quedan abiertos (actualizado)

- Decidir si se pushean los commits locales a `origin/main` (a la fecha:
  `0d4a36a`, `0431c16`, mas los cambios de Flyway/AdminSeeder de la seccion 9,
  que aun no se han commiteado).
- Confirmar en el dashboard de Railway que las variables de MySQL quedaron
  enlazadas (seccion 9) -- esto es lo unico que de verdad resuelve el crash
  original, el codigo por si solo no alcanza.
- Configurar `ADMIN_ID`/`ADMIN_NOMBRE`/`ADMIN_PASSWORD` en Railway antes del
  primer deploy exitoso (o insertar el admin a mano si se prefiere).
- Inconsistencia de nombre de campo `cargo` vs `rol` entre login y usuarios
  (documentada en seccion 3, no corregida).
- WARN cosmetico en el log ante un `ClientAbortException` (broken pipe): el
  `GlobalExceptionHandler` intenta responder JSON sobre una respuesta que ya
  tiene `Content-Type: text/html`, generando un segundo error en cascada al
  loguear. No afecta al usuario final, solo ensucia el log del servidor.
- i18n dinamico de contenido generado por JS (fuera de alcance, ya documentado
  en Fase H).
- Checkout WSL original con 2 commits de atraso y cambios sin commitear
  (no se toco, decision pendiente del usuario sobre que hacer con ese
  trabajo).
