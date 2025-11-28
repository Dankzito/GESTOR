
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const path = require('path');
const { pool, initDB } = require('./db');
const { ensureAuthenticated, ensureRole, ensureValidated } = require('./middlewares/auth');
const { nanoid } = require('nanoid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para pasar usuario a todas las vistas


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-session-key',
  resave: false,
  saveUninitialized: false
}));

// Inicializar DB
initDB().catch(err => console.error('Error initDB:', err));

// Exponer usuario en las vistas
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  // Exponer path para menu activo
  res.locals.path = req.path;
  next();
});

/* ---------- AUTH ---------- */
// Login API for Modal
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Contraseña incorrecta' });

    // Actualizar last_login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    req.session.user = {
      id: user.id,
      nombre: user.nombre,
      role: user.role,
      email: user.email,
      validated: user.validated
    };
    res.json({ success: true, redirect: '/dashboard' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// Register (Optional, keep for admin usage or setup)
app.get('/register', (req, res) => res.render('register', { error: null }));
app.post('/register', async (req, res) => {
  const { nombre, email, password, role } = req.body;
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) return res.render('register', { error: 'Email ya registrado' });
  const hashed = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();

  // Profesores no validados por defecto, alumnos y admin validados
  const validated = (role === 'profesor') ? false : true;

  await pool.query('INSERT INTO users (id,nombre,email,password,role,validated) VALUES (?,?,?,?,?,?)',
    [id, nombre, email, hashed, role || 'alumno', validated]);

  // Auto login after register
  req.session.user = { id, nombre, role: role || 'alumno', email, validated };
  res.redirect('/dashboard');
});

/* ---------- ADMIN PANEL ---------- */
app.get('/admin', ensureAuthenticated, ensureRole('admin'), async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    res.render('admin', { users });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar usuarios');
  }
});

app.post('/admin/users/:id/role', ensureAuthenticated, ensureRole('admin'), async (req, res) => {
  const { role } = req.body;
  await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
  res.redirect('/admin');
});

app.post('/admin/users/:id/validate', ensureAuthenticated, ensureRole('admin'), async (req, res) => {
  await pool.query('UPDATE users SET validated = TRUE WHERE id = ?', [req.params.id]);
  res.redirect('/admin');
});

app.post('/admin/users/:id/delete', ensureAuthenticated, ensureRole('admin'), async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.redirect('/admin');
});

/* ---------- PUBLIC / HOME ---------- */
app.get('/', async (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('index', { title: 'Iniciar Sesión', error: null });
});

/* ---------- DASHBOARD & MODULES ---------- */
app.get('/dashboard', ensureAuthenticated, async (req, res) => {
  const user = req.session.user;
  let stats = {};

  try {
    if (user.role === 'admin') {
      // Estadísticas para admin
      const [userCount] = await pool.query('SELECT COUNT(*) as total FROM users');
      const [pendingProfs] = await pool.query('SELECT COUNT(*) as total FROM users WHERE role = "profesor" AND validated = FALSE');
      const [studentCount] = await pool.query('SELECT COUNT(*) as total FROM estudiantes');
      const [gradeCount] = await pool.query('SELECT COUNT(*) as total FROM calificaciones');
      const [pendingProfsList] = await pool.query('SELECT id, nombre, email FROM users WHERE role = "profesor" AND validated = FALSE LIMIT 5');

      stats = {
        totalUsers: userCount[0].total,
        pendingProfessors: pendingProfs[0].total,
        totalStudents: studentCount[0].total,
        totalGrades: gradeCount[0].total,
        pendingProfessorsList: pendingProfsList
      };
    } else if (user.role === 'profesor') {
      // Estadísticas para profesor
      const [gradeCount] = await pool.query('SELECT COUNT(*) as total FROM calificaciones WHERE profesorId = ?', [user.id]);
      const [recentGrades] = await pool.query(`
        SELECT c.*, e.nombre as estudiante_nombre 
        FROM calificaciones c
        LEFT JOIN estudiantes e ON c.alumnoId = e.id
        WHERE c.profesorId = ?
        ORDER BY c.fecha DESC LIMIT 5
      `, [user.id]);
      const [todayAttendance] = await pool.query(`
        SELECT COUNT(*) as total FROM asistencias 
        WHERE DATE(fecha) = CURDATE()
      `);

      stats = {
        totalGrades: gradeCount[0].total,
        recentGrades: recentGrades,
        todayAttendance: todayAttendance[0].total
      };
    } else if (user.role === 'alumno') {
      // Estadísticas para alumno
      const [avgGrade] = await pool.query('SELECT AVG(nota) as promedio FROM calificaciones WHERE alumnoId = ?', [user.id]);
      const [recentGrades] = await pool.query(`
        SELECT c.*, p.nombre as profesor_nombre
        FROM calificaciones c
        LEFT JOIN profesores p ON c.profesorId = p.id
        WHERE c.alumnoId = ?
        ORDER BY c.fecha DESC LIMIT 5
      `, [user.id]);
      const [monthAttendance] = await pool.query(`
        SELECT COUNT(*) as total FROM asistencias 
        WHERE alumnoId = ? AND MONTH(fecha) = MONTH(CURDATE())
      `, [user.id]);

      stats = {
        averageGrade: avgGrade[0].promedio ? avgGrade[0].promedio.toFixed(2) : 'N/A',
        recentGrades: recentGrades,
        monthAttendance: monthAttendance[0].total
      };
    }
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
  }

  res.render('dashboard', { stats });
});

