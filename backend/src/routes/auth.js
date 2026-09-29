const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { autenticarOpcional } = require('../middleware/auth');

const router = express.Router();
const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas tentativas. Tente novamente mais tarde.' }
});

const COOKIE_OPCOES_BASE = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production'
};

function opcoesCookie(lembrar = true) {
  return lembrar
    ? { ...COOKIE_OPCOES_BASE, maxAge: 7 * 24 * 60 * 60 * 1000 }
    : COOKIE_OPCOES_BASE;
}

function gerarToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

function paraUsuarioPublico(row) {
  return { uid: row.id, email: row.email, name: row.name };
}

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres' });
  }

  try {
    const [existentes] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existentes.length > 0) {
      return res.status(409).json({ message: 'Este e-mail já está cadastrado' });
    }

    const id = uuidv4();
    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
      [id, name, email, hash]
    );

    const token = gerarToken(id);
    res.cookie('token', token, opcoesCookie());
    return res.status(201).json({ user: { uid: id, email, name } });
  } catch (erro) {
    console.error('[auth/register]', erro);
    return res.status(500).json({ message: 'Erro ao criar conta' });
  }
});

router.post('/login', limitarLogin, async (req, res) => {
  const { email, password, lembrar } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios' });
  }

  try {
    const [linhas] = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      [email]
    );
    const usuario = linhas[0];

    if (!usuario) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos' });
    }

    const senhaConfere = await bcrypt.compare(password, usuario.password_hash);
    if (!senhaConfere) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos' });
    }

    const token = gerarToken(usuario.id);
    res.cookie('token', token, opcoesCookie(lembrar !== false));
    return res.json({ user: paraUsuarioPublico(usuario) });
  } catch (erro) {
    console.error('[auth/login]', erro);
    return res.status(500).json({ message: 'Erro ao entrar' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPCOES_BASE);
  return res.json({ ok: true });
});

router.get('/session', autenticarOpcional, async (req, res) => {
  if (!req.userId) {
    return res.json({ user: null });
  }

  try {
    const [linhas] = await pool.query(
      'SELECT id, name, email FROM users WHERE id = ?',
      [req.userId]
    );
    const usuario = linhas[0];
    if (!usuario) return res.json({ user: null });
    return res.json({ user: paraUsuarioPublico(usuario) });
  } catch (erro) {
    console.error('[auth/session]', erro);
    return res.status(500).json({ message: 'Erro ao obter sessão' });
  }
});

module.exports = router;
