document.addEventListener('DOMContentLoaded', () => {
  const viewInicio = document.getElementById('viewInicio');
  const viewLogin = document.getElementById('viewLogin');
  const viewRegister = document.getElementById('viewRegister');

  function esconderTodas() {
    [viewInicio, viewLogin, viewRegister].forEach((v) => {
      if (v) v.hidden = true;
    });
  }

  function mostrarVisao(visao) {
    esconderTodas();
    const mapa = { inicio: viewInicio, login: viewLogin, register: viewRegister };
    const alvo = mapa[visao] || viewInicio;
    if (alvo) alvo.hidden = false;
    window.scrollTo(0, 0);
  }

  function mostrarAutenticacao(modo) {
    mostrarVisao(modo === 'register' ? 'register' : 'login');
  }

  function voltarParaInicio() {
    mostrarVisao('inicio');
    const url = new URL(window.location.href);
    if (url.searchParams.has('auth') || url.searchParams.has('next')) {
      url.searchParams.delete('auth');
      url.searchParams.delete('next');
      history.replaceState(null, '', url.toString());
    }
  }

  document.querySelectorAll('[data-abrir-auth]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      mostrarAutenticacao(el.getAttribute('data-abrir-auth'));
    });
  });

  document.getElementById('openLogin')?.addEventListener('click', () => mostrarAutenticacao('login'));
  document.getElementById('openRegister')?.addEventListener('click', () => mostrarAutenticacao('register'));

  document.getElementById('switchToRegister')?.addEventListener('click', () => mostrarAutenticacao('register'));
  document.getElementById('switchToLogin')?.addEventListener('click', () => mostrarAutenticacao('login'));

  document.querySelectorAll('[data-voltar]').forEach((btn) => {
    btn.addEventListener('click', voltarParaInicio);
  });

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const alvo = document.querySelector(a.getAttribute('href'));
      if (!alvo) return;
      if (alvo.offsetParent === null) {
        e.preventDefault();
        voltarParaInicio();
        setTimeout(() => alvo.scrollIntoView({ behavior: 'smooth' }), 60);
      }
    });
  });

  const parametros = new URLSearchParams(window.location.search);
  if (parametros.get('auth') === 'register') mostrarAutenticacao('register');
  else if (parametros.get('auth') === 'login' || parametros.get('next')) mostrarAutenticacao('login');
  else mostrarVisao('inicio');
});
