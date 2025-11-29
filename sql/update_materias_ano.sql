-- Cambiar columna descripcion por ano en la tabla materias
-- Este script actualiza la estructura de la tabla materias

-- Verificar si la columna 'ano' ya existe
-- Si no existe, agregarla
ALTER TABLE materias ADD COLUMN ano VARCHAR(10) NULL AFTER nombre;

-- Migrar datos de descripcion a ano si existen
UPDATE materias SET ano = descripcion WHERE descripcion IN ('1°', '2°', '3°', '4°', '5°', '6°', '7°');

-- Opcional: Eliminar la columna descripcion si ya no es necesaria
-- ALTER TABLE materias DROP COLUMN descripcion;

