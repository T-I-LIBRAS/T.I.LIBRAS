const PERIMETRO_DO_ANEL = 2 * Math.PI * 52;

const FORMAS_DAS_ALTERNATIVAS = [
  { classe: 'forma-a', letra: 'A' },
  { classe: 'forma-b', letra: 'B' },
  { classe: 'forma-c', letra: 'C' },
  { classe: 'forma-d', letra: 'D' }
];

let categoriaAtual = 'Hardware';
let perguntasAtivas = [];
let perguntaAtual = 0;
let respostasDaTentativa = [];
let perguntaRespondida = false;
let progressoPronto = false;

function termosDoProjeto() {
  return typeof TERMOS_LOCAIS !== 'undefined' && Array.isArray(TERMOS_LOCAIS) ? TERMOS_LOCAIS : [];
}

function termoPorNome(nome) {
  return termosDoProjeto().find((item) => item.termo === nome) || null;
}

function termosDaCategoria(categoria) {
  const todos = termosDoProjeto();
  if (categoria === 'Todos') return todos;
  return todos.filter((item) => item.categoria === categoria);
}

function totalDaCategoria(categoria) {
  return termosDaCategoria(categoria).length;
}

function progressoDisponivel() {
  return !!(window.Progresso && window.Progresso.quizzesConcluidos);
}

function obterQuizzesConcluidos() {
  return progressoDisponivel() ? window.Progresso.quizzesConcluidos() : [];
}

function lerPontuacao(categoria) {
  if (!progressoDisponivel() || typeof window.Progresso.pontuacaoDe !== 'function') return {};
  return window.Progresso.pontuacaoDe(categoria) || {};
}

function formatarResultado(resultado) {
  if (!resultado) return '--';
  const rotuloAcertos = resultado.acertos === 1 ? 'acerto' : 'acertos';
  const rotuloErros = resultado.erros === 1 ? 'erro' : 'erros';
  const placar = `${resultado.acertos} ${rotuloAcertos} · ${resultado.erros} ${rotuloErros}`;
  return resultado.semRegistro ? `${placar} · ${resultado.semRegistro} sem registro` : placar;
}

function resumoDaCategoria(categoria) {
  const total = totalDaCategoria(categoria);
  const registro = lerPontuacao(categoria);
  const concluido = obterQuizzesConcluidos().includes(categoria);

  let concluidas = Number(registro.melhor_progresso);
  if (!Number.isFinite(concluidas) || concluidas < 0) concluidas = 0;
  concluidas = Math.min(Math.round(concluidas), total);
  if (concluido && total > 0) concluidas = total;

  const porcentagem = total > 0 ? Math.round((concluidas / total) * 100) : 0;
  const acertosSalvos = Number(registro.ultima_pontuacao);
  const errosSalvos = Number(registro.ultimo_erros);
  const temResultado = registro.ultima_pontuacao !== undefined && Number.isFinite(acertosSalvos) && acertosSalvos >= 0;

  return {
    total,
    concluidas,
    porcentagem,
    concluido,
    emAndamento: !!registro.tentativa || (!concluido && concluidas > 0),
    ultimoResultado: temResultado
      ? {
          acertos: Math.round(acertosSalvos),
          erros: Number.isFinite(errosSalvos) && errosSalvos >= 0 ? Math.round(errosSalvos) : 0,
          semRegistro: Number(registro.questoes_sem_registro) || 0
        }
      : null
  };
}

function desenharAnel(categoria, resumo) {
  const anel = document.querySelector(`.donut[data-donut="${categoria}"]`);
  if (!anel) return;

  const valor = anel.querySelector('.donut-value');
  if (valor) {
    valor.style.strokeDasharray = String(PERIMETRO_DO_ANEL);
    valor.style.strokeDashoffset = String(PERIMETRO_DO_ANEL * (1 - resumo.porcentagem / 100));
  }

  anel.classList.toggle('is-completo', resumo.concluido);

  const centro = anel.querySelector('.donut-center');
  if (!centro) return;

  if (resumo.concluido) {
    centro.innerHTML = '<span class="donut-pct">100%</span>';
    return;
  }

  const pct = `<span class="donut-pct">${resumo.porcentagem}%</span>`;

  // No Simulado Geral o círculo mostra apenas o percentual.
  if (categoria === 'Todos') {
    centro.innerHTML = pct;
    return;
  }

  const status = resumo.emAndamento ? 'Em andamento' : 'Não iniciado';
  centro.innerHTML = `${pct}<span class="donut-status">${status}</span>`;
}

