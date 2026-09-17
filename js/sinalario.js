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

/* ------------------------------ Player Plyr ------------------------------ */

/* O #player no sinalario.html é só uma div receptora: o Plyr cria o embed do
   YouTube inteiro por conta própria (data-plyr-provider / data-plyr-embed-id,
   os atributos oficiais da biblioteca) e monta a interface dele sobre esse
   embed. Como nenhum <iframe> é escrito à mão no HTML, não existem dois
   players na tela nem a interface nativa do YouTube (título, foto do canal,
   botões de compartilhar) aparecendo por baixo.

   Ajustes pensados para o estudo da Libras:
   · 0.25x a 1x no menu de velocidade (configurações);
   · seekTime: 5 → botão e setas do teclado voltam 5 segundos;
   · loop ativo → o sinal repete sozinho, sem parar no fim;
   · autoplay + muted → o sinal começa sozinho (o navegador só libera o
     autoplay com o som desligado, e o conteúdo é 100% visual);
   · storage desligado → o player sobe sempre no estado definido aqui, sem
     restaurar volume/mudo de visitas antigas e quebrar o autoplay;
   · youtube → parâmetros repassados ao embed que o Plyr monta, e são eles que
     forçam a ocultação da interface do YouTube. */
const player = new Plyr('#player', {
  /* Lista explícita do que o Plyr renderiza: 'play-large' NÃO entra aqui, e é
     essa ausência que resolve o botão central. No plyr.js há um único ponto
     que cria o .plyr__control--overlaid — o bloco
     `if (this.config.controls.includes('play-large'))` dentro do create(),
     que monta o <button> e o insere no container antes do .plyr__controls.
     Fora da lista o botão nem é renderizado — e, como garantia extra, o nó é
     apagado do DOM por removerBotaoCentral() (logo abaixo) e mantido invisível
     pela regra sem !important do style.css. A barra roxa inferior (play, voltar
     5s, progresso, tempo e velocidade) segue como o único controle do vídeo. */
  controls: ['play', 'rewind', 'progress', 'current-time', 'settings'],
  settings: ['speed'],
  speed: { selected: 1, options: [0.25, 0.5, 0.75, 1] }, // 0.25x para estudo
  seekTime: 5,              // botão de retornar 5 segundos
  /* O loop é feito à mão, fora do Plyr (ver o tique de 'timeupdate' e o
     handler de 'ended' mais abaixo). O loop da PRÓPRIA biblioteca fica
     desligado de propósito: no provider do YouTube ele chama stopVideo() antes
     de playVideo(), e o stopVideo() joga o embed no estado "cued" — que é
     exatamente quando o YouTube desenha o botão redondo gigante no centro da
     imagem, por cima do peito/mãos da intérprete. O nosso loop só usa
     currentTime (seekTo), então o embed nunca troca de estado. */
  loop: { active: false },
  autoplay: true,
  muted: true,              // mudo por padrão (indispensável para o autoplay)
  hl: 'pt-BR',              // idioma da interface do embed (playerVars hl)
  /* O clique na imagem não pausa. Com o Plyr fora do caminho, o clique não
     dispara o pause do próprio iframe — e é justamente o pause que faz o
     YouTube desenhar o botão gigante no centro da imagem. O play/pause segue
     disponível na barra roxa inferior e pela barra de espaço */
  clickToPlay: false,
  storage: { enabled: false },
  /* Parâmetros nativos do player do YouTube. No Plyr 3.7.8 o provider monta a
     URL do embed assim (código da própria biblioteca, no arquivo plyr.js):

       playerVars: { ...{autoplay, hl, controls, disablekb, playsinline,
                         cc_load_policy, cc_lang_pref, widget_referrer}, ...youtube }

     Ou seja: TODAS as chaves deste objeto viram parâmetros do iframe e as do
     projeto entram por último, vencendo as da biblioteca. Por isso os nomes
     nativos ficam aqui no nível de cima — é o formato que o Plyr repassa ao
     embed. O bloco `playerVars` mais abaixo é o mesmo pacote escrito como a
     API do YouTube o chama, e é achatado para o nível de cima por
     normalizarPlayerVarsDoYoutube(), antes de o iframe existir: um objeto
     aninhado viraria o parâmetro inútil `playerVars=[object Object]`.

     Cada chave existe para tirar uma camada nativa de cima da imagem — o
     iframe deve sobrar como superfície de vídeo puro. O que a API do YouTube
     não desliga por parâmetro nenhum é a barra de título que aparece ao passar
     o mouse (com título, canal e "assistir no YouTube"): endereço dela é
     dentro do iframe, e `showinfo` está obsoleto justamente por isso. */
  youtube: {
    noCookie: true,          // youtube-nocookie.com: sem cookies de rastreio
    customControls: true,    // barra roxa do projeto no lugar da barra nativa
    mute: 1,                 // o embed NASCE mudo: é o que o YouTube exige para
                             // liberar o autoplay na origem. Sem isto o Plyr só
                             // muta depois do 'ready', e o YouTube, recusando o
                             // autoplay, deixa o próprio botão de play no centro
                             // (o placeholder cinza) em cima da intérprete
    rel: 0,                  // sem sugestões de outros vídeos no fim
    showinfo: 0,             // sem título/canal no topo do embed
    iv_load_policy: 3,       // sem cards e anotações sobre a imagem
    modestbranding: 1,       // marca d'água discreta
    cc_load_policy: 0,       // legendas nunca desenhadas sobre a intérprete
    controls: 0,             // sem a barra cinza nativa do YouTube
    disablekb: 1,            // sem os atalhos de teclado do próprio YouTube
    fs: 0,                   // sem o botão de tela cheia do YouTube
    playsinline: 1,          // embutido, sem tela cheia automática no iOS
    /* O mesmo pacote na nomenclatura oficial da API do YouTube; é achatado
       na criação do player, logo abaixo, porque o Plyr quer as chaves soltas.
       Em caso de chave repetida, o valor daqui vence o do nível de cima. */
    playerVars: {
      controls: 0,
      disablekb: 1,
      fs: 0,
      rel: 0,
      cc_load_policy: 0
    }
  },
  /* Rótulos em português: o Plyr só traz o inglês embutido */
  i18n: {
    restart: 'Reiniciar',
    rewind: 'Voltar {seektime}s',
    play: 'Reproduzir',
    pause: 'Pausar',
    seek: 'Buscar',
    seekLabel: '{currentTime} de {duration}',
    played: 'Reproduzido',
    buffered: 'Carregado',
    currentTime: 'Tempo atual',
    duration: 'Duração',
    volume: 'Volume',
    mute: 'Mudo',
    unmute: 'Com som',
    enableCaptions: 'Ativar legendas',
    disableCaptions: 'Desativar legendas',
    settings: 'Configurações',
    speed: 'Velocidade',
    normal: 'Normal',
    loop: 'Repetir',
    start: 'Início',
    end: 'Fim',
    all: 'Tudo',
    reset: 'Redefinir',
    disabled: 'Desativado',
    enabled: 'Ativado',
    menuBack: 'Voltar ao menu anterior',
    frameTitle: 'Player de {title}'
  }
});

