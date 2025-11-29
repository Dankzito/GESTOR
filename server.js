
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

// Register (Solo para alumnos)
app.get('/register', async (req, res) => {
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  const { nombre, email, password, role } = req.body;
  const selectedRole = role || 'alumno';
  
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) {
    return res.render('register', { error: 'Email ya registrado' });
  }
  
  const hashed = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();

  // Todos los usuarios no validados por defecto - el admin debe validarlos
  const validated = false;

  // Insertar usuario no validado
  try {
    await pool.query('INSERT INTO users (id,nombre,email,password,role,validated) VALUES (?,?,?,?,?,?)',
      [id, nombre, email, hashed, selectedRole, validated]);
  } catch (err) {
    console.error('Error al registrar usuario:', err);
    return res.render('register', { error: 'Error al crear la cuenta. Por favor intenta nuevamente.' });
  }

  // Auto login after register - pero mostrará mensaje de validación pendiente
  req.session.user = { id, nombre, role: selectedRole, email, validated };
  res.redirect('/dashboard');
});

/* ---------- ADMIN PANEL ---------- */
app.get('/admin', ensureAuthenticated, ensureRole('admin'), async (req, res) => {
  try {
    // Obtener usuarios con materia y año (cursoId ahora almacena el año como texto: 1°, 2°, etc.)
    let users = [];
    try {
      const [usersResult] = await pool.query(`
        SELECT u.*, m.nombre as materia_nombre, m.ano as materia_ano, u.cursoId as curso_nombre 
        FROM users u 
        LEFT JOIN materias m ON u.materiaId = m.id 
        ORDER BY u.created_at DESC
      `);
      users = Array.isArray(usersResult) ? usersResult : usersResult[0] || [];
    } catch (err) {
      // Si las tablas no existen, hacer consulta simple
      if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_FIELD_ERROR') {
        const [usersResult] = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        users = Array.isArray(usersResult) ? usersResult : usersResult[0] || [];
        // Agregar curso_nombre desde cursoId si existe
        users = users.map(u => ({
          ...u,
          curso_nombre: u.cursoId || null
        }));
      } else {
        throw err;
      }
    }

    // Obtener materias para los selectores
    const [materias] = await pool.query('SELECT * FROM materias ORDER BY nombre ASC').catch(() => [[]]);

    res.render('admin', { 
      users: users,
      materias: materias || []
    });
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
  const userId = req.params.id;

  try {
    // Validar usuario
    await pool.query('UPDATE users SET validated = TRUE WHERE id = ?', [userId]);
    res.redirect('/admin');
  } catch (err) {
    console.error('Error al validar usuario:', err);
    res.redirect('/admin');
  }
});

// Asignar año (curso) a alumno - ahora cursoId almacena el año (1°, 2°, etc.)
app.post('/admin/users/:id/assign-curso', ensureAuthenticated, ensureRole('admin'), async (req, res) => {
  const { cursoId } = req.body; // cursoId ahora es el año (1°, 2°, 3°, etc.)
  const userId = req.params.id;

  try {
    await pool.query('UPDATE users SET cursoId = ? WHERE id = ?', [cursoId || null, userId]).catch((err) => {
      // Si la columna cursoId no existe, crearla
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        return pool.query('ALTER TABLE users ADD COLUMN cursoId VARCHAR(10) NULL').then(() => {
          return pool.query('UPDATE users SET cursoId = ? WHERE id = ?', [cursoId || null, userId]);
        });
      }
      throw err;
    });
    res.redirect('/admin');
  } catch (err) {
    console.error('Error al asignar año:', err);
    res.redirect('/admin');
  }
});

