// Lógica do sinalário: lista de termos, filtros, favoritos e vídeos.
const dados = bancoSinalario;

// Cor do ponto de cada área (indicado na lista)
const mapaDePontos = {
  Hardware: 'purple',
  Software: 'blue',
  'Programação': 'yellow',
  Eletricidade: 'red',
  Redes: 'green'
};

// Cor do cabeçalho de cada área (iguais às usadas na página Praticar)
const coresDasAreas = {
  Hardware: '#7b46ce', /* roxo da nova logo */
  Software: '#3f86dc', /* azul da nova logo */
  'Programação': '#f59e0b',
  Eletricidade: '#ef4444',
  Redes: '#10b981'
};

let categoriaSelecionada = 'todos';
let busca = '';
let termoAtual = dados[0];

// Controle de "sinal visto": 10s de exibição + vídeo tocado até o fim
let playerYT = null;
let ytPronto = false;
let videoIdPendente = '';
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
  const sinaisVistos = JSON.parse(localStorage.getItem('sinaisVistos') || '[]');
  if (!sinaisVistos.includes(visto.termo)) {
    sinaisVistos.push(visto.termo);
    localStorage.setItem('sinaisVistos', JSON.stringify(sinaisVistos));
    renderizarLista();
  }
}

function carregarVideo(videoId) {
  if (playerYT && ytPronto && videoId) {
    playerYT.loadVideoById(videoId);
  } else if (videoId) {
    videoIdPendente = videoId;
  }
}

// Nome exigido pela API do YouTube para iniciar o player
function onYouTubeIframeAPIReady() {
  playerYT = new YT.Player('ytPlayer', {
    videoId: videoIdPendente || '',
    playerVars: { rel: 0, modestbranding: 1 },
    events: {
      onReady: () => {
        ytPronto = true;
        if (videoIdPendente) {
          playerYT.loadVideoById(videoIdPendente);
          videoIdPendente = '';
        }
      },
      onStateChange: (evento) => {
        if (evento.data === YT.PlayerState.ENDED && visto && visto.termo) {
          visto.videoTerminou = true;
          marcarComoVisto();
        }
      }
    }
  });
}

function obterFavoritos() {
  return JSON.parse(localStorage.getItem('termosFavoritos') || '[]');
}

function alternarFavorito(nomeDoTermo) {
  let favoritos = obterFavoritos();
  if (favoritos.includes(nomeDoTermo)) {
    favoritos = favoritos.filter((t) => t !== nomeDoTermo);
  } else {
    favoritos.push(nomeDoTermo);
  }
  localStorage.setItem('termosFavoritos', JSON.stringify(favoritos));
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
    const cor = coresDasAreas[item.cat] || '#7b46ce';

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
          ? '<i class="fa-solid fa-heart" style="color: #ef4444;"></i>'
          : '<i class="fa-regular fa-heart"></i>'}
      </button>
    `;

    // Termo selecionado: contorno e fundo na cor da área
    if (ativo) {
      linha.style.borderColor = cor;
      linha.style.backgroundColor = cor + '1a';
    }

    const nomeEl = linha.querySelector('.term-item-content strong');
    if (nomeEl && coresDasAreas[item.cat]) {
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

  // Reinicia a contagem de tempo para marcar o termo como visto
  reiniciarVisto(termoAtual.term);

  const favoritos = obterFavoritos();
  const ehFavorito = favoritos.includes(termoAtual.term);
  const cor = coresDasAreas[termoAtual.cat] || '#7b46ce';

  // Cabeçalho na cor da área
  const cabecalho = document.getElementById('termHeader');
  if (cabecalho) cabecalho.style.background = cor;

  document.getElementById('displayTerm').textContent = termoAtual.term;
  document.getElementById('displayCategory').textContent = termoAtual.cat.toUpperCase();
  document.getElementById('displayDef').textContent = termoAtual.def;
  document.getElementById('displayExPt').textContent = `"${termoAtual.exPt}"`;
  document.getElementById('displayExGlosa').textContent = termoAtual.exGlosa;

  const fonteEl = document.getElementById('displaySource');
  if (fonteEl) {
    fonteEl.textContent = termoAtual.source;
    fonteEl.href = termoAtual.link;
  }

  // Imagem do termo (mostra placeholder se a imagem não existir)
  const imagemEl = document.getElementById('termImage');
  const placeholder = document.getElementById('imgPlaceholder');
  if (imagemEl && placeholder) {
    const slug = normalizar(termoAtual.term).replace(/\s+/g, '-');
    imagemEl.style.display = '';
    placeholder.style.display = 'none';
    imagemEl.src = `img/${slug}.png`;
  }

  if (termoAtual.youtubeId) {
    carregarVideo(extrairIdDoVideo(termoAtual.youtubeId));
  }

  // Coração de favoritar do cabeçalho
  const botaoFavorito = document.getElementById('btnMainFav');
  if (botaoFavorito) {
    botaoFavorito.innerHTML = ehFavorito
      ? '<i class="fa-solid fa-heart" style="color: #ef4444;"></i>'
      : '<i class="fa-regular fa-heart"></i>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('searchInput').addEventListener('input', (evento) => {
    busca = evento.target.value;
    renderizarLista();
  });

  document.getElementById('categorySelect').addEventListener('change', (evento) => {
    categoriaSelecionada = evento.target.value;
    renderizarLista();
  });

  document.getElementById('btnMainFav').addEventListener('click', () => {
    if (termoAtual) alternarFavorito(termoAtual.term);
  });

  // Lê ?cat= da URL (usado no botão "Consultar" da página Praticar)
  const parametros = new URLSearchParams(window.location.search);
  const categoriaDaUrl = parametros.get('cat');
  if (categoriaDaUrl) {
    const catNormalizada = normalizar(categoriaDaUrl);
    const select = document.getElementById('categorySelect');
    if ([...select.options].some((opcao) => opcao.value === catNormalizada)) {
      select.value = catNormalizada;
      categoriaSelecionada = catNormalizada;
    }
  }

  renderizarLista();

  // Abre o primeiro termo da categoria recebida pela URL
  if (categoriaDaUrl) {
    const filtrados = filtrarDados();
    if (filtrados.length > 0) {
      termoAtual = filtrados[0];
      renderizarLista();
    }
  }

  exibirTermoAtual();
});
