/* =========================================================================
   progresso.js — Persistência do progresso do usuário no Supabase
   -------------------------------------------------------------------------
   Todo o progresso do usuário (sinais vistos, termos favoritos, quizzes
   concluídos e pontuações) é lido e gravado na tabela `progresso_usuario`
   do Supabase, vinculado ao `user_id` (auth.users.id).

   Nenhum dado de progresso é armazenado em localStorage: a única fonte de
   verdade é a conta do usuário no banco de dados.

   Requer que js/supabase-config.js (window.supabaseClient) já tenha sido
   carregado e que js/auth.js esteja definindo window.currentUser.
   ========================================================================= */

const TABELA_PROGRESSO = 'progresso_usuario';

function progressoVazio() {
  return {
    sinais_vistos: [],
    termos_favoritos: [],
    quizzes_concluidos: [],
    pontuacoes: {}
  };
}

let dadosProgresso = progressoVazio();
let usuarioCarregado = null;
let salvandoProgresso = false;
let salvamentoPendente = false;
let timerSalvamento = null;

function clienteProgresso() {
  return window.supabaseClient || null;
}

function idDoUsuarioAtual() {
  if (window.currentUser && window.currentUser.uid) return window.currentUser.uid;
  return null;
}

async function resolverIdDoUsuario() {
  const idDireto = idDoUsuarioAtual();
  if (idDireto) return idDireto;

  const cliente = clienteProgresso();
  if (!cliente) return null;

  try {
    const { data } = await cliente.auth.getSession();
    const sessao = data ? data.session : null;
    return sessao && sessao.user ? sessao.user.id : null;
  } catch (erro) {
    return null;
  }
}

function normalizarRegistro(registro) {
  const base = progressoVazio();
  if (!registro) return base;

  return {
    sinais_vistos: Array.isArray(registro.sinais_vistos)
      ? registro.sinais_vistos.slice()
      : base.sinais_vistos,
    termos_favoritos: Array.isArray(registro.termos_favoritos)
      ? registro.termos_favoritos.slice()
      : base.termos_favoritos,
    quizzes_concluidos: Array.isArray(registro.quizzes_concluidos)
      ? registro.quizzes_concluidos.slice()
      : base.quizzes_concluidos,
    pontuacoes:
      registro.pontuacoes && typeof registro.pontuacoes === 'object'
        ? { ...registro.pontuacoes }
        : base.pontuacoes
  };
}

function limparProgressoEmMemoria() {
  dadosProgresso = progressoVazio();
  usuarioCarregado = null;
}

async function carregarProgresso(forcar) {
  const cliente = clienteProgresso();
  const uid = await resolverIdDoUsuario();

  if (!cliente || !uid) {
    limparProgressoEmMemoria();
    return dadosProgresso;
  }

  if (!forcar && usuarioCarregado === uid) return dadosProgresso;

  try {
    const { data, error } = await cliente
      .from(TABELA_PROGRESSO)
      .select('sinais_vistos, termos_favoritos, quizzes_concluidos, pontuacoes')
      .eq('user_id', uid)
      .maybeSingle();

    if (error) throw error;

    dadosProgresso = normalizarRegistro(data);
  } catch (erro) {
    console.error('[Progresso] Falha ao carregar dados do Supabase:', erro && erro.message ? erro.message : erro);
    dadosProgresso = progressoVazio();
  }

  usuarioCarregado = uid;
  window.dispatchEvent(new CustomEvent('progresso-carregado'));
  return dadosProgresso;
}