/* Traduz a nomenclatura da API do YouTube (playerVars) para a que o Plyr
   repassa ao embed, e deixa no iframe apenas parâmetros primitivos. Roda de
   forma síncrona, logo depois do `new Plyr(...)`: o provider lê
   `config.youtube` só na hora de montar a URL, e essa hora é sempre posterior
   a este script — o embed nasce quando a API do YouTube avisa que carregou. */
function normalizarPlayerVarsDoYoutube() {
  const config = player.config && player.config.youtube;
  if (!config || !config.playerVars || typeof config.playerVars !== 'object') return;

  player.config.youtube = Object.assign({}, config, config.playerVars);
  delete player.config.youtube.playerVars;
}

normalizarPlayerVarsDoYoutube();

/* ---------------- Cena limpa: nada de controle sobre a imagem ---------------
   O botão central do Plyr (.plyr__control--overlaid) tem UM único ponto de
   criação na biblioteca: o bloco `if (this.config.controls.includes
   ('play-large'))` de Controls.create(), que monta o <button> e o insere
   direto no container, antes do .plyr__controls. Como 'play-large' está fora
   da lista de controls acima, o nó não nasce no DOM — e é essa a remoção
   definitiva: nenhum botão é criado, nada precisa ser escondido nem apagado.

   As duas camadas seguintes são redes de segurança, na ordem em que agem:

   1) removerBotaoCentral() apaga o nó do DOM se alguma versão futura da
      biblioteca (ou uma config alterada) voltar a criá-lo. Roda na montagem, a
      cada mutação do container — o Plyr destrói e remonta o embed inteiro a
      cada troca de termo — e a cada troca de estado do player (ready, playing,
      pause, ended, seeked, loadstart), que é quando a interface é reconstruída;

   2) a regra .plyr__control--overlaid do style.css, SEM !important e com peso
      maior que a da biblioteca, mantém a camada invisível mesmo no intervalo
      entre uma inserção e a remoção (garantia visual, de custo zero).

   A barra roxa inferior (.plyr__controls) e seus itens (play, voltar 5s,
   progresso, tempo e velocidade) não são alcançados por nada daqui: o expurgo
   mira apenas o botão central, nunca os filhos da barra.

   A sobreposição que o PRÓPRIO player do YouTube desenha DENTRO do iframe não
   pertence a este documento — nenhum seletor ou JS da página a alcança. Quem a
   mantém fora de cena são as duas peças deste arquivo:
   · o loop sem estado de fim, logo abaixo, que reinicia o sinal por currentTime
     um instante antes do último quadro (mata o desenho de fim de vídeo);
   · o congelamento por setPlaybackRate(0) da seção "Congelar o sinal" (mata o
     desenho de pausa: o embed nunca chega a PAUSED).

   Sobre o nó alvo: o #player do HTML é só a div receptora do embed. Quando a
   API do YouTube fica pronta, o provider do Plyr a troca por uma div nova
   (media = replaceElement(div, media)) e o nó que sobrevive é o container que
   recebe a classe .plyr — daí containerDoPlayer, e nunca #player. */
