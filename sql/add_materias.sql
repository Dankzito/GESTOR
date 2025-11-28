-- Crear tabla materias
CREATE TABLE IF NOT EXISTS materias (
  id VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Agregar columna materiaId a la tabla users (ejecutar manualmente si no existe)
-- ALTER TABLE users ADD COLUMN materiaId VARCHAR(50);
-- ALTER TABLE users ADD CONSTRAINT fk_user_materia FOREIGN KEY (materiaId) REFERENCES materias(id) ON DELETE SET NULL;

