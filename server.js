const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Servir archivos estáticos
app.use(express.static(__dirname));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error de conexión a MongoDB:', err));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.php');
});

// Rutas de módulos
app.get('/modulo_panol', (req, res) => {
    servePHPFile('modules/panol/index.php', req, res);
});

app.get('/modulo_biblioteca', (req, res) => {
    servePHPFile('modules/biblioteca/index.php', req, res);
});

app.get('/modulo_estudiantes', (req, res) => {
    servePHPFile('modules/estudiantes/index.php', req, res);
});

app.get('/modulo_tutores', (req, res) => {
    servePHPFile('modules/tutores/index.php', req, res);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});