function removerBotaoCentral() {
  if (!containerDoPlayer) return;

  containerDoPlayer.querySelectorAll('.plyr__control--overlaid').forEach((no) => no.remove());
}

/* Garantia extra: se 'play-large' voltar à lista de controls numa edição
   futura, ele é descartado antes de qualquer remontagem da interface. */
if (player.config && Array.isArray(player.config.controls)) {
  player.config.controls = player.config.controls.filter(
    (controle) => controle !== 'play-large'
  );
}

/* O nó vivo do player (ver o comentário acima): é ele que continua no
   documento a cada troca de termo, quando o #player já foi substituído */
const containerDoPlayer = player.elements ? player.elements.container : null;

removerBotaoCentral();

if (window.MutationObserver && containerDoPlayer) {
  const observadorDoBotaoCentral = new MutationObserver(removerBotaoCentral);
  observadorDoBotaoCentral.observe(containerDoPlayer, {
    childList: true,
    subtree: true
  });
}

/* Cada troca de estado do player é um ponto onde a camada central poderia ser
   recriada, então o expurgo também roda nesses eventos — não só nas mutações
   do DOM observadas acima */
['ready', 'playing', 'pause', 'ended', 'seeked', 'loadstart'].forEach((evento) => {
  player.on(evento, removerBotaoCentral);
});

/* Estado da troca de vídeo. O provider do YouTube sobe de forma assíncrona:
   até o Plyr disparar 'ready' ainda não existe player para receber o vídeo,
   então o termo escolhido fica guardado e entra assim que ele fica pronto. */
let playerPronto = false;
let videoIdPendente = '';

/* Id entregue ao Plyr por último. Em modo embed o getter player.source devolve
   media.currentSrc — que no YouTube não existe —, então a fonte da verdade é
   este marcador: com ele o mesmo termo nunca é recarregado à toa, nem no
   primeiro carregamento (o id inicial vem do data-plyr-embed-id do HTML). */
