
/**
 * db.js - conexión a MySQL usando mysql2/promise.
 * Inicializa tablas (si no existen) y crea un admin por defecto si no hubiera ninguno.
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { crypto } = require('crypto');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'gestor_modulos',
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDB() {
  // Se asume que el script sql/create_db.sql ya fue ejecutado. Si no, intentar crear tables mínimos.
  // Comprobar si hay usuarios; si no existe admin crear uno.
  const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM users');
  if (rows && rows[0] && rows[0].cnt === 0) {
    const hashed = await bcrypt.hash('admin123', 10);
    const id = 'admin-1';
    await pool.query('INSERT INTO users (id,nombre,email,password,role) VALUES (?,?,?,?,?)', [id, 'Administrador', 'admin@local', hashed, 'admin']);
    console.log('Admin creado por defecto: admin@local / admin123');
  } else {
    console.log('Usuarios detectados en la DB.');
  }
}

module.exports = { pool, initDB };
