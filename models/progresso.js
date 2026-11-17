const pool = require('../config/database');

// Modelo do progresso do usuário (tabela `progresso_usuario`, ver config/schema.sql).
const Progresso = {
  // Progresso de quem ainda não salvou nada.
  vazio() {
    return {
      sinais_vistos: [],
      termos_favoritos: [],
      quizzes_concluidos: [],
      pontuacoes: {}
    };
  },

  // Confere se o corpo enviado pelo front-end tem o formato esperado.
  isValid(corpo) {
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

    return !(listaInvalida || !pontuacoesValida);
  },

  async findByUserId(userId) {
    const [linhas] = await pool.query(
      `SELECT sinais_vistos, termos_favoritos, quizzes_concluidos, pontuacoes
       FROM progresso_usuario WHERE user_id = ?`,
      [userId]
    );

    if (linhas.length === 0) {
      return this.vazio();
    }

    const registro = linhas[0];
    return {
      sinais_vistos: registro.sinais_vistos,
      termos_favoritos: registro.termos_favoritos,
      quizzes_concluidos: registro.quizzes_concluidos,
      pontuacoes: registro.pontuacoes
    };
  },

  // Cria ou atualiza o progresso do usuário (um registro por usuário).
  async save(userId, { sinais_vistos, termos_favoritos, quizzes_concluidos, pontuacoes }) {
    await pool.query(
      `INSERT INTO progresso_usuario (user_id, sinais_vistos, termos_favoritos, quizzes_concluidos, pontuacoes)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         sinais_vistos = VALUES(sinais_vistos),
         termos_favoritos = VALUES(termos_favoritos),
         quizzes_concluidos = VALUES(quizzes_concluidos),
         pontuacoes = VALUES(pontuacoes)`,
      [
        userId,
        JSON.stringify(sinais_vistos),
        JSON.stringify(termos_favoritos),
        JSON.stringify(quizzes_concluidos),
        JSON.stringify(pontuacoes)
      ]
    );
  }
};

module.exports = Progresso;
