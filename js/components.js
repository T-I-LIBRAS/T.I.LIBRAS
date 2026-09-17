const PAGINA_INICIAL_APP = 'sinalario.html';
const LINK_GITHUB = 'https://github.com/ti-libras/T.I.-LIBRAS';

function estaLogado() {
  return (
    !!(window.currentUser && window.currentUser.uid) ||
    !!(window.sessaoSupabase && window.sessaoSupabase.user)
  );
}

function encerrarSessao() {
  window.currentUser = null;
  window.sessaoSupabase = null;
  window.dispatchEvent(new CustomEvent('auth-changed'));
}

async function sairDoSistema() {
  if (window.Auth && window.Auth.logout) {
    await window.Auth.logout();
  } else {
    encerrarSessao();
  }
}

class AppHeaderHome extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="header">
        <a href="index.html" class="logo" title="Ir para a página inicial">
          <img src="assets/imagens/logo.png" alt="T.I. Libras Logo" class="brand-logo">
          <span class="logo-text">T.I Libras</span>
        </a>
        <div class="header-actions">
          <a href="#login" class="auth-btn auth-login" id="headerLogin" data-abrir-auth="login">Entrar</a>
          <a href="#cadastro" class="auth-btn auth-register" id="headerRegister" data-abrir-auth="register">Criar conta</a>
          <a href="${PAGINA_INICIAL_APP}" class="auth-btn auth-register" id="headerAcessar" hidden>Acessar plataforma</a>
          <button type="button" class="auth-btn auth-logout" id="headerSair" hidden><i class="fa-solid fa-arrow-right-from-bracket"></i> Sair</button>
        </div>
      </header>
    `;

    const aplicarEstado = () => {
      const logado = estaLogado();
      const login = this.querySelector('#headerLogin');
      const registro = this.querySelector('#headerRegister');
      const acessar = this.querySelector('#headerAcessar');
      const sair = this.querySelector('#headerSair');
      if (login) login.style.display = logado ? 'none' : '';
      if (registro) registro.style.display = logado ? 'none' : '';
      if (acessar) acessar.style.display = logado ? '' : 'none';
      if (sair) sair.style.display = logado ? '' : 'none';
    };

    const sairBtn = this.querySelector('#headerSair');
    if (sairBtn) sairBtn.addEventListener('click', sairDoSistema);

    aplicarEstado();
    window.addEventListener('auth-changed', aplicarEstado);
  }
}

class AppHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="header">
        <a href="index.html" class="logo" title="Ir para a página inicial">
          <img src="assets/imagens/logo.png" alt="T.I. Libras Logo" class="brand-logo">
          <span class="logo-text">T.I Libras</span>
        </a>
        <nav class="nav-links">
          <a href="sinalario.html" id="nav-sinalario">Sinalário</a>
          <a href="praticar.html" id="nav-praticar">Praticar</a>
        </nav>
        <div class="header-actions">
          <a href="index.html?auth=login" class="auth-btn auth-login" id="headerLogin">Entrar</a>
          <a href="index.html?auth=register" class="auth-btn auth-register" id="headerRegister">Cadastrar</a>
          <button class="icon-btn" type="button" title="Configurações"><i class="fa-solid fa-gear"></i></button>
          <button type="button" class="auth-btn auth-logout" id="headerSair" hidden><i class="fa-solid fa-arrow-right-from-bracket"></i> Sair</button>
        </div>
      </header>
    `;

    const caminho = window.location.pathname;
    if (caminho.includes('sinalario.html')) {
      this.querySelector('#nav-sinalario')?.classList.add('active');
    } else if (caminho.includes('praticar.html')) {
      this.querySelector('#nav-praticar')?.classList.add('active');
    }

    const aplicarEstado = () => {
      const logado = estaLogado();
      const praticar = this.querySelector('#nav-praticar');
      const sinalario = this.querySelector('#nav-sinalario');
      const login = this.querySelector('#headerLogin');
      const registro = this.querySelector('#headerRegister');
      const sair = this.querySelector('#headerSair');
      const nav = this.querySelector('.nav-links');
      const logo = this.querySelector('.logo');
      if (logo) logo.setAttribute('href', logado ? PAGINA_INICIAL_APP : 'index.html');
      if (praticar) praticar.style.display = logado ? '' : 'none';
      if (sinalario) sinalario.style.display = logado ? '' : 'none';
      if (nav) nav.style.display = logado ? '' : 'none';
      if (login) login.style.display = logado ? 'none' : '';
      if (registro) registro.style.display = logado ? 'none' : '';
      if (sair) sair.style.display = logado ? '' : 'none';
    };

    const sairBtn = this.querySelector('#headerSair');
    if (sairBtn) {
      sairBtn.addEventListener('click', async () => {
        await sairDoSistema();
        window.location.href = 'index.html';
      });
    }

    aplicarEstado();
    window.addEventListener('auth-changed', aplicarEstado);
  }
}

class AppFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="footer">
        <div class="footer-top">
          <div class="footer-brand">
            <img src="assets/imagens/logo.png" alt="T.I. Libras" class="brand-logo">
            <div class="footer-brand-text">
              <strong>T.I Libras</strong>
              <span>Tecnologia acessível em Libras</span>
            </div>
          </div>
          <div class="footer-social">
            <a href="${LINK_GITHUB}" target="_blank" rel="noopener noreferrer" class="social-round github" aria-label="GitHub" title="GitHub">
              <i class="fa-brands fa-github"></i>
            </a>
            <a href="https://www.youtube.com/@t.i.libras" target="_blank" rel="noopener noreferrer" class="social-round youtube" aria-label="YouTube" title="YouTube">
              <i class="fa-brands fa-youtube"></i>
            </a>
          </div>
        </div>
        <div class="footer-links">
          <div class="footer-links-group">
            <span class="footer-contact">Contato: <a href="mailto:ttilibras@gmail.com">ttilibras@gmail.com</a></span>
            <a href="ficha-tecnica.html">Ficha Técnica</a>
            <a href="termos.html">Termos e Condições de Uso</a>
          </div>
          <span class="footer-copy">© 2026 T.I. Libras. Todos os direitos reservados.</span>
        </div>
      </footer>
    `;
  }
}

customElements.define('app-header-home', AppHeaderHome);
customElements.define('app-header', AppHeader);
customElements.define('app-footer', AppFooter);