function atualizarDadosDoCard(categoria, resumo) {
  const card = document.getElementById(`card-${categoria}`);
  if (!card) return;

  desenharAnel(categoria, resumo);

  const botao = card.querySelector('.btn-card-start');
  botao.disabled = !progressoPronto || resumo.total === 0;
  botao.querySelector('[data-acao-quiz]').textContent = 'Começar';

  const concluidasEl = card.querySelector('[data-stat="concluidas"]');
  if (concluidasEl) concluidasEl.textContent = String(resumo.concluidas);

  const totalEl = card.querySelector('[data-stat="total"]');
  if (totalEl) totalEl.textContent = String(resumo.total);

  const resultadoEl = card.querySelector('[data-stat="resultado"]');
  if (resultadoEl) resultadoEl.textContent = formatarResultado(resumo.ultimoResultado);
}

function desenharEstrelas(quantidade) {
  const container = document.getElementById('starsRow');
  if (!container) return;

  const total = CATEGORIAS_DA_PROGRESSAO.length;
  if (container.children.length !== total) {
    container.innerHTML = '';
    for (let indice = 0; indice < total; indice += 1) {
      const estrela = document.createElement('span');
      estrela.className = 'star';
      estrela.innerHTML = '<i class="fa-solid fa-star"></i>';
      container.appendChild(estrela);
    }
  }

  Array.from(container.children).forEach((estrela, indice) => {
    estrela.classList.toggle('preenchida', indice < quantidade);
  });
}

function desenharBarraDeProgresso(concluidos, total) {
  const pontos = document.getElementById('progressDots');
  const preenchimento = document.getElementById('progressFill');
  if (!pontos || total <= 0) return;

  if (pontos.children.length !== total) {
    pontos.innerHTML = '';
    for (let indice = 0; indice < total; indice += 1) {
      const ponto = document.createElement('span');
      ponto.className = 'progress-dot';
      pontos.appendChild(ponto);
    }
  }

  Array.from(pontos.children).forEach((ponto, indice) => {
    ponto.classList.toggle('ativo', indice < concluidos);
  });

  if (!preenchimento) return;

  if (concluidos <= 0) {
    preenchimento.style.width = '0%';
    return;
  }

  // A barra vai de ponta a ponta; cada estrela conquistada preenche até o
  // centro dela e, ao concluir tudo, o preenchimento vai até o fim da trilha.
  const largura = concluidos >= total ? 100 : ((concluidos - 0.5) / total) * 100;
  preenchimento.style.width = `${Math.max(0, Math.min(100, largura))}%`;
}

function atualizarProgresso() {
  const concluidos = obterQuizzesConcluidos();
  const total = CATEGORIAS_DA_PROGRESSAO.length;

  CATEGORIAS_DA_PROGRESSAO.forEach((categoria) => {
    const resumo = resumoDaCategoria(categoria);
    const card = document.getElementById(`card-${categoria}`);
    if (card) card.classList.toggle('completed', resumo.concluido);
    atualizarDadosDoCard(categoria, resumo);
  });

  const porcentagem = total ? Math.round((concluidos.length / total) * 100) : 0;

  const textoEl = document.getElementById('progressText');
  if (textoEl) textoEl.textContent = `${concluidos.length} / ${total} Concluídos (${porcentagem}%)`;

  desenharEstrelas(concluidos.length);
  desenharBarraDeProgresso(concluidos.length, total);
}

function celebrarNaSelecao() {
  if (!progressoPronto || !document.getElementById('selectionScreen').getClientRects().length) return;
  if (obterQuizzesConcluidos().length !== CATEGORIAS_DA_PROGRESSAO.length) return;
  if (lerPontuacao(CHAVE_CELEBRACAO_PRATICAR).exibida) return;
  TentativasQuiz.gravar(CHAVE_CELEBRACAO_PRATICAR, { exibida: true });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const camada = document.createElement('div');
  camada.className = 'confetes-pratica';
  camada.setAttribute('aria-hidden', 'true');
  const cores = ['#fbbf24', '#c4b5fd', '#8b5cf6', '#38bdf8', '#34d399'];
  for (let i = 0; i < 48; i++) {
    const papel = document.createElement('span');
    papel.style.setProperty('--x', `${Math.random() * 100}%`);
    papel.style.setProperty('--desvio', `${Math.random() * 140 - 70}px`);
    papel.style.setProperty('--giro', `${Math.random() * 720 - 360}deg`);
    papel.style.setProperty('--duracao', `${1.3 + Math.random() * 1.1}s`);
    papel.style.setProperty('--atraso', `${Math.random() * 0.35}s`);
    papel.style.setProperty('--cor', cores[i % cores.length]);
    camada.appendChild(papel);
  }
  document.getElementById('selectionScreen').appendChild(camada);
  window.setTimeout(() => camada.remove(), 2800);
}

