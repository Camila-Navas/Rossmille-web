-- ============================================================
-- ROSS MILLE - Schema de base de datos (Flyway V1)
-- ============================================================
-- Sin CREATE DATABASE / USE: Flyway se conecta directo al schema
-- indicado en la URL JDBC (spring.datasource.url). El usuario de
-- Railway normalmente no tiene privilegios para crear bases nuevas,
-- solo para escribir en la que el plugin ya aprovisiono.
-- ============================================================

-- ------------------------------------------------------------
-- usuarios: empleados y administradores del sistema
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario       VARCHAR(10)  NOT NULL,
    nombre_usuario   VARCHAR(100) NOT NULL,
    rol_usuarios     VARCHAR(20)  NOT NULL,
    correo_usuario   VARCHAR(100) NULL,
    telefono_usuario VARCHAR(15)  NULL,
    contrasena       VARCHAR(255) NOT NULL,
    PRIMARY KEY (id_usuario),
    CONSTRAINT chk_rol CHECK (rol_usuarios IN ('Administrador', 'Empleado'))
);

-- ------------------------------------------------------------
-- clientes: compradores de la tienda
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
    id_clientes VARCHAR(10)  NOT NULL,
    nombre      VARCHAR(100) NOT NULL,
    correo      VARCHAR(100) NULL,
    telefono    VARCHAR(15)  NULL,
    direccion   VARCHAR(255) NULL,
    PRIMARY KEY (id_clientes)
);

-- ------------------------------------------------------------
-- productos: inventario de la tienda
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS productos (
    id          INT           NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(100)  NOT NULL,
    descripcion TEXT          NULL,
    talla       VARCHAR(10)   NULL,
    precio      DECIMAL(10,2) NOT NULL,
    stock       INT           NOT NULL DEFAULT 0,
    genero      VARCHAR(20)   NULL,
    categoria   VARCHAR(50)   NULL,
    color       VARCHAR(30)   NULL,
    PRIMARY KEY (id)
);

-- ------------------------------------------------------------
-- ventas: cabecera de cada venta realizada
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ventas (
    id          INT           NOT NULL AUTO_INCREMENT,
    id_cliente  VARCHAR(10)   NULL,
    id_empleado VARCHAR(10)   NOT NULL,
    fecha       DATETIME      NOT NULL,
    total       DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(20)   NOT NULL DEFAULT 'Efectivo',
    PRIMARY KEY (id),
    FOREIGN KEY (id_cliente)  REFERENCES clientes(id_clientes)  ON DELETE SET NULL,
    FOREIGN KEY (id_empleado) REFERENCES usuarios(id_usuario)   ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- detalle_venta: lineas de cada venta
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_venta (
    id              INT           NOT NULL AUTO_INCREMENT,
    venta_id        INT           NOT NULL,
    producto_id     INT           NOT NULL,
    cantidad        INT           NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (venta_id)    REFERENCES ventas(id)    ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- pedidos: solicitudes de productos sin stock
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
    id             INT           NOT NULL AUTO_INCREMENT,
    id_cliente     VARCHAR(10)   NOT NULL,
    fecha_pedido   DATETIME      NOT NULL,
    estado         VARCHAR(20)   NOT NULL DEFAULT 'Pendiente',
    total_estimado DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    observaciones  TEXT          NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_clientes) ON DELETE RESTRICT,
    CONSTRAINT chk_estado CHECK (estado IN ('Pendiente', 'En Proceso', 'Atendido'))
);

-- ------------------------------------------------------------
-- configuracion: parametros del sistema (clave-valor)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuracion (
    clave       VARCHAR(100) NOT NULL,
    valor       TEXT         NULL,
    grupo       VARCHAR(50)  NOT NULL DEFAULT 'general',
    descripcion VARCHAR(255) NULL,
    actualizado TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- detalle_pedido: productos dentro de cada pedido
-- producto_id es NULL si el producto fue ingresado manualmente
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS detalle_pedido (
    id                            INT           NOT NULL AUTO_INCREMENT,
    pedido_id                     INT           NOT NULL,
    producto_id                   INT           NULL,
    nombre_producto_personalizado VARCHAR(200)  NULL,
    cantidad                      INT           NOT NULL,
    precio_unitario_estimado      DECIMAL(10,2) NOT NULL,
    descripcion_personalizada     TEXT          NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (pedido_id)   REFERENCES pedidos(id)   ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
);
