
function ensureAuthenticated(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect('/login');
}

function ensureRole(role) {
  return (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === role) return next();
    if (req.session && req.session.user && req.session.user.role === 'admin') return next();
    return res.status(403).send('Acceso denegado');
  };
}

module.exports = { ensureAuthenticated, ensureRole };
