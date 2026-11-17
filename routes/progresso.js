const express = require('express');
const Progresso = require('../models/progresso');
const Conquistas = require('../models/conquistas');
const { autenticar } = require('../middlewares/auth');

const router = express.Router();

/* GET progresso do usuário logado */
router.get('/', autenticar, async (req, res) => {
  try {
    const progresso = await Progresso.findByUserId(req.userId);
    return res.json(progresso);
  } catch (erro) {
    console.error('[progresso/get]', erro);
    return res.status(500).json({ message: 'Erro ao carregar progresso' });
  }
});

/* PUT salva o progresso do usuário logado */
router.put('/', autenticar, async (req, res) => {
  const corpo = req.body || {};

  if (!Progresso.isValid(corpo)) {
    return res.status(400).json({ message: 'Formato de progresso inválido' });
  }

  try {
    await Progresso.save(req.userId, corpo);
  } catch (erro) {
    console.error('[progresso/put]', erro);
    return res.status(500).json({ message: 'Erro ao salvar progresso' });
  }

  // O progresso já está salvo. Se a checagem de conquistas falhar (ex.: tabela ainda não
  // criada), o salvamento continua valendo e a resposta segue como sucesso.
  let novasConquistas = [];
  try {
    novasConquistas = await Conquistas.sincronizar(req.userId, corpo);
  } catch (erro) {
    console.error('[progresso/put] conquistas', erro);
  }

  return res.json({ ok: true, novas_conquistas: novasConquistas });
});

module.exports = router;
