const TERMOS_DO_SINALARIO = typeof TERMOS !== 'undefined' ? TERMOS : [];

const MAPA_DE_PONTOS = {
  Hardware: 'purple',
  Software: 'blue',
  'Programação': 'yellow',
  Eletricidade: 'red',
  Redes: 'green'
};

const CORES_DAS_AREAS = {
  Hardware: '#783cc8',
  Software: '#3c8cdc',
  'Programação': '#f59e0b',
  Eletricidade: '#ef4444',
  Redes: '#10b981'
};

const ICONES_DAS_AREAS = {
  Hardware: 'fa-desktop',
  Software: 'fa-compact-disc',
  'Programação': 'fa-laptop-code',
  Eletricidade: 'fa-plug',
  Redes: 'fa-tower-broadcast'
};

const ICONES_DO_FILTRO = {
  todos: 'fa-shapes',
  hardware: 'fa-desktop',
  software: 'fa-compact-disc',
  programacao: 'fa-laptop-code',
  eletricidade: 'fa-plug',
  redes: 'fa-tower-broadcast',
  favoritos: 'fa-heart'
};

const ANTECEDENCIA_DO_FIM = 1;
const INTERVALO_DA_CONTAGEM = 10000;

let categoriaSelecionada = 'todos';
let busca = '';
let termoAtual = TERMOS_DO_SINALARIO[0] || null;
let videoIndisponivel = false;
let timerDoVisto = null;
let visto = { termo: null, tempoOk: false, videoTerminou: false };
let instanteAnterior = 0;

function normalizar(texto) {
  return String(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function videoDoSinal() {
  return document.getElementById('videoSinal');
}

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
  }, INTERVALO_DA_CONTAGEM);
}

function marcarComoVisto() {
  if (!visto || !visto.termo) return;
  if (!(visto.tempoOk && visto.videoTerminou)) return;
  if (!progressoDisponivel()) return;
  if (window.Progresso.adicionarSinalVisto(visto.termo)) renderizarLista();
}

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
  const icone = gatilho.querySelector('.selected-option i');
  if (icone) icone.className = `fa-solid ${ICONES_DO_FILTRO[valor] || 'fa-shapes'} icon-${valor}`;
}

function valoresDoFiltroDisponiveis() {
  return [...document.querySelectorAll('.custom-option')].map((opcao) => opcao.dataset.value);
}

function definirVideoIndisponivel(estado) {
  videoIndisponivel = !!estado;
  const aviso = document.getElementById('avisoVideoIndisponivel');
  if (aviso) aviso.classList.toggle('esta-visivel', videoIndisponivel);
}

function tentarReproduzir() {
  const video = videoDoSinal();
  if (!video || videoIndisponivel) return;

  const promessa = video.play();
  if (promessa && typeof promessa.catch === 'function') promessa.catch(() => {});
}

function carregarVideoDoTermo(termo) {
  const video = videoDoSinal();
  if (!video) return;

  const fonte = termo && termo.video ? termo.video : '';

  if (!fonte) {
    video.removeAttribute('src');
    video.load();
    definirVideoIndisponivel(true);
    return;
  }

  definirVideoIndisponivel(false);
  instanteAnterior = 0;
  video.muted = true;
  video.src = fonte;
  video.load();
  tentarReproduzir();
}

function aoAtualizarTempo() {
  const video = videoDoSinal();
  if (!video || videoIndisponivel) return;

  const duracao = Number(video.duration) || 0;
  const instante = Number(video.currentTime) || 0;
  const reiniciouCiclo = duracao > 0 && instante < instanteAnterior - 0.5;
  const chegouAoFim = duracao > 0 && instante >= duracao - ANTECEDENCIA_DO_FIM;

  instanteAnterior = instante;

  if (visto && visto.termo && !visto.videoTerminou && (chegouAoFim || reiniciouCiclo)) {
    visto.videoTerminou = true;
    marcarComoVisto();
  }
}

function conectarVideo() {
  const video = videoDoSinal();
  if (!video) return;

  video.addEventListener('timeupdate', aoAtualizarTempo);
  video.addEventListener('error', () => {
    definirVideoIndisponivel(true);
  });
}

function alternarFavorito(nomeDoTermo) {
  if (!progressoDisponivel()) return;

  window.Progresso.alternarFavorito(nomeDoTermo);
  renderizarLista();
  exibirTermoAtual();
}

