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
let carregamentoFalhou = false;
let salvandoProgresso = false;
let salvamentoPendente = false;
let timerSalvamento = null;
let consultaEmCurso = null;

function idDoUsuarioAtual() {
  if (window.currentUser && window.currentUser.uid) return window.currentUser.uid;
  return null;
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
  carregamentoFalhou = false;
}

async function carregarProgresso(forcar) {
  const uid = idDoUsuarioAtual();

  if (!uid) {
    limparProgressoEmMemoria();
    return dadosProgresso;
  }

  if (!forcar && usuarioCarregado === uid && !carregamentoFalhou) return dadosProgresso;

  if (consultaEmCurso && consultaEmCurso.uid === uid) return consultaEmCurso.promessa;
  const consulta = { uid };
  consultaEmCurso = consulta;
  consulta.promessa = (async () => {
    try {
      const registro = await window.apiFetch('/progresso');
      if (idDoUsuarioAtual() !== uid || consultaEmCurso !== consulta) return dadosProgresso;
      dadosProgresso = normalizarRegistro(registro);
      usuarioCarregado = uid;
      carregamentoFalhou = false;
    } catch (erro) {
      if (idDoUsuarioAtual() !== uid || consultaEmCurso !== consulta) return dadosProgresso;
      console.error('[Progresso] Falha ao carregar dados no backend:', erro);
      dadosProgresso = progressoVazio();
      usuarioCarregado = null;
      carregamentoFalhou = true;
    } finally {
      if (consultaEmCurso === consulta) consultaEmCurso = null;
    }
    window.dispatchEvent(new CustomEvent('progresso-carregado'));
    return dadosProgresso;
  })();
  return consulta.promessa;
}

let timerAvisoConquista = null;

// Aviso discreto ("Conquista desbloqueada: ..."), anunciado a leitores de tela (role="status").
function mostrarAvisoConquista(novas) {
  const nomes = novas.map((c) => c.nome);
  const texto = nomes.length === 1
    ? `Conquista desbloqueada: ${nomes[0]}`
    : `${nomes.length} conquistas desbloqueadas: ${nomes.join(', ')}`;

  let aviso = document.getElementById('avisoConquista');
  if (!aviso) {
    aviso = document.createElement('div');
    aviso.id = 'avisoConquista';
    aviso.className = 'aviso-conquista';
    aviso.setAttribute('role', 'status');
    aviso.setAttribute('aria-live', 'polite');
    document.body.appendChild(aviso);
  }

  aviso.textContent = texto;
  aviso.classList.add('visivel');
  if (timerAvisoConquista) clearTimeout(timerAvisoConquista);
  timerAvisoConquista = setTimeout(() => aviso.classList.remove('visivel'), 6000);
}

// O servidor confere as conquistas ao salvar e informa as novas em `novas_conquistas`.
function avisarConquistas(resposta) {
  const novas = resposta && Array.isArray(resposta.novas_conquistas) ? resposta.novas_conquistas : [];
  if (!novas.length) return;
  window.dispatchEvent(new CustomEvent('conquistas-desbloqueadas', { detail: { conquistas: novas } }));
  mostrarAvisoConquista(novas);
}

