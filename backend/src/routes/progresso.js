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
  const corpo = req.body || {};

  const listas = ['sinais_vistos', 'termos_favoritos', 'quizzes_concluidos'];
  const listaInvalida = listas.some((campo) => (
    !Array.isArray(corpo[campo]) ||
    corpo[campo].length > 500 ||
    corpo[campo].some((valor) => typeof valor !== 'string' || valor.length > 150)
  ));
  const pontuacoesValida = corpo.pontuacoes &&
    typeof corpo.pontuacoes === 'object' &&
    !Array.isArray(corpo.pontuacoes) &&
    Object.keys(corpo.pontuacoes).length <= 100;

  if (listaInvalida || !pontuacoesValida) {
    return res.status(400).json({ message: 'Formato de progresso inválido' });
  }

  const { sinais_vistos, termos_favoritos, quizzes_concluidos, pontuacoes } = corpo;

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