function filtrarDados() {
  const favoritos = obterFavoritos();

  return TERMOS_DO_SINALARIO.filter((item) => {
    const bateCategoria = categoriaSelecionada === 'todos'
      ? true
      : categoriaSelecionada === 'favoritos'
        ? favoritos.includes(item.termo)
        : normalizar(item.categoria) === categoriaSelecionada;

    const buscaBate = normalizar(item.termo).includes(normalizar(busca));

    return bateCategoria && buscaBate;
  });
}

function renderizarLista() {
  const container = document.getElementById('termsList');
  if (!container) return;

  const filtrados = filtrarDados();
  const contador = document.getElementById('termsCount');

  if (contador) {
    contador.textContent = `${filtrados.length} ${filtrados.length === 1 ? 'TERMO' : 'TERMOS'}`;
  }

  container.innerHTML = '';

  const favoritos = obterFavoritos();

  filtrados.forEach((item) => {
    const ativo = !!(termoAtual && termoAtual.termo === item.termo);
    const ehFavorito = favoritos.includes(item.termo);
    const cor = CORES_DAS_AREAS[item.categoria] || '#783cc8';

    const linha = document.createElement('div');
    linha.className = `term-item${ativo ? ' active' : ''}`;
    linha.innerHTML = `
      <div class="term-item-content">
        <span class="dot ${MAPA_DE_PONTOS[item.categoria] || 'purple'}"></span>
        <div class="term-text">
          <strong>${item.termo}</strong>
          <small>${item.categoria}</small>
        </div>
      </div>
      <button class="btn-fav" title="Favoritar">
        ${ehFavorito
          ? '<i class="fa-solid fa-heart"></i>'
          : '<i class="fa-regular fa-heart"></i>'}
      </button>
    `;

    if (ativo) {
      linha.style.borderColor = cor;
      linha.style.backgroundColor = cor + '1a';

      const nomeEl = linha.querySelector('.term-item-content strong');
      if (nomeEl) nomeEl.style.color = cor;
    }

    linha.querySelector('.term-item-content').addEventListener('click', () => {
      termoAtual = item;
      renderizarLista();
      exibirTermoAtual();
    });

    linha.querySelector('.btn-fav').addEventListener('click', (evento) => {
      evento.stopPropagation();
      alternarFavorito(item.termo);
    });

    container.appendChild(linha);
  });
}

function exibirTermoAtual() {
  if (!termoAtual) return;

  reiniciarVisto(termoAtual.termo);

  const favoritos = obterFavoritos();
  const ehFavorito = favoritos.includes(termoAtual.termo);
  const cor = CORES_DAS_AREAS[termoAtual.categoria] || '#783cc8';

  const cabecalho = document.getElementById('termHeader');
  if (cabecalho) cabecalho.style.background = cor;

  document.getElementById('displayTerm').textContent = termoAtual.termo;
  document.getElementById('displayCategory').textContent = termoAtual.categoria.toUpperCase();
  document.getElementById('displayDef').textContent = termoAtual.descricao || '';

  const iconeCategoria = document.getElementById('displayCategoryIcon');
  if (iconeCategoria) {
    iconeCategoria.className =
      `fa-solid ${ICONES_DAS_AREAS[termoAtual.categoria] || 'fa-folder-open'}`;
  }

  document.getElementById('displayExPt').textContent =
    termoAtual.exemploPt ? `"${termoAtual.exemploPt}"` : 'Exemplo em breve.';
  document.getElementById('displayExGlosa').textContent =
    termoAtual.exemploGlosa || 'Exemplo em breve.';

  const imagemEl = document.getElementById('termImage');
  const placeholder = document.getElementById('imgPlaceholder');

  if (imagemEl && placeholder) {
    imagemEl.style.display = '';
    placeholder.style.display = 'none';

    imagemEl.onerror = () => {
      imagemEl.style.display = 'none';
      placeholder.style.display = 'flex';
    };

    imagemEl.src = termoAtual.imagem || '';
  }

  carregarVideoDoTermo(termoAtual);

  const botaoFavorito = document.getElementById('btnMainFav');
  if (botaoFavorito) {
    botaoFavorito.innerHTML = ehFavorito
      ? '<i class="fa-solid fa-heart"></i>'
      : '<i class="fa-regular fa-heart"></i>';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  conectarVideo();

  if (progressoDisponivel()) await window.Progresso.carregar();

  const campoBusca = document.getElementById('searchInput');
  if (campoBusca) {
    campoBusca.addEventListener('input', (evento) => {
      busca = evento.target.value;
      renderizarLista();
    });
  }

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

  const botaoFavorito = document.getElementById('btnMainFav');
  if (botaoFavorito) {
    botaoFavorito.addEventListener('click', () => {
      if (termoAtual) alternarFavorito(termoAtual.termo);
    });
  }

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
