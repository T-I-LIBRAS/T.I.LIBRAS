const dados = bancoSinalario;

const mapaDePontos = {
  Hardware: 'purple',
  Software: 'blue',
  'Programação': 'yellow',
  Eletricidade: 'red',
  Redes: 'green'
};

/* Cores de cada área alinhadas com a paleta da nova logo */
const coresDasAreas = {
  Hardware: '#783cc8',
  Software: '#3c8cdc',
  'Programação': '#f59e0b',
  Eletricidade: '#ef4444',
  Redes: '#10b981'
};

/* Ícones das áreas: exatamente os mesmos usados na página Praticar (Font Awesome 6) */
const iconesDasAreas = {
  Hardware: 'fa-desktop',
  Software: 'fa-compact-disc',
  'Programação': 'fa-laptop-code',
  Eletricidade: 'fa-plug',
  Redes: 'fa-tower-broadcast'
};

/* Ícone do campo de filtro. "Todas as áreas" usa ícone genérico (sem troféu). */
const iconesDoFiltro = {
  todos: 'fa-shapes',
  hardware: 'fa-desktop',
  software: 'fa-compact-disc',
  programacao: 'fa-laptop-code',
  eletricidade: 'fa-plug',
  redes: 'fa-tower-broadcast',
  favoritos: 'fa-heart'
};

/* Sincroniza o custom select com o valor escolhido: marca o item ativo no menu
   e replica no gatilho o rótulo + o ícone (com a classe de cor da área, que o
   CSS colore com a paleta oficial). Substitui o antigo #filterIcon solto. */
function atualizarIconeDoFiltro(valor) {
  const gatilho = document.getElementById('categoryTrigger');
  if (!gatilho) return;

  gatilho.dataset.value = valor;

  document.querySelectorAll('.custom-option').forEach((opcao) => {
    opcao.classList.toggle('active', opcao.dataset.value === valor);
  });

  const modelo = document.querySelector(`.custom-option[data-value="${valor}"]`);
  const selecionado = gatilho.querySelector('.selected-option');
  if (modelo && selecionado) selecionado.innerHTML = modelo.innerHTML;

  /* Rede de segurança: garante o glifo oficial da área (iconesDoFiltro) e a
     classe de cor icon-<valor>, espelhando o data-value do item escolhido */
  const icone = gatilho.querySelector('.selected-option i');
  if (icone) {
    icone.className = `fa-solid ${iconesDoFiltro[valor] || 'fa-shapes'} icon-${valor}`;
  }
}

/* Valores disponíveis no filtro (lidos do próprio menu customizado) */
function valoresDoFiltroDisponiveis() {
  return [...document.querySelectorAll('.custom-option')].map((opcao) => opcao.dataset.value);
}

let categoriaSelecionada = 'todos';
let busca = '';
let termoAtual = dados[0];

let playerYT = null;
let ytPronto = false;
let videoIdPendente = '';
let timerDoVisto = null;
let vigiaDoVideo = null;
let visto = { termo: null, tempoOk: false, videoTerminou: false };

/* Estado da barra de controles customizada */
let velocidadeAtual = 1;      /* 0.5x / 0.75x / 1x — câmera lenta da Libras */
let arrastandoBarra = false;  /* trava o relógio enquanto o usuário arrasta */

function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function extrairIdDoVideo(entrada) {
  if (!entrada) return '';
  const resultado = entrada.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return resultado ? resultado[1] : entrada.trim();
}

/* ------------------- Progresso do usuário (Supabase) ------------------- */

function progressoDisponivel() {
  return !!(window.Progresso && window.Progresso.carregar);
}

function obterFavoritos() {
  return progressoDisponivel() ? window.Progresso.favoritos() : [];
}

function reiniciarVisto(termo) {
  if (timerDoVisto) {
    clearTimeout(timerDoVisto);
    timerDoVisto = null;
  }
  visto = { termo: termo, tempoOk: false, videoTerminou: false };
  timerDoVisto = setTimeout(() => {
    if (visto && visto.termo === termo) {
      visto.tempoOk = true;
      marcarComoVisto();
    }
  }, 10000);
}

function marcarComoVisto() {
  if (!visto || !visto.termo) return;
  if (!(visto.tempoOk && visto.videoTerminou)) return;
  if (!progressoDisponivel()) return;
  if (window.Progresso.adicionarSinalVisto(visto.termo)) renderizarLista();
}

