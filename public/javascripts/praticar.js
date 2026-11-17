const CATEGORIAS_DO_PRATICAR = ['Hardware', 'Software', 'Programação', 'Eletricidade', 'Redes'];
const CATEGORIAS_DA_PROGRESSAO = [...CATEGORIAS_DO_PRATICAR, 'Todos'];
const PERIMETRO_DO_ANEL = 2 * Math.PI * 52;

let categoriaAtual = 'Hardware';
let perguntasAtivas = [];
let perguntaAtual = 0;
let acertos = 0;
let erros = 0;
let idDaExecucao = 0;

function termosDoProjeto() {
  return typeof TERMOS_LOCAIS !== 'undefined' && Array.isArray(TERMOS_LOCAIS) ? TERMOS_LOCAIS : [];
}

function termoPorNome(nome) {
  return termosDoProjeto().find((item) => item.termo === nome) || null;
}

function embaralhar(lista) {
  return [...lista].sort(() => 0.5 - Math.random());
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
  return `${resultado.acertos} ${rotuloAcertos} · ${resultado.erros} ${rotuloErros}`;
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
    concluido: concluido || (total > 0 && porcentagem === 100),
    ultimoResultado: temResultado
      ? {
          acertos: Math.round(acertosSalvos),
          erros: Number.isFinite(errosSalvos) && errosSalvos >= 0 ? Math.round(errosSalvos) : 0
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
    centro.innerHTML = '<i class="fa-solid fa-check donut-check"></i><span class="donut-pct">100%</span><span class="donut-status">Concluído!</span>';
    return;
  }

  const status = resumo.porcentagem > 0 ? 'Em andamento' : 'Não iniciado';
  centro.innerHTML = `<span class="donut-pct">${resumo.porcentagem}%</span><span class="donut-status">${status}</span>`;
}

function atualizarDadosDoCard(categoria, resumo) {
  const card = document.getElementById(`card-${categoria}`);
  if (!card) return;

  desenharAnel(categoria, resumo);

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

  const largura = total > 1 ? ((concluidos - 1) / (total - 1)) * 100 : 100;
  preenchimento.style.width = `${Math.max(0, Math.min(100, largura))}%`;
}

function mensagemDeProgresso(concluidos, total) {
  if (concluidos === 0) return 'Vamos começar? Escolha uma categoria abaixo!';
  if (concluidos < total / 2) {
    return `Bom começo! Você já concluiu ${concluidos} quiz${concluidos > 1 ? 'zes' : ''}, continue praticando.`;
  }
  if (concluidos < total - 1) return 'Você está indo muito bem, continue assim!';
  if (concluidos < total) return `Quase lá! Falta só mais ${total - concluidos} para concluir tudo.`;
  return 'Parabéns! Você concluiu todos os quizzes! 🎉';
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

  const mensagemEl = document.getElementById('progressMessage');
  if (mensagemEl) mensagemEl.textContent = mensagemDeProgresso(concluidos.length, total);

  desenharEstrelas(concluidos.length);
  desenharBarraDeProgresso(concluidos.length, total);
}

function registrarProgressoParcial(categoria, concluidas, total) {
  if (!progressoDisponivel() || typeof window.Progresso.registrarPontuacao !== 'function') return;

  const registro = lerPontuacao(categoria);
  const salvo = Number(registro.melhor_progresso);
  const melhor = Number.isFinite(salvo) ? Math.max(salvo, concluidas) : concluidas;

  window.Progresso.registrarPontuacao(categoria, {
    melhor_progresso: melhor,
    total_questoes: total
  });
}

function registrarQuizConcluido(categoria, totalDeQuestoes, totalDeAcertos, totalDeErros) {
  if (!progressoDisponivel()) return;

  window.Progresso.concluirQuiz(categoria);
  if (typeof window.Progresso.registrarUltimaAtividade === 'function') {
    window.Progresso.registrarUltimaAtividade('quiz', categoria);
  }

  window.Progresso.registrarPontuacao(categoria, {
    ultima_pontuacao: totalDeAcertos,
    ultimo_erros: totalDeErros,
    total_questoes: totalDeQuestoes,
    melhor_progresso: totalDeQuestoes,
    ultima_conclusao: new Date().toISOString()
  });
}