async function gravarProgresso() {
  const cliente = clienteProgresso();
  const uid = await resolverIdDoUsuario();

  if (!cliente || !uid) return false;

  if (salvandoProgresso) {
    salvamentoPendente = true;
    return false;
  }

  salvandoProgresso = true;

  let falhou = false;

  try {
    const { error } = await cliente.from(TABELA_PROGRESSO).upsert(
      {
        user_id: uid,
        sinais_vistos: dadosProgresso.sinais_vistos,
        termos_favoritos: dadosProgresso.termos_favoritos,
        quizzes_concluidos: dadosProgresso.quizzes_concluidos,
        pontuacoes: dadosProgresso.pontuacoes,
        atualizado_em: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    );

    if (error) throw error;
  } catch (erro) {
    falhou = true;
    console.error('[Progresso] Falha ao salvar dados no Supabase:', erro && erro.message ? erro.message : erro);
  }

  salvandoProgresso = false;

  if (salvamentoPendente) {
    salvamentoPendente = false;
    return gravarProgresso();
  }

  return !falhou;
}

function agendarGravacao() {
  if (timerSalvamento) clearTimeout(timerSalvamento);
  timerSalvamento = setTimeout(() => {
    timerSalvamento = null;
    gravarProgresso();
  }, 350);
}

/* ----------------------------- Sinais vistos ----------------------------- */

function sinaisVistos() {
  return dadosProgresso.sinais_vistos.slice();
}

function adicionarSinalVisto(termo) {
  if (!termo || dadosProgresso.sinais_vistos.includes(termo)) return false;
  dadosProgresso.sinais_vistos.push(termo);
  agendarGravacao();
  return true;
}

function removerSinalVisto(termo) {
  const antes = dadosProgresso.sinais_vistos.length;
  dadosProgresso.sinais_vistos = dadosProgresso.sinais_vistos.filter((item) => item !== termo);
  if (dadosProgresso.sinais_vistos.length !== antes) {
    agendarGravacao();
    return true;
  }
  return false;
}

/* --------------------------- Termos favoritos --------------------------- */

function favoritos() {
  return dadosProgresso.termos_favoritos.slice();
}

function ehFavorito(termo) {
  return dadosProgresso.termos_favoritos.includes(termo);
}

function alternarFavorito(termo) {
  if (!termo) return false;

  if (ehFavorito(termo)) {
    dadosProgresso.termos_favoritos = dadosProgresso.termos_favoritos.filter(
      (item) => item !== termo
    );
  } else {
    dadosProgresso.termos_favoritos.push(termo);
  }

  agendarGravacao();
  return ehFavorito(termo);
}

/* --------------------------- Quizzes concluídos -------------------------- */

function quizzesConcluidos() {
  return dadosProgresso.quizzes_concluidos.slice();
}

function quizConcluido(categoria) {
  return dadosProgresso.quizzes_concluidos.includes(categoria);
}

function concluirQuiz(categoria) {
  if (!categoria || quizConcluido(categoria)) return false;
  dadosProgresso.quizzes_concluidos.push(categoria);
  agendarGravacao();
  return true;
}

function limparQuizzesConcluidos() {
  dadosProgresso.quizzes_concluidos = [];
  agendarGravacao();
}

/* -------------------------------- Pontuações ----------------------------- */

function pontuacoes() {
  return { ...dadosProgresso.pontuacoes };
}

function pontuacaoDe(categoria) {
  return { ...(dadosProgresso.pontuacoes[categoria] || {}) };
}

/* Mescla os valores na pontuação da categoria sobrescrevendo as chaves
   informadas — ideal para guardar a última pontuação obtida. */
function registrarPontuacao(categoria, valores) {
  if (!categoria || !valores) return;

  const atual = dadosProgresso.pontuacoes[categoria] || {};
  dadosProgresso.pontuacoes[categoria] = {
    ...atual,
    ...valores,
    atualizado_em: new Date().toISOString()
  };
  agendarGravacao();
}

/* Soma valores numéricos aos já gravados — ideal para contadores. */
function incrementarPontuacao(categoria, valores) {
  if (!categoria || !valores) return;

  const atual = dadosProgresso.pontuacoes[categoria] || {};
  const somado = { ...atual };

  Object.keys(valores).forEach((chave) => {
    const valor = valores[chave];
    if (typeof valor === 'number') {
      somado[chave] = (typeof somado[chave] === 'number' ? somado[chave] : 0) + valor;
    } else {
      somado[chave] = valor;
    }
  });

  somado.atualizado_em = new Date().toISOString();
  dadosProgresso.pontuacoes[categoria] = somado;
  agendarGravacao();
}

function definirPontuacao(categoria, valores) {
  if (!categoria) return;
  dadosProgresso.pontuacoes[categoria] = {
    ...(valores || {}),
    atualizado_em: new Date().toISOString()
  };
  agendarGravacao();
}

/* --------------------------------- Eventos ------------------------------- */

window.addEventListener('auth-changed', async () => {
  const uid = idDoUsuarioAtual();

  if (!uid) {
    if (timerSalvamento) {
      clearTimeout(timerSalvamento);
      timerSalvamento = null;
    }
    limparProgressoEmMemoria();
    window.dispatchEvent(new CustomEvent('progresso-carregado'));
    return;
  }

  if (uid !== usuarioCarregado) await carregarProgresso(true);
});

window.Progresso = {
  TABELA: TABELA_PROGRESSO,
  carregar: carregarProgresso,
  salvar: gravarProgresso,
  vazio: progressoVazio,
  dados: () => normalizarRegistro(dadosProgresso),
  usuarioId: () => usuarioCarregado,
  sinaisVistos,
  adicionarSinalVisto,
  removerSinalVisto,
  favoritos,
  ehFavorito,
  alternarFavorito,
  quizzesConcluidos,
  quizConcluido,
  concluirQuiz,
  limparQuizzesConcluidos,
  pontuacoes,
  pontuacaoDe,
  registrarPontuacao,
  incrementarPontuacao,
  definirPontuacao
};