function iniciarQuiz(categoria) {
  if (!progressoPronto || !CATEGORIAS_DA_PROGRESSAO.includes(categoria)) return;
  const termos = termosDaCategoria(categoria);
  if (termos.length === 0) return;
  categoriaAtual = categoria;
  const tentativa = TentativasQuiz.abrir(categoria, termos);
  perguntasAtivas = tentativa.perguntas;
  respostasDaTentativa = tentativa.respostas;
  perguntaAtual = respostasDaTentativa.length;

  const selecao = document.getElementById('selectionScreen');
  const tela = document.getElementById('quizScreen');
  const corpo = document.querySelector('#quizScreen .quiz-body-grid');
  const painelResultado = document.getElementById('resultPanel');
  if (selecao) selecao.style.display = 'none';
  if (tela) tela.style.display = 'block';
  if (corpo) corpo.style.display = '';
  if (painelResultado) painelResultado.style.display = 'none';

  carregarPergunta(perguntaAtual);
  document.getElementById('qTitle').focus();
}

function voltarParaSelecao() {
  perguntaRespondida = false;

  const tela = document.getElementById('quizScreen');
  const selecao = document.getElementById('selectionScreen');
  if (tela) tela.style.display = 'none';
  if (selecao) selecao.style.display = 'block';

  pararVideoDaPergunta();
  atualizarProgresso();
  celebrarNaSelecao();
}

function obterImagemPadrao() {
  return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e2e8f0'/><text x='50%' y='55%' font-size='28' text-anchor='middle' dominant-baseline='middle'>?</text></svg>";
}

function videoDaPergunta() {
  return document.getElementById('qVideo');
}

function avisoDaPergunta() {
  return document.getElementById('qVideoAviso');
}

function pararVideoDaPergunta() {
  const video = videoDaPergunta();
  if (!video) return;
  video.pause();
  if (window.VideoYoutube) window.VideoYoutube.esconder(video);
}

function carregarVideoDaPergunta(pergunta) {
  const video = videoDaPergunta();
  const aviso = avisoDaPergunta();
  if (!video) return;

  if (aviso) aviso.classList.remove('esta-visivel');

  const fonte = pergunta && pergunta.video ? pergunta.video : '';

  if (!fonte) {
    if (window.VideoYoutube) window.VideoYoutube.esconder(video);
    video.style.display = '';
    video.removeAttribute('src');
    video.load();
    if (aviso) aviso.classList.add('esta-visivel');
    return;
  }

  // Link do YouTube: toca no iframe, sem controles para não entregar a resposta.
  if (window.VideoYoutube && window.VideoYoutube.exibir(video, fonte, { controles: false })) return;

  video.pause();
  video.src = fonte;
  video.currentTime = 0;
  video.load();

  const promessa = video.play();
  if (promessa && typeof promessa.catch === 'function') promessa.catch(() => {});
}

function nomesDasOpcoes(pergunta) {
  const opcoes = Array.isArray(pergunta.opcoes) ? pergunta.opcoes : [];
  const validas = opcoes.filter((nome) => termoPorNome(nome));

  if (validas.includes(pergunta.termo)) return validas;
  return [pergunta.termo, ...validas];
}

function carregarPergunta(indice) {
  perguntaRespondida = false;
  document.getElementById('qAvancar').hidden = true;
  document.getElementById('qFeedback').textContent = '';

  if (indice >= perguntasAtivas.length) {
    mostrarResultado();
    return;
  }

  const pergunta = perguntasAtivas[indice];

  const categoriaEl = document.getElementById('qCategory');
  const tituloEl = document.getElementById('qTitle');
  if (categoriaEl) categoriaEl.textContent = pergunta.categoria.toUpperCase();
  if (tituloEl) tituloEl.textContent = `Pergunta ${indice + 1} de ${perguntasAtivas.length}`;

  carregarVideoDaPergunta(pergunta);

  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';

  TentativasQuiz.embaralhar(nomesDasOpcoes(pergunta)).forEach((nome, indice) => {
    const opcao = termoPorNome(nome);
    if (!opcao) return;

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'option-btn-card';
    card.dataset.termo = opcao.termo;
    card.addEventListener('click', () => verificarResposta(opcao.termo, pergunta.termo, card));

    const forma = FORMAS_DAS_ALTERNATIVAS[indice % FORMAS_DAS_ALTERNATIVAS.length];
    const marcador = document.createElement('span');
    marcador.className = `forma-opcao ${forma.classe}`;
    marcador.textContent = forma.letra;
    marcador.setAttribute('aria-hidden', 'true');

    const texto = document.createElement('span');
    texto.className = 'option-term-text';
    texto.textContent = opcao.termo;

    card.appendChild(marcador);
    card.appendChild(texto);
    container.appendChild(card);
  });
}