// Asignar materia a profesor
app.post('/admin/users/:id/assign-materia', ensureAuthenticated, ensureRole('admin'), async (req, res) => {
  const { materiaId } = req.body;
  const userId = req.params.id;

  try {
    // Actualizar materiaId en la tabla users
    try {
      await pool.query('UPDATE users SET materiaId = ? WHERE id = ?', [materiaId || null, userId]);
    } catch (err) {
      // Si la columna materiaId no existe, intentar agregarla
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        await pool.query('ALTER TABLE users ADD COLUMN materiaId VARCHAR(50) NULL');
        await pool.query('UPDATE users SET materiaId = ? WHERE id = ?', [materiaId || null, userId]);
      } else {
        throw err;
      }
    }
    
    // También actualizar o crear registro en tabla profesores
    const [user] = await pool.query('SELECT nombre FROM users WHERE id = ?', [userId]);
    if (user.length > 0 && materiaId) {
      const [materia] = await pool.query('SELECT nombre FROM materias WHERE id = ?', [materiaId]).catch(() => [[]]);
      const materiaNombre = materia.length > 0 ? materia[0].nombre : null;
      
      if (materiaNombre) {
        // Buscar si existe registro en profesores por nombre o por userId
        const [profesor] = await pool.query('SELECT id FROM profesores WHERE nombre = ? OR id = ?', [user[0].nombre, userId]);
        if (profesor.length > 0) {
          await pool.query('UPDATE profesores SET materia = ? WHERE id = ?', [materiaNombre, profesor[0].id]);
        } else {
          await pool.query('INSERT INTO profesores (id, nombre, materia) VALUES (?, ?, ?)', 
            [userId, user[0].nombre, materiaNombre]);
        }
      }
    } else if (user.length > 0 && !materiaId) {
      // Si se elimina la materia, también actualizar la tabla profesores
      const [profesor] = await pool.query('SELECT id FROM profesores WHERE nombre = ? OR id = ?', [user[0].nombre, userId]);
      if (profesor.length > 0) {
        await pool.query('UPDATE profesores SET materia = NULL WHERE id = ?', [profesor[0].id]);
      }
    }
    
    res.redirect('/admin');
  } catch (err) {
    console.error('Error al asignar materia:', err);
    res.redirect('/admin');
  }
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

/* ---------- ESTUDIANTES ---------- */
app.get('/estudiantes', ensureAuthenticated, async (req, res) => {
  try {
    const user = req.session.user;
    let estudiantes = [];
    
    if (user.role === 'profesor') {
      // Profesores solo ven estudiantes del mismo año que sus materias
      try {
        // Obtener los años (ano) de las materias que tiene el profesor
        // Intentar usar ano, si no existe usar descripcion
        let [materiasProfesor] = await pool.query(`
          SELECT DISTINCT m.ano 
          FROM materias m
          INNER JOIN users u ON m.id = u.materiaId
          WHERE u.id = ? AND u.role = 'profesor' AND m.ano IS NOT NULL
        `, [user.id]).catch(() => {
          // Si falla, intentar con descripcion
          return pool.query(`
            SELECT DISTINCT m.descripcion as ano 
            FROM materias m
            INNER JOIN users u ON m.id = u.materiaId
            WHERE u.id = ? AND u.role = 'profesor' AND m.descripcion IS NOT NULL
          `, [user.id]);
        });
        
        const anos = materiasProfesor.map(m => m.ano || m.descripcion).filter(a => a);
        
        if (anos.length > 0) {
          const placeholders = anos.map(() => '?').join(',');
          const [estudiantesResult] = await pool.query(`
            SELECT u.id, u.nombre, u.email, u.validated, u.cursoId as curso_nombre, u.created_at
            FROM users u
            WHERE u.role = 'alumno' AND u.validated = TRUE AND u.cursoId IN (${placeholders})
            ORDER BY u.nombre ASC
          `, anos);
          estudiantes = estudiantesResult || [];
        } else {
          estudiantes = [];
        }
      } catch (err) {
        console.error('Error al obtener materias del profesor:', err);
        estudiantes = [];
      }
    } else {
      // Admin ve todos los estudiantes
      const [estudiantesResult] = await pool.query(`
        SELECT u.id, u.nombre, u.email, u.validated, u.cursoId as curso_nombre, u.created_at
        FROM users u
        WHERE u.role = 'alumno'
        ORDER BY u.nombre ASC
      `);
      estudiantes = estudiantesResult;
    }
    
    res.render('estudiantes', { estudiantes: estudiantes || [] });
  } catch (err) {
    console.error('Error al obtener estudiantes:', err);
    res.status(500).send('Error al cargar estudiantes: ' + err.message);
  }
});

/* ---------- MATERIAS ---------- */
app.get('/materias', ensureAuthenticated, ensureRole('admin'), async (req, res) => {
  try {
    const [materias] = await pool.query('SELECT * FROM materias ORDER BY nombre ASC');
    res.render('materias', { materias });
  } catch (err) {
    console.error('Error al obtener materias:', err);
    // Si la tabla no existe, crear estructura básica con columna 'ano'
    if (err.code === 'ER_NO_SUCH_TABLE') {
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS materias (
            id VARCHAR(50) PRIMARY KEY,
            nombre VARCHAR(200) NOT NULL,
            ano VARCHAR(10),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);
        res.render('materias', { materias: [] });
      } catch (createErr) {
        console.error('Error al crear tabla materias:', createErr);
        res.status(500).send('Error al inicializar la tabla de materias. Por favor ejecuta: sql/add_materias.sql');
      }
    } else {
      res.status(500).send('Error al cargar materias: ' + err.message);
    }
  }
});