function iniciarQuiz(categoria) {
  categoriaAtual = categoria;
  perguntasAtivas = embaralhar(termosDaCategoria(categoria));
  perguntaAtual = 0;
  acertos = 0;
  erros = 0;
  idDaExecucao += 1;

  const selecao = document.getElementById('selectionScreen');
  const tela = document.getElementById('quizScreen');
  const corpo = document.querySelector('#quizScreen .quiz-body-grid');
  const painelResultado = document.getElementById('resultPanel');
  if (selecao) selecao.style.display = 'none';
  if (tela) tela.style.display = 'block';
  if (corpo) corpo.style.display = '';
  if (painelResultado) painelResultado.style.display = 'none';

  carregarPergunta(perguntaAtual);
}

function voltarParaSelecao() {
  idDaExecucao += 1;

  const tela = document.getElementById('quizScreen');
  const selecao = document.getElementById('selectionScreen');
  if (tela) tela.style.display = 'none';
  if (selecao) selecao.style.display = 'block';

  pararVideoDaPergunta();
  atualizarProgresso();
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
  if (indice >= perguntasAtivas.length) {
    mostrarResultado();
    return;
  }

  registrarProgressoParcial(categoriaAtual, indice, perguntasAtivas.length);
  atualizarProgresso();

  const pergunta = perguntasAtivas[indice];

  const categoriaEl = document.getElementById('qCategory');
  const tituloEl = document.getElementById('qTitle');
  if (categoriaEl) categoriaEl.textContent = pergunta.categoria.toUpperCase();
  if (tituloEl) tituloEl.textContent = `Pergunta ${indice + 1} de ${perguntasAtivas.length}`;

  carregarVideoDaPergunta(pergunta);

  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';

  embaralhar(nomesDasOpcoes(pergunta)).forEach((nome) => {
    const opcao = termoPorNome(nome);
    if (!opcao) return;

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'option-btn-card';
    card.dataset.termo = opcao.termo;
    card.addEventListener('click', () => verificarResposta(opcao.termo, pergunta.termo, card));

    const texto = document.createElement('span');
    texto.className = 'option-term-text';
    texto.textContent = opcao.termo;

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

function irParaProximaPergunta(execucao, atraso) {
  setTimeout(() => {
    if (execucao !== idDaExecucao) return;
    perguntaAtual += 1;
    carregarPergunta(perguntaAtual);
  }, atraso);
}

function verificarResposta(respostaEscolhida, respostaCorreta, cardClicado) {
  const todosOsCards = document.querySelectorAll('.option-btn-card');
  todosOsCards.forEach((card) => {
    card.disabled = true;
  });

  const execucao = idDaExecucao;

  if (respostaEscolhida === respostaCorreta) {
    acertos += 1;
    marcarCorreto(cardClicado, 'Correto');
    irParaProximaPergunta(execucao, 1200);
    return;
  }

  erros += 1;
  cardClicado.classList.add('wrong');

  const marcador = document.createElement('span');
  marcador.className = 'answer-status-tag';
  marcador.innerHTML = '<i class="fa-solid fa-xmark"></i> Incorreto';
  cardClicado.appendChild(marcador);

  todosOsCards.forEach((card) => {
    if (card.dataset.termo === respostaCorreta) marcarCorreto(card, 'Resposta Certa');
  });

  irParaProximaPergunta(execucao, 1800);
}

function mostrarResultado() {
  const total = perguntasAtivas.length;
  const porcentagem = total > 0 ? Math.round((acertos / total) * 100) : 0;

  registrarQuizConcluido(categoriaAtual, total, acertos, erros);
  atualizarProgresso();
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
  definirTexto('resultPct', `Você acertou ${porcentagem}% das ${total} questões de ${categoriaAtual}.`);
}

document.addEventListener('DOMContentLoaded', async () => {
  if (window.Progresso && window.Progresso.carregar) {
    await window.Progresso.carregar();
  }

  atualizarProgresso();

  window.addEventListener('progresso-carregado', atualizarProgresso);

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
});
