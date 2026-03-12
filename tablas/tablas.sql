drop database isiweek;
CREATE DATABASE IF NOT EXISTS isiweek CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE isiweek;

CREATE TABLE monedas (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    simbolo VARCHAR(10) NOT NULL
);

INSERT INTO monedas (nombre, codigo, simbolo) VALUES
('Peso Dominicano', 'DOP', 'RD$'),
('Dólar Estadounidense', 'USD', '$'),
('Euro', 'EUR', '€'),
('Peso Chileno', 'CLP', 'CLP$'),
('Peso Colombiano', 'COP', 'COL$'),
('Peso Mexicano', 'MXN', 'MX$');

CREATE TABLE empresas (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    rnc VARCHAR(50) DEFAULT NULL,
    razon_social VARCHAR(150) DEFAULT NULL,
    telefono VARCHAR(20) DEFAULT NULL,
    email VARCHAR(150) DEFAULT NULL,
    direccion TEXT DEFAULT NULL,
    pais VARCHAR(10) DEFAULT 'DO',
    estado_geo VARCHAR(100) DEFAULT NULL,
    ciudad VARCHAR(100) DEFAULT NULL,
    moneda_id INT NOT NULL,
    estado ENUM('activa','inactiva') DEFAULT 'activa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (moneda_id) REFERENCES monedas(id)
);

CREATE TABLE tipos_usuario (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL
);

INSERT INTO tipos_usuario (nombre) VALUES ('Super Admin'), ('Administrador'), ('Vendedor');

CREATE TABLE modos_sistema (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(150) DEFAULT NULL
);

INSERT INTO modos_sistema (nombre, descripcion) VALUES
('POS', 'Punto de Venta'),
('OBRAS', 'Gestión de Construcción'),
('CREDITOS', 'Cartera de Créditos'),
('VENTAS_ONLINE', 'Ventas Online');

CREATE TABLE usuarios (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT DEFAULT NULL,
    tipo_usuario_id INT NOT NULL,
    modo_sistema_id INT DEFAULT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    cedula VARCHAR(30) DEFAULT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    estado ENUM('activo','inactivo') DEFAULT 'activo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL,
    FOREIGN KEY (tipo_usuario_id) REFERENCES tipos_usuario(id),
    FOREIGN KEY (modo_sistema_id) REFERENCES modos_sistema(id) ON DELETE SET NULL
);

