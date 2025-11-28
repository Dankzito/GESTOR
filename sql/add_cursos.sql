-- Crear tabla cursos
CREATE TABLE IF NOT EXISTS cursos (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Agregar columna cursoId a la tabla users
ALTER TABLE users ADD COLUMN cursoId VARCHAR(50) NULL;
ALTER TABLE users ADD CONSTRAINT fk_user_curso FOREIGN KEY (cursoId) REFERENCES cursos(id) ON DELETE SET NULL;

