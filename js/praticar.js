const CATEGORIAS_DO_PRATICAR = ['Hardware', 'Software', 'Programação', 'Eletricidade', 'Redes'];
const CATEGORIAS_DA_PROGRESSAO = [...CATEGORIAS_DO_PRATICAR, 'Todos'];
const TEMPO_DA_QUESTAO = 60;

let categoriaAtual = 'Hardware';
let perguntasAtivas = [];
let perguntaAtual = 0;
let cronometroIntervalo = null;
let tempoRestante = TEMPO_DA_QUESTAO;

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

function atualizarContadoresDasCategorias() {
  document.querySelectorAll('.meta-info[data-meta]').forEach((meta) => {
    const categoria = meta.dataset.meta;
    const total = termosDaCategoria(categoria).length;
    meta.textContent = meta.textContent.replace(/^\d+/, String(total));
  });
}

function progressoDisponivel() {
  return !!(window.Progresso && window.Progresso.quizzesConcluidos);
}

function obterQuizzesConcluidos() {
  return progressoDisponivel() ? window.Progresso.quizzesConcluidos() : [];
}

function registrarQuizConcluido(categoria, totalDeQuestoes) {
  if (!progressoDisponivel()) return;

  window.Progresso.concluirQuiz(categoria);
  window.Progresso.registrarPontuacao(categoria, {
    ultima_pontuacao: totalDeQuestoes,
    total_questoes: totalDeQuestoes,
    ultima_conclusao: new Date().toISOString()
  });
}

function atualizarProgresso() {
  const concluidos = obterQuizzesConcluidos();

  CATEGORIAS_DA_PROGRESSAO.forEach((cat) => {
    const card = document.getElementById(`card-${cat}`);
    if (!card) return;
    card.classList.toggle('completed', concluidos.includes(cat));
  });

  const total = CATEGORIAS_DA_PROGRESSAO.length;
  const porcentagem = total ? Math.round((concluidos.length / total) * 100) : 0;

  const textoEl = document.getElementById('progressText');
  if (textoEl) textoEl.textContent = `${concluidos.length} / ${total} Concluídos (${porcentagem}%)`;

  const barraEl = document.getElementById('progressBar');
  if (barraEl) barraEl.style.width = `${porcentagem}%`;

  const mensagemEl = document.getElementById('progressMessage');
  if (mensagemEl) {
    const numero = concluidos.length;
    let texto;

    if (numero === 0) {
      texto = 'Vamos começar? Escolha uma categoria abaixo!';
    } else if (numero < total / 2) {
      texto = `Bom começo! Você já concluiu ${numero} quiz${numero > 1 ? 'zes' : ''}, continue praticando.`;
    } else if (numero < total - 1) {
      texto = 'Você está indo muito bem, continue assim!';
    } else if (numero < total) {
      texto = `Quase lá! Falta só mais ${total - numero} para concluir tudo.`;
    } else {
      texto = 'Parabéns! Você concluiu todos os quizzes! 🎉';
    }

    mensagemEl.textContent = texto;
  }
}

function iniciarQuiz(categoria) {
  categoriaAtual = categoria;
  perguntasAtivas = embaralhar(termosDaCategoria(categoria));
  perguntaAtual = 0;

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
    registrarQuizConcluido(categoriaAtual, perguntasAtivas.length);
    alert(`Parabéns! Você concluiu o Quiz de ${categoriaAtual} com ${perguntasAtivas.length} questões sem erros!`);
    voltarParaSelecao();
    return;
  }

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
    imagem.addEventListener('error', function () { this.src = obterImagemPadrao(); });

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
  todosOsCards.forEach((card) => { card.disabled = true; });

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

  atualizarContadoresDasCategorias();
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