app.post('/materias', ensureAuthenticated, ensureRole('admin'), async (req, res) => {
  const { nombre, ano } = req.body;
  
  // Intentar usar la columna 'ano', si no existe usar 'descripcion' como fallback
  try {
    await pool.query('INSERT INTO materias (id, nombre, ano) VALUES (?, ?, ?)', 
      [nanoid(), nombre, ano || null]);
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      // Si la columna ano no existe, usar descripcion
      await pool.query('INSERT INTO materias (id, nombre, descripcion) VALUES (?, ?, ?)', 
        [nanoid(), nombre, ano || null]);
    } else {
      throw err;
    }
  }
  res.redirect('/materias');
});

app.post('/materias/:id/edit', ensureAuthenticated, ensureRole('admin'), async (req, res) => {
  const { nombre, ano } = req.body;
  
  // Intentar usar la columna 'ano', si no existe usar 'descripcion' como fallback
  try {
    await pool.query('UPDATE materias SET nombre = ?, ano = ? WHERE id = ?', 
      [nombre, ano || null, req.params.id]);
  } catch (err) {
    if (err.code === 'ER_BAD_FIELD_ERROR') {
      // Si la columna ano no existe, usar descripcion
      await pool.query('UPDATE materias SET nombre = ?, descripcion = ? WHERE id = ?', 
        [nombre, ano || null, req.params.id]);
    } else {
      throw err;
    }
  }
  res.redirect('/materias');
});

app.post('/materias/:id/delete', ensureAuthenticated, ensureRole('admin'), async (req, res) => {
  await pool.query('DELETE FROM materias WHERE id = ?', [req.params.id]);
  res.redirect('/materias');
});

/* ---------- PROFESORES ---------- */
app.get('/profesores', ensureAuthenticated, async (req, res) => {
  try {
    // Mostrar solo usuarios registrados con rol profesor
    const [profesores] = await pool.query(`
      SELECT u.id, u.nombre, u.email, u.validated, m.nombre as materia_nombre, u.created_at
      FROM users u
      LEFT JOIN materias m ON u.materiaId = m.id
      WHERE u.role = 'profesor'
      ORDER BY u.nombre ASC
    `);
    res.render('profesores', { profesores: profesores || [] });
  } catch (err) {
    console.error('Error al obtener profesores:', err);
    // Si la columna materiaId no existe, hacer consulta simple
    try {
      const [profesores] = await pool.query(`
        SELECT id, nombre, email, validated, created_at
        FROM users
        WHERE role = 'profesor'
        ORDER BY nombre ASC
      `);
      res.render('profesores', { profesores: profesores || [] });
    } catch (err2) {
      res.status(500).send('Error al cargar profesores: ' + err2.message);
    }
  }
});

