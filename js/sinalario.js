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

let timerDoVisto = null;
let visto = { termo: null, tempoOk: false, videoTerminou: false };

function normalizar(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function extrairIdDoVideo(entrada) {
  if (!entrada) return '';
  const resultado = entrada.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return resultado ? resultado[1] : entrada.trim();
}

/* Um id do YouTube tem sempre 11 caracteres de [A-Za-z0-9_-]. O banco traz
   "SEU_ID_AQUI" nos termos ainda sem vídeo: sem esta checagem, loadVideoById
   receberia um id inexistente e o embed mostraria o letreiro cinza de erro */
function idDeVideoValido(id) {
  return typeof id === 'string' && /^[\w-]{11}$/.test(id);
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

/* ==========================================================================
   PLAYER · YOUTUBE IFRAME PLAYER API OFICIAL (sem nenhuma biblioteca)

   O Plyr saiu do projeto por completo: não existe instância, script, CDN,
   folha de estilo, MutationObserver nem hack da biblioteca antiga. O embed é
   criado pela API oficial (script no <head> do sinalario.html) e a interface
   é 100% do projeto — a barra roxa (.barra-sinalario, #6C5CE7), montada no
   HTML e ligada aos métodos nativos logo abaixo.

   O que mantém o centro da tela limpo em TODAS as ações:

   1) playerVars travam a interface do Google (controls: 0, disablekb: 1,
      modestbranding: 1, rel: 0, playsinline: 1, fs: 0, cc_load_policy: 0,
      iv_load_policy: 3). Sobraria a faixa de título do hover — e ela nunca
      aparece porque:

   2) o wrapper do vídeo tem pointer-events: none (css/sinalario.css): nenhum
      clique, hover ou arrasto alcança o iframe, então nenhum overlay nativo
      é ativado — nem a barra cinza, nem o título, nem o botão central;

   3) o botão central redondo do YouTube só nasce nos estados PAUSED (2) e
      CUED (5), desenhados DENTRO do iframe (nenhum seletor desta página os
      alcança). Por isso o "pause" da barra roxa é um CONGELAMENTO:
      setPlaybackRate(0) para a imagem e o tempo com o embed seguindo em
      PLAYING — nenhum dos estados proibidos é atingido. Se o embed recusar a
      taxa 0, o quadro passa a ser segurado por seekTo (reserva), sempre em
      PLAYING. pauseVideo() não é chamado em nenhum caminho — é exatamente o
      PAUSED que ele cria o estado que desenha o botão central;

   4) o loop é feito à mão: ao chegar em duration - 0.15s o vídeo volta com
      seekTo(0, true), então o embed nunca entra em ENDED — o estado que
      desenha a sobreposição de fim de vídeo sobre o último quadro, em cima
      das mãos da intérprete.
   ========================================================================== */

const ESTADO_DO_YOUTUBE = {
  NAO_INICIADO: -1,
  FINALIZADO: 0,
  REPRODUZINDO: 1,
  PAUSADO: 2,
  BUFFERIZANDO: 3,
  EM_ESPERA: 5            // "cued": o outro estado que desenha o botão central
};

const VELOCIDADES = [0.25, 0.5, 0.75, 1];  // 0.25x para o estudo da Libras
const ANTECEDENCIA_DO_LOOP = 0.15;         // s antes do último quadro
const INTERVALO_DA_BARRA = 50;             // ms: tique do progresso e do loop
const MINIMO_ENTRE_REINICIOS = 250;        // ms: impede dois seeks no mesmo ciclo
const INTERVALO_DA_RESERVA = 150;          // ms entre uma segurada de quadro e outra
const CONFERENCIA_DA_TAXA = 300;           // ms para o embed confirmar a taxa 0
const CODIGOS_DE_VIDEO_INDISPONIVEL = [2, 5, 100, 101, 150];

let player = null;              // instância YT.Player: fonte única do vídeo
let playerPronto = false;
let videoIdAtual = '';
let videoIdPendente = null;     // null = nada pendente
let videoIndisponivel = false;  // termo sem vídeo cadastrado (aviso na tela)
let sinalCongelado = false;
let velocidadeDoSinal = 1;      // velocidade da barra, guardada para o play
let instanteDoSinal = 0;        // quadro segurado no modo de reserva
let reservaDoQuadro = null;
let conferenciaDaTaxa = null;
let ultimoReinicioDoLoop = 0;
let ultimoEstadoDoEmbed = null;
let arrastandoProgresso = false;
let tiqueDaBarra = null;

/* Diagnóstico de validação, sem ruído no console: no DevTools do navegador,
   `loopDoSinalario.reinicios` mostra quantas vezes o ciclo voltou ao segundo 0
   e `loopDoSinalario.resgates` quantas dessas vezes o embed teve de ser
   arrancado de um estado proibido (ENDED/CUED). `resgates` zerado é o atestado
   de que o loop nunca deixou a mídia sair de PLAYING — ou seja, nenhum botão
   central teve chance de ser desenhado. */
const diagnosticoDoLoop = { reinicios: 0, resgates: 0 };
window.loopDoSinalario = diagnosticoDoLoop;

/* Elementos da barra roxa, cacheados uma única vez: o tique roda a cada 50ms e
   não pode varrer o DOM a cada leitura */
const barraRoxa = {
  botaoPlay: null,
  botaoRetroceder: null,
  botaoVelocidade: null,
  progresso: null,
  preenchido: null,
  tempo: null,
  aviso: null
};

function playerEstaUtil() {
  return !!(
    player &&
    typeof player.getCurrentTime === 'function' &&
    typeof player.getDuration === 'function' &&
    typeof player.seekTo === 'function' &&
    typeof player.getPlayerState === 'function'
  );
}

/* -------------------- Montagem pela API oficial -------------------- */

function primeiroIdValido(...candidatos) {
  return candidatos.map(extrairIdDoVideo).find(idDeVideoValido) || '';
}

function criarPlayerDoYoutube() {
  if (player || !window.YT || typeof window.YT.Player !== 'function') return;

  const alvo = document.getElementById('player');
  if (!alvo) return;

  /* Vídeo inicial: o data-video-id do HTML ou, se ele não for um id válido, o
     primeiro termo do banco que tenha vídeo */
  videoIdAtual = primeiroIdValido(
    alvo.dataset ? alvo.dataset.videoId : '',
    ...dados.map((item) => item.youtubeId)
  );

  if (!videoIdAtual) {
    videoIndisponivel = true;
    mostrarVideoIndisponivel(true);
    atualizarControlesHabilitados();
    return;
  }

  /* A API substitui a div #player pelo iframe do embed. Nenhum <iframe> é
     escrito à mão no HTML: nunca existem dois players na tela, nem a moldura
     nativa do YouTube por baixo. */
  player = new YT.Player('player', {
    videoId: videoIdAtual,
    playerVars: {
      controls: 0,         // sem a barra cinza nativa do YouTube
      disablekb: 1,        // sem os atalhos de teclado do próprio YouTube
      modestbranding: 1,   // marca d'água discreta
      rel: 0,              // sem sugestões de outros vídeos no fim
      playsinline: 1,      // embutido, sem tela cheia automática no iOS
      fs: 0,               // sem o botão de tela cheia do YouTube
      cc_load_policy: 0,   // legendas nunca desenhadas sobre a intérprete
      iv_load_policy: 3,   // sem cards e anotações sobre a imagem
      autoplay: 1,         // o sinal começa sozinho...
      mute: 1,             // ...e nasce mudo: é a exigência do YouTube para
                           // liberar o autoplay (o conteúdo é 100% visual)
      hl: 'pt-BR',         // idioma da interface do embed
      origin: window.location.origin
    },
    events: {
      onReady: aoFicarPronto,
      onStateChange: aoMudarEstado,
      onError: aoDarErro
    }
  });
}

/* A API oficial avisa por esta função global quando o módulo do player fica
   disponível. O fallback no fim do arquivo cobre o caso oposto (API que
   termina de carregar antes deste script). */
window.onYouTubeIframeAPIReady = function () {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', criarPlayerDoYoutube, { once: true });
  } else {
    criarPlayerDoYoutube();
  }
};

function aoFicarPronto() {
  playerPronto = true;

  if (playerEstaUtil()) player.setPlaybackRate(velocidadeDoSinal);

  atualizarRotuloDaVelocidade();
  atualizarDuracaoDaBarra();
  atualizarIconeDoPlay();
  aplicarVideoPendente();
  iniciarTiqueDaBarra();
}

function aoDarErro(evento) {
  if (CODIGOS_DE_VIDEO_INDISPONIVEL.includes(Number(evento.data))) {
    videoIdAtual = '';
    videoIndisponivel = true;
    mostrarVideoIndisponivel(true);
    atualizarControlesHabilitados();
  }
}

function mostrarVideoIndisponivel(mostrar) {
  if (barraRoxa.aviso) barraRoxa.aviso.classList.toggle('esta-visivel', !!mostrar);
}

/* Sem vídeo cadastrado, os controles ficam inertes: nenhum botão da barra roxa
   vira comando sobre o embed que ainda está atrás do aviso */
function atualizarControlesHabilitados() {
  const habilitado = !videoIndisponivel;

  [barraRoxa.botaoPlay, barraRoxa.botaoRetroceder, barraRoxa.botaoVelocidade]
    .forEach((botao) => {
      if (botao) botao.disabled = !habilitado;
    });

  if (barraRoxa.progresso) {
    barraRoxa.progresso.classList.toggle('esta-desabilitado', !habilitado);
    barraRoxa.progresso.setAttribute('aria-disabled', habilitado ? 'false' : 'true');
  }
}

/* -------------------- Troca de termo / de vídeo -------------------- */

/* Troca o vídeo exibido reaproveitando o mesmo embed (loadVideoById): nunca há
   manipulação manual de src e nunca existem dois players no documento */
function trocarVideo(idYouTube) {
  const id = extrairIdDoVideo(idYouTube);

  /* Termo ainda sem vídeo cadastrado: o aviso cobre a área em vez de deixar o
     erro do YouTube aparecer no meio da tela. O sinal anterior sai de cena sem
     nenhum stopVideo() — a taxa 0 para a imagem mantendo o embed em PLAYING,
     que é o único estado do YouTube que não desenha o botão central */
  if (!idDeVideoValido(id)) {
    videoIdAtual = '';
    videoIdPendente = null;
    videoIndisponivel = true;
    sinalCongelado = false;
    pararReservaDoQuadro();
    clearTimeout(conferenciaDaTaxa);

    if (playerEstaUtil()) player.setPlaybackRate(0);

    mostrarVideoIndisponivel(true);
    atualizarControlesHabilitados();
    atualizarBarraDeProgresso(0, 0);
    atualizarIconeDoPlay();
    return;
  }

  videoIndisponivel = false;
  mostrarVideoIndisponivel(false);
  atualizarControlesHabilitados();

  if (id === videoIdAtual) return;

  videoIdAtual = id;

  /* O termo novo entra tocando do zero, então o congelamento do termo anterior
     não atravessa a troca — e a velocidade volta para a escolhida na barra,
     inclusive quando o termo anterior era o aviso "em breve" (taxa 0) */
  reiniciarCongelamento();
  ultimoReinicioDoLoop = 0;
  ultimoEstadoDoEmbed = null;

  if (playerEstaUtil()) player.setPlaybackRate(velocidadeDoSinal || 1);
  player.loadVideoById(id);

  atualizarDuracaoDaBarra();
  atualizarIconeDoPlay();
}

function aplicarVideoPendente() {
  if (!playerPronto || videoIdPendente === null) return;

  const id = videoIdPendente;
  videoIdPendente = null;
  trocarVideo(id);
}

/* Chamada a cada troca de termo: guarda o id escolhido e aplica assim que o
   player estiver pronto (o embed sobe de forma assíncrona) */
function atualizarVideo(idYouTube) {
  videoIdPendente = extrairIdDoVideo(idYouTube);
  aplicarVideoPendente();
}

/* -------------------- Loop suave (sem estado ENDED) -------------------- */

/* Reinicia o ciclo no segundo 0 mantendo a mídia em execução: seekTo() não
   alterna o embed para PAUSED, ENDED nem CUED — a reprodução simplesmente
   continua do ponto zero. O playVideo() entra só como recuperação, para o caso
   de o embed ter escapado para um desses estados antes desta chamada. */
function reiniciarCicloDoSinal() {
  if (!playerEstaUtil() || sinalCongelado || videoIndisponivel) return false;

  const agora = Date.now();
  if (agora - ultimoReinicioDoLoop < MINIMO_ENTRE_REINICIOS) return false;

  ultimoReinicioDoLoop = agora;
  diagnosticoDoLoop.reinicios += 1;

  player.seekTo(0, true);

  /* Saída de ENDED (0) e CUED (5) sem passar por stopVideo(): é a única
     transição possível para PLAYING que não desenha o botão central */
  if (Number(player.getPlayerState()) !== ESTADO_DO_YOUTUBE.REPRODUZINDO) {
    player.playVideo();
    diagnosticoDoLoop.resgates += 1;
  }

  atualizarIconeDoPlay();
  return true;
}

/* -------------------- Congelar (pausa sem entrar em PAUSED) -------------------- */

function pararReservaDoQuadro() {
  if (!reservaDoQuadro) return;

  clearInterval(reservaDoQuadro);
  reservaDoQuadro = null;
}

/* Reserva: segura o quadro por currentTime, mantendo o embed em PLAYING */
function iniciarReservaDoQuadro() {
  if (!playerEstaUtil() || reservaDoQuadro) return;

  instanteDoSinal = Number(player.getCurrentTime());
  reservaDoQuadro = setInterval(() => {
    if (!sinalCongelado || !playerEstaUtil()) {
      pararReservaDoQuadro();
      return;
    }

    player.seekTo(instanteDoSinal, true);
    if (Number(player.getPlayerState()) !== ESTADO_DO_YOUTUBE.REPRODUZINDO) {
      player.playVideo();
    }
    atualizarIconeDoPlay();
  }, INTERVALO_DA_RESERVA);
}

/* Aplica (ou reafirma) o congelamento: taxa 0 com o embed em PLAYING */
function aplicarCongelamento() {
  if (!playerEstaUtil()) return;

  player.setPlaybackRate(0);

  /* Estado proibido: sai dele sem largar o quadro */
  if (Number(player.getPlayerState()) !== ESTADO_DO_YOUTUBE.REPRODUZINDO) {
    player.playVideo();
  }

  atualizarIconeDoPlay();

  /* O embed confirma a taxa só depois do ciclo de mensagens do iframe: se ele
     recusar o 0, o quadro passa a ser segurado por currentTime, nunca por
     pauseVideo() — que é justamente o estado que desenha o botão central */
  clearTimeout(conferenciaDaTaxa);
  conferenciaDaTaxa = setTimeout(() => {
    if (!sinalCongelado || !playerEstaUtil()) return;

    if (Number(player.getPlaybackRate()) === 0) pararReservaDoQuadro();
    else iniciarReservaDoQuadro();
  }, CONFERENCIA_DA_TAXA);
}

function congelarSinal() {
  if (!playerEstaUtil()) return;

  velocidadeDoSinal = Number(player.getPlaybackRate()) || velocidadeDoSinal || 1;
  instanteDoSinal = Number(player.getCurrentTime());
  sinalCongelado = true;

  aplicarCongelamento();
}

function reproduzirSinal() {
  sinalCongelado = false;
  pararReservaDoQuadro();
  clearTimeout(conferenciaDaTaxa);

  if (!playerEstaUtil()) return;

  player.setPlaybackRate(velocidadeDoSinal || 1);
  player.playVideo();
  atualizarIconeDoPlay();
}

/* Troca de termo: o vídeo novo entra tocando do zero, então o congelamento do
   termo anterior não atravessa a troca */
function reiniciarCongelamento() {
  sinalCongelado = false;
  pararReservaDoQuadro();
  clearTimeout(conferenciaDaTaxa);
}

/* -------------------- Eventos do embed -------------------- */

function aoMudarEstado(evento) {
  if (videoIndisponivel) return;   // sem vídeo carregado não há estado a resgatar

  const estado = Number(evento.data);
  const estadoAnterior = ultimoEstadoDoEmbed;
  ultimoEstadoDoEmbed = estado;

  /* PAUSED só pode ter vindo do próprio YouTube (atalho, perda de foco,
     overlay nativo): o quadro é congelado na hora e o estado proibido é
     desfeito — o botão central nunca fica desenhado */
  if (estado === ESTADO_DO_YOUTUBE.PAUSADO) {
    if (sinalCongelado) aplicarCongelamento();
    else congelarSinal();
    return;
  }

  if (estado === ESTADO_DO_YOUTUBE.FINALIZADO) {
    if (sinalCongelado) {
      aplicarCongelamento();
      return;
    }

    /* Este é o instante exato em que o YouTube acaba de desenhar a
       sobreposição de fim sobre o último quadro: o reinício sai no mesmo ciclo,
       sem a janela mínima entre reinícios */
    ultimoReinicioDoLoop = 0;
    reiniciarCicloDoSinal();
    return;
  }

  if (estado === ESTADO_DO_YOUTUBE.REPRODUZINDO) {
    /* playVideo() de recuperação durante o congelamento não pode descongelar */
    if (sinalCongelado) aplicarCongelamento();
    else atualizarIconeDoPlay();
    return;
  }

  /* CUED só é resgatado se o sinal JÁ vinha tocando: no carregamento inicial
     esse estado é normal (o autoplay está a caminho) e insistir ali viraria uma
     enxurrada de playVideo */
  if (
    estado === ESTADO_DO_YOUTUBE.EM_ESPERA &&
    estadoAnterior === ESTADO_DO_YOUTUBE.REPRODUZINDO &&
    !sinalCongelado
  ) {
    ultimoReinicioDoLoop = 0;
    reiniciarCicloDoSinal();
  }
}

/* Tique do player (a cada 50ms). Três responsabilidades:

   1) BARRA ROXA: progresso e tempo por getCurrentTime() / getDuration();
   2) CONTAGEM de "termo visto" — rede de segurança do segundo 10s: como o
      reinício antecipado do loop acontece, o embed nunca dispara 'ended', e é
      este tique que fecha a contagem ao alcançar o final;
   3) LOOP SEM ESTADO DE FIM: reinicia o sinal um instante ANTES do último
      quadro, então o embed nunca chega a ENDED e a sobreposição de fim de
      vídeo não é desenhada. */
function tiqueDoSinal() {
  if (!playerEstaUtil()) return;

  /* Termo sem vídeo: a barra fica zerada e nada do embed anterior é lido */
  if (videoIndisponivel) {
    arrastandoProgresso = false;
    atualizarBarraDeProgresso(0, 0);
    return;
  }

  const duracao = Number(player.getDuration()) || 0;
  const instante = Number(player.getCurrentTime()) || 0;
  const estado = Number(player.getPlayerState());

  if (!arrastandoProgresso) atualizarBarraDeProgresso(instante, duracao);

  if (
    visto && visto.termo && !visto.videoTerminou &&
    duracao > 0 && instante >= duracao - 1
  ) {
    visto.videoTerminou = true;
    marcarComoVisto();
  }

  if (sinalCongelado) return;   // congelado: o quadro é do usuário

  const estadoAnterior = ultimoEstadoDoEmbed;
  ultimoEstadoDoEmbed = estado;

  const perdido = estado === ESTADO_DO_YOUTUBE.FINALIZADO ||
    (estado === ESTADO_DO_YOUTUBE.EM_ESPERA &&
      estadoAnterior === ESTADO_DO_YOUTUBE.REPRODUZINDO);

  if (duracao > 0 && (perdido || instante >= duracao - ANTECEDENCIA_DO_LOOP)) {
    reiniciarCicloDoSinal();
  }
}

function iniciarTiqueDaBarra() {
  if (tiqueDaBarra) return;
  tiqueDaBarra = setInterval(tiqueDoSinal, INTERVALO_DA_BARRA);
}

/* -------------------- Barra roxa (visual) -------------------- */

function formatarTempo(segundos) {
  const total = Math.max(0, Math.floor(Number(segundos) || 0));
  const minutos = Math.floor(total / 60);
  return `${minutos}:${String(total % 60).padStart(2, '0')}`;
}

function atualizarBarraDeProgresso(instante, duracao) {
  const porcentagem = duracao > 0 ? Math.min(100, (instante / duracao) * 100) : 0;

  if (barraRoxa.preenchido) {
    barraRoxa.preenchido.style.width = `${porcentagem}%`;
  }

  if (barraRoxa.tempo) {
    barraRoxa.tempo.textContent = `${formatarTempo(instante)} / ${formatarTempo(duracao)}`;
  }

  if (barraRoxa.progresso) {
    barraRoxa.progresso.setAttribute('aria-valuenow', String(Math.round(porcentagem)));
    barraRoxa.progresso.setAttribute(
      'aria-valuetext',
      `${formatarTempo(instante)} de ${formatarTempo(duracao)}`
    );
  }
}

function atualizarDuracaoDaBarra() {
  if (!playerEstaUtil()) {
    atualizarBarraDeProgresso(0, 0);
    return;
  }

  atualizarBarraDeProgresso(
    Number(player.getCurrentTime()) || 0,
    Number(player.getDuration()) || 0
  );
}

function atualizarIconeDoPlay() {
  if (!barraRoxa.botaoPlay) return;

  /* Congelado (ou sem vídeo) o ícone é o de reproduzir: nada está rodando */
  const parado = sinalCongelado || videoIndisponivel;

  barraRoxa.botaoPlay.innerHTML = parado
    ? '<i class="fa-solid fa-play"></i>'
    : '<i class="fa-solid fa-pause"></i>';

  barraRoxa.botaoPlay.setAttribute('aria-label', parado ? 'Reproduzir sinal' : 'Pausar sinal');
}

function atualizarRotuloDaVelocidade() {
  if (!barraRoxa.botaoVelocidade) return;

  barraRoxa.botaoVelocidade.textContent = `${velocidadeDoSinal}x`;
  barraRoxa.botaoVelocidade.setAttribute('aria-label', `Velocidade ${velocidadeDoSinal}x`);
}

/* -------------------- Barra roxa (ações nativas) -------------------- */

/* Play/Pause: playVideo() para tocar; para parar, o congelamento por
   setPlaybackRate(0) — visualmente idêntico a pauseVideo(), mas sem deixar o
   embed em PAUSED (o estado em que o YouTube desenha o botão central) */
function alternarPlayPauseDoSinal() {
  if (videoIndisponivel) return;

  if (sinalCongelado) reproduzirSinal();
  else congelarSinal();
}

/* Rewind 5s: player.seekTo(player.getCurrentTime() - 5, true) */
function retroceder5s() {
  if (!playerEstaUtil() || videoIndisponivel) return;

  const duracao = Number(player.getDuration()) || 0;
  const alvo = Math.max(0, (Number(player.getCurrentTime()) || 0) - 5);

  player.seekTo(alvo, true);
  if (sinalCongelado) instanteDoSinal = alvo;   // a reserva segue do novo ponto

  atualizarBarraDeProgresso(alvo, duracao);
}

/* Velocidade: alterna os valores da lista com setPlaybackRate() */
function ciclarVelocidade() {
  if (videoIndisponivel) return;

  const indice = VELOCIDADES.indexOf(velocidadeDoSinal);
  velocidadeDoSinal = VELOCIDADES[(indice + 1) % VELOCIDADES.length];

  /* Congelado: a taxa 0 permanece na imagem e a nova velocidade fica guardada
     para quando o play voltar */
  if (!sinalCongelado && playerEstaUtil()) player.setPlaybackRate(velocidadeDoSinal);

  atualizarRotuloDaVelocidade();
}

/* Progresso: converte a fração clicada/arrastada em posição do vídeo */
function irParaPosicao(fracao) {
  if (!playerEstaUtil() || videoIndisponivel) return;

  const duracao = Number(player.getDuration()) || 0;
  if (!duracao) return;

  const alvo = Math.min(Math.max(fracao, 0), 1) * duracao;

  player.seekTo(alvo, true);
  if (sinalCongelado) instanteDoSinal = alvo;

  atualizarBarraDeProgresso(alvo, duracao);
}

/* -------------------- Ligação da barra roxa -------------------- */

function conectarBarraRoxa() {
  barraRoxa.botaoPlay = document.getElementById('btnPlayPause');
  barraRoxa.botaoRetroceder = document.getElementById('btnRewind');
  barraRoxa.botaoVelocidade = document.getElementById('btnVelocidade');
  barraRoxa.progresso = document.getElementById('barraProgresso');
  barraRoxa.preenchido = document.getElementById('progressoPreenchido');
  barraRoxa.tempo = document.getElementById('tempoSinal');
  barraRoxa.aviso = document.getElementById('avisoVideoIndisponivel');

  if (barraRoxa.botaoPlay) {
    barraRoxa.botaoPlay.addEventListener('click', alternarPlayPauseDoSinal);
  }

  if (barraRoxa.botaoRetroceder) {
    barraRoxa.botaoRetroceder.addEventListener('click', retroceder5s);
  }

  if (barraRoxa.botaoVelocidade) {
    barraRoxa.botaoVelocidade.addEventListener('click', ciclarVelocidade);
  }

  if (barraRoxa.progresso) {
    const fracaoDoPonto = (evento) => {
      const caixa = barraRoxa.progresso.getBoundingClientRect();
      return caixa.width ? (evento.clientX - caixa.left) / caixa.width : 0;
    };

    barraRoxa.progresso.addEventListener('pointerdown', (evento) => {
      arrastandoProgresso = true;
      if (barraRoxa.progresso.setPointerCapture) {
        barraRoxa.progresso.setPointerCapture(evento.pointerId);
      }
      irParaPosicao(fracaoDoPonto(evento));
    });

    barraRoxa.progresso.addEventListener('pointermove', (evento) => {
      if (!arrastandoProgresso) return;
      irParaPosicao(fracaoDoPonto(evento));
    });

    const soltar = (evento) => {
      arrastandoProgresso = false;

      if (
        barraRoxa.progresso.releasePointerCapture &&
        barraRoxa.progresso.hasPointerCapture &&
        barraRoxa.progresso.hasPointerCapture(evento.pointerId)
      ) {
        barraRoxa.progresso.releasePointerCapture(evento.pointerId);
      }
    };

    barraRoxa.progresso.addEventListener('pointerup', soltar);
    barraRoxa.progresso.addEventListener('pointercancel', soltar);

    /* Acessibilidade por teclado: setas andam 5s, Home/End vão aos extremos */
    barraRoxa.progresso.addEventListener('keydown', (evento) => {
      if (!playerEstaUtil()) return;

      const duracao = Number(player.getDuration()) || 0;
      if (!duracao) return;

      const instante = Number(player.getCurrentTime()) || 0;
      let alvo = null;

      if (evento.key === 'ArrowRight') alvo = instante + 5;
      else if (evento.key === 'ArrowLeft') alvo = instante - 5;
      else if (evento.key === 'Home') alvo = 0;
      else if (evento.key === 'End') alvo = duracao - ANTECEDENCIA_DO_LOOP;

      if (alvo === null) return;

      evento.preventDefault();
      player.seekTo(Math.min(Math.max(alvo, 0), duracao), true);
      if (sinalCongelado) instanteDoSinal = alvo;
      atualizarBarraDeProgresso(alvo, duracao);
    });
  }

  atualizarRotuloDaVelocidade();
  atualizarControlesHabilitados();
  atualizarIconeDoPlay();
}

conectarBarraRoxa();

/* Fallback: se a API do YouTube terminou de carregar antes deste arquivo, o
   callback global já foi perdido — aqui o player é montado direto. As duas
   portas são idempotentes (criarPlayerDoYoutube sai na hora se já houver
   player), então nunca existe mais de um embed no documento. */
if (window.YT && typeof window.YT.Player === 'function') {
  criarPlayerDoYoutube();
}

/* ------------------------------ Listas e telas ------------------------------ */

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
    const buscaBate = item.term.toLowerCase().includes(busca.toLowerCase());
    return bateCategoria && buscaBate;
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

  /* Sempre chamado: termos sem vídeo cadastrado caem no aviso "em breve" e o
     vídeo do termo anterior sai de cena por completo */
  atualizarVideo(termoAtual.youtubeId);

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

  /* Rede de segurança do carregamento da API (ver o fallback acima) */
  criarPlayerDoYoutube();

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
});