/* ------------------------- Player do YouTube ------------------------- */

/* A partir daqui o vídeo é 100% controlado pela YouTube Iframe Player API
   (script https://www.youtube.com/iframe_api carregado no <head>): não existe
   mais troca manual de src no iframe e nenhuma regra de CSS desloca o player
   para esconder a barra nativa — quem esconde é o playerVars abaixo. */

/* Parâmetros do player. TODOS os controles nativos do YouTube são desligados
   aqui — a interação fica 100% na barra customizada abaixo do vídeo (ver
   .player-controls no CSS e configurarControlesDoPlayer no JS).
   · controls: 0        → esconde a barra nativa de reprodução;
   · disablekb: 1       → desativa os atalhos de teclado nativos (o teclado
     continua funcionando, mas pela nossa barra de progresso);
   · modestbranding: 1  → remove a marca d'água grande;
   · rel: 0             → impede a grade de vídeos recomendados no final;
   · showinfo: 0        → esconde título/canal no topo (parâmetro legado que
     o player ainda lê em algumas versões);
   · fs: 0              → desativa o botão nativo de tela cheia;
   · iv_load_policy: 3  → oculta as anotações sobrepostas ao vídeo.
   O autoplay: 1 e o loop: 1 são preservados: o sinal continua começando
   sozinho ao escolher o termo e reiniciando no fim (reforçado no ENDED). */
const PARAMETROS_DO_PLAYER = {
  'controls': 0,
  'disablekb': 1,
  'modestbranding': 1,
  'rel': 0,
  'showinfo': 0,
  'fs': 0,
  'iv_load_policy': 3,
  'autoplay': 1,
  'loop': 1
};

/* ID do vídeo do termo que está no card central (vazio se ainda não houver) */
function videoIdDoTermoAtual() {
  return termoAtual ? extrairIdDoVideo(termoAtual.youtubeId) : '';
}

/* O objeto só responde aos getters depois que a API termina o onReady */
function playerDisponivel() {
  return typeof YT !== 'undefined'
    && !!playerYT
    && ytPronto
    && typeof playerYT.getDuration === 'function';
}

function formatarTempo(segundos) {
  const total = Number.isFinite(segundos) && segundos > 0 ? Math.floor(segundos) : 0;
  const minutos = Math.floor(total / 60);
  const resto = total % 60;
  return `${minutos}:${String(resto).padStart(2, '0')}`;
}

/* ------------------ Espelho visual dos controles ------------------ */

function atualizarBotaoPlayPause() {
  const botao = document.getElementById('btnPlayPause');
  if (!botao) return;

  const tocando = playerDisponivel()
    && typeof playerYT.getPlayerState === 'function'
    && playerYT.getPlayerState() === YT.PlayerState.PLAYING;

  botao.innerHTML = tocando
    ? '<i class="fa-solid fa-pause"></i>'
    : '<i class="fa-solid fa-play"></i>';
  botao.setAttribute('aria-label', tocando ? 'Pausar vídeo' : 'Reproduzir vídeo');
  botao.title = tocando ? 'Pausar' : 'Reproduzir';
}

/* O navegador só libera o autoplay de vídeo MUDO e, com controls: 0, a barra
   nativa do YouTube leva embora o botão de som. Este é o espelho desse botão,
   sem o qual o sinal ficaria silencioso e sem saída para o usuário. */
function atualizarBotaoSom() {
  const botao = document.getElementById('btnMute');
  if (!botao) return;

  const mudo = !playerDisponivel() || playerYT.isMuted();

  botao.innerHTML = mudo
    ? '<i class="fa-solid fa-volume-xmark"></i>'
    : '<i class="fa-solid fa-volume-high"></i>';
  botao.setAttribute('aria-label', mudo ? 'Ativar som' : 'Desativar som');
  botao.title = mudo ? 'Ativar som' : 'Desativar som';
}

function alternarSom() {
  if (!playerDisponivel()) return;

  if (playerYT.isMuted()) {
    playerYT.unMute();
    playerYT.setVolume(100);
  } else {
    playerYT.mute();
  }
  atualizarBotaoSom();
}

/* Pinta a trilha, a bolinha e o relógio de uma vez (usado pelo tique
   automático, pelo arraste e pelo teclado) */