/* ---------- ESTUDIANTES (Antes Alumnos) ---------- */
app.get('/estudiantes', ensureAuthenticated, async (req, res) => {
  try {
    // Verificar si existe la tabla estudiantes, si no, verificar alumnos
    let [estudiantes] = await pool.query('SELECT * FROM estudiantes');
    res.render('estudiantes', { estudiantes });
  } catch (err) {
    console.error('Error al obtener estudiantes:', err);
    // Si la tabla no existe, intentar usar alumnos o crearla
    if (err.code === 'ER_NO_SUCH_TABLE') {
      try {
        // Intentar leer de alumnos si existe
        const [alumnosRows] = await pool.query('SELECT * FROM alumnos');
        if (alumnosRows.length > 0) {
          // Si hay datos en alumnos, redirigir a actualizar DB
          console.log('Tabla alumnos encontrada, necesita actualización');
        }

        // Crear tabla estudiantes
        await pool.query(`
          CREATE TABLE IF NOT EXISTS estudiantes (
            id VARCHAR(50) PRIMARY KEY,
            nombre VARCHAR(200),
            dni VARCHAR(50)
          )
        `);
        res.render('estudiantes', { estudiantes: [] });
      } catch (createErr) {
        console.error('Error al crear tabla estudiantes:', createErr);
        res.status(500).render('error', {
          message: 'Error al inicializar la tabla de estudiantes. Por favor ejecuta: node update_db.js'
        });
      }
    } else {
      res.status(500).send('Error al cargar estudiantes: ' + err.message);
    }
  }
});
app.post('/estudiantes', ensureAuthenticated, ensureRole('admin'), async (req, res) => {
  const { nombre, dni } = req.body;
  await pool.query('INSERT INTO estudiantes (id,nombre,dni) VALUES (?,?,?)', [nanoid(), nombre, dni]);
  res.redirect('/estudiantes');
});
app.post('/estudiantes/:id/delete', ensureAuthenticated, ensureRole('admin'), async (req, res) => {
  await pool.query('DELETE FROM estudiantes WHERE id = ?', [req.params.id]);
  res.redirect('/estudiantes');
});
app.post('/estudiantes/:id/edit', ensureAuthenticated, ensureRole('admin'), async (req, res) => {
  const { nombre, dni } = req.body;
  await pool.query('UPDATE estudiantes SET nombre = ?, dni = ? WHERE id = ?', [nombre, dni, req.params.id]);
  res.redirect('/estudiantes');
});

/* ---------- PROFESORES ---------- */
app.get('/profesores', ensureAuthenticated, async (req, res) => {
  try {
    const [profesores] = await pool.query('SELECT * FROM profesores');
    res.render('profesores', { profesores });
  } catch (err) {
    console.error('Error al obtener profesores:', err);
    res.status(500).send('Error al cargar profesores: ' + err.message);
  }
});
app.post('/profesores', ensureAuthenticated, ensureRole('admin'), async (req, res) => {
  const { nombre, materia } = req.body;
  await pool.query('INSERT INTO profesores (id,nombre,materia) VALUES (?,?,?)', [nanoid(), nombre, materia]);
  res.redirect('/profesores');
});
app.post('/profesores/:id/delete', ensureAuthenticated, ensureRole('admin'), async (req, res) => {
  await pool.query('DELETE FROM profesores WHERE id = ?', [req.params.id]);
  res.redirect('/profesores');
});
app.post('/profesores/:id/edit', ensureAuthenticated, ensureRole('admin'), async (req, res) => {
  const { nombre, materia } = req.body;
  await pool.query('UPDATE profesores SET nombre = ?, materia = ? WHERE id = ?', [nombre, materia, req.params.id]);
  res.redirect('/profesores');
});

