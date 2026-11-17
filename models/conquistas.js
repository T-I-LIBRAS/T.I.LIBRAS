const pool = require('../config/database');
const Progresso = require('./progresso');

// Catálogo das conquistas. Para criar outra, basta incluir um item aqui:
//   campo -> qual lista do progresso é contada (sinais_vistos, termos_favoritos ou quizzes_concluidos)
//   meta  -> quantos itens DISTINTOS dessa lista são necessários
const CATALOGO = [
  {
    codigo: 'primeiros_sinais',
    nome: 'Primeiros sinais',
    descricao: 'Abra um sinal no sinalário.',
    requisito: 'Visualizar 1 sinal',
    icone: 'fa-hand',
    campo: 'sinais_vistos',
    meta: 1
  },
  {
    codigo: 'colecionador',
    nome: 'Colecionador',
    descricao: 'Salve termos nos favoritos.',
    requisito: 'Favoritar 10 termos',
    icone: 'fa-star',
    campo: 'termos_favoritos',
    meta: 10
  },
  {
    codigo: 'primeiro_desafio',
    nome: 'Primeiro desafio',
    descricao: 'Finalize um quiz de qualquer categoria.',
    requisito: 'Concluir 1 quiz',
    icone: 'fa-trophy',
    campo: 'quizzes_concluidos',
    meta: 1
  },
  {
    codigo: 'especialista_ti',
    nome: 'Especialista em TI',
    descricao: 'Conheça vários sinais do sinalário.',
    requisito: 'Visualizar 50 sinais',
    icone: 'fa-award',
    campo: 'sinais_vistos',
    meta: 50
  }
];

// Conta itens DISTINTOS (texto não vazio). Repetições e valores inválidos não contam.
function contarDistintos(lista) {
  if (!Array.isArray(lista)) return 0;
  const itens = lista.filter((valor) => typeof valor === 'string' && valor.trim() !== '');
  return new Set(itens).size;
}

// Quais conquistas o progresso informado cumpre (não grava nada).
function avaliar(progresso) {
  const dados = progresso || {};
  return CATALOGO.map((conquista) => {
    const atual = contarDistintos(dados[conquista.campo]);
    return { ...conquista, atual, cumprida: atual >= conquista.meta };
  });
}

const Conquistas = {
  catalogo: CATALOGO,
  avaliar,

  // Registra as conquistas que o progresso já cumpre. Pode ser chamado quantas vezes
  // quiser: a chave única do banco + INSERT IGNORE evitam duplicidade, mesmo com
  // requisições simultâneas. Devolve só as conquistas NOVAS (affectedRows === 1).
  async sincronizar(userId, progresso) {
    const dados = progresso || await Progresso.findByUserId(userId);
    const novas = [];

    for (const conquista of avaliar(dados).filter((item) => item.cumprida)) {
      const [resultado] = await pool.query(
        'INSERT IGNORE INTO conquistas_usuario (user_id, codigo_conquista) VALUES (?, ?)',
        [userId, conquista.codigo]
      );
      if (resultado && resultado.affectedRows === 1) {
        novas.push({ codigo: conquista.codigo, nome: conquista.nome });
      }
    }

    return novas;
  },

  // Lista as conquistas do usuário (registrando antes as que estiverem pendentes).
  async listar(userId) {
    const progresso = await Progresso.findByUserId(userId);
    const novas = await this.sincronizar(userId, progresso);

    const [linhas] = await pool.query(
      'SELECT codigo_conquista, desbloqueada_em FROM conquistas_usuario WHERE user_id = ?',
      [userId]
    );
    const desbloqueios = new Map(linhas.map((l) => [l.codigo_conquista, l.desbloqueada_em]));

    const conquistas = avaliar(progresso).map((item) => {
      const desbloqueada = desbloqueios.has(item.codigo);
      return {
        codigo: item.codigo,
        nome: item.nome,
        descricao: item.descricao,
        requisito: item.requisito,
        icone: item.icone,
        meta: item.meta,
        atual: desbloqueada ? item.meta : Math.min(item.atual, item.meta),
        desbloqueada,
        desbloqueada_em: desbloqueada ? desbloqueios.get(item.codigo) : null
      };
    });

    return {
      conquistas,
      total: conquistas.length,
      desbloqueadas: conquistas.filter((c) => c.desbloqueada).length,
      novas
    };
  }
};

module.exports = Conquistas;