function marcarCorreto(card, rotulo) {
  card.classList.add('correct');

  const marcador = document.createElement('span');
  marcador.className = 'answer-status-tag';
  marcador.innerHTML = `<i class="fa-solid fa-check"></i> ${rotulo}`;
  card.appendChild(marcador);
}

function avancarPergunta() {
  if (!perguntaRespondida) return;
  perguntaAtual += 1;
  carregarPergunta(perguntaAtual);
  document.getElementById('qTitle').focus();
}

function verificarResposta(respostaEscolhida, respostaCorreta, cardClicado) {
  if (perguntaRespondida) return;
  perguntaRespondida = true;

  const todosOsCards = document.querySelectorAll('#optionsContainer .option-btn-card');
  todosOsCards.forEach((card) => {
    card.disabled = true;
  });

  const feedback = document.getElementById('qFeedback');
  const acertou = respostaEscolhida === respostaCorreta;
  respostasDaTentativa.push(acertou);
  if (acertou) {
    marcarCorreto(cardClicado, 'Correto');
    feedback.textContent = `Correto! O sinal é ${respostaCorreta}.`;
  } else {
    cardClicado.classList.add('wrong');
    const marcador = document.createElement('span');
    marcador.className = 'answer-status-tag';
    marcador.innerHTML = '<i class="fa-solid fa-xmark"></i> Incorreto';
    cardClicado.appendChild(marcador);
    todosOsCards.forEach((card) => {
      if (card.dataset.termo === respostaCorreta) marcarCorreto(card, 'Resposta Certa');
    });
    feedback.textContent = `Incorreto. O sinal é ${respostaCorreta}.`;
  }

  const respondidas = perguntaAtual + 1;
  const total = perguntasAtivas.length;
  const ultimaPergunta = respondidas === total;
  TentativasQuiz.registrar(categoriaAtual, perguntasAtivas, respostasDaTentativa);
  atualizarProgresso();

  const botao = document.getElementById('qAvancar');
  document.getElementById('qAvancarTexto').textContent = ultimaPergunta ? 'Ver resultado' : 'Avançar';
  botao.hidden = false;
  botao.focus({ preventScroll: true });
}

function mostrarResultado() {
  const { acertos, erros } = TentativasQuiz.placar(respostasDaTentativa);

  pararVideoDaPergunta();

  const corpo = document.querySelector('#quizScreen .quiz-body-grid');
  const painel = document.getElementById('resultPanel');
  if (corpo) corpo.style.display = 'none';
  if (painel) painel.style.display = 'block';

  const tituloEl = document.getElementById('qTitle');
  if (tituloEl) tituloEl.textContent = 'Resultado final';

  const definirTexto = (id, texto) => {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
  };

  definirTexto('resultAcertos', String(acertos));
  definirTexto('resultErros', String(erros));
  definirTexto('resultPct', TentativasQuiz.resumoResultado(categoriaAtual, respostasDaTentativa));
}

document.addEventListener('DOMContentLoaded', async () => {
  window.addEventListener('progresso-carregado', atualizarProgresso);
  const recarregar = document.getElementById('recarregarPratica');
  recarregar.addEventListener('click', () => window.location.reload());
  progressoPronto = await TentativasQuiz.carregar();
  atualizarProgresso();
  if (!progressoPronto) {
    const textoEl = document.getElementById('progressText');
    if (textoEl) textoEl.textContent = 'Não foi possível carregar seu progresso.';
    recarregar.hidden = false;
    return;
  }

  const video = videoDaPergunta();
  const aviso = avisoDaPergunta();

  if (video) {
    video.addEventListener('error', () => {
      if (aviso) aviso.classList.add('esta-visivel');
    });
  }

  const parametros = new URLSearchParams(window.location.search);
  const categoria = parametros.get('cat');
  if (categoria && CATEGORIAS_DA_PROGRESSAO.includes(categoria)) iniciarQuiz(categoria);
  else celebrarNaSelecao();
});