async function gravarProgresso() {
  const uid = idDoUsuarioAtual();
  if (!uid) return false;
  if (carregamentoFalhou || usuarioCarregado !== uid) return false;

  clearTimeout(timerSalvamento);
  timerSalvamento = null;

  if (salvandoProgresso) {
    salvamentoPendente = true;
    return false;
  }

  salvandoProgresso = true;
  let falhou = false;

  try {
    const resposta = await window.apiFetch('/progresso', {
      method: 'PUT',
      keepalive: true,
      body: JSON.stringify(dadosProgresso)
    });
    avisarConquistas(resposta);
  } catch (erro) {
    falhou = true;
    console.error('[Progresso] Falha ao salvar dados no backend:', erro && erro.message ? erro.message : erro);
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

function sinaisVistos() {
  return dadosProgresso.sinais_vistos.slice();
}

function adicionarSinalVisto(termo) {
  if (!termo || dadosProgresso.sinais_vistos.includes(termo)) return false;
  dadosProgresso.sinais_vistos.push(termo);
  registrarAtividadeDoDia();
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

function quizzesConcluidos() {
  return CATEGORIAS_DA_PROGRESSAO.filter(quizConcluido);
}

function quizConcluido(categoria) {
  return dadosProgresso.quizzes_concluidos.includes(categoria);
}

function concluirQuiz(categoria) {
  if (!categoria || quizConcluido(categoria)) return false;
  dadosProgresso.quizzes_concluidos.push(categoria);
  registrarAtividadeDoDia();
  agendarGravacao();
  return true;
}

function limparQuizzesConcluidos() {
  dadosProgresso.quizzes_concluidos = [];
  agendarGravacao();
}

function pontuacoes() {
  return { ...dadosProgresso.pontuacoes };
}

function pontuacaoDe(categoria) {
  return { ...(dadosProgresso.pontuacoes[categoria] || {}) };
}

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

// Última atividade (sinal visto ou quiz concluído). Fica guardada dentro de `pontuacoes`,
// numa chave reservada, então não precisa mudar o banco nem o servidor.
const CHAVE_ULTIMA_ATIVIDADE = '_ultima_atividade';

function registrarUltimaAtividade(tipo, rotulo) {
  if (!tipo || !rotulo) return;
  definirPontuacao(CHAVE_ULTIMA_ATIVIDADE, {
    tipo: tipo,
    rotulo: rotulo,
    data: new Date().toISOString()
  });
  registrarAtividadeDoDia();
}

// ------------------------------------------------------------------
// Ofensiva diária (streak), guardada no localStorage.
// Conta dias consecutivos de estudo/prática, voltando a zero quando
// o aluno passa um dia sem nenhuma atividade.
// ------------------------------------------------------------------
const CHAVE_OFENSIVA = 'ti-libras:ofensiva';
const LIMITE_DIAS_OFENSIVA = 180;

function chaveOfensiva() {
  const uid = idDoUsuarioAtual();
  return uid ? `${CHAVE_OFENSIVA}:${uid}` : CHAVE_OFENSIVA;
}

function diaLocalChave(data) {
  const d = data || new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0')
  ].join('-');
}

function lerOfensiva() {
  const base = { dias: [], recorde: 0 };
  try {
    const bruto = localStorage.getItem(chaveOfensiva());
    if (!bruto) return base;
    const salvo = JSON.parse(bruto);
    const dias = Array.isArray(salvo.dias)
      ? salvo.dias.filter((dia) => typeof dia === 'string')
      : [];
    const recorde = Number(salvo.recorde);
    return {
      dias,
      recorde: Number.isFinite(recorde) ? Math.max(0, Math.trunc(recorde)) : 0
    };
  } catch {
    return base;
  }
}

function salvarOfensiva(estado) {
  try {
    localStorage.setItem(chaveOfensiva(), JSON.stringify(estado));
  } catch { /* Sem armazenamento: a ofensiva vale só nesta sessão. */ }
}

// Conta os dias seguidos terminando hoje (ou ontem, se hoje ainda não houve atividade).
function calcularSequencia(dias) {
  const conjunto = new Set(dias);
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!conjunto.has(diaLocalChave(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!conjunto.has(diaLocalChave(cursor))) return 0;
  }

  let total = 0;
  while (conjunto.has(diaLocalChave(cursor))) {
    total += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return total;
}

function registrarAtividadeDoDia() {
  const hoje = diaLocalChave();
  const estado = lerOfensiva();

  if (!estado.dias.includes(hoje)) estado.dias.push(hoje);

  estado.dias = [...new Set(estado.dias)].sort().slice(-LIMITE_DIAS_OFENSIVA);
  estado.recorde = Math.max(estado.recorde || 0, calcularSequencia(estado.dias));

  salvarOfensiva(estado);
  window.dispatchEvent(new CustomEvent('ofensiva-atualizada'));
  return estado;
}

// Resumo pronto para a interface: total atual, recorde e a semana atual (D S T Q Q S S).
function resumoOfensiva() {
  const estado = lerOfensiva();
  const conjunto = new Set(estado.dias);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const hojeChave = diaLocalChave(hoje);
  const atual = calcularSequencia(estado.dias);
  const letras = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const diaDaSemana = hoje.getDay();

  const semana = letras.map((letra, indice) => {
    const dia = new Date(hoje);
    dia.setDate(dia.getDate() - diaDaSemana + indice);
    const chave = diaLocalChave(dia);
    return {
      letra,
      ativo: conjunto.has(chave),
      hoje: chave === hojeChave,
      data: chave
    };
  });

  return {
    atual,
    recorde: Math.max(estado.recorde || 0, atual),
    ativoHoje: conjunto.has(hojeChave),
    semana
  };
}

window.Ofensiva = {
  registrar: registrarAtividadeDoDia,
  resumo: resumoOfensiva,
  chave: chaveOfensiva
};

// Devolve { tipo: 'sinal' | 'quiz', rotulo, data } ou null.
// Também olha a data de conclusão dos quizzes antigos, que já existia antes deste recurso.
function ultimaAtividade() {
  const candidatas = [];
  const guardada = dadosProgresso.pontuacoes[CHAVE_ULTIMA_ATIVIDADE];
  if (guardada && guardada.tipo && guardada.rotulo && guardada.data) {
    candidatas.push({ tipo: guardada.tipo, rotulo: guardada.rotulo, data: guardada.data });
  }

  Object.keys(dadosProgresso.pontuacoes).forEach((chave) => {
    if (chave === CHAVE_ULTIMA_ATIVIDADE) return;
    const registro = dadosProgresso.pontuacoes[chave];
    if (registro && registro.ultima_conclusao) {
      candidatas.push({ tipo: 'quiz', rotulo: chave, data: registro.ultima_conclusao });
    }
  });

  let melhor = null;
  candidatas.forEach((item) => {
    const tempo = new Date(item.data).getTime();
    if (Number.isNaN(tempo)) return;
    if (!melhor || tempo > new Date(melhor.data).getTime()) melhor = item;
  });
  return melhor;
}

// Progresso geral = sinais vistos que existem no sinalário ÷ total de termos (0 a 100).
// Devolve null quando a lista de termos (/data/termos.js) não está carregada na página.
function percentualGeral() {
  if (typeof TERMOS === 'undefined' || !Array.isArray(TERMOS) || !TERMOS.length) return null;
  const nomes = new Set(TERMOS.map((t) => t.termo));
  const vistos = new Set(dadosProgresso.sinais_vistos.filter((nome) => nomes.has(nome)));
  return Math.min(100, Math.round((vistos.size / TERMOS.length) * 100));
}

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
  definirPontuacao,
  percentualGeral,
  registrarUltimaAtividade,
  ultimaAtividade,
  avisarConquistas
};