const elementoDoPlayer = document.getElementById('player');
let videoIdAtual = extrairIdDoVideo(
  elementoDoPlayer ? elementoDoPlayer.dataset.plyrEmbedId : ''
);

/* Troca o vídeo exibido: o Plyr remonta o embed do YouTube inteiro por baixo,
   então nunca existe manipulação manual de src no HTML */
function carregarVideo(idYouTube) {
  const id = extrairIdDoVideo(idYouTube);
  if (!id || id === videoIdAtual) return;

  videoIdAtual = id;

  /* O termo novo entra tocando (autoplay + loop), então o congelamento do
     termo anterior não atravessa a troca — ver "Congelar o sinal" */
  reiniciarCongelamento();

  player.source = {
    type: 'video',
    sources: [{ src: id, provider: 'youtube' }]
  };
}

function aplicarVideoPendente() {
  if (!playerPronto || !videoIdPendente) return;

  const id = videoIdPendente;
  videoIdPendente = '';
  carregarVideo(id);
}

/* Ao trocar de termo na lista: aponta o Plyr para o vídeo do sinal */
function atualizarVideo(idYouTube) {
  const id = extrairIdDoVideo(idYouTube);
  if (!id) return;

  videoIdPendente = id;
  aplicarVideoPendente();
}

player.on('ready', () => {
  playerPronto = true;
  aplicarVideoPendente();
});

/* Mudo: nenhuma chamada de volume/mudo fica por aqui. O Plyr reaplica o
   config.muted (muted: true acima) dentro do build da interface, que o provider
   do YouTube dispara ~50ms depois do 'ready' — inclusive a cada remontagem
   feita pela troca de termo. Além disso a barra roxa do projeto não tem volume
   nem mudo, então nada pode desmutar o sinal. Cada chamada extra a mute()/
   setVolume() é uma troca de estado a menos no embed, e é justamente uma troca
   de estado que faz o YouTube desenhar ícones por cima da intérprete. */

/* Tique do player (no YouTube o Plyr dispara 'timeupdate' a cada 50ms).
   Duas responsabilidades:

   1) CONTAGEM de "termo visto" — rede de segurança: quando o reinício
      antecipado abaixo acontece, o embed nunca dispara 'ended', então este
      tique fecha a contagem ao alcançar o final;
   2) LOOP SEM ESTADO DE FIM — reinicia o sinal um instante ANTES do último
      quadro. O embed nunca chega ao estado "ended", que é justamente quando o
      YouTube desenha a sobreposição de fim de vídeo (retroceder/avançar,
      replay) por cima do último quadro, em cima do peito/mãos da intérprete.
      O reinício usa só currentTime (seekTo), que não troca o estado do embed —
      diferente do stopVideo() que o loop nativo da biblioteca usaria. */
const ANTECEDENCIA_DO_LOOP = 0.2; // segundos antes do fim

player.on('timeupdate', () => {
  if (!player.duration) return;

  if (
    visto && visto.termo && !visto.videoTerminou &&
    player.currentTime >= player.duration - 1
  ) {
    visto.videoTerminou = true;
    marcarComoVisto();
  }

  if (player.currentTime >= player.duration - ANTECEDENCIA_DO_LOOP) {
    player.currentTime = 0;
    Promise.resolve(player.play()).catch(() => {});
  }
});

player.on('ended', () => {
  if (visto && visto.termo) {
    visto.videoTerminou = true;
    marcarComoVisto();
  }

  /* Rede de segurança do loop (ver o tique de 'timeupdate'): se algum quadro
     escapar e o embed chegar ao fim, o sinal volta ao início e segue tocando —
     sempre por currentTime/play(), nunca por stopVideo(), que é o que joga o
     embed no estado "cued" e desenha o botão central. */
  player.currentTime = 0;
  Promise.resolve(player.play()).catch(() => {});
});