function pintarProgresso(porcentagem, atual, duracao) {
  const preenchimento = document.getElementById('playerProgressFill');
  const barra = document.getElementById('playerProgress');
  const relogio = document.getElementById('playerTime');

  if (preenchimento) preenchimento.style.width = `${porcentagem}%`;
  if (barra) barra.setAttribute('aria-valuenow', String(Math.round(porcentagem)));
  if (relogio) relogio.textContent = `${formatarTempo(atual)} / ${formatarTempo(duracao)}`;
}

function atualizarBarraDeProgresso() {
  if (arrastandoBarra || !playerDisponivel()) return;

  const duracao = playerYT.getDuration();
  const atual = playerYT.getCurrentTime();
  const porcentagem = duracao > 0
    ? Math.min(100, Math.max(0, (atual / duracao) * 100))
    : 0;

  pintarProgresso(porcentagem, atual, duracao);

  /* Trecho já carregado: some com a estimativa quando o player ainda não a tem */
  if (typeof playerYT.getVideoLoadedFraction === 'function') {
    const buffer = document.getElementById('playerProgressBuffer');
    if (buffer) buffer.style.width = `${playerYT.getVideoLoadedFraction() * 100}%`;
  }
}

/* Com loop infinito o evento ENDED pode nunca disparar, porque o YouTube
   reinicia o vídeo sozinho. Este tique periódico mantém a barra viva e
   contabiliza o termo como visto quando a reprodução chega ao fim. */
function iniciarVigiaDoVideo() {
  if (vigiaDoVideo) return;
  vigiaDoVideo = setInterval(() => {
    if (!playerDisponivel()) return;

    atualizarBarraDeProgresso();

    if (!visto || !visto.termo || visto.videoTerminou) return;

    const duracao = playerYT.getDuration();
    const atual = playerYT.getCurrentTime();
    if (duracao > 0 && atual > 0 && atual >= duracao - 1) {
      visto.videoTerminou = true;
      marcarComoVisto();
    }
  }, 250);
}

function carregarVideo(videoId) {
  if (!videoId) return;

  if (playerYT && ytPronto) {
    /* Zera barra e relógio na hora: sem isso o termo novo ficaria exibindo a
       posição do anterior enquanto o vídeo carrega */
    pintarProgresso(0, 0, 0);

    /* A API cuida do autoplay; o loop é garantido no handler de ENDED */
    playerYT.loadVideoById(videoId);
    return;
  }

  /* API ainda não pronta (primeira carga): o ID fica guardado e o
     onYouTubeIframeAPIReady já monta o player no vídeo certo */
  videoIdPendente = videoId;
}

function onYouTubeIframeAPIReady() {
  const idInicial = videoIdPendente || videoIdDoTermoAtual();

  playerYT = new YT.Player('ytPlayer', {
    videoId: idInicial,
    /* O card do vídeo é quem define o tamanho real (680px de teto + 16:9 do
       .video-wrapper-yt). Passar as porcentagens aqui evita que o iframe
       nasça com os 640x390 padrão da API antes do CSS entrar em ação. */
    width: '100%',
    height: '100%',
    /* controls: 0 → a interface nativa pesada Some; o resto (modestbranding,
       rel, loop e autoplay) mantém o sinal limpo e em repetição contínua */
    playerVars: PARAMETROS_DO_PLAYER,
    events: {
      onReady: () => {
        ytPronto = true;

        /* A API volta para 1x ao carregar um vídeo novo: reaplica a
           velocidade escolhida no seletor e sincroniza os controles */
        if (typeof playerYT.setPlaybackRate === 'function') {
          playerYT.setPlaybackRate(velocidadeAtual);
        }
        atualizarBotaoPlayPause();
        atualizarBotaoSom();
        atualizarBarraDeProgresso();
        iniciarVigiaDoVideo();

        /* Termo trocado antes de o player ficar pronto: aplica agora */
        if (videoIdPendente && videoIdPendente !== idInicial) {
          playerYT.loadVideoById(videoIdPendente);
        }
        videoIdPendente = '';
      },
      onStateChange: (evento) => {
        /* Cada troca de estado revalida o ícone (o YouTube também pausa
           sozinho quando a aba perde o foco, por exemplo) */
        atualizarBotaoPlayPause();
        atualizarBotaoSom();

        if (evento.data === YT.PlayerState.PLAYING) {
          if (typeof playerYT.setPlaybackRate === 'function') {
            playerYT.setPlaybackRate(velocidadeAtual);
          }
          atualizarBarraDeProgresso();
          return;
        }

        if (evento.data !== YT.PlayerState.ENDED) return;

        if (visto && visto.termo) {
          visto.videoTerminou = true;
          marcarComoVisto();
        }

        /* Loop infinito garantido: reinicia do zero mesmo quando o parâmetro
           playlist ainda aponta para o vídeo anterior */
        try {
          playerYT.seekTo(0, true);
          playerYT.playVideo();
        } catch (erro) {
          /* player indisponível (troca rápida de termo): ignora */
        }
      }
    }
  });
}

