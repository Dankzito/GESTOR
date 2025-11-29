-- Agregar columna cursoId a la tabla materias para relacionar materias con cursos
-- Este script actualiza la estructura de la tabla materias

-- Verificar si la columna cursoId ya existe
-- Si no existe, agregarla
ALTER TABLE materias ADD COLUMN cursoId VARCHAR(50) NULL AFTER ano;

-- Opcional: Agregar foreign key si es necesario
-- ALTER TABLE materias ADD CONSTRAINT fk_materia_curso FOREIGN KEY (cursoId) REFERENCES cursos(id) ON DELETE SET NULL;

