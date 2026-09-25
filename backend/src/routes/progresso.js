const express = require('express');
const pool = require('../db');
const { autenticar } = require('../middleware/auth');

const router = express.Router();

function progressoVazio() {
  return {
    sinais_vistos: [],
    termos_favoritos: [],
    quizzes_concluidos: [],
    pontuacoes: {}
  };
}

router.get('/', autenticar, async (req, res) => {
  try {
    const [linhas] = await pool.query(
      `SELECT sinais_vistos, termos_favoritos, quizzes_concluidos, pontuacoes
       FROM progresso_usuario WHERE user_id = ?`,
      [req.userId]
    );

    if (linhas.length === 0) {
      return res.json(progressoVazio());
    }

    const registro = linhas[0];
    return res.json({
      sinais_vistos: registro.sinais_vistos,
      termos_favoritos: registro.termos_favoritos,
      quizzes_concluidos: registro.quizzes_concluidos,
      pontuacoes: registro.pontuacoes
    });
  } catch (erro) {
    console.error('[progresso/get]', erro);
    return res.status(500).json({ message: 'Erro ao carregar progresso' });
  }
});

router.put('/', autenticar, async (req, res) => {
  const base = progressoVazio();
  const corpo = req.body || {};

  const sinais_vistos = Array.isArray(corpo.sinais_vistos) ? corpo.sinais_vistos : base.sinais_vistos;
  const termos_favoritos = Array.isArray(corpo.termos_favoritos) ? corpo.termos_favoritos : base.termos_favoritos;
  const quizzes_concluidos = Array.isArray(corpo.quizzes_concluidos) ? corpo.quizzes_concluidos : base.quizzes_concluidos;
  const pontuacoes = corpo.pontuacoes && typeof corpo.pontuacoes === 'object' ? corpo.pontuacoes : base.pontuacoes;

  try {
    await pool.query(
      `INSERT INTO progresso_usuario (user_id, sinais_vistos, termos_favoritos, quizzes_concluidos, pontuacoes)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         sinais_vistos = VALUES(sinais_vistos),
         termos_favoritos = VALUES(termos_favoritos),
         quizzes_concluidos = VALUES(quizzes_concluidos),
         pontuacoes = VALUES(pontuacoes)`,
      [
        req.userId,
        JSON.stringify(sinais_vistos),
        JSON.stringify(termos_favoritos),
        JSON.stringify(quizzes_concluidos),
        JSON.stringify(pontuacoes)
      ]
    );

    return res.json({ ok: true });
  } catch (erro) {
    console.error('[progresso/put]', erro);
    return res.status(500).json({ message: 'Erro ao salvar progresso' });
  }
});

module.exports = router;
