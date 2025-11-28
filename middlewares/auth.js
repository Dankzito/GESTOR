
function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/');
}

function ensureRole(role) {
  return (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === role) return next();
    if (req.session && req.session.user && req.session.user.role === 'admin') return next();
    return res.status(403).send('Acceso denegado');
  };
}

function ensureValidated(req, res, next) {
  // Admin y alumnos siempre tienen acceso
  if (req.session && req.session.user) {
    const user = req.session.user;

    // Admin y alumnos pasan sin validación
    if (user.role === 'admin' || user.role === 'alumno') {
      return next();
    }

    // Profesores deben estar validados
    if (user.role === 'profesor') {
      if (user.validated === true || user.validated === 1) {
        return next();
      }
      // Profesor no validado - redirigir al dashboard con mensaje
      return res.status(403).render('pending-validation', {
        user: user,
        message: 'Tu cuenta está pendiente de validación por un administrador.'
      });
    }
  }

  return res.redirect('/');
}

module.exports = { ensureAuthenticated, ensureRole, ensureValidated };
