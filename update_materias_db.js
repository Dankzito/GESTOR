/**
 * Script para actualizar la base de datos con la tabla materias
 * y agregar la columna materiaId a users
 */
const { pool } = require('./db');

async function updateMateriasDB() {
  try {
    console.log('Actualizando base de datos para módulo Materias...');

    // Crear tabla materias
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS materias (
          id VARCHAR(50) PRIMARY KEY,
          nombre VARCHAR(200) NOT NULL,
          descripcion TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `);
      console.log('✓ Tabla materias creada/verificada');
    } catch (err) {
      if (err.code !== 'ER_TABLE_EXISTS_ERROR') {
        throw err;
      }
      console.log('✓ Tabla materias ya existe');
    }

    // Verificar si la columna materiaId existe en users
    try {
      const [columns] = await pool.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'materiaId'
      `);
      
      if (columns.length === 0) {
        // Agregar columna materiaId
        await pool.query('ALTER TABLE users ADD COLUMN materiaId VARCHAR(50)');
        console.log('✓ Columna materiaId agregada a users');
        
        // Agregar foreign key
        try {
          await pool.query(`
            ALTER TABLE users 
            ADD CONSTRAINT fk_user_materia 
            FOREIGN KEY (materiaId) REFERENCES materias(id) ON DELETE SET NULL
          `);
          console.log('✓ Foreign key fk_user_materia agregada');
        } catch (fkErr) {
          if (fkErr.code !== 'ER_DUP_KEY') {
            console.log('⚠ No se pudo agregar foreign key (puede que ya exista):', fkErr.message);
          } else {
            console.log('✓ Foreign key ya existe');
          }
        }
      } else {
        console.log('✓ Columna materiaId ya existe en users');
      }
    } catch (err) {
      console.error('Error al verificar/agregar columna materiaId:', err.message);
    }

    console.log('✓ Base de datos actualizada correctamente');
    process.exit(0);
  } catch (err) {
    console.error('Error al actualizar base de datos:', err);
    process.exit(1);
  }
}

updateMateriasDB();

