-- 1. Rename alumnos table to estudiantes
RENAME TABLE alumnos TO estudiantes;

-- 2. Update modules table
UPDATE modules SET name='Gestor de Estudiantes', slug='estudiantes' WHERE slug='alumnos';
INSERT IGNORE INTO modules (id, name, slug) VALUES 
('m-est', 'Gestor de Estudiantes', 'estudiantes'),
('m-prof', 'Gestor de Profesores', 'profesores'),
('m-calif', 'Gestor de Calificaciones', 'calificaciones'),
('m-asist', 'Gestor de Asistencias', 'asistencias');

-- 3. Add columns to calificaciones
ALTER TABLE calificaciones ADD COLUMN profesorId VARCHAR(50);
ALTER TABLE calificaciones ADD COLUMN materia VARCHAR(200);

-- 4. Add Foreign Key to calificaciones
ALTER TABLE calificaciones ADD CONSTRAINT fk_calif_prof FOREIGN KEY (profesorId) REFERENCES profesores(id) ON DELETE SET NULL;