CREATE TABLE otp_tokens (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    codigo VARCHAR(6) NOT NULL,
    expira_at DATETIME NOT NULL,
    usado TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE modulos (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(200) DEFAULT NULL,
    modo_sistema_id INT DEFAULT NULL,
    FOREIGN KEY (modo_sistema_id) REFERENCES modos_sistema(id) ON DELETE SET NULL
);

INSERT INTO modulos (nombre, slug, modo_sistema_id) VALUES
('Dashboard', 'dashboard', NULL),
('Solicitudes', 'solicitudes', NULL),
('Empresas', 'empresas', NULL),
('Usuarios', 'usuarios', NULL),
('Depuración', 'depuracion', NULL),
('Configuración', 'configuracion', NULL),
('Vender', 'vender', 1),
('Mis Ventas', 'mis-ventas', 1),
('Productos', 'productos', 1),
('Clientes', 'clientes', 1),
('Inventario', 'inventario', 1),
('Compras', 'compras', 1),
('Proveedores', 'proveedores', 1),
('Cotizaciones', 'cotizaciones', 1),
('Categorías', 'categorias', 1),
('Marcas', 'marcas', 1),
('Cajas', 'cajas', 1),
('Gastos', 'gastos', 1),
('Reportes', 'reportes', 1),
('Ventas a crédito', 'cuotas', 1),
('Dashboard Simple', 'dashboard-simple', 2),
('Mis Obras', 'mis-obras', 2),
('Trabajadores', 'trabajadores', 2),
('Asistencia Diaria', 'asistencia-diaria', 2),
('Gastos de Obra', 'gastos-obra', 2),
('Reportes Simples', 'reportes-simples', 2),
('Dashboard Créditos', 'creditos-dashboard', 3),
('Planes de Crédito', 'creditos-planes', 3),
('Contratos', 'creditos-contratos', 3),
('Cuotas', 'creditos-cuotas', 3),
('Pagos', 'creditos-pagos', 3),
('Mora y Alertas', 'creditos-mora', 3),
('Pedidos', 'ventas-online-pedidos', 4),
('Catálogo', 'ventas-online-catalogo', 4);

CREATE TABLE empresa_modulos (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    modulo_id INT NOT NULL,
    activo TINYINT(1) DEFAULT 1,
    UNIQUE KEY uq_empresa_modulo (empresa_id, modulo_id),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (modulo_id) REFERENCES modulos(id) ON DELETE CASCADE
);

CREATE TABLE tipo_usuario_modulos (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tipo_usuario_id INT NOT NULL,
    modulo_id INT NOT NULL,
    puede_ver TINYINT(1) DEFAULT 1,
    UNIQUE KEY uq_tipo_modulo (tipo_usuario_id, modulo_id),
    FOREIGN KEY (tipo_usuario_id) REFERENCES tipos_usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (modulo_id) REFERENCES modulos(id) ON DELETE CASCADE
);

CREATE TABLE comprobantes (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    descripcion VARCHAR(150) NOT NULL
);

INSERT INTO comprobantes (codigo, descripcion) VALUES
('B01', 'Comprobante Consumidor Final'),
('B02', 'Comprobante Crédito Fiscal'),
('B03', 'Nota de Débito'),
('B04', 'Nota de Crédito'),
('B14', 'Comprobante Regímenes Especiales'),
('B15', 'Comprobante Gubernamental'),
('B16', 'Comprobante Exportaciones');

CREATE TABLE metodos_pago (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO metodos_pago (nombre) VALUES
('Efectivo'), ('Débito'), ('Tarjeta de Crédito'), ('Transferencia'), ('Cheque'), ('Crédito');

CREATE TABLE categorias (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE TABLE marcas (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE TABLE clientes (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    cedula_rnc VARCHAR(30) DEFAULT NULL,
    telefono VARCHAR(20) DEFAULT NULL,
    email VARCHAR(150) DEFAULT NULL,
    direccion TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE TABLE productos (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    categoria_id INT DEFAULT NULL,
    marca_id INT DEFAULT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT DEFAULT NULL,
    codigo VARCHAR(100) DEFAULT NULL,
    imagen VARCHAR(255) DEFAULT NULL,
    barcode VARCHAR(255) DEFAULT NULL,
    precio DECIMAL(15,2) NOT NULL DEFAULT 0,
    precio_costo DECIMAL(15,2) DEFAULT 0,
    stock INT DEFAULT 0,
    itbis_pct DECIMAL(5,2) DEFAULT 18.00,
    itbis_habilitado TINYINT(1) DEFAULT 1,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    FOREIGN KEY (marca_id) REFERENCES marcas(id) ON DELETE SET NULL
);

CREATE TABLE cajas (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    numero_usuario INT DEFAULT NULL,
    saldo_actual DECIMAL(15,2) DEFAULT 0,
    activa TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE TABLE cajas_sesiones (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    caja_id INT NOT NULL,
    usuario_id INT NOT NULL,
    saldo_apertura DECIMAL(15,2) DEFAULT 0,
    saldo_cierre DECIMAL(15,2) DEFAULT NULL,
    saldo_calculado DECIMAL(15,2) DEFAULT NULL,
    diferencia_cierre DECIMAL(15,2) DEFAULT NULL,
    notas_cierre TEXT DEFAULT NULL,
    abierta_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cerrada_at TIMESTAMP NULL DEFAULT NULL,
    estado ENUM('abierta','cerrada') DEFAULT 'abierta',
    FOREIGN KEY (caja_id) REFERENCES cajas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE ventas (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    usuario_id INT NOT NULL,
    cliente_id INT DEFAULT NULL,
    caja_sesion_id INT DEFAULT NULL,
    comprobante_id INT DEFAULT NULL,
    metodo_pago_id INT DEFAULT NULL,
    subtotal DECIMAL(15,2) DEFAULT 0,
    itbis DECIMAL(15,2) DEFAULT 0,
    descuento DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    efectivo_recibido DECIMAL(15,2) DEFAULT 0,
    es_pago_mixto TINYINT(1) DEFAULT 0,
    estado ENUM('completada','cancelada','pendiente') DEFAULT 'completada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (caja_sesion_id) REFERENCES cajas_sesiones(id) ON DELETE SET NULL,
    FOREIGN KEY (comprobante_id) REFERENCES comprobantes(id) ON DELETE SET NULL,
    FOREIGN KEY (metodo_pago_id) REFERENCES metodos_pago(id) ON DELETE SET NULL
);

CREATE TABLE venta_pagos (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    metodo_pago_id INT NOT NULL,
    monto DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (metodo_pago_id) REFERENCES metodos_pago(id)
);

CREATE TABLE venta_detalles (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    producto_id INT DEFAULT NULL,
    nombre_producto VARCHAR(150) DEFAULT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(15,2) NOT NULL,
    itbis DECIMAL(15,2) DEFAULT 0,
    descuento DECIMAL(15,2) DEFAULT 0,
    subtotal DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
);

CREATE TABLE venta_cuotas (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    empresa_id INT NOT NULL,
    numero INT NOT NULL,
    monto DECIMAL(15,2) NOT NULL,
    estado ENUM('pendiente','pagada') DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pagada_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE TABLE proveedores (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    rnc VARCHAR(30) DEFAULT NULL,
    telefono VARCHAR(20) DEFAULT NULL,
    email VARCHAR(150) DEFAULT NULL,
    direccion TEXT DEFAULT NULL,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE TABLE compras (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    proveedor_id INT DEFAULT NULL,
    usuario_id INT NOT NULL,
    total DECIMAL(15,2) DEFAULT 0,
    estado ENUM('completada','pendiente','cancelada') DEFAULT 'completada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE compra_detalles (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    compra_id INT NOT NULL,
    producto_id INT DEFAULT NULL,
    nombre_producto VARCHAR(150) DEFAULT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(15,2) NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
);

CREATE TABLE cotizaciones (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    cliente_id INT DEFAULT NULL,
    usuario_id INT NOT NULL,
    subtotal DECIMAL(15,2) DEFAULT 0,
    itbis DECIMAL(15,2) DEFAULT 0,
    descuento DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,
    notas TEXT DEFAULT NULL,
    estado ENUM('pendiente','aprobada','rechazada','vencida') DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE cotizacion_items (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    cotizacion_id INT NOT NULL,
    producto_id INT DEFAULT NULL,
    nombre_producto VARCHAR(150) DEFAULT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(15,2) NOT NULL,
    itbis DECIMAL(15,2) DEFAULT 0,
    descuento DECIMAL(15,2) DEFAULT 0,
    subtotal DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
);

CREATE TABLE gastos (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    usuario_id INT NOT NULL,
    concepto VARCHAR(200) NOT NULL,
    monto DECIMAL(15,2) NOT NULL,
    tipo VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE obras (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    codigo VARCHAR(50) DEFAULT NULL,
    estado ENUM('en_progreso','completada','pausada','cancelada') DEFAULT 'en_progreso',
    fecha_inicio DATE DEFAULT NULL,
    fecha_fin_estimada DATE DEFAULT NULL,
    presupuesto DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE TABLE trabajadores (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    cedula VARCHAR(30) DEFAULT NULL,
    telefono VARCHAR(20) DEFAULT NULL,
    cargo VARCHAR(100) DEFAULT NULL,
    salario_diario DECIMAL(15,2) DEFAULT 0,
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE TABLE asistencias (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    obra_id INT NOT NULL,
    trabajador_id INT NOT NULL,
    fecha DATE NOT NULL,
    horas_trabajadas DECIMAL(5,2) DEFAULT 8,
    estado ENUM('presente','ausente','medio_dia') DEFAULT 'presente',
    FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE CASCADE,
    FOREIGN KEY (trabajador_id) REFERENCES trabajadores(id) ON DELETE CASCADE
);

CREATE TABLE gastos_obra (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    obra_id INT NOT NULL,
    usuario_id INT NOT NULL,
    concepto VARCHAR(200) NOT NULL,
    tipo VARCHAR(100) DEFAULT NULL,
    monto DECIMAL(15,2) NOT NULL,
    fecha DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE solicitudes (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT DEFAULT NULL,
    nombre VARCHAR(150) DEFAULT NULL,
    email VARCHAR(150) DEFAULT NULL,
    telefono VARCHAR(20) DEFAULT NULL,
    mensaje TEXT DEFAULT NULL,
    estado ENUM('pendiente','aprobada','rechazada') DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL
);

CREATE TABLE configuracion (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id INT NOT NULL,
    clave VARCHAR(100) NOT NULL,
    valor TEXT DEFAULT NULL,
    UNIQUE KEY uq_empresa_clave (empresa_id, clave),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE TABLE sistema_config (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO sistema_config (clave, valor) VALUES
('whatsapp_numero', '18494324597'),
('whatsapp_mensaje', 'Hola, necesito soporte con IsiWeek'),
('sistema_nombre', 'IsiWeek'),
('sistema_logo', '/logo.png'),
('sistema_email', 'contacto@isiweek.com');

CREATE TABLE usuario_modos (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    modo_sistema_id INT NOT NULL,
    UNIQUE KEY uq_usuario_modo (usuario_id, modo_sistema_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (modo_sistema_id) REFERENCES modos_sistema(id) ON DELETE CASCADE
);


-- ─────────────────────────────────────────────
-- FINANCIAMIENTO
-- ─────────────────────────────────────────────

CREATE TABLE fin_planes (
    id             INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id     INT NOT NULL,
    nombre         VARCHAR(150) NOT NULL,
    codigo         VARCHAR(50)  DEFAULT NULL,
    descripcion    TEXT         DEFAULT NULL,
    mora_pct       DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    dias_gracia    INT          NOT NULL DEFAULT 5,
    descuento_anticipado_pct  DECIMAL(5,2) DEFAULT 0,
    cuotas_minimas_anticipadas INT DEFAULT 0,
    monto_minimo   DECIMAL(15,2) DEFAULT 0,
    monto_maximo   DECIMAL(15,2) DEFAULT NULL,
    requiere_fiador    TINYINT(1) DEFAULT 0,
    permite_anticipado TINYINT(1) DEFAULT 1,
    activo         TINYINT(1)   DEFAULT 1,
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE TABLE fin_plan_opciones (
    id             INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    plan_id        INT NOT NULL,
    meses          INT NOT NULL,
    tasa_anual_pct DECIMAL(7,4) DEFAULT 0,
    inicial_pct    DECIMAL(5,2) DEFAULT 0,
    tipo           ENUM('cash','credito') DEFAULT 'credito',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES fin_planes(id) ON DELETE CASCADE
);

CREATE TABLE fin_contratos (
    id             INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id     INT NOT NULL,
    usuario_id     INT NOT NULL,
    cliente_id     INT NOT NULL,
    plan_id        INT NOT NULL,
    opcion_id      INT NOT NULL,
    numero         VARCHAR(30) NOT NULL UNIQUE,
    monto_total    DECIMAL(15,2) NOT NULL,
    monto_inicial  DECIMAL(15,2) NOT NULL DEFAULT 0,
    monto_financiado DECIMAL(15,2) NOT NULL,
    total_intereses  DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_pagar      DECIMAL(15,2) NOT NULL,
    saldo_pendiente  DECIMAL(15,2) NOT NULL,
    meses          INT NOT NULL,
    tasa_anual_pct DECIMAL(7,4) DEFAULT 0,
    cuota_mensual  DECIMAL(15,2) NOT NULL,
    fecha_inicio   DATE NOT NULL,
    fecha_fin      DATE NOT NULL,
    notas          TEXT DEFAULT NULL,
    estado         ENUM('activo','pagado','incumplido','reestructurado','cancelado') DEFAULT 'activo',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id)  REFERENCES empresas(id)  ON DELETE CASCADE,
    FOREIGN KEY (usuario_id)  REFERENCES usuarios(id),
    FOREIGN KEY (cliente_id)  REFERENCES clientes(id),
    FOREIGN KEY (plan_id)     REFERENCES fin_planes(id),
    FOREIGN KEY (opcion_id)   REFERENCES fin_plan_opciones(id)
);

CREATE TABLE fin_contrato_activos (
    id             INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    contrato_id    INT NOT NULL,
    empresa_id     INT NOT NULL,
    nombre         VARCHAR(150) NOT NULL,
    descripcion    TEXT DEFAULT NULL,
    serial         VARCHAR(100) DEFAULT NULL,
    valor          DECIMAL(15,2) DEFAULT 0,
    imagen         VARCHAR(255) DEFAULT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contrato_id) REFERENCES fin_contratos(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id)  REFERENCES empresas(id)  ON DELETE CASCADE
);

CREATE TABLE fin_fiadores (
    id             INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    contrato_id    INT NOT NULL,
    nombre         VARCHAR(150) NOT NULL,
    cedula         VARCHAR(30)  DEFAULT NULL,
    telefono       VARCHAR(20)  DEFAULT NULL,
    email          VARCHAR(150) DEFAULT NULL,
    direccion      TEXT         DEFAULT NULL,
    created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contrato_id) REFERENCES fin_contratos(id) ON DELETE CASCADE
);

CREATE TABLE fin_cuotas (
    id             INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    contrato_id    INT NOT NULL,
    empresa_id     INT NOT NULL,
    numero         INT NOT NULL,
    monto          DECIMAL(15,2) NOT NULL,
    capital        DECIMAL(15,2) NOT NULL DEFAULT 0,
    interes        DECIMAL(15,2) NOT NULL DEFAULT 0,
    mora           DECIMAL(15,2) NOT NULL DEFAULT 0,
    fecha_vencimiento DATE NOT NULL,
    fecha_pago     DATE DEFAULT NULL,
    estado         ENUM('pendiente','pagada','vencida','parcial') DEFAULT 'pendiente',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contrato_id) REFERENCES fin_contratos(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id)  REFERENCES empresas(id)  ON DELETE CASCADE
);

CREATE TABLE fin_pagos (
    id             INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    contrato_id    INT NOT NULL,
    empresa_id     INT NOT NULL,
    usuario_id     INT NOT NULL,
    monto          DECIMAL(15,2) NOT NULL,
    monto_capital  DECIMAL(15,2) NOT NULL DEFAULT 0,
    monto_interes  DECIMAL(15,2) NOT NULL DEFAULT 0,
    monto_mora     DECIMAL(15,2) NOT NULL DEFAULT 0,
    metodo_pago_id INT DEFAULT NULL,
    referencia     VARCHAR(100) DEFAULT NULL,
    notas          TEXT DEFAULT NULL,
    fecha          DATE NOT NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contrato_id)   REFERENCES fin_contratos(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id)    REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id)    REFERENCES usuarios(id),
    FOREIGN KEY (metodo_pago_id) REFERENCES metodos_pago(id) ON DELETE SET NULL
);

CREATE TABLE fin_pago_cuotas (
    id        INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    pago_id   INT NOT NULL,
    cuota_id  INT NOT NULL,
    monto     DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (pago_id)  REFERENCES fin_pagos(id)  ON DELETE CASCADE,
    FOREIGN KEY (cuota_id) REFERENCES fin_cuotas(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- CATÁLOGO ONLINE
-- ─────────────────────────────────────────────

CREATE TABLE catalogo_config (
    id                INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id        INT NOT NULL UNIQUE,
    nombre            VARCHAR(150) NOT NULL,
    descripcion       TEXT DEFAULT NULL,
    url_slug          VARCHAR(100) NOT NULL UNIQUE,
    logo              VARCHAR(255) DEFAULT NULL,
    color_primario    VARCHAR(10)  DEFAULT '#1d6fce',
    color_secundario  VARCHAR(10)  DEFAULT '#0ea5e9',
    whatsapp          VARCHAR(20)  DEFAULT NULL,
    horario           TEXT         DEFAULT NULL,
    direccion         TEXT         DEFAULT NULL,
    activo            TINYINT(1)   DEFAULT 1,
    created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE TABLE catalogo_productos (
    id            INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id    INT NOT NULL,
    producto_id   INT NOT NULL,
    visible       TINYINT(1) DEFAULT 1,
    destacado     TINYINT(1) DEFAULT 0,
    orden         INT DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_catalogo_producto (empresa_id, producto_id),
    FOREIGN KEY (empresa_id)  REFERENCES empresas(id)  ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

CREATE TABLE catalogo_pedidos (
    id            INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    empresa_id    INT NOT NULL,
    nombre_cliente VARCHAR(150) NOT NULL,
    telefono      VARCHAR(20)  DEFAULT NULL,
    email         VARCHAR(150) DEFAULT NULL,
    direccion     TEXT         DEFAULT NULL,
    notas         TEXT         DEFAULT NULL,
    total         DECIMAL(15,2) NOT NULL DEFAULT 0,
    estado        ENUM('pendiente','confirmado','enviado','entregado','cancelado') DEFAULT 'pendiente',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

CREATE TABLE catalogo_pedido_items (
    id            INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    pedido_id     INT NOT NULL,
    producto_id   INT DEFAULT NULL,
    nombre_producto VARCHAR(150) NOT NULL,
    cantidad      INT NOT NULL DEFAULT 1,
    precio        DECIMAL(15,2) NOT NULL,
    subtotal      DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (pedido_id)   REFERENCES catalogo_pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
);

