const { pool, initDB } = require('./db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { nanoid } = require('nanoid');

async function setupAdmin() {
    try {
        const email = 'admin@test.com';
        const password = 'password123';
        const hashed = await bcrypt.hash(password, 10);
        const id = nanoid();

        // Check if exists
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length) {
            console.log('User admin@test.com already exists. Updating to admin role.');
            await pool.query('UPDATE users SET role = ?, password = ? WHERE email = ?', ['admin', hashed, email]);
        } else {
            console.log('Creating new admin user.');
            await pool.query('INSERT INTO users (id,nombre,email,password,role) VALUES (?,?,?,?,?)',
                [id, 'Test Admin', email, hashed, 'admin']);
        }
        console.log('Admin setup complete. Login with: admin@test.com / password123');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

setupAdmin();