/* ------------------- Barra de controles customizada ------------------- */

function aplicarVelocidade(velocidade) {
  velocidadeAtual = velocidade;

  document.querySelectorAll('.player-speed-btn').forEach((botao) => {
    const ativo = parseFloat(botao.dataset.speed) === velocidade;
    botao.classList.toggle('active', ativo);
    botao.setAttribute('aria-pressed', ativo ? 'true' : 'false');
  });

  if (playerDisponivel() && typeof playerYT.setPlaybackRate === 'function') {
    playerYT.setPlaybackRate(velocidade);
  }
}

function alternarPlayPause() {
  if (!playerDisponivel()) return;

  if (playerYT.getPlayerState() === YT.PlayerState.PLAYING) {
    playerYT.pauseVideo();
  } else {
    playerYT.playVideo();
  }
  atualizarBotaoPlayPause();
}

/* Replay: volta 5 segundos para rever o sinal sem reiniciar o vídeo */
function voltarCincoSegundos() {
  if (!playerDisponivel()) return;

  playerYT.seekTo(Math.max(0, playerYT.getCurrentTime() - 5), true);
  atualizarBarraDeProgresso();
}

function buscarPosicaoNaBarra(evento) {
  const barra = document.getElementById('playerProgress');
  if (!barra) return 0;

  const caixa = barra.getBoundingClientRect();
  const proporcao = caixa.width > 0 ? (evento.clientX - caixa.left) / caixa.width : 0;
  return Math.min(1, Math.max(0, proporcao));
}

function aplicarPosicaoNaBarra(proporcao) {
  if (!playerDisponivel()) return;

  const duracao = playerYT.getDuration();
  if (!duracao) return;

  const alvo = proporcao * duracao;
  playerYT.seekTo(alvo, true);
  pintarProgresso(proporcao * 100, alvo, duracao);
}

function configurarBarraDeProgresso() {
  const barra = document.getElementById('playerProgress');
  if (!barra) return;

  /* Clique simples: salta direto para o ponto clicado */
  barra.addEventListener('click', (evento) => {
    aplicarPosicaoNaBarra(buscarPosicaoNaBarra(evento));
  });

  /* Arraste: segue o ponteiro enquanto o botão estiver pressionado */
  barra.addEventListener('pointerdown', (evento) => {
    arrastandoBarra = true;
    if (barra.setPointerCapture) barra.setPointerCapture(evento.pointerId);
    aplicarPosicaoNaBarra(buscarPosicaoNaBarra(evento));

    const aoMover = (movimento) => aplicarPosicaoNaBarra(buscarPosicaoNaBarra(movimento));
    const aoSoltar = () => {
      arrastandoBarra = false;
      barra.removeEventListener('pointermove', aoMover);
      barra.removeEventListener('pointerup', aoSoltar);
      barra.removeEventListener('pointercancel', aoSoltar);
    };

    barra.addEventListener('pointermove', aoMover);
    barra.addEventListener('pointerup', aoSoltar);
    barra.addEventListener('pointercancel', aoSoltar);
  });

  /* Teclado (a barra é focável): setas avançam/voltam 5 segundos */
  barra.addEventListener('keydown', (evento) => {
    if (evento.key !== 'ArrowRight' && evento.key !== 'ArrowLeft') return;
    if (!playerDisponivel()) return;

    const duracao = playerYT.getDuration();
    if (!duracao) return;

    const passo = evento.key === 'ArrowRight' ? 5 : -5;
    const alvo = Math.min(duracao, Math.max(0, playerYT.getCurrentTime() + passo));
    evento.preventDefault();
    playerYT.seekTo(alvo, true);
    pintarProgresso((alvo / duracao) * 100, alvo, duracao);
  });
}

