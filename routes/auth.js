const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Users = require('../models/users');
const { autenticar, autenticarOpcional } = require('../middlewares/auth');

const router = express.Router();
const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas tentativas. Tente novamente mais tarde.' }
});

const limitarExclusao = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
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

/* POST cadastro */
router.post('/register', async (req, res) => {
  const { name, email, password, consentimento } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios' });
  }
  // LGPD: o cadastro só é feito com o aceite explícito dos Termos e da Política de Privacidade
  if (consentimento !== true) {
    return res.status(400).json({ message: 'É preciso aceitar os Termos de Uso e a Política de Privacidade' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'A senha deve ter pelo menos 6 caracteres' });
  }

  try {
    if (await Users.emailExists(email)) {
      return res.status(409).json({ message: 'Este e-mail já está cadastrado' });
    }

    const usuario = await Users.register({ name, email, password });

    const token = gerarToken(usuario.id);
    res.cookie('token', token, opcoesCookie());
    return res.status(201).json({ user: Users.toPublic(usuario) });
  } catch (erro) {
    console.error('[auth/register]', erro);
    return res.status(500).json({ message: 'Erro ao criar conta' });
  }
});

/* POST login */
router.post('/login', limitarLogin, async (req, res) => {
  const { email, password, lembrar } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios' });
  }

  try {
    const usuario = await Users.login(email, password);

    if (!usuario) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos' });
    }

    const token = gerarToken(usuario.id);
    res.cookie('token', token, opcoesCookie(lembrar !== false));
    return res.json({ user: Users.toPublic(usuario) });
  } catch (erro) {
    console.error('[auth/login]', erro);
    return res.status(500).json({ message: 'Erro ao entrar' });
  }
});

/* POST logout */
router.post('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPCOES_BASE);
  return res.json({ ok: true });
});

/* GET sessão atual (user: null quando não há login) */
router.get('/session', autenticarOpcional, async (req, res) => {
  if (!req.userId) {
    return res.json({ user: null });
  }

  try {
    const usuario = await Users.findById(req.userId);
    if (!usuario) return res.json({ user: null });
    return res.json({ user: Users.toPublic(usuario) });
  } catch (erro) {
    console.error('[auth/session]', erro);
    return res.status(500).json({ message: 'Erro ao obter sessão' });
  }
});

/* PUT edita os dados do próprio perfil (por enquanto, só o nome) */
router.put('/profile', autenticar, async (req, res) => {
  const { name } = req.body || {};
  const nome = typeof name === 'string' ? name.trim() : '';

  if (nome.length < 1 || nome.length > 150) {
    return res.status(400).json({ message: 'Informe um nome com até 150 caracteres' });
  }

  try {
    const usuario = await Users.updateName(req.userId, nome);
    if (!usuario) return res.status(404).json({ message: 'Usuário não encontrado' });
    return res.json({ user: Users.toPublic(usuario) });
  } catch (erro) {
    console.error('[auth/profile]', erro);
    return res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
});

/* DELETE exclui a conta do próprio usuário (LGPD: direito de eliminação).
   Exige a senha como confirmação. Apaga também o progresso e as conquistas (ON DELETE CASCADE). */
router.delete('/account', autenticar, limitarExclusao, async (req, res) => {
  const { password } = req.body || {};

  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ message: 'Informe sua senha para confirmar a exclusão' });
  }

  try {
    if (!(await Users.senhaConfere(req.userId, password))) {
      return res.status(401).json({ message: 'Senha incorreta' });
    }

    await Users.deleteAccount(req.userId);
    res.clearCookie('token', COOKIE_OPCOES_BASE);
    return res.json({ ok: true });
  } catch (erro) {
    console.error('[auth/account]', erro);
    return res.status(500).json({ message: 'Erro ao excluir a conta' });
  }
});

module.exports = router;
