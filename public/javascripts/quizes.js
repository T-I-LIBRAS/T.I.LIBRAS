const FORMAS_DAS_ALTERNATIVAS = [
  { classe: 'forma-a', letra: 'A' },
  { classe: 'forma-b', letra: 'B' },
  { classe: 'forma-c', letra: 'C' },
  { classe: 'forma-d', letra: 'D' }
];

const CATEGORIAS_DO_QUIZ = {
  hardware: 'Hardware',
  software: 'Software',
  programacao: 'Programação',
  eletricidade: 'Eletricidade',
  redes: 'Redes'
};

function termosDoProjeto() {
  return typeof TERMOS_LOCAIS !== 'undefined' && Array.isArray(TERMOS_LOCAIS)
    ? TERMOS_LOCAIS
    : [];
}

function termoPorNome(nome) {
  return termosDoProjeto().find((item) => item.termo === nome) || null;
}

function nomeDaCategoria(chave) {
  return CATEGORIAS_DO_QUIZ[String(chave || '').toLowerCase()] || 'Hardware';
}

function nomesDasOpcoes(pergunta) {
  const opcoes = Array.isArray(pergunta.opcoes) ? pergunta.opcoes : [];
  const validas = opcoes.filter((nome) => termoPorNome(nome));

  if (validas.includes(pergunta.termo)) return validas;
  return [pergunta.termo, ...validas];
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!await TentativasQuiz.carregar()) {
    document.getElementById('quizBreadcrumb').textContent = 'Recarregue a página para retomar seu quiz.';
    return;
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

  const termos = termosDoProjeto().filter((item) => item.categoria === nomeCategoria);
  const { perguntas: perguntasAtivas, respostas } = TentativasQuiz.abrir(nomeCategoria, termos);
  let indicePerguntaAtual = respostas.length;

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
      if (window.VideoYoutube) window.VideoYoutube.esconder(videoQuiz);
      videoQuiz.style.display = '';
      if (botaoVideo) botaoVideo.style.display = '';
      videoQuiz.removeAttribute('src');
      videoQuiz.load();
      atualizarIconeDoVideo();
      return;
    }

    // Link do YouTube: toca no iframe (o botão de play/pause do <video> não se aplica).
    const ehYoutube = !!(window.VideoYoutube && window.VideoYoutube.exibir(videoQuiz, fonte, { controles: false }));
    if (botaoVideo) botaoVideo.style.display = ehYoutube ? 'none' : '';
    if (ehYoutube) return;

    videoQuiz.src = fonte;
    videoQuiz.load();

    const promessa = videoQuiz.play();
    if (promessa && typeof promessa.catch === 'function') promessa.catch(() => {});

    atualizarIconeDoVideo();
  }

  function montarOpcao(opcao, pergunta, indice) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'option-btn';
    botao.dataset.termo = opcao.termo;

    const forma = FORMAS_DAS_ALTERNATIVAS[indice % FORMAS_DAS_ALTERNATIVAS.length];
    const marcador = document.createElement('span');
    marcador.className = `forma-opcao ${forma.classe}`;
    marcador.textContent = forma.letra;
    marcador.setAttribute('aria-hidden', 'true');
    botao.appendChild(marcador);

    const bloco = document.createElement('div');

    const nome = document.createElement('div');
    nome.textContent = opcao.termo;
    bloco.appendChild(nome);

    const estado = document.createElement('span');
    estado.className = 'status-badge';
    bloco.appendChild(estado);

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

    TentativasQuiz.embaralhar(nomesDasOpcoes(pergunta)).forEach((nome, indice) => {
      const opcao = termoPorNome(nome);
      if (opcao) gradeOpcoes.appendChild(montarOpcao(opcao, pergunta, indice));
    });
  }

  function selecionarResposta(botaoEscolhido, opcaoEscolhida, opcaoCorreta) {
    if (respostas.length !== indicePerguntaAtual) return;
    const todosOsBotoes = gradeOpcoes.querySelectorAll('.option-btn');
    todosOsBotoes.forEach((botao) => { botao.disabled = true; });

    const acertou = opcaoEscolhida === opcaoCorreta;
    respostas.push(acertou);
    window.Progresso.incrementarPontuacao(nomeCategoria, { questoes_feitas: 1 });
    TentativasQuiz.registrar(nomeCategoria, perguntasAtivas, respostas);
    if (acertou) {
      botaoEscolhido.classList.add('correct');
      botaoEscolhido.querySelector('.status-badge').innerText = '✓ Correto!';
    } else {
      botaoEscolhido.classList.add('incorrect');
      botaoEscolhido.querySelector('.status-badge').innerText = 'X Incorreto';

      todosOsBotoes.forEach((botao) => {
        if (botao.dataset.termo === opcaoCorreta) {
          botao.classList.add('correct');
          botao.querySelector('.status-badge').innerText = '✓ Resposta certa';
        }
      });
    }

    botaoProxima.innerText = indicePerguntaAtual < perguntasAtivas.length - 1
      ? 'Próxima Questão →'
      : 'Ver resultado 🏆';
    botaoProxima.style.display = 'block';
  }

  function exibirResultadoFinal() {
    const { acertos: pontuacao, erros } = TentativasQuiz.placar(respostas);

    cardQuiz.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem;">
        <span style="font-size: 3.5rem;">🏁</span>
        <h2 style="margin: 10px 0; color: var(--cor-primaria);">Quiz concluído!</h2>
        <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; margin: 18px 0;">
          <div style="min-width: 130px; padding: 14px 18px; border-radius: 10px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46;">
            <div style="font-size: 2.2rem; font-weight: 800; line-height: 1.1;">${pontuacao}</div>
            <div style="font-weight: 700;">✓ Acertos</div>
          </div>
          <div style="min-width: 130px; padding: 14px 18px; border-radius: 10px; background: #fef2f2; border: 1px solid #fecaca; color: #991b1b;">
            <div style="font-size: 2.2rem; font-weight: 800; line-height: 1.1;">${erros}</div>
            <div style="font-weight: 700;">✗ Erros</div>
          </div>
        </div>
        <p style="color: #64748b; margin-bottom: 20px;">
          ${TentativasQuiz.resumoResultado(nomeCategoria, respostas)}
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
    if (respostas.length !== indicePerguntaAtual + 1) return;
    if (indicePerguntaAtual < perguntasAtivas.length - 1) {
      indicePerguntaAtual += 1;
      carregarPergunta();
    } else {
      exibirResultadoFinal();
    }
  });

  carregarPergunta();
});
