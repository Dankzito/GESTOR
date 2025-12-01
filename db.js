
/**
 * db.js - conexión a MySQL usando mysql2/promise.
 * Inicializa tablas (si no existen) y crea un admin por defecto si no hubiera ninguno.
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
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
  try {
    // Crear tabla users si no existe
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('alumno','profesor','admin') DEFAULT 'alumno',
        validated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Agregar columna dni si no existe
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN dni VARCHAR(50) NULL`);
      console.log('Columna dni agregada a la tabla users');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.log('Columna dni ya existe');
      }
    }

    // Agregar columnas materiaId y cursoId si no existen
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN materiaId VARCHAR(255) NULL`);
      console.log('Columna materiaId agregada');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.log('Columna materiaId ya existe');
      }
    }

    try {
      await pool.query(`ALTER TABLE users ADD COLUMN cursoId VARCHAR(10) NULL`);
      console.log('Columna cursoId agregada');
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') {
        console.log('Columna cursoId ya existe');
      }
    }

    // Crear admin por defecto si no hay usuarios
    const [users] = await pool.query('SELECT * FROM users');
    if (users.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (id, nombre, email, password, role, validated) VALUES (?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), 'Administrador', 'admin@gestor.com', hashedPassword, 'admin', true]
      );
      console.log('Usuario admin creado: admin@gestor.com / admin123');
    } else {
      console.log('Usuarios detectados en la DB.');
    }
  } catch (err) {
    console.error('Error al inicializar la base de datos:', err);
  }
}

module.exports = { pool, initDB };
