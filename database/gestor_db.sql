-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS gestor_db;
USE gestor_db;

-- Tabla de usuarios
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'profesor', 'bibliotecario', 'panol') NOT NULL,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de estudiantes
CREATE TABLE estudiantes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    dni VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    curso VARCHAR(50) NOT NULL,
    division VARCHAR(10),
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sección Pañol
CREATE TABLE herramientas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    cantidad_total INT NOT NULL DEFAULT 1,
    cantidad_disponible INT NOT NULL DEFAULT 1,
    estado ENUM('disponible', 'mantenimiento', 'baja') DEFAULT 'disponible'
);

CREATE TABLE prestamos_panol (
    id INT PRIMARY KEY AUTO_INCREMENT,
    estudiante_id INT NOT NULL,
    herramienta_id INT NOT NULL,
    cantidad INT NOT NULL DEFAULT 1,
    fecha_prestamo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_devolucion_esperada DATETIME NOT NULL,
    fecha_devolucion_real DATETIME,
    estado ENUM('prestado', 'devuelto', 'vencido') DEFAULT 'prestado',
    observaciones TEXT,
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id),
    FOREIGN KEY (herramienta_id) REFERENCES herramientas(id)
);

-- Sección Biblioteca
CREATE TABLE libros (
    id INT PRIMARY KEY AUTO_INCREMENT,
    isbn VARCHAR(20) UNIQUE,
    titulo VARCHAR(200) NOT NULL,
    autor VARCHAR(100),
    editorial VARCHAR(100),
    categoria VARCHAR(50),
    cantidad_total INT NOT NULL DEFAULT 1,
    cantidad_disponible INT NOT NULL DEFAULT 1,
    ubicacion VARCHAR(50),
    estado ENUM('disponible', 'prestado', 'baja') DEFAULT 'disponible'
);

CREATE TABLE prestamos_biblioteca (
    id INT PRIMARY KEY AUTO_INCREMENT,
    estudiante_id INT NOT NULL,
    libro_id INT NOT NULL,
    fecha_prestamo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_devolucion_esperada DATETIME NOT NULL,
    fecha_devolucion_real DATETIME,
    estado ENUM('prestado', 'devuelto', 'vencido') DEFAULT 'prestado',
    observaciones TEXT,
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id),
    FOREIGN KEY (libro_id) REFERENCES libros(id)
);

-- Tabla de historial de acciones
CREATE TABLE historial (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(50),
    registro_id INT,
    detalles TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Insertar usuario administrador por defecto
INSERT INTO usuarios (username, password, rol) 
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
-- La contraseña por defecto es 'password' (hasheada)