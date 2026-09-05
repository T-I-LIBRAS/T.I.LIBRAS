// Página de praticar: seleção de categoria e quiz com cronômetro.
const todasAsPerguntas = [
  { term: "Monitor", cat: "Hardware", img: "imagens/sinais/monitor.png" },
  { term: "Mouse", cat: "Hardware", img: "imagens/sinais/mouse.png" },
  { term: "Teclado", cat: "Hardware", img: "imagens/sinais/teclado.png" },
  { term: "Fone (de ouvido)", cat: "Hardware", img: "imagens/sinais/fone.png" },
  { term: "Microfone", cat: "Hardware", img: "imagens/sinais/microfone.png" },
  { term: "Webcam", cat: "Hardware", img: "imagens/sinais/webcam.png" },
  { term: "Impressora", cat: "Hardware", img: "imagens/sinais/impressora.png" },
  { term: "Placa Mãe", cat: "Hardware", img: "imagens/sinais/placa-mae.png" },
  { term: "Memória RAM", cat: "Hardware", img: "imagens/sinais/memoria-ram.png" },
  { term: "Fonte de alimentação", cat: "Hardware", img: "imagens/sinais/fonte.png" },
  { term: "HD", cat: "Hardware", img: "imagens/sinais/hd.png" },
  { term: "SSD", cat: "Hardware", img: "imagens/sinais/ssd.png" },
  { term: "Processador", cat: "Hardware", img: "imagens/sinais/processador.png" },
  { term: "Gabinete", cat: "Hardware", img: "imagens/sinais/gabinete.png" },
  { term: "Laptop", cat: "Hardware", img: "imagens/sinais/laptop.png" },
  { term: "Cooler", cat: "Hardware", img: "imagens/sinais/cooler.png" },
  { term: "Pendrive", cat: "Hardware", img: "imagens/sinais/pendrive.png" },
  { term: "Sistema Operacional", cat: "Software", img: "imagens/sinais/so.png" },
  { term: "Linux", cat: "Software", img: "imagens/sinais/linux.png" },
  { term: "Windows", cat: "Software", img: "imagens/sinais/windows.png" },
  { term: "Office", cat: "Software", img: "imagens/sinais/office.png" },
  { term: "Aplicativo", cat: "Software", img: "imagens/sinais/app.png" },
  { term: "Kernel", cat: "Software", img: "imagens/sinais/kernel.png" },
  { term: "E-Mail", cat: "Software", img: "imagens/sinais/email.png" },
  { term: "Mac", cat: "Software", img: "imagens/sinais/mac.png" },
  { term: "Word", cat: "Software", img: "imagens/sinais/word.png" },
  { term: "Excel", cat: "Software", img: "imagens/sinais/excel.png" },
  { term: "PowerPoint", cat: "Software", img: "imagens/sinais/powerpoint.png" },
  { term: "Algoritmo", cat: "Programação", img: "imagens/sinais/algoritmo.png" },
  { term: "Variável", cat: "Programação", img: "imagens/sinais/variavel.png" },
  { term: "Laço de Repetição", cat: "Programação", img: "imagens/sinais/laco.png" },
  { term: "Operador", cat: "Programação", img: "imagens/sinais/operador.png" },
  { term: "Java", cat: "Programação", img: "imagens/sinais/java.png" },
  { term: "HTML", cat: "Programação", img: "imagens/sinais/html.png" },
  { term: "CSS", cat: "Programação", img: "imagens/sinais/css.png" },
  { term: "JavaScript", cat: "Programação", img: "imagens/sinais/javascript.png" },
  { term: "Python", cat: "Programação", img: "imagens/sinais/python.png" },
  { term: "NetBeans", cat: "Programação", img: "imagens/sinais/netbeans.png" },
  { term: "GitHub", cat: "Programação", img: "imagens/sinais/github.png" },
  { term: "Repositório", cat: "Programação", img: "imagens/sinais/repositorio.png" },
  { term: "Potência", cat: "Eletricidade", img: "imagens/sinais/potencia.png" },
  { term: "Resistor", cat: "Eletricidade", img: "imagens/sinais/resistor.png" },
  { term: "Tensão", cat: "Eletricidade", img: "imagens/sinais/tensao.png" },
  { term: "Corrente Elétrica", cat: "Eletricidade", img: "imagens/sinais/corrente.png" },
  { term: "Cabo", cat: "Eletricidade", img: "imagens/sinais/cabo.png" },
  { term: "Alicate", cat: "Eletricidade", img: "imagens/sinais/alicate.png" },
  { term: "Condutor", cat: "Eletricidade", img: "imagens/sinais/condutor.png" },
  { term: "LED", cat: "Eletricidade", img: "imagens/sinais/led.png" },
  { term: "Corrente Alternada", cat: "Eletricidade", img: "imagens/sinais/ca.png" },
  { term: "Disjuntor", cat: "Eletricidade", img: "imagens/sinais/disjuntor.png" },
  { term: "Multímetro", cat: "Eletricidade", img: "imagens/sinais/multimetro.png" },
  { term: "Site", cat: "Redes", img: "imagens/sinais/site.png" },
  { term: "Navegador de Internet", cat: "Redes", img: "imagens/sinais/navegador.png" },
  { term: "Google Chrome", cat: "Redes", img: "imagens/sinais/chrome.png" },
  { term: "Edge", cat: "Redes", img: "imagens/sinais/edge.png" },
  { term: "Firefox", cat: "Redes", img: "imagens/sinais/firefox.png" },
  { term: "Abas", cat: "Redes", img: "imagens/sinais/abas.png" },
  { term: "Maximizar e Minimizar", cat: "Redes", img: "imagens/sinais/window-actions.png" },
  { term: "Google", cat: "Redes", img: "imagens/sinais/google.png" },
  { term: "Vírus", cat: "Redes", img: "imagens/sinais/virus.png" },
  { term: "Antivírus", cat: "Redes", img: "imagens/sinais/antivirus.png" },
  { term: "Backup", cat: "Redes", img: "imagens/sinais/backup.png" },
  { term: "Link", cat: "Redes", img: "imagens/sinais/link.png" }
];