/* ---------- CALIFICACIONES ---------- */
app.get('/calificaciones', ensureAuthenticated, async (req, res) => {
  try {
    // Join con estudiantes y profesores
    const [calificaciones] = await pool.query(`
      SELECT c.*, e.nombre as estudiante_nombre, p.nombre as profesor_nombre
      FROM calificaciones c 
      LEFT JOIN estudiantes e ON c.alumnoId = e.id
      LEFT JOIN profesores p ON c.profesorId = p.id
    `);
    const [estudiantes] = await pool.query('SELECT * FROM estudiantes');
    const [profesores] = await pool.query('SELECT * FROM profesores');
    res.render('calificaciones', { calificaciones, estudiantes, profesores });
  } catch (err) {
    console.error('Error al obtener calificaciones:', err);
    res.status(500).send('Error al cargar calificaciones: ' + err.message);
  }
});
app.post('/calificaciones', ensureAuthenticated, ensureValidated, ensureRole('profesor'), async (req, res) => {
  const { alumnoId, nota, comentario, profesorId } = req.body;
  const user = req.session.user;
  
  // Si es profesor, buscar su ID en la tabla profesores por nombre
  let finalProfesorId = profesorId;
  let materia = '';
  
  if (user.role === 'profesor') {
    // Para profesores, buscar su ID en la tabla profesores por nombre
    if (!profesorId || profesorId === '') {
      let [pRows] = await pool.query('SELECT id, materia FROM profesores WHERE nombre = ?', [user.nombre]);
      if (pRows.length) {
        finalProfesorId = pRows[0].id;
        materia = pRows[0].materia || '';
      } else {
        // Si no existe el registro, crearlo automáticamente
        const nuevoProfesorId = nanoid();
        await pool.query('INSERT INTO profesores (id, nombre, materia) VALUES (?, ?, ?)', 
          [nuevoProfesorId, user.nombre, '']);
        finalProfesorId = nuevoProfesorId;
        materia = '';
      }
    } else {
      // Si proporcionó un profesorId, usarlo (por si seleccionó de la lista)
      const [pRows] = await pool.query('SELECT materia FROM profesores WHERE id = ?', [profesorId]);
      if (pRows.length) {
        materia = pRows[0].materia || '';
      } else {
        return res.status(400).send('El profesor seleccionado no existe.');
      }
    }
  } else if (user.role === 'admin' && profesorId) {
    // Para admin, debe proporcionar un profesorId
    const [pRows] = await pool.query('SELECT materia FROM profesores WHERE id = ?', [profesorId]);
    if (pRows.length) {
      materia = pRows[0].materia || '';
    } else {
      return res.status(400).send('El profesor seleccionado no existe.');
    }
  } else if (user.role === 'admin' && !profesorId) {
    return res.status(400).send('Debe seleccionar un profesor');
  }

  await pool.query('INSERT INTO calificaciones (id,alumnoId,nota,comentario,fecha,profesorId,materia) VALUES (?,?,?,?,?,?,?)',
    [nanoid(), alumnoId, Number(nota), comentario, new Date(), finalProfesorId, materia]);
  res.redirect('/calificaciones');
});
app.post('/calificaciones/:id/edit', ensureAuthenticated, ensureValidated, ensureRole('profesor'), async (req, res) => {
  const { nota, comentario } = req.body;
  await pool.query('UPDATE calificaciones SET nota = ?, comentario = ? WHERE id = ?', [Number(nota), comentario, req.params.id]);
  res.redirect('/calificaciones');
});
app.post('/calificaciones/:id/delete', ensureAuthenticated, ensureRole('admin'), async (req, res) => {
  await pool.query('DELETE FROM calificaciones WHERE id = ?', [req.params.id]);
  res.redirect('/calificaciones');
});

/* ---------- ASISTENCIAS ---------- */
app.get('/asistencias', ensureAuthenticated, async (req, res) => {
  try {
    const [asistencias] = await pool.query(`
      SELECT a.*, e.nombre as estudiante_nombre 
      FROM asistencias a 
      LEFT JOIN estudiantes e ON a.alumnoId = e.id
    `);
    const [estudiantes] = await pool.query('SELECT * FROM estudiantes');
    res.render('asistencias', { asistencias, estudiantes });
  } catch (err) {
    console.error('Error al obtener asistencias:', err);
    res.status(500).send('Error al cargar asistencias: ' + err.message);
  }
});
app.post('/asistencias', ensureAuthenticated, ensureValidated, ensureRole('profesor'), async (req, res) => {
  const { alumnoId, estado } = req.body;
  await pool.query('INSERT INTO asistencias (id,alumnoId,estado,fecha) VALUES (?,?,?,?)', [nanoid(), alumnoId, estado, new Date()]);
  res.redirect('/asistencias');
});

/* ---------- HISTORIAL ESTUDIANTE ---------- */
app.get('/estudiantes/:id/historial', ensureAuthenticated, async (req, res) => {
  const { id } = req.params;
  const [estudiante] = await pool.query('SELECT * FROM estudiantes WHERE id = ?', [id]);
  if (!estudiante.length) return res.redirect('/estudiantes');

  const [calificaciones] = await pool.query(`
    SELECT c.*, p.nombre as profesor_nombre 
    FROM calificaciones c 
    LEFT JOIN profesores p ON c.profesorId = p.id 
    WHERE c.alumnoId = ? ORDER BY c.fecha DESC`, [id]);

  const [asistencias] = await pool.query('SELECT * FROM asistencias WHERE alumnoId = ? ORDER BY fecha DESC', [id]);

  res.render('historial', { estudiante: estudiante[0], calificaciones, asistencias });
});

app.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
