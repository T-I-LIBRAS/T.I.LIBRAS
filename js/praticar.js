const CATEGORIAS_DO_PRATICAR = ['Hardware', 'Software', 'Programação', 'Eletricidade', 'Redes'];
const CATEGORIAS_DA_PROGRESSAO = [...CATEGORIAS_DO_PRATICAR, 'Todos'];
const TEMPO_DA_QUESTAO = 60;
const PERIMETRO_DO_ANEL = 2 * Math.PI * 52;

let categoriaAtual = 'Hardware';
let perguntasAtivas = [];
let perguntaAtual = 0;
let cronometroIntervalo = null;
let tempoRestante = TEMPO_DA_QUESTAO;
let inicioDaExecucao = 0;

function termosDoProjeto() {
  return typeof TERMOS !== 'undefined' && Array.isArray(TERMOS) ? TERMOS : [];
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

function rolarCarrossel(distancia) {
  const grade = document.getElementById('selectionGrid');
  if (!grade) return;
  grade.scrollBy({ left: distancia, behavior: 'smooth' });
}

function atualizarEstadoDoCarrossel() {
  const grade = document.getElementById('selectionGrid');
  const botoes = document.querySelector('.carousel-nav-btns');
  if (!grade) return;

  const temTransbordo = grade.scrollWidth > grade.clientWidth + 1;
  if (botoes) botoes.style.display = temTransbordo ? 'flex' : 'none';
  grade.style.justifyContent = temTransbordo ? 'flex-start' : 'center';
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

function formatarTempo(segundos) {
  const total = Number(segundos);
  if (!Number.isFinite(total) || total <= 0) return '--:--';

  const arredondado = Math.round(total);
  const minutos = Math.floor(arredondado / 60);
  const resto = arredondado % 60;
  return `${String(minutos).padStart(2, '0')}:${String(resto).padStart(2, '0')}`;
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
  const recorde = Number(registro.melhor_tempo);

  return {
    total,
    concluidas,
    porcentagem,
    concluido: concluido || (total > 0 && porcentagem === 100),
    recorde: Number.isFinite(recorde) && recorde > 0 ? Math.round(recorde) : null
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

  const recordeEl = card.querySelector('[data-stat="recorde"]');
  if (recordeEl) recordeEl.textContent = formatarTempo(resumo.recorde);

  const meta = card.querySelector('.meta-info');
  if (meta) {
    const legenda = meta.dataset.legenda || '';
    meta.textContent = legenda ? `${resumo.total} Questões · ${legenda}` : `${resumo.total} Questões`;
  }
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

function registrarQuizConcluido(categoria, totalDeQuestoes) {
  if (!progressoDisponivel()) return;

  window.Progresso.concluirQuiz(categoria);

  const registro = lerPontuacao(categoria);
  const duracao = Math.max(1, Math.round((Date.now() - inicioDaExecucao) / 1000));
  const recordeAnterior = Number(registro.melhor_tempo);
  const melhorTempo =
    Number.isFinite(recordeAnterior) && recordeAnterior > 0
      ? Math.min(recordeAnterior, duracao)
      : duracao;

  window.Progresso.registrarPontuacao(categoria, {
    ultima_pontuacao: totalDeQuestoes,
    total_questoes: totalDeQuestoes,
    melhor_progresso: totalDeQuestoes,
    ultimo_tempo: duracao,
    melhor_tempo: melhorTempo,
    ultima_conclusao: new Date().toISOString()
  });
}

function iniciarQuiz(categoria) {
  categoriaAtual = categoria;
  perguntasAtivas = embaralhar(termosDaCategoria(categoria));
  perguntaAtual = 0;
  inicioDaExecucao = Date.now();

  const selecao = document.getElementById('selectionScreen');
  const tela = document.getElementById('quizScreen');
  if (selecao) selecao.style.display = 'none';
  if (tela) tela.style.display = 'block';

  carregarPergunta(perguntaAtual);
}

function voltarParaSelecao() {
  clearInterval(cronometroIntervalo);
  cronometroIntervalo = null;

  const tela = document.getElementById('quizScreen');
  const selecao = document.getElementById('selectionScreen');
  if (tela) tela.style.display = 'none';
  if (selecao) selecao.style.display = 'block';

  pararVideoDaPergunta();
  atualizarProgresso();
  atualizarEstadoDoCarrossel();
}

function iniciarCronometro() {
  clearInterval(cronometroIntervalo);
  tempoRestante = TEMPO_DA_QUESTAO;
  atualizarCronometro();

  cronometroIntervalo = setInterval(() => {
    tempoRestante -= 1;
    atualizarCronometro();

    if (tempoRestante <= 0) {
      clearInterval(cronometroIntervalo);
      cronometroIntervalo = null;
      lidarComErro();
    }
  }, 1000);
}

function atualizarCronometro() {
  const alvo = document.getElementById('timer');
  if (!alvo) return;

  const minutos = Math.floor(tempoRestante / 60);
  const segundos = tempoRestante % 60;
  alvo.textContent = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
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
}

function carregarVideoDaPergunta(pergunta) {
  const video = videoDaPergunta();
  const aviso = avisoDaPergunta();
  if (!video) return;

  if (aviso) aviso.classList.remove('esta-visivel');

  const fonte = pergunta && pergunta.video ? pergunta.video : '';

  if (!fonte) {
    video.removeAttribute('src');
    video.load();
    if (aviso) aviso.classList.add('esta-visivel');
    return;
  }

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
    const categoriaConcluida = categoriaAtual;
    const totalDeQuestoes = perguntasAtivas.length;

    registrarQuizConcluido(categoriaConcluida, totalDeQuestoes);
    voltarParaSelecao();
    alert(`Parabéns! Você concluiu o Quiz de ${categoriaConcluida} com ${totalDeQuestoes} questões sem erros!`);
    return;
  }

  registrarProgressoParcial(categoriaAtual, indice, perguntasAtivas.length);
  atualizarProgresso();

  const banner = document.getElementById('feedbackBanner');
  if (banner) banner.style.display = 'none';

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

    const imagem = document.createElement('img');
    imagem.className = 'option-img-thumb';
    imagem.src = opcao.imagem;
    imagem.alt = opcao.termo;
    imagem.addEventListener('error', function () {
      this.src = obterImagemPadrao();
    });

    const texto = document.createElement('span');
    texto.className = 'option-term-text';
    texto.textContent = opcao.termo;

    card.appendChild(imagem);
    card.appendChild(texto);
    container.appendChild(card);
  });

  iniciarCronometro();
}

function marcarCorreto(card, rotulo) {
  card.classList.add('correct');

  const marcador = document.createElement('span');
  marcador.className = 'answer-status-tag';
  marcador.innerHTML = `<i class="fa-solid fa-check"></i> ${rotulo}`;
  card.appendChild(marcador);
}

function verificarResposta(respostaEscolhida, respostaCorreta, cardClicado) {
  const todosOsCards = document.querySelectorAll('.option-btn-card');
  todosOsCards.forEach((card) => {
    card.disabled = true;
  });

  clearInterval(cronometroIntervalo);
  cronometroIntervalo = null;

  if (respostaEscolhida === respostaCorreta) {
    marcarCorreto(cardClicado, 'Correto');

    setTimeout(() => {
      perguntaAtual += 1;
      carregarPergunta(perguntaAtual);
    }, 1200);
    return;
  }

  cardClicado.classList.add('wrong');

  const marcador = document.createElement('span');
  marcador.className = 'answer-status-tag';
  marcador.innerHTML = '<i class="fa-solid fa-xmark"></i> Incorreto';
  cardClicado.appendChild(marcador);

  todosOsCards.forEach((card) => {
    if (card.dataset.termo === respostaCorreta) marcarCorreto(card, 'Resposta Certa');
  });

  lidarComErro();
}

function lidarComErro() {
  const banner = document.getElementById('feedbackBanner');
  if (banner) banner.style.display = 'block';

  clearInterval(cronometroIntervalo);
  cronometroIntervalo = null;

  setTimeout(() => {
    iniciarQuiz(categoriaAtual);
  }, 2000);
}

document.addEventListener('DOMContentLoaded', async () => {
  if (window.Progresso && window.Progresso.carregar) {
    await window.Progresso.carregar();
  }

  atualizarProgresso();
  atualizarEstadoDoCarrossel();

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

window.addEventListener('resize', atualizarEstadoDoCarrossel);