let categoriaAtual = 'Hardware';
let perguntasAtivas = [];
let perguntaAtual = 0;
let cronometroIntervalo;
let tempoRestante = 60;

function rolarCarrossel(distancia) {
  const grade = document.getElementById('selectionGrid');
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

function atualizarProgresso() {
  const concluidos = JSON.parse(localStorage.getItem('completedQuizzes') || '[]');
  const categorias = ['Hardware', 'Software', 'Programação', 'Eletricidade', 'Redes', 'Todos'];

  categorias.forEach((cat) => {
    const card = document.getElementById(`card-${cat}`);
    if (!card) return;
    if (concluidos.includes(cat)) card.classList.add('completed');
    else card.classList.remove('completed');
  });

  const total = categorias.length;
  const porcentagem = Math.round((concluidos.length / total) * 100);

  document.getElementById('progressText').textContent =
    `${concluidos.length} / ${total} Concluídos (${porcentagem}%)`;
  document.getElementById('progressBar').style.width = `${porcentagem}%`;

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
  perguntasAtivas = categoria === 'Todos'
    ? [...todasAsPerguntas].sort(() => 0.5 - Math.random())
    : todasAsPerguntas.filter((pergunta) => pergunta.cat === categoria);

  perguntaAtual = 0;
  document.getElementById('selectionScreen').style.display = 'none';
  document.getElementById('quizScreen').style.display = 'block';
  carregarPergunta(perguntaAtual);
}

function voltarParaSelecao() {
  clearInterval(cronometroIntervalo);
  document.getElementById('quizScreen').style.display = 'none';
  document.getElementById('selectionScreen').style.display = 'block';
  atualizarProgresso();
}

function iniciarCronometro() {
  clearInterval(cronometroIntervalo);
  tempoRestante = 60;
  atualizarCronometro();
  cronometroIntervalo = setInterval(() => {
    tempoRestante--;
    atualizarCronometro();
    if (tempoRestante <= 0) {
      clearInterval(cronometroIntervalo);
      lidarComErro();
    }
  }, 1000);
}

function atualizarCronometro() {
  const minutos = Math.floor(tempoRestante / 60);
  const segundos = tempoRestante % 60;
  document.getElementById('timer').textContent =
    `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
}

function obterImagemPadrao() {
  return "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23e2e8f0'/><text x='50%' y='55%' font-size='28' text-anchor='middle' dominant-baseline='middle'>?</text></svg>";
}

function carregarPergunta(indice) {
  if (indice >= perguntasAtivas.length) {
    const concluidos = JSON.parse(localStorage.getItem('completedQuizzes') || '[]');
    if (!concluidos.includes(categoriaAtual)) {
      concluidos.push(categoriaAtual);
      localStorage.setItem('completedQuizzes', JSON.stringify(concluidos));
    }

    alert(`Parabéns! Você concluiu o Quiz de ${categoriaAtual} com ${perguntasAtivas.length} questões sem erros!`);
    voltarParaSelecao();
    return;
  }

  document.getElementById('feedbackBanner').style.display = 'none';
  const pergunta = perguntasAtivas[indice];
  document.getElementById('qCategory').textContent = pergunta.cat.toUpperCase();
  document.getElementById('qTitle').textContent = `Pergunta ${indice + 1} de ${perguntasAtivas.length}`;
  document.getElementById('qVideoText').textContent = `Sinal demonstrativo de: "${pergunta.term}"`;

  let bancoDaArea = [];
  if (categoriaAtual === 'Todos') {
    bancoDaArea = todasAsPerguntas.filter((item) => item.term !== pergunta.term);
  } else {
    bancoDaArea = todasAsPerguntas.filter(
      (item) => item.cat === pergunta.cat && item.term !== pergunta.term
    );
  }

  const distratores = bancoDaArea.sort(() => 0.5 - Math.random()).slice(0, 3);
  const opcoes = [pergunta, ...distratores].sort(() => 0.5 - Math.random());

  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';

  opcoes.forEach((opcao) => {
    const card = document.createElement('button');
    card.className = 'option-btn-card';
    card.onclick = () => verificarResposta(opcao.term, pergunta.term, card);

    const imagem = document.createElement('img');
    imagem.className = 'option-img-thumb';
    imagem.src = opcao.img;
    imagem.alt = opcao.term;
    imagem.onerror = function () { this.src = obterImagemPadrao(); };

    const texto = document.createElement('span');
    texto.className = 'option-term-text';
    texto.textContent = opcao.term;

    card.appendChild(imagem);
    card.appendChild(texto);
    container.appendChild(card);
  });

  iniciarCronometro();
}

function verificarResposta(respostaEscolhida, respostaCorreta, cardClicado) {
  const todosOsCards = document.querySelectorAll('.option-btn-card');
  todosOsCards.forEach((card) => { card.disabled = true; });
  clearInterval(cronometroIntervalo);

  if (respostaEscolhida === respostaCorreta) {
    cardClicado.classList.add('correct');

    const marcador = document.createElement('span');
    marcador.className = 'answer-status-tag';
    marcador.innerHTML = '<i class="fa-solid fa-check"></i> Correto';
    cardClicado.appendChild(marcador);

    setTimeout(() => {
      perguntaAtual++;
      carregarPergunta(perguntaAtual);
    }, 1200);
  } else {
    cardClicado.classList.add('wrong');

    const marcador = document.createElement('span');
    marcador.className = 'answer-status-tag';
    marcador.innerHTML = '<i class="fa-solid fa-xmark"></i> Incorreto';
    cardClicado.appendChild(marcador);

    todosOsCards.forEach((card) => {
      const texto = card.querySelector('.option-term-text').textContent;
      if (texto === respostaCorreta) {
        card.classList.add('correct');
        const marcadorCerto = document.createElement('span');
        marcadorCerto.className = 'answer-status-tag';
        marcadorCerto.innerHTML = '<i class="fa-solid fa-check"></i> Resposta Certa';
        card.appendChild(marcadorCerto);
      }
    });

    lidarComErro();
  }
}

function lidarComErro() {
  const banner = document.getElementById('feedbackBanner');
  banner.style.display = 'block';
  setTimeout(() => {
    iniciarQuiz(categoriaAtual);
  }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
  localStorage.setItem('totalQuizzes', '6');
  localStorage.setItem('totalQuestoes', String(todasAsPerguntas.length));

  atualizarProgresso();
  atualizarEstadoDoCarrossel();

  const parametros = new URLSearchParams(window.location.search);
  const categoria = parametros.get('cat');
  if (categoria) iniciarQuiz(categoria);
});

window.addEventListener('resize', atualizarEstadoDoCarrossel);
