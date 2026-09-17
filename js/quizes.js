const CATEGORIAS_DO_QUIZ = {
  hardware: 'Hardware',
  software: 'Software',
  programacao: 'Programação',
  eletricidade: 'Eletricidade',
  redes: 'Redes'
};

function termosDoProjeto() {
  return typeof TERMOS !== 'undefined' && Array.isArray(TERMOS) ? TERMOS : [];
}

function termoPorNome(nome) {
  return termosDoProjeto().find((item) => item.termo === nome) || null;
}

function embaralhar(lista) {
  return [...lista].sort(() => 0.5 - Math.random());
}

function nomeDaCategoria(chave) {
  return CATEGORIAS_DO_QUIZ[String(chave || '').toLowerCase()] || 'Hardware';
}

function perguntasDaCategoria(nome) {
  return embaralhar(termosDoProjeto().filter((item) => item.categoria === nome));
}

function nomesDasOpcoes(pergunta) {
  const opcoes = Array.isArray(pergunta.opcoes) ? pergunta.opcoes : [];
  const validas = opcoes.filter((nome) => termoPorNome(nome));

  if (validas.includes(pergunta.termo)) return validas;
  return [pergunta.termo, ...validas];
}

document.addEventListener('DOMContentLoaded', async () => {
  if (window.Progresso && window.Progresso.carregar) {
    await window.Progresso.carregar();
  }

  const gradeOpcoes = document.getElementById('optionsGrid');
  const botaoProxima = document.getElementById('btnNext');
  const caminhoQuiz = document.getElementById('quizBreadcrumb');
  const porcentagemQuiz = document.getElementById('quizPercent');
  const numeroPergunta = document.getElementById('qNum');
  const cardQuiz = document.querySelector('.quiz-card');
  const videoQuiz = document.getElementById('quizVideo');
  const botaoVideo = document.getElementById('quizPlayBtn');

  const parametros = new URLSearchParams(window.location.search);
  const categoriaDaUrl = parametros.get('categoria') || 'hardware';
  const nomeCategoria = nomeDaCategoria(categoriaDaUrl);

  const perguntasAtivas = perguntasDaCategoria(nomeCategoria);
  let indicePerguntaAtual = 0;
  let pontuacao = 0;

  function registrarQuestaoFeita(categoria) {
    if (!window.Progresso) return;
    window.Progresso.incrementarPontuacao(categoria, { questoes_feitas: 1 });
  }

  function registrarQuizConcluido(categoria) {
    if (!window.Progresso) return;
    window.Progresso.concluirQuiz(categoria);
    window.Progresso.registrarPontuacao(categoria, {
      ultima_pontuacao: pontuacao,
      ultima_conclusao: new Date().toISOString()
    });
  }

  function atualizarIconeDoVideo() {
    if (!botaoVideo || !videoQuiz) return;

    const parado = videoQuiz.paused;
    botaoVideo.innerHTML = parado
      ? '<i class="fa-solid fa-play"></i>'
      : '<i class="fa-solid fa-pause"></i>';
    botaoVideo.setAttribute('aria-label', parado ? 'Reproduzir sinal' : 'Pausar sinal');
  }

  function carregarVideoDaPergunta(pergunta) {
    if (!videoQuiz) return;

    const fonte = pergunta && pergunta.video ? pergunta.video : '';

    if (!fonte) {
      videoQuiz.removeAttribute('src');
      videoQuiz.load();
      atualizarIconeDoVideo();
      return;
    }

    videoQuiz.src = fonte;
    videoQuiz.load();

    const promessa = videoQuiz.play();
    if (promessa && typeof promessa.catch === 'function') promessa.catch(() => {});

    atualizarIconeDoVideo();
  }

  function montarOpcao(opcao, pergunta) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'option-btn';
    botao.dataset.termo = opcao.termo;

    const imagem = document.createElement('img');
    imagem.className = 'opt-thumb';
    imagem.src = opcao.imagem;
    imagem.alt = '';
    imagem.addEventListener('error', function () { this.style.visibility = 'hidden'; });

    const bloco = document.createElement('div');

    const nome = document.createElement('div');
    nome.textContent = opcao.termo;
    bloco.appendChild(nome);

    const estado = document.createElement('span');
    estado.className = 'status-badge';
    bloco.appendChild(estado);

    botao.appendChild(imagem);
    botao.appendChild(bloco);

    botao.addEventListener('click', () => selecionarResposta(botao, opcao.termo, pergunta.termo));

    return botao;
  }

  function carregarPergunta() {
    botaoProxima.style.display = 'none';
    gradeOpcoes.innerHTML = '';

    const pergunta = perguntasAtivas[indicePerguntaAtual];

    if (!pergunta) {
      exibirResultadoFinal();
      return;
    }

    const total = perguntasAtivas.length;
    const progresso = Math.round((indicePerguntaAtual / total) * 100);

    caminhoQuiz.innerText = `${nomeCategoria} · Questão ${indicePerguntaAtual + 1} de ${total}`;
    porcentagemQuiz.innerText = `${progresso}% concluído`;
    numeroPergunta.innerText = String(indicePerguntaAtual + 1);

    document.querySelector('.quiz-header h2').innerText =
      `Qual termo de ${nomeCategoria} está sendo sinalizado?`;

    carregarVideoDaPergunta(pergunta);

    embaralhar(nomesDasOpcoes(pergunta)).forEach((nome) => {
      const opcao = termoPorNome(nome);
      if (opcao) gradeOpcoes.appendChild(montarOpcao(opcao, pergunta));
    });
  }

  function selecionarResposta(botaoEscolhido, opcaoEscolhida, opcaoCorreta) {
    const todosOsBotoes = gradeOpcoes.querySelectorAll('.option-btn');
    todosOsBotoes.forEach((botao) => { botao.disabled = true; });

    if (opcaoEscolhida === opcaoCorreta) {
      botaoEscolhido.classList.add('correct');
      botaoEscolhido.querySelector('.status-badge').innerText = '✓ Correto!';
      pontuacao += 1;

      registrarQuestaoFeita(nomeCategoria);

      botaoProxima.innerText = indicePerguntaAtual < perguntasAtivas.length - 1
        ? 'Próxima Questão →'
        : 'Finalizar Quiz 🏆';
      botaoProxima.style.display = 'block';
      return;
    }

    botaoEscolhido.classList.add('incorrect');
    botaoEscolhido.querySelector('.status-badge').innerText = 'X Errou! Reiniciando...';

    todosOsBotoes.forEach((botao) => {
      if (botao.dataset.termo === opcaoCorreta) botao.classList.add('correct');
    });

    setTimeout(() => {
      alert('Você errou uma questão! O quiz será reiniciado do começo.');
      indicePerguntaAtual = 0;
      pontuacao = 0;
      carregarPergunta();
    }, 1800);
  }

  function exibirResultadoFinal() {
    cardQuiz.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem;">
        <span style="font-size: 3.5rem;">🎉</span>
        <h2 style="margin: 10px 0; color: var(--cor-primaria);">Parabéns! Quiz Concluído!</h2>
        <p style="color: #64748b; margin-bottom: 20px;">
          Você acertou todas as ${perguntasAtivas.length} questões da categoria ${nomeCategoria}!
        </p>
        <a href="praticar.html" class="btn btn-primary">Voltar para Praticar</a>
      </div>
    `;

    gradeOpcoes.innerHTML = '';
    botaoProxima.style.display = 'none';
    porcentagemQuiz.innerText = '100% concluído';
  }

  if (botaoVideo) {
    botaoVideo.addEventListener('click', () => {
      if (!videoQuiz) return;
      if (videoQuiz.paused) {
        const promessa = videoQuiz.play();
        if (promessa && typeof promessa.catch === 'function') promessa.catch(() => {});
      } else {
        videoQuiz.pause();
      }
      atualizarIconeDoVideo();
    });
  }

  if (videoQuiz) {
    videoQuiz.addEventListener('play', atualizarIconeDoVideo);
    videoQuiz.addEventListener('pause', atualizarIconeDoVideo);
  }

  botaoProxima.addEventListener('click', () => {
    if (indicePerguntaAtual < perguntasAtivas.length - 1) {
      indicePerguntaAtual += 1;
      carregarPergunta();
    } else {
      registrarQuizConcluido(nomeCategoria);
      exibirResultadoFinal();
    }
  });

  carregarPergunta();
});