function configurarControlesDoPlayer() {
  const botaoPlay = document.getElementById('btnPlayPause');
  if (botaoPlay) botaoPlay.addEventListener('click', alternarPlayPause);

  const botaoReplay = document.getElementById('btnReplay');
  if (botaoReplay) botaoReplay.addEventListener('click', voltarCincoSegundos);

  const botaoSom = document.getElementById('btnMute');
  if (botaoSom) botaoSom.addEventListener('click', alternarSom);

  document.querySelectorAll('.player-speed-btn').forEach((botao) => {
    botao.addEventListener('click', () => aplicarVelocidade(parseFloat(botao.dataset.speed)));
  });

  configurarBarraDeProgresso();
  aplicarVelocidade(velocidadeAtual);
}

function alternarFavorito(nomeDoTermo) {
  if (!progressoDisponivel()) return;
  window.Progresso.alternarFavorito(nomeDoTermo);
  renderizarLista();
  exibirTermoAtual();
}

function filtrarDados() {
  const favoritos = obterFavoritos();
  return dados.filter((item) => {
    const bateCategoria = categoriaSelecionada === 'todos'
      ? true
      : categoriaSelecionada === 'favoritos'
        ? favoritos.includes(item.term)
        : normalizar(item.cat) === categoriaSelecionada;
    const bateBusca = item.term.toLowerCase().includes(busca.toLowerCase());
    return bateCategoria && bateBusca;
  });
}

function renderizarLista() {
  const container = document.getElementById('termsList');
  const filtrados = filtrarDados();

  document.getElementById('termsCount').textContent =
    `${filtrados.length} ${filtrados.length === 1 ? 'TERMO' : 'TERMOS'}`;
  container.innerHTML = '';

  const favoritos = obterFavoritos();

  filtrados.forEach((item) => {
    const ativo = !!(termoAtual && termoAtual.term === item.term);
    const ehFavorito = favoritos.includes(item.term);
    const cor = coresDasAreas[item.cat] || '#783cc8';

    const linha = document.createElement('div');
    linha.className = `term-item${ativo ? ' active' : ''}`;
    linha.innerHTML = `
      <div class="term-item-content">
        <span class="dot ${mapaDePontos[item.cat] || 'purple'}"></span>
        <div class="term-text">
          <strong>${item.term}</strong>
          <small>${item.cat}</small>
        </div>
      </div>
      <button class="btn-fav" title="Favoritar">
        ${ehFavorito
          ? '<i class="fa-solid fa-heart" style="color: #D63031;"></i>'
          : '<i class="fa-regular fa-heart"></i>'}
      </button>
    `;

    if (ativo) {
      linha.style.borderColor = cor;
      linha.style.backgroundColor = cor + '1a';
    }

    /* Nome SEMPRE preto; apenas o item ativo mantém a cor da área como destaque */
    const nomeEl = linha.querySelector('.term-item-content strong');
    if (ativo && nomeEl && coresDasAreas[item.cat]) {
      nomeEl.style.color = coresDasAreas[item.cat];
    }

    linha.querySelector('.term-item-content').addEventListener('click', () => {
      termoAtual = item;
      renderizarLista();
      exibirTermoAtual();
    });

    linha.querySelector('.btn-fav').addEventListener('click', (evento) => {
      evento.stopPropagation();
      alternarFavorito(item.term);
    });

    container.appendChild(linha);
  });
}