/* ============ Congelar o sinal: pausar sem entrar no PAUSED ============

   O botão gigante que aparece em cima da intérprete é desenhado pelo PRÓPRIO
   player do YouTube DENTRO do iframe, e ele só surge em dois estados do embed:
   PAUSED (2) e CUED (5) — este último é onde o stopVideo() deixa o vídeo.
   Nenhum seletor nem JS desta página alcança aquele desenho, então a única
   saída é o embed nunca entrar nesses dois estados.

   Por isso o play/pause da barra roxa CONGELA o quadro em vez de pausar:

   · player.embed é a instância YT.Player da API oficial do YouTube (o Plyr
     guarda a instância ali e a refaz a cada troca de termo, daí embedDoYoutube());
   · setPlaybackRate(0) para a imagem e o tempo, com o embed seguindo em
     PLAYING — nenhum dos estados que pintam o botão;
   · player.speed = 0 NÃO serve: o setter do Plyr limita a velocidade entre
     minimumSpeed e maximumSpeed, e no provider do YouTube esses limites são o
     menor e o maior item do menu ([0.25 ... 1]) — o 0 viraria 0.25;
   · media.paused + o evento 'pause' (o mesmo par que o provider usa por dentro)
     trocam o ícone da barra, sem nenhum pauseVideo().

   Caminhos de pausa, todos cobertos:
   · botão da barra e teclas espaço/k → player.togglePlay();
   · chamadas diretas à API do Plyr → player.pause();
   · o clique na imagem chega ao iframe e o YouTube pausa por conta própria —
     o 'statechange' abaixo desfaz o PAUSED na hora, congelando o quadro;
   · se o embed recusar a taxa 0 (o YouTube pode impor um piso de velocidade),
     o quadro passa a ser segurado por currentTime, sempre em PLAYING.

   player.togglePlay e player.pause são propriedades da instância criadas uma
   única vez no construtor do Plyr, então as trocas sobrevivem às remontagens
   do embed a cada troca de termo. */

const ESTADO_DO_YOUTUBE = {
  FINALIZADO: 0,
  REPRODUZINDO: 1,
  PAUSADO: 2,
  EM_ESPERA: 5             // "cued": o outro estado que desenha o botão central
};

const INTERVALO_DA_RESERVA = 250;  // ms entre uma segurada do quadro e outra
const CONFERENCIA_DA_TAXA = 300;   // ms para o embed confirmar a taxa 0

let sinalCongelado = false;
let velocidadeDoSinal = 1;         // velocidade do menu, guardada para o play
let instanteDoSinal = 0;           // quadro segurado no modo de reserva
let reservaDoQuadro = null;        // interval do modo de reserva
let conferenciaDaTaxa = null;      // timeout da conferência da taxa 0

function embedDoYoutube() {
  return player.embed && typeof player.embed.setPlaybackRate === 'function'
    ? player.embed
    : null;
}

function taxaAtualDoEmbed() {
  const embed = embedDoYoutube();
  return embed ? Number(embed.getPlaybackRate()) : null;
}

/* O ícone do item play é decidido por media.paused (checkPlaying do Plyr).
   Mexer nesse flag e disparar o mesmo evento que o provider dispara troca o
   ícone da barra sem que o iframe receba um pauseVideo(). */
function avisarBarraRoxa(pausado) {
  if (!player.media || player.media.paused === pausado) return;

  player.media.paused = pausado;
  player.media.dispatchEvent(new CustomEvent(pausado ? 'pause' : 'play', {
    detail: { plyr: player }
  }));
}

function pararReservaDoQuadro() {
  if (!reservaDoQuadro) return;

  clearInterval(reservaDoQuadro);
  reservaDoQuadro = null;
}

/* Reserva: segura o quadro por currentTime, mantendo o embed em PLAYING */
function iniciarReservaDoQuadro() {
  const embed = embedDoYoutube();
  if (!embed || reservaDoQuadro) return;

  instanteDoSinal = Number(embed.getCurrentTime());
  reservaDoQuadro = setInterval(() => {
    const atual = embedDoYoutube();
    if (!sinalCongelado || !atual) {
      pararReservaDoQuadro();
      return;
    }

    atual.seekTo(instanteDoSinal, true);
    if (Number(atual.getPlayerState()) !== ESTADO_DO_YOUTUBE.REPRODUZINDO) {
      atual.playVideo();
    }
    avisarBarraRoxa(true);
  }, INTERVALO_DA_RESERVA);
}

