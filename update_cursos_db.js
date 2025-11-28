/**
 * Script para agregar la tabla cursos y la columna cursoId a la tabla users
 */

const { pool } = require('./db');
const fs = require('fs');
const path = require('path');

async function updateCursosDB() {
    try {
        console.log('Iniciando migración de cursos...');

        // Verificar si la tabla cursos ya existe
        const [tables] = await pool.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'cursos'
        `);

        if (tables.length === 0) {
            // Crear tabla cursos
            await pool.query(`
                CREATE TABLE IF NOT EXISTS cursos (
                    id VARCHAR(50) PRIMARY KEY,
                    nombre VARCHAR(200) NOT NULL,
                    descripcion TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            `);
            console.log('✓ Tabla "cursos" creada exitosamente');
        } else {
            console.log('✓ La tabla "cursos" ya existe');
        }

        // Verificar si la columna cursoId ya existe en users
        const [columns] = await pool.query(`
            SHOW COLUMNS FROM users LIKE 'cursoId'
        `);

        if (columns.length === 0) {
            // Agregar columna cursoId
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN cursoId VARCHAR(50) NULL
            `);
            console.log('✓ Columna "cursoId" agregada a la tabla users');

            // Agregar foreign key si es posible
            try {
                await pool.query(`
                    ALTER TABLE users 
                    ADD CONSTRAINT fk_user_curso 
                    FOREIGN KEY (cursoId) REFERENCES cursos(id) 
                    ON DELETE SET NULL
                `);
                console.log('✓ Foreign key "fk_user_curso" agregada exitosamente');
            } catch (fkErr) {
                // Si falla la FK (puede ser que la tabla cursos no exista o ya exista la FK)
                if (fkErr.code !== 'ER_DUP_KEY' && fkErr.code !== 'ER_CANNOT_ADD_FOREIGN') {
                    console.warn('⚠ No se pudo agregar la foreign key:', fkErr.message);
                } else {
                    console.log('✓ La foreign key ya existe o no es necesaria');
                }
            }
        } else {
            console.log('✓ La columna "cursoId" ya existe en la tabla users');
        }

        console.log('\n✅ Migración de cursos completada exitosamente!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en la migración:', error);
        process.exit(1);
    }
}

updateCursosDB();

