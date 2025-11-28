CREATE DATABASE IF NOT EXISTS gestor_modulos CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE gestor_modulos;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL UNIQUE,
  password VARCHAR(300) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS modules (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(200),
  slug VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS alumnos (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(200),
  dni VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS profesores (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(200),
  materia VARCHAR(200)
);

CREATE TABLE IF NOT EXISTS calificaciones (
  id VARCHAR(50) PRIMARY KEY,
  alumnoId VARCHAR(50),
  nota INT,
  comentario TEXT,
  fecha DATETIME,
  FOREIGN KEY (alumnoId) REFERENCES alumnos(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS asistencias (
  id VARCHAR(50) PRIMARY KEY,
  alumnoId VARCHAR(50),
  estado VARCHAR(50),
  fecha DATETIME,
  FOREIGN KEY (alumnoId) REFERENCES alumnos(id) ON DELETE SET NULL
);

-- Opcional: insertar módulos por defecto
INSERT IGNORE INTO modules (id, name, slug) VALUES
('m-calif','Gestor de Calificaciones','calificaciones'),
('m-alum','Gestor de Alumnos','alumnos'),
('m-prof','Gestor de Profesores','profesores'),
('m-asist','Gestor de Asistencias','asistencias');
