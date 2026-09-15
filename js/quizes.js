const bancoPerguntas = {
  hardware: [
    {
      pergunta: 'Qual termo de Hardware está sendo sinalizado?',
      correta: 'Mouse',
      opcoes: [
        { nome: 'Mouse', icone: '🖱️' },
        { nome: 'Teclado', icone: '⌨️' },
        { nome: 'Monitor', icone: '🖥️' },
        { nome: 'Processador', icone: '💾' }
      ]
    },
    {
      pergunta: 'Qual termo representa a unidade de entrada do computador?',
      correta: 'Teclado',
      opcoes: [
        { nome: 'Processador', icone: '💾' },
        { nome: 'Teclado', icone: '⌨️' },
        { nome: 'Mouse', icone: '🖱️' },
        { nome: 'Monitor', icone: '🖥️' }
      ]
    },
    {
      pergunta: 'Qual periférico exibe as informações visuais na tela?',
      correta: 'Monitor',
      opcoes: [
        { nome: 'Teclado', icone: '⌨️' },
        { nome: 'Mouse', icone: '🖱️' },
        { nome: 'Monitor', icone: '🖥️' },
        { nome: 'Processador', icone: '💾' }
      ]
    }
  ],
  software: [
    {
      pergunta: 'Qual item é considerado um Sistema Operacional?',
      correta: 'Linux',
      opcoes: [
        { nome: 'Linux', icone: '🐧' },
        { nome: 'HDMI', icone: '🔌' },
        { nome: 'RAM', icone: '🎰' },
        { nome: 'Fonte', icone: '⚡' }
      ]
    },
    {
      pergunta: 'Qual software é utilizado para navegar na Web?',
      correta: 'Navegador Web',
      opcoes: [
        { nome: 'Navegador Web', icone: '🌐' },
        { nome: 'Placa Mãe', icone: '🎛️' },
        { nome: 'Cabo de Rede', icone: '🧶' },
        { nome: 'HD Externo', icone: '💽' }
      ]
    }
  ],
  redes: [
    {
      pergunta: 'Qual dispositivo conecta computadores em uma rede local?',
      correta: 'Roteador',
      opcoes: [
        { nome: 'Roteador', icone: '📡' },
        { nome: 'Monitor', icone: '🖥️' },
        { nome: 'Teclado', icone: '⌨️' },
        { nome: 'Pendrive', icone: '💾' }
      ]
    }
  ]
};

document.addEventListener('DOMContentLoaded', async () => {
  /* Carrega o progresso da conta do usuário no Supabase */
  if (window.Progresso && window.Progresso.carregar) {
    await window.Progresso.carregar();
  }

  const gradeOpcoes = document.getElementById('optionsGrid');
  const botaoProxima = document.getElementById('btnNext');
  const caminhoQuiz = document.getElementById('quizBreadcrumb');
  const porcentagemQuiz = document.getElementById('quizPercent');
  const numeroPergunta = document.getElementById('qNum');
  const cardQuiz = document.querySelector('.quiz-card');

  const parametros = new URLSearchParams(window.location.search);
  const categoriaDaUrl = parametros.get('categoria') || 'hardware';

  const perguntasAtivas = bancoPerguntas[categoriaDaUrl] || bancoPerguntas.hardware;
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

  function carregarPergunta() {
    botaoProxima.style.display = 'none';
    gradeOpcoes.innerHTML = '';

    const pergunta = perguntasAtivas[indicePerguntaAtual];
    const total = perguntasAtivas.length;
    const progresso = Math.round((indicePerguntaAtual / total) * 100);

    const nomeCategoria = categoriaDaUrl.charAt(0).toUpperCase() + categoriaDaUrl.slice(1);
    caminhoQuiz.innerText = `${nomeCategoria} · Questão ${indicePerguntaAtual + 1} de ${total}`;
    porcentagemQuiz.innerText = `${progresso}% concluído`;
    numeroPergunta.innerText = indicePerguntaAtual + 1;

    document.querySelector('.quiz-header h2').innerText = pergunta.pergunta;

    pergunta.opcoes.forEach((opcao) => {
      const botao = document.createElement('button');
      botao.className = 'option-btn';
      botao.innerHTML = `
        <span class="opt-icon">${opcao.icone}</span>
        <div>
          <div>${opcao.nome}</div>
          <span class="status-badge"></span>
        </div>
      `;

      botao.addEventListener('click', () => selecionarResposta(botao, opcao.nome, pergunta.correta));
      gradeOpcoes.appendChild(botao);
    });
  }

  function selecionarResposta(botaoEscolhido, opcaoEscolhida, opcaoCorreta) {
    const todosOsBotoes = gradeOpcoes.querySelectorAll('.option-btn');
    todosOsBotoes.forEach((botao) => { botao.style.pointerEvents = 'none'; });

    if (opcaoEscolhida === opcaoCorreta) {
      botaoEscolhido.classList.add('correct');
      botaoEscolhido.querySelector('.status-badge').innerText = '✓ Correto!';
      pontuacao++;

      registrarQuestaoFeita(categoriaDaUrl);

      botaoProxima.innerText = indicePerguntaAtual < perguntasAtivas.length - 1
        ? 'Próxima Questão →'
        : 'Finalizar Quiz 🏆';
      botaoProxima.style.display = 'block';
    } else {
      botaoEscolhido.classList.add('incorrect');
      botaoEscolhido.querySelector('.status-badge').innerText = 'X Errou! Reiniciando...';

      todosOsBotoes.forEach((botao) => {
        if (botao.innerText.includes(opcaoCorreta)) {
          botao.classList.add('correct');
        }
      });

      setTimeout(() => {
        alert('Você errou uma questão! O quiz será reiniciado do começo.');
        indicePerguntaAtual = 0;
        pontuacao = 0;
        carregarPergunta();
      }, 1800);
    }
  }

  botaoProxima.addEventListener('click', () => {
    if (indicePerguntaAtual < perguntasAtivas.length - 1) {
      indicePerguntaAtual++;
      carregarPergunta();
    } else {
      registrarQuizConcluido(categoriaDaUrl);
      exibirResultadoFinal();
    }
  });

  function exibirResultadoFinal() {
    cardQuiz.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem;">
        <span style="font-size: 3.5rem;">🎉</span>
        <h2 style="margin: 10px 0; color: var(--cor-primaria);">Parabéns! Quiz Concluído!</h2>
        <p style="color: #64748b; margin-bottom: 20px;">
          Você acertou todas as ${perguntasAtivas.length} questões da categoria ${categoriaDaUrl}!
        </p>
        <a href="praticar.html" class="btn btn-primary">Voltar para Praticar</a>
      </div>
    `;
    gradeOpcoes.innerHTML = '';
    botaoProxima.style.display = 'none';
    porcentagemQuiz.innerText = '100% concluído';
  }

  carregarPergunta();
});