function exibirTermoAtual() {
  if (!termoAtual) return;

  reiniciarVisto(termoAtual.term);

  const favoritos = obterFavoritos();
  const ehFavorito = favoritos.includes(termoAtual.term);
  const cor = coresDasAreas[termoAtual.cat] || '#783cc8';

  const cabecalho = document.getElementById('termHeader');
  if (cabecalho) cabecalho.style.background = cor;

  document.getElementById('displayTerm').textContent = termoAtual.term;
  document.getElementById('displayCategory').textContent = termoAtual.cat.toUpperCase();
  document.getElementById('displayDef').textContent = termoAtual.def;

  const iconeCategoria = document.getElementById('displayCategoryIcon');
  if (iconeCategoria) {
    iconeCategoria.className = `fa-solid ${iconesDasAreas[termoAtual.cat] || 'fa-folder-open'}`;
  }

  document.getElementById('displayExPt').textContent = `"${termoAtual.exPt}"`;
  document.getElementById('displayExGlosa').textContent = termoAtual.exGlosa;

  const imagemEl = document.getElementById('termImage');
  const placeholder = document.getElementById('imgPlaceholder');
  if (imagemEl && placeholder) {
    const slug = normalizar(termoAtual.term).replace(/\s+/g, '-');
    placeholder.style.display = 'none';
    imagemEl.style.display = '';

    /* Termo ainda sem imagem: mostra o placeholder em vez de um ícone quebrado */
    imagemEl.onerror = () => {
      imagemEl.style.display = 'none';
      placeholder.style.display = 'flex';
    };

    imagemEl.src = `img/${slug}.png`;
  }

  if (termoAtual.youtubeId) {
    carregarVideo(extrairIdDoVideo(termoAtual.youtubeId));
  }

  const botaoFavorito = document.getElementById('btnMainFav');
  if (botaoFavorito) {
    botaoFavorito.innerHTML = ehFavorito
      ? '<i class="fa-solid fa-heart" style="color: #D63031;"></i>'
      : '<i class="fa-regular fa-heart"></i>';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (progressoDisponivel()) {
    await window.Progresso.carregar();
  }

  document.getElementById('searchInput').addEventListener('input', (evento) => {
    busca = evento.target.value;
    renderizarLista();
  });

  /* Custom select de áreas: toggle do menu, aplicação do filtro e fechamento
     por clique fora ou tecla Esc */
  const containerDoFiltro = document.getElementById('categoryCustomSelect');
  const gatilhoDoFiltro = document.getElementById('categoryTrigger');

  if (containerDoFiltro && gatilhoDoFiltro) {
    const fecharMenuDoFiltro = () => {
      containerDoFiltro.classList.remove('open');
      gatilhoDoFiltro.setAttribute('aria-expanded', 'false');
    };

    gatilhoDoFiltro.addEventListener('click', () => {
      const aberto = containerDoFiltro.classList.toggle('open');
      gatilhoDoFiltro.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });

    containerDoFiltro.querySelectorAll('.custom-option').forEach((opcao) => {
      opcao.addEventListener('click', () => {
        categoriaSelecionada = opcao.dataset.value;
        atualizarIconeDoFiltro(categoriaSelecionada);
        fecharMenuDoFiltro();
        renderizarLista();
      });
    });

    document.addEventListener('click', (evento) => {
      if (!containerDoFiltro.contains(evento.target)) fecharMenuDoFiltro();
    });

    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape') fecharMenuDoFiltro();
    });
  }

  document.getElementById('btnMainFav').addEventListener('click', () => {
    if (termoAtual) alternarFavorito(termoAtual.term);
  });

  /* Barra de controles customizada: play/pause, voltar 5s, velocidade e
     progresso. Fica ligada uma única vez, independente do termo exibido. */
  configurarControlesDoPlayer();

  /* Sempre que o progresso vier do Supabase (login/troca de conta),
     a interface é reconstruída com os dados da conta do usuário. */
  window.addEventListener('progresso-carregado', () => {
    renderizarLista();
    exibirTermoAtual();
  });

  const parametros = new URLSearchParams(window.location.search);
  const categoriaDaUrl = parametros.get('cat');
  if (categoriaDaUrl) {
    const catNormalizada = normalizar(categoriaDaUrl);
    if (valoresDoFiltroDisponiveis().includes(catNormalizada)) {
      categoriaSelecionada = catNormalizada;
    }
  }

  atualizarIconeDoFiltro(categoriaSelecionada);
  renderizarLista();

  if (categoriaDaUrl) {
    const filtrados = filtrarDados();
    if (filtrados.length > 0) {
      termoAtual = filtrados[0];
      renderizarLista();
    }
  }

  exibirTermoAtual();

  /* Rede de segurança: se a API do YouTube já estava carregada quando este
     script rodou, o callback global teria disparado antes desta declaração.
     Como o alvo é o <div id="ytPlayer">, inicializa o player de qualquer forma. */
  if (!playerYT && typeof YT !== 'undefined' && YT.Player) {
    onYouTubeIframeAPIReady();
  }
});