/* ---------- CALIFICACIONES ---------- */
app.get('/calificaciones', ensureAuthenticated, async (req, res) => {
  try {
    const user = req.session.user;
    let calificaciones = [];
    let estudiantes = [];
    let profesores = [];

    if (user.role === 'alumno') {
      // Alumnos solo ven sus propias calificaciones
      const [calificacionesResult] = await pool.query(`
        SELECT c.*, u.nombre as estudiante_nombre, p.nombre as profesor_nombre
        FROM calificaciones c 
        LEFT JOIN users u ON c.alumnoId = u.id
        LEFT JOIN profesores p ON c.profesorId = p.id
        WHERE c.alumnoId = ?
        ORDER BY c.fecha DESC
      `, [user.id]);
      calificaciones = calificacionesResult;
    } else if (user.role === 'profesor') {
      // Profesores ven solo calificaciones de sus alumnos (mismo año)
      try {
        // Obtener los años (ano) de las materias que tiene el profesor
        // Intentar usar ano, si no existe usar descripcion
        let [materiasProfesor] = await pool.query(`
          SELECT DISTINCT m.ano 
          FROM materias m
          INNER JOIN users u ON m.id = u.materiaId
          WHERE u.id = ? AND u.role = 'profesor' AND m.ano IS NOT NULL
        `, [user.id]).catch(() => {
          // Si falla, intentar con descripcion
          return pool.query(`
            SELECT DISTINCT m.descripcion as ano 
            FROM materias m
            INNER JOIN users u ON m.id = u.materiaId
            WHERE u.id = ? AND u.role = 'profesor' AND m.descripcion IS NOT NULL
          `, [user.id]);
        });
        
        const anos = materiasProfesor.map(m => m.ano || m.descripcion).filter(a => a);
        
        if (anos.length > 0) {
          const placeholders = anos.map(() => '?').join(',');
          const [calificacionesResult] = await pool.query(`
            SELECT c.*, u.nombre as estudiante_nombre, p.nombre as profesor_nombre
            FROM calificaciones c 
            LEFT JOIN users u ON c.alumnoId = u.id
            LEFT JOIN profesores p ON c.profesorId = p.id
            WHERE u.cursoId IN (${placeholders})
            ORDER BY c.fecha DESC
          `, anos);
          calificaciones = calificacionesResult || [];

          // Obtener estudiantes del mismo año
          const [estudiantesResult] = await pool.query(`
            SELECT id, nombre, email 
            FROM users 
            WHERE role = 'alumno' AND validated = TRUE AND cursoId IN (${placeholders})
            ORDER BY nombre ASC
          `, anos);
          estudiantes = estudiantesResult || [];
        }
      } catch (err) {
        console.error('Error al obtener materias del profesor:', err);
        // Si falla, dejar arrays vacíos
        calificaciones = [];
        estudiantes = [];
      }

      // Obtener profesores (tabla profesores)
      try {
        const [profesoresResult] = await pool.query('SELECT * FROM profesores ORDER BY nombre ASC');
        profesores = profesoresResult || [];
      } catch (err) {
        profesores = [];
      }
    } else {
      // Admin ve todas las calificaciones
      const [calificacionesResult] = await pool.query(`
        SELECT c.*, u.nombre as estudiante_nombre, p.nombre as profesor_nombre
        FROM calificaciones c 
        LEFT JOIN users u ON c.alumnoId = u.id
        LEFT JOIN profesores p ON c.profesorId = p.id
        ORDER BY c.fecha DESC
      `);
      calificaciones = calificacionesResult;

      // Obtener estudiantes (usuarios con rol alumno validados)
      const [estudiantesResult] = await pool.query(`
        SELECT id, nombre, email 
        FROM users 
        WHERE role = 'alumno' AND validated = TRUE
        ORDER BY nombre ASC
      `);
      estudiantes = estudiantesResult;

      // Obtener profesores (usuarios con rol profesor o tabla profesores)
      const [profesoresResult] = await pool.query('SELECT * FROM profesores ORDER BY nombre ASC');
      profesores = profesoresResult;
    }

    res.render('calificaciones', { calificaciones, estudiantes, profesores });
  } catch (err) {
    console.error('Error al obtener calificaciones:', err);
    res.status(500).send('Error al cargar calificaciones: ' + err.message);
  }
});
app.post('/calificaciones', ensureAuthenticated, ensureValidated, ensureRole('profesor'), async (req, res) => {
  const { alumnoId, nota, comentario, profesorId } = req.body;
  const user = req.session.user;
  
  // Verificar que el alumnoId corresponde a un usuario con rol alumno validado
  const [alumno] = await pool.query('SELECT id, cursoId FROM users WHERE id = ? AND role = ? AND validated = TRUE', [alumnoId, 'alumno']);
  if (alumno.length === 0) {
    return res.status(400).send('Estudiante no válido o no validado');
  }
  
  // Si es profesor, verificar que el alumno esté en el mismo año que sus materias
  if (user.role === 'profesor') {
    try {
      // Obtener los años (ano) de las materias del profesor
      // Intentar usar ano, si no existe usar descripcion
      let [materiasProfesor] = await pool.query(`
        SELECT DISTINCT m.ano 
        FROM materias m
        INNER JOIN users u ON m.id = u.materiaId
        WHERE u.id = ? AND u.role = 'profesor' AND m.ano IS NOT NULL
      `, [user.id]).catch(() => {
        // Si falla, intentar con descripcion
        return pool.query(`
          SELECT DISTINCT m.descripcion as ano 
          FROM materias m
          INNER JOIN users u ON m.id = u.materiaId
          WHERE u.id = ? AND u.role = 'profesor' AND m.descripcion IS NOT NULL
        `, [user.id]);
      });
      
      const anosProfesor = materiasProfesor.map(m => m.ano || m.descripcion).filter(a => a);
      
      // Verificar que el alumno esté en uno de esos años
      if (anosProfesor.length === 0 || !alumno[0].cursoId || !anosProfesor.includes(alumno[0].cursoId)) {
        return res.status(403).send('No puedes calificar a este estudiante. Debe estar en un año donde tengas una materia asignada.');
      }
    } catch (err) {
      console.error('Error al validar materia del profesor:', err);
      return res.status(403).send('No puedes calificar a este estudiante. Error al verificar tus materias asignadas.');
    }
  }
  
  let finalProfesorId = profesorId;
  let materia = '';
  
  if (user.role === 'profesor') {
    // Para profesores, usar su propio ID o buscar en la tabla profesores
    finalProfesorId = user.id;
    
    // Buscar materia del profesor desde users o profesores
    const [userMateria] = await pool.query('SELECT materiaId FROM users WHERE id = ?', [user.id]);
    if (userMateria.length > 0 && userMateria[0].materiaId) {
      const [materiaRow] = await pool.query('SELECT nombre FROM materias WHERE id = ?', [userMateria[0].materiaId]);
      materia = materiaRow.length > 0 ? materiaRow[0].nombre : '';
    }
    
    // También buscar en tabla profesores como fallback
    if (!materia) {
      const [pRows] = await pool.query('SELECT materia FROM profesores WHERE nombre = ? OR id = ?', [user.nombre, user.id]);
      if (pRows.length > 0) {
        materia = pRows[0].materia || '';
      }
    }
    
    // Crear o actualizar registro en profesores si no existe
    const [profesorExists] = await pool.query('SELECT id FROM profesores WHERE id = ? OR nombre = ?', [user.id, user.nombre]);
    if (profesorExists.length === 0) {
      await pool.query('INSERT INTO profesores (id, nombre, materia) VALUES (?, ?, ?)', 
        [user.id, user.nombre, materia]);
    } else {
      await pool.query('UPDATE profesores SET materia = ? WHERE id = ?', [materia, profesorExists[0].id]);
    }
    finalProfesorId = profesorExists.length > 0 ? profesorExists[0].id : user.id;
    
  } else if (user.role === 'admin' && profesorId) {
    // Para admin, usar el profesorId proporcionado
    const [pRows] = await pool.query('SELECT materia FROM profesores WHERE id = ?', [profesorId]);
    if (pRows.length > 0) {
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
    const user = req.session.user;
    let asistencias = [];
    let estudiantes = [];

    if (user.role === 'alumno') {
      // Alumnos solo ven sus propias asistencias
      const [asistenciasResult] = await pool.query(`
        SELECT a.*, u.nombre as estudiante_nombre 
        FROM asistencias a 
        LEFT JOIN users u ON a.alumnoId = u.id
        WHERE a.alumnoId = ?
        ORDER BY a.fecha DESC
      `, [user.id]);
      asistencias = asistenciasResult;
    } else if (user.role === 'profesor') {
      // Profesores ven solo asistencias de estudiantes de sus años
      try {
        // Obtener los años (ano) de las materias que tiene el profesor
        // Intentar usar ano, si no existe usar descripcion
        let [materiasProfesor] = await pool.query(`
          SELECT DISTINCT m.ano 
          FROM materias m
          INNER JOIN users u ON m.id = u.materiaId
          WHERE u.id = ? AND u.role = 'profesor' AND m.ano IS NOT NULL
        `, [user.id]).catch(() => {
          // Si falla, intentar con descripcion
          return pool.query(`
            SELECT DISTINCT m.descripcion as ano 
            FROM materias m
            INNER JOIN users u ON m.id = u.materiaId
            WHERE u.id = ? AND u.role = 'profesor' AND m.descripcion IS NOT NULL
          `, [user.id]);
        });
        
        const anos = materiasProfesor.map(m => m.ano || m.descripcion).filter(a => a);
        
        if (anos.length > 0) {
          const placeholders = anos.map(() => '?').join(',');
          const [asistenciasResult] = await pool.query(`
            SELECT DISTINCT a.*, u.nombre as estudiante_nombre 
            FROM asistencias a 
            LEFT JOIN users u ON a.alumnoId = u.id
            WHERE u.cursoId IN (${placeholders})
            ORDER BY a.fecha DESC
          `, anos);
          asistencias = asistenciasResult || [];
          
          // Obtener estudiantes del mismo año
          const [estudiantesResult] = await pool.query(`
            SELECT id, nombre, email 
            FROM users 
            WHERE role = 'alumno' AND validated = TRUE AND cursoId IN (${placeholders})
            ORDER BY nombre ASC
          `, anos);
          estudiantes = estudiantesResult || [];
        }
      } catch (err) {
        console.error('Error al obtener materias del profesor:', err);
        // Si falla, dejar arrays vacíos
        asistencias = [];
        estudiantes = [];
      }
    } else if (user.role === 'admin') {
      // Admin ve todas las asistencias
      const [asistenciasResult] = await pool.query(`
        SELECT a.*, u.nombre as estudiante_nombre 
        FROM asistencias a 
        LEFT JOIN users u ON a.alumnoId = u.id
        ORDER BY a.fecha DESC
      `);
      asistencias = asistenciasResult;
      
      // Obtener estudiantes (usuarios con rol alumno)
      const [estudiantesResult] = await pool.query(`
        SELECT id, nombre, email 
        FROM users 
        WHERE role = 'alumno' AND validated = TRUE
        ORDER BY nombre ASC
      `);
      estudiantes = estudiantesResult;
    }

    res.render('asistencias', { asistencias, estudiantes });
  } catch (err) {
    console.error('Error al obtener asistencias:', err);
    res.status(500).send('Error al cargar asistencias: ' + err.message);
  }
});
app.post('/asistencias', ensureAuthenticated, ensureValidated, ensureRole('profesor'), async (req, res) => {
  const { alumnoId, estado } = req.body;
  const user = req.session.user;
  
  // Verificar que el alumnoId corresponde a un usuario con rol alumno validado
  const [alumno] = await pool.query('SELECT id, cursoId FROM users WHERE id = ? AND role = ? AND validated = TRUE', [alumnoId, 'alumno']);
  if (alumno.length === 0) {
    return res.status(400).send('Estudiante no válido o no validado');
  }
  
  // Si es profesor, verificar que el alumno esté en el mismo año que sus materias
  if (user.role === 'profesor') {
    try {
      // Obtener los años (ano) de las materias del profesor
      // Intentar usar ano, si no existe usar descripcion
      let [materiasProfesor] = await pool.query(`
        SELECT DISTINCT m.ano 
        FROM materias m
        INNER JOIN users u ON m.id = u.materiaId
        WHERE u.id = ? AND u.role = 'profesor' AND m.ano IS NOT NULL
      `, [user.id]).catch(() => {
        // Si falla, intentar con descripcion
        return pool.query(`
          SELECT DISTINCT m.descripcion as ano 
          FROM materias m
          INNER JOIN users u ON m.id = u.materiaId
          WHERE u.id = ? AND u.role = 'profesor' AND m.descripcion IS NOT NULL
        `, [user.id]);
      });
      
      const anosProfesor = materiasProfesor.map(m => m.ano || m.descripcion).filter(a => a);
      
      // Verificar que el alumno esté en uno de esos años
      if (anosProfesor.length === 0 || !alumno[0].cursoId || !anosProfesor.includes(alumno[0].cursoId)) {
        return res.status(403).send('No puedes registrar asistencia de este estudiante. Debe estar en un año donde tengas una materia asignada.');
      }
    } catch (err) {
      console.error('Error al validar materia del profesor:', err);
      return res.status(403).send('No puedes registrar asistencia de este estudiante. Error al verificar tus materias asignadas.');
    }
  }
  
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
