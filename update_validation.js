/**
 * Script para agregar el campo 'validated' a la tabla users
 * Los profesores nuevos serán marcados como no validados por defecto
 * Los usuarios existentes serán validados automáticamente
 */

const { pool } = require('./db');

async function updateValidation() {
    try {
        console.log('Iniciando migración de validación...');

        // Verificar si la columna ya existe
        const [columns] = await pool.query(`
      SHOW COLUMNS FROM users LIKE 'validated'
    `);

        if (columns.length > 0) {
            console.log('La columna "validated" ya existe.');
            return;
        }

        // Agregar columna validated
        await pool.query(`
      ALTER TABLE users 
      ADD COLUMN validated BOOLEAN DEFAULT TRUE
    `);
        console.log('✓ Columna "validated" agregada exitosamente');

        // Actualizar todos los usuarios existentes como validados
        await pool.query(`
      UPDATE users SET validated = TRUE WHERE validated IS NULL
    `);
        console.log('✓ Usuarios existentes marcados como validados');

        // Agregar columna last_login para tracking
        const [lastLoginCol] = await pool.query(`
      SHOW COLUMNS FROM users LIKE 'last_login'
    `);

        if (lastLoginCol.length === 0) {
            await pool.query(`
        ALTER TABLE users 
        ADD COLUMN last_login TIMESTAMP NULL
      `);
            console.log('✓ Columna "last_login" agregada exitosamente');
        }

        console.log('\n✅ Migración completada exitosamente!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en la migración:', error);
        process.exit(1);
    }
}

updateValidation();
