const { pool } = require('./db');

async function updateSchema() {
    try {
        console.log('Actualizando esquema de base de datos...');

        // Add columns to calificaciones if they don't exist
        // We use a try-catch block for each column addition to avoid errors if they already exist
        // or check information_schema, but try-catch is simpler for this script.

        try {
            await pool.query("ALTER TABLE calificaciones ADD COLUMN profesorId VARCHAR(50)");
            console.log('Columna profesorId agregada.');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log('Info profesorId:', e.message);
        }

        try {
            await pool.query("ALTER TABLE calificaciones ADD COLUMN materia VARCHAR(200)");
            console.log('Columna materia agregada.');
        } catch (e) {
            if (e.code !== 'ER_DUP_FIELDNAME') console.log('Info materia:', e.message);
        }

        // Add Foreign Key
        try {
            await pool.query("ALTER TABLE calificaciones ADD CONSTRAINT fk_calif_prof FOREIGN KEY (profesorId) REFERENCES profesores(id) ON DELETE SET NULL");
            console.log('Foreign Key fk_calif_prof agregada.');
        } catch (e) {
            if (e.code !== 'ER_DUP_KEY' && !e.message.includes('Duplicate')) console.log('Info FK:', e.message);
        }

        console.log('Esquema actualizado.');
        process.exit(0);
    } catch (err) {
        console.error('Error actualizando esquema:', err);
        process.exit(1);
    }
}

updateSchema();
