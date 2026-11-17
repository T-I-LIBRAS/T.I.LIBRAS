const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const token = req.cookies && req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Não autenticado' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (erro) {
    return res.status(401).json({ message: 'Sessão inválida ou expirada' });
  }
}

// Igual a `autenticar`, mas não bloqueia a requisição se não houver sessão.
// Usado em GET /api/auth/session para retornar `null` em vez de erro 401.
function autenticarOpcional(req, res, next) {
  const token = req.cookies && req.cookies.token;
  if (!token) {
    req.userId = null;
    return next();
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
  } catch (erro) {
    req.userId = null;
  }
  next();
}

module.exports = { autenticar, autenticarOpcional };
