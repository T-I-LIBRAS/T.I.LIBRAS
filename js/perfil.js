(function () {
  function atualizarPerfil() {
    const usuario = window.currentUser;
    if (!usuario) return;

    const nome = usuario.name || (usuario.email ? usuario.email.split('@')[0] : 'Usuário');
    const inicial = (nome || '?').trim().charAt(0).toUpperCase();

    const avatar = document.getElementById('perfilAvatar');
    const titulo = document.getElementById('perfilNome');
    const emailTopo = document.getElementById('perfilEmail');
    const infoNome = document.getElementById('infoNome');
    const infoEmail = document.getElementById('infoEmail');

    if (avatar) avatar.textContent = inicial || '?';
    if (titulo) titulo.textContent = nome;
    if (emailTopo) emailTopo.textContent = usuario.email || '';
    if (infoNome) infoNome.textContent = nome;
    if (infoEmail) infoEmail.textContent = usuario.email || '-';
  }

  async function atualizarEstatisticas() {
    if (!window.Progresso) return;
    const dados = await window.Progresso.carregar();
    const sinais = document.getElementById('perfilSinais');
    const favoritos = document.getElementById('perfilFavoritos');
    const quizzes = document.getElementById('perfilQuizzes');
    if (sinais) sinais.textContent = dados.sinais_vistos.length;
    if (favoritos) favoritos.textContent = dados.termos_favoritos.length;
    if (quizzes) quizzes.textContent = dados.quizzes_concluidos.length;
  }

  window.addEventListener('auth-changed', () => {
    atualizarPerfil();
    atualizarEstatisticas();
  });
  window.addEventListener('progresso-carregado', atualizarEstatisticas);

  document.addEventListener('DOMContentLoaded', () => {
    atualizarPerfil();
    atualizarEstatisticas();
    const btnSair = document.getElementById('btnSairPerfil');
    if (btnSair) {
      btnSair.addEventListener('click', async () => {
        if (window.Auth && window.Auth.logout) {
          await window.Auth.logout();
        }
        window.location.href = 'index.html';
      });
    }
  });
})();
