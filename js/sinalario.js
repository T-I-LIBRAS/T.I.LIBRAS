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
  controls: ['play', 'rewind', 'progress', 'current-time', 'settings'],
  settings: ['speed'],
  speed: { selected: 1, options: [0.25, 0.5, 0.75, 1] }, // 0.25x para estudo
  seekTime: 5,              // botão de retornar 5 segundos
  loop: { active: true },   // loop automático infinito
  autoplay: true,
  muted: true,              // mudo por padrão (indispensável para o autoplay)
  /* O clique na imagem não pausa. Com o Plyr fora do caminho, o clique não
     dispara o pause do próprio iframe — e é justamente o pause que faz o
     YouTube desenhar o botão gigante no centro da imagem. O play/pause segue
     disponível na barra roxa inferior e pela barra de espaço */
  clickToPlay: false,
  storage: { enabled: false },
  youtube: {
    noCookie: true,         // domínio youtube-nocookie: sem cookies de rastreio
    rel: 0,                 // sem sugestões de outros vídeos no fim
    showinfo: 0,            // sem título/canal no topo do embed
    iv_load_policy: 3,      // sem cards e anotações sobre a imagem
    modestbranding: 1,      // marca d'água discreta
    /* Estas duas chaves entram no playerVars do embed e são aplicadas por
       último, então valem como palavra final: sem a barra cinza nativa do
       YouTube e sem o teclado dele (quem responde às teclas é o Plyr) */
    controls: 0,            // oculta a barra cinza nativa do YouTube
    disablekb: 1            // desliga os atalhos de teclado do próprio YouTube
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

/* O sinal é 100% visual: reforça o mudo sempre que um vídeo começa (a troca de
   termo remonta o embed e o YouTube volta ao próprio estado padrão) */
player.on('playing', () => {
  player.muted = true;
});

/* Com o loop ativo quem reinicia o vídeo é o próprio Plyr, então o evento
   'ended' pode nunca chegar: este tique fecha a contagem de "termo visto"
   quando a reprodução alcança o final */
player.on('timeupdate', () => {
  if (!visto || !visto.termo || visto.videoTerminou) return;
  if (player.duration > 0 && player.currentTime >= player.duration - 1) {
    visto.videoTerminou = true;
    marcarComoVisto();
  }
});

player.on('ended', () => {
  if (visto && visto.termo) {
    visto.videoTerminou = true;
    marcarComoVisto();
  }
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
