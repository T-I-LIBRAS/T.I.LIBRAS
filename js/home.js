(function () {
  function atualizarSaudacao() {
    const usuario = window.currentUser;
    const saudacao = document.getElementById('homeSaudacao');
    const avatar = document.getElementById('homeAvatar');
    if (!usuario) return;

    const nome = usuario.name || (usuario.email ? usuario.email.split('@')[0] : 'por aqui');
    if (saudacao) saudacao.textContent = `Olá, ${nome}! 👋`;
    if (avatar) avatar.textContent = (nome || '?').trim().charAt(0).toUpperCase();
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
