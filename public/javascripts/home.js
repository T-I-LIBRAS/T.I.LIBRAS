(function () {
  function atualizarSaudacao() {
    const usuario = window.currentUser;
    const saudacao = document.getElementById('homeSaudacao');
    if (!usuario || !saudacao) return;

    const nome = usuario.name || (usuario.email ? usuario.email.split('@')[0] : 'por aqui');
    saudacao.textContent = `Olá, ${nome}!`;
  }

  function mostrarProgresso(percentual) {
    const valor = document.getElementById('statProgresso');
    const texto = document.getElementById('textoProgresso');
    const barra = document.getElementById('barraProgresso');
    const preenchida = document.getElementById('barraProgressoPreenchida');
    if (valor) valor.textContent = `${percentual}%`;
    if (texto) texto.textContent = `${percentual}%`;
    if (barra) barra.setAttribute('aria-valuenow', String(percentual));
    if (preenchida) preenchida.style.width = `${percentual}%`;
  }

  function escapar(texto) {
    return String(texto).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function formatarQuando(iso) {
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) return '';
    const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const hoje = new Date();
    const ontem = new Date();
    ontem.setDate(hoje.getDate() - 1);
    if (data.toDateString() === hoje.toDateString()) return `Hoje, às ${hora}`;
    if (data.toDateString() === ontem.toDateString()) return `Ontem, às ${hora}`;
    return `${data.toLocaleDateString('pt-BR')}, às ${hora}`;
  }

  function mostrarUltimaAtividade() {
    const area = document.getElementById('ultimaAtividade');
    if (!area || !window.Progresso) return;

    const atividade = window.Progresso.ultimaAtividade();
    if (!atividade) {
      area.innerHTML = '<p class="home-box-vazio">Você ainda não tem atividades. Comece pelo <a href="sinalario.html">Sinalário</a>!</p>';
      return;
    }

    const ehQuiz = atividade.tipo === 'quiz';
    const icone = ehQuiz ? 'fa-graduation-cap' : 'fa-hand';
    const titulo = ehQuiz ? `Quiz de ${atividade.rotulo} concluído` : `Sinal visto: ${atividade.rotulo}`;
    const destino = ehQuiz ? 'praticar.html' : 'sinalario.html';

    area.innerHTML = `
      <a href="${destino}" class="home-atividade">
        <span class="home-atividade-icone"><i class="fa-solid ${icone}"></i></span>
        <span class="home-atividade-texto">
          <strong>${escapar(titulo)}</strong>
          <span>${escapar(formatarQuando(atividade.data))}</span>
        </span>
        <span class="home-atividade-seta"><i class="fa-solid fa-arrow-right"></i></span>
      </a>`;
  }

  async function atualizarEstatisticas() {
    if (!window.Progresso) return;
    const dados = await window.Progresso.carregar();
    const statSinais = document.getElementById('statSinais');
    const statFavoritos = document.getElementById('statFavoritos');
    const statQuizzes = document.getElementById('statQuizzes');
    if (statSinais) statSinais.textContent = dados.sinais_vistos.length;
    if (statFavoritos) statFavoritos.textContent = dados.termos_favoritos.length;
    if (statQuizzes) statQuizzes.textContent = dados.quizzes_concluidos.length;
    const percentual = window.Progresso.percentualGeral();
    mostrarProgresso(percentual === null ? 0 : percentual);
    mostrarUltimaAtividade();
  }

  window.addEventListener('auth-changed', () => {
    atualizarSaudacao();
    atualizarEstatisticas();
  });
  window.addEventListener('progresso-carregado', atualizarEstatisticas);

  document.addEventListener('DOMContentLoaded', () => {
    atualizarSaudacao();
    atualizarEstatisticas();
  });
})();
