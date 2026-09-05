// Lógica da página inicial: alterna entre o conteúdo de apresentação (Início) e as
// telas de Login/Cadastro exibidas na PRÓPRIA página (sem janelas pop-up/modal).
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

  // "Voltar": retorna ao conteúdo inicial e limpa ?auth/?next da URL para
  // que um simples F5 não reabra o formulário.
  function voltarParaInicio() {
    mostrarVisao('inicio');
    const url = new URL(window.location.href);
    if (url.searchParams.has('auth') || url.searchParams.has('next')) {
      url.searchParams.delete('auth');
      url.searchParams.delete('next');
      history.replaceState(null, '', url.toString());
    }
  }

  // Links "Entrar"/"Cadastrar" do Header 1 e do restante da página
  document.querySelectorAll('[data-abrir-auth]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      mostrarAutenticacao(el.getAttribute('data-abrir-auth'));
    });
  });

  // Botões da faixa principal (hero)
  document.getElementById('openLogin')?.addEventListener('click', () => mostrarAutenticacao('login'));
  document.getElementById('openRegister')?.addEventListener('click', () => mostrarAutenticacao('register'));

  // Troca entre Login e Cadastro dentro das próprias seções
  document.getElementById('switchToRegister')?.addEventListener('click', () => mostrarAutenticacao('register'));
  document.getElementById('switchToLogin')?.addEventListener('click', () => mostrarAutenticacao('login'));

  // Botões "Voltar"
  document.querySelectorAll('[data-voltar]').forEach((btn) => {
    btn.addEventListener('click', voltarParaInicio);
  });

  // Âncoras do menu de apresentação do Header 1: se o conteúdo de Início estiver
  // oculto (ex.: tela de login visível), primeiro volta e depois rola até a seção.
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

  // Estado inicial — respeita deep links: ?auth=login|register e ?next=...
  const parametros = new URLSearchParams(window.location.search);
  if (parametros.get('auth') === 'register') mostrarAutenticacao('register');
  else if (parametros.get('auth') === 'login' || parametros.get('next')) mostrarAutenticacao('login');
  else mostrarVisao('inicio');

  // ============================================================
  // MODO DE TESTE LOCAL (sem Firebase acessível, ex.: Live Server
  // offline). Quando o window.Auth do Firebase não está disponível,
  // o "Entrar" / "Continuar com o Google" / "Criar conta" fazem um
  // login SIMULADO: salva a sessão no localStorage (isLoggedIn=true),
  // troca o Header 1 pelo Header 2 e abre a tela do Praticar.
  // ============================================================
  const firebaseDisponivel = typeof window.Auth !== 'undefined' && window.Auth;
  if (!firebaseDisponivel) {
    const entrarNoModoLocal = (nome, email) => {
      iniciarSessaoLocal({
        uid: 'local-' + Date.now(),
        nome: nome || 'Usuário de Teste',
        email: email || 'teste@local.dev'
      });
      window.location.href = 'praticar.html';
    };

    const formLogin = document.getElementById('loginForm');
    if (formLogin) {
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail')?.value.trim();
        entrarNoModoLocal('', email);
      });
    }

    const btnGoogle = document.getElementById('btnGoogle');
    if (btnGoogle) {
      btnGoogle.addEventListener('click', (e) => {
        e.preventDefault();
        entrarNoModoLocal();
      });
    }

    const formRegistro = document.getElementById('registerForm');
    if (formRegistro) {
      formRegistro.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('regName')?.value.trim();
        const email = document.getElementById('regEmail')?.value.trim();
        entrarNoModoLocal(nome, email);
      });
    }

    const btnGoogleRegister = document.getElementById('btnGoogleRegister');
    if (btnGoogleRegister) {
      btnGoogleRegister.addEventListener('click', (e) => {
        e.preventDefault();
        entrarNoModoLocal();
      });
    }
  }
});