/* Aplica (ou reafirma) o congelamento no embed */
function aplicarCongelamento() {
  const embed = embedDoYoutube();
  if (!embed) return;

  avisarBarraRoxa(true);
  embed.setPlaybackRate(0);

  /* Estado proibido: sai dele sem largar o quadro */
  if (Number(embed.getPlayerState()) !== ESTADO_DO_YOUTUBE.REPRODUZINDO) {
    embed.playVideo();
    avisarBarraRoxa(true);   // a volta para PLAYING avisa o Plyr do contrário
  }

  /* O embed confirma a taxa só depois do ciclo de mensagens do iframe: se ele
     recusar o 0, o quadro passa a ser segurado por currentTime */
  clearTimeout(conferenciaDaTaxa);
  conferenciaDaTaxa = setTimeout(() => {
    if (!sinalCongelado) return;

    if (taxaAtualDoEmbed() === 0) pararReservaDoQuadro();
    else iniciarReservaDoQuadro();
  }, CONFERENCIA_DA_TAXA);
}

function congelarSinal() {
  const embed = embedDoYoutube();
  if (!embed) return;   // embed ainda carregando: não há quadro para congelar

  sinalCongelado = true;
  velocidadeDoSinal = taxaAtualDoEmbed() || player.config.speed.selected || 1;
  instanteDoSinal = Number(embed.getCurrentTime());
  aplicarCongelamento();
}

function descongelarSinal() {
  const embed = embedDoYoutube();

  sinalCongelado = false;
  pararReservaDoQuadro();
  clearTimeout(conferenciaDaTaxa);

  if (!embed) return;

  embed.setPlaybackRate(velocidadeDoSinal || 1);
  Promise.resolve(player.play()).catch(() => {});   // segue de onde parou
}

/* Troca de termo: o embed é remontado do zero e o termo novo já entra tocando
   (autoplay + loop), então o congelamento não atravessa a troca */
function reiniciarCongelamento() {
  sinalCongelado = false;
  pararReservaDoQuadro();
  clearTimeout(conferenciaDaTaxa);
}

/* Os dois pontos de entrada do play/pause do Plyr congelam em vez de pausar */
player.togglePlay = (forcar) => {
  const deveReproduzir = typeof forcar === 'boolean' ? forcar : !player.playing;
  if (deveReproduzir) descongelarSinal();
  else congelarSinal();
};

player.pause = () => {
  congelarSinal();
};

/* O iframe também pausa sozinho (clique na imagem, por exemplo): o estado
   proibido é desfeito na hora. A biblioteca dispara 'statechange' no container
   do player, com o código do estado do YouTube no detail. */
if (containerDoPlayer) {
  containerDoPlayer.addEventListener('statechange', (evento) => {
    const codigo = evento.detail ? Number(evento.detail.code) : null;

    if (codigo === ESTADO_DO_YOUTUBE.PAUSADO) {
      if (sinalCongelado) aplicarCongelamento();
      else congelarSinal();
      return;
    }

    if (
      sinalCongelado &&
      (codigo === ESTADO_DO_YOUTUBE.EM_ESPERA || codigo === ESTADO_DO_YOUTUBE.FINALIZADO)
    ) {
      aplicarCongelamento();
    }
  });
}

/* Com o sinal congelado, a volta para PLAYING (depois de um playVideo de
   recuperação) não pode trocar o ícone da barra para "pausar" */
['play', 'playing'].forEach((evento) => {
  player.on(evento, () => {
    if (sinalCongelado) avisarBarraRoxa(true);
  });
});

/* Trocar a velocidade com o sinal congelado não pode descongelar a imagem: o
   menu escreve em media.playbackRate, então a taxa 0 é reaplicada e a nova
   velocidade fica guardada para quando o play voltar */
player.on('ratechange', () => {
  if (!sinalCongelado) return;

  const taxa = taxaAtualDoEmbed();
  if (taxa === 0 || taxa === null) return;

  velocidadeDoSinal = taxa;
  aplicarCongelamento();
});

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
    atualizarVideo(termoAtual.youtubeId);
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
