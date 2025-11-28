const { pool } = require('./db');

async function updateDB() {
    try {
        console.log('Iniciando actualización de base de datos...');

        // 1. Rename alumnos to estudiantes if it exists
        try {
            const [rows] = await pool.query("SHOW TABLES LIKE 'alumnos'");
            if (rows.length > 0) {
                console.log('Renombrando tabla alumnos a estudiantes...');
                
                // Primero eliminar las claves foráneas si existen
                // MySQL no soporta IF EXISTS en DROP FOREIGN KEY, así que usamos try-catch
                try {
                    // Obtener nombres de claves foráneas
                    const [fkCalif] = await pool.query(`
                        SELECT CONSTRAINT_NAME 
                        FROM information_schema.KEY_COLUMN_USAGE 
                        WHERE TABLE_SCHEMA = DATABASE() 
                        AND TABLE_NAME = 'calificaciones' 
                        AND REFERENCED_TABLE_NAME = 'alumnos'
                    `);
                    if (fkCalif.length > 0) {
                        for (const fk of fkCalif) {
                            await pool.query(`ALTER TABLE calificaciones DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
                        }
                    }
                } catch (e) {
                    console.log('No se encontró FK en calificaciones o ya fue eliminada:', e.message);
                }
                
                try {
                    const [fkAsist] = await pool.query(`
                        SELECT CONSTRAINT_NAME 
                        FROM information_schema.KEY_COLUMN_USAGE 
                        WHERE TABLE_SCHEMA = DATABASE() 
                        AND TABLE_NAME = 'asistencias' 
                        AND REFERENCED_TABLE_NAME = 'alumnos'
                    `);
                    if (fkAsist.length > 0) {
                        for (const fk of fkAsist) {
                            await pool.query(`ALTER TABLE asistencias DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
                        }
                    }
                } catch (e) {
                    console.log('No se encontró FK en asistencias o ya fue eliminada:', e.message);
                }
                
                // Renombrar la tabla
                await pool.query('RENAME TABLE alumnos TO estudiantes');
                console.log('Tabla renombrada.');
                
                // Recrear las claves foráneas
                try {
                    await pool.query('ALTER TABLE calificaciones ADD CONSTRAINT fk_calif_est FOREIGN KEY (alumnoId) REFERENCES estudiantes(id) ON DELETE SET NULL');
                } catch (e) {
                    console.log('Nota: No se pudo recrear FK en calificaciones:', e.message);
                }
                
                try {
                    await pool.query('ALTER TABLE asistencias ADD CONSTRAINT fk_asist_est FOREIGN KEY (alumnoId) REFERENCES estudiantes(id) ON DELETE SET NULL');
                } catch (e) {
                    console.log('Nota: No se pudo recrear FK en asistencias:', e.message);
                }
            } else {
                console.log('Tabla alumnos no encontrada (o ya renombrada).');
            }
        } catch (e) {
            console.log('Nota sobre renombrado:', e.message);
        }

        // 2. Ensure estudiantes table exists (if it wasn't renamed)
        await pool.query(`
      CREATE TABLE IF NOT EXISTS estudiantes (
        id VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(200),
        dni VARCHAR(50)
      )
    `);

        // 3. Update modules table
        // Remove old modules if they exist and insert new ones, or update.
        // Let's just update the names and slugs.
        await pool.query("UPDATE modules SET name='Gestor de Estudiantes', slug='estudiantes' WHERE slug='alumnos'");

        // Insert if not exists (using INSERT IGNORE or ON DUPLICATE KEY UPDATE)
        // We want: Estudiantes, Profesores, Calificaciones, Asistencias.
        const modules = [
            { id: 'm-est', name: 'Gestor de Estudiantes', slug: 'estudiantes' },
            { id: 'm-prof', name: 'Gestor de Profesores', slug: 'profesores' },
            { id: 'm-calif', name: 'Gestor de Calificaciones', slug: 'calificaciones' },
            { id: 'm-asist', name: 'Gestor de Asistencias', slug: 'asistencias' }
        ];

        for (const mod of modules) {
            const [exists] = await pool.query('SELECT id FROM modules WHERE slug = ?', [mod.slug]);
            if (exists.length === 0) {
                await pool.query('INSERT INTO modules (id, name, slug) VALUES (?, ?, ?)', [mod.id, mod.name, mod.slug]);
                console.log(`Modulo insertado: ${mod.name}`);
            } else {
                await pool.query('UPDATE modules SET name = ? WHERE slug = ?', [mod.name, mod.slug]);
                console.log(`Modulo actualizado: ${mod.name}`);
            }
        }

        console.log('Actualización completada.');
        process.exit(0);
    } catch (err) {
        console.error('Error actualizando DB:', err);
        process.exit(1);
    }
}

updateDB();
