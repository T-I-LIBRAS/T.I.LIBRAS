const express = require('express');
const Conquistas = require('../models/conquistas');
const { autenticar } = require('../middlewares/auth');

const router = express.Router();

/* GET conquistas do usuário logado.
   Também registra as que o progresso já cumpre (operação idempotente).
   O usuário vem sempre do cookie de sessão: não existe como consultar a conta de outra pessoa. */
router.get('/', autenticar, async (req, res) => {
  try {
    const resultado = await Conquistas.listar(req.userId);
    return res.json(resultado);
  } catch (erro) {
    console.error('[conquistas/get]', erro);
    return res.status(500).json({ message: 'Erro ao carregar conquistas' });
  }
});

module.exports = router;
