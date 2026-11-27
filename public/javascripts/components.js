const PAGINA_INICIAL_APP = 'home.html';
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

function menuAcessibilidadeHtml() {
  return `
    <div class="acess-menu">
      <button type="button" class="acess-btn" id="acessBtn" aria-haspopup="true" aria-expanded="false" aria-controls="acessPainel" aria-label="Opções de acessibilidade" title="Acessibilidade">
        <span class="acess-icone-tema" aria-hidden="true">
          <svg class="icone-sol" viewBox="0 0 24 24" width="22" height="22" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            focusable="false">
            <circle cx="12" cy="12" r="4.1" fill="currentColor" stroke="none" />
            <path d="M12 2.4v2.3M12 19.3v2.3M2.4 12h2.3M19.3 12h2.3M5.2 5.2l1.65 1.65M17.15 17.15l1.65 1.65M18.8 5.2l-1.65 1.65M6.85 17.15L5.2 18.8" />
          </svg>
          <svg class="icone-lua" viewBox="0 0 24 24" width="22" height="22" fill="currentColor"
            stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
            focusable="false">
            <path d="M20.9 14.3A9.2 9.2 0 0 1 9.7 3.1a7.3 7.3 0 1 0 11.2 11.2Z" />
          </svg>
        </span>
      </button>
      <div class="acess-painel" id="acessPainel" role="group" aria-label="Opções de acessibilidade" hidden>
        <h2 class="acess-titulo">Acessibilidade</h2>
        <div class="acess-grupo">
          <span class="acess-rotulo">Tema</span>
          <div class="acess-opcoes">
            <button type="button" class="acess-opcao" data-tema-opcao="claro" aria-pressed="true"><i class="fa-solid fa-sun"></i> Claro</button>
            <button type="button" class="acess-opcao" data-tema-opcao="escuro" aria-pressed="false"><i class="fa-solid fa-moon"></i> Escuro</button>
          </div>
        </div>
        <div class="acess-grupo">
          <span class="acess-rotulo">Contraste</span>
          <div class="acess-opcoes">
            <button type="button" class="acess-opcao" data-contraste-opcao="normal" aria-pressed="true">Normal</button>
            <button type="button" class="acess-opcao" data-contraste-opcao="alto" aria-pressed="false"><i class="fa-solid fa-circle-half-stroke"></i> Alto</button>
          </div>
        </div>
        <button type="button" class="acess-restaurar" id="acessRestaurar">Restaurar padrão</button>
      </div>
    </div>
  `;
}

class AppHeaderHome extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="header">
        <a href="index.html" class="logo" title="Ir para a página inicial">
          <img src="/images/logo.png" alt="T.I. Libras Logo" class="brand-logo">
          <span class="logo-text">T.I Libras</span>
        </a>
        <div class="header-actions">
          ${menuAcessibilidadeHtml()}
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
          <img src="/images/logo.png" alt="T.I. Libras Logo" class="brand-logo">
          <span class="logo-text">T.I Libras</span>
        </a>
        <nav class="nav-links">
          <a href="home.html" id="nav-inicio">Início</a>
          <a href="sinalario.html" id="nav-sinalario">Sinalário</a>
          <a href="praticar.html" id="nav-praticar">Praticar</a>
        </nav>
        <div class="header-actions">
          ${menuAcessibilidadeHtml()}
          <a href="index.html?auth=login" class="auth-btn auth-login" id="headerLogin">Entrar</a>
          <a href="index.html?auth=register" class="auth-btn auth-register" id="headerRegister">Cadastrar</a>
          <a href="perfil.html" class="auth-btn auth-perfil" id="headerPerfil" hidden>
            <span class="avatar-mini" id="headerAvatarMini">?</span>
            <span id="headerPerfilNome">Perfil</span>
          </a>
          <button type="button" class="auth-btn auth-logout" id="headerSair" hidden><i class="fa-solid fa-arrow-right-from-bracket"></i> Sair</button>
        </div>
      </header>
    `;

    const caminho = window.location.pathname;
    if (caminho.includes('home.html')) {
      this.querySelector('#nav-inicio')?.classList.add('active');
    } else if (caminho.includes('sinalario.html')) {
      this.querySelector('#nav-sinalario')?.classList.add('active');
    } else if (caminho.includes('praticar.html')) {
      this.querySelector('#nav-praticar')?.classList.add('active');
    }

    const aplicarEstado = () => {
      const logado = estaLogado();
      const inicio = this.querySelector('#nav-inicio');
      const praticar = this.querySelector('#nav-praticar');
      const sinalario = this.querySelector('#nav-sinalario');
      const login = this.querySelector('#headerLogin');
      const registro = this.querySelector('#headerRegister');
      const perfil = this.querySelector('#headerPerfil');
      const sair = this.querySelector('#headerSair');
      const nav = this.querySelector('.nav-links');
      const logo = this.querySelector('.logo');
      if (logo) logo.setAttribute('href', logado ? PAGINA_INICIAL_APP : 'index.html');
      if (inicio) inicio.style.display = logado ? '' : 'none';
      if (praticar) praticar.style.display = logado ? '' : 'none';
      if (sinalario) sinalario.style.display = logado ? '' : 'none';
      if (nav) nav.style.display = logado ? '' : 'none';
      if (login) login.style.display = logado ? 'none' : '';
      if (registro) registro.style.display = logado ? 'none' : '';
      if (perfil) perfil.style.display = logado ? '' : 'none';
      if (sair) sair.style.display = logado ? '' : 'none';

      if (logado) {
        const usuario = (window.currentUser) || (window.sessaoSupabase && window.sessaoSupabase.user) || {};
        const nome = usuario.name || usuario.email || 'Perfil';
        const inicial = (nome || '?').trim().charAt(0).toUpperCase();
        const nomeEl = this.querySelector('#headerPerfilNome');
        const avatarEl = this.querySelector('#headerAvatarMini');
        if (nomeEl) nomeEl.textContent = (usuario.name || nome.split('@')[0] || 'Perfil');
        if (avatarEl) avatarEl.textContent = inicial || '?';
      }
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
            <div class="footer-brand-text">
              <strong>T.I Libras</strong>
              <span>Tecnologia acessível em Libras</span>
            </div>
          </div>
          <div class="footer-social">
            <a href="${LINK_GITHUB}" target="_blank" rel="noopener noreferrer" class="social-round github" aria-label="GitHub" title="GitHub">
              <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.62 7.62 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/>
              </svg>
            </a>
            <a href="https://www.instagram.com/t.i.libras/" target="_blank" rel="noopener noreferrer" class="social-round instagram" aria-label="Instagram do T.I Libras" title="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false">
                <rect x="3" y="3" width="18" height="18" rx="5"/>
                <circle cx="12" cy="12" r="4.2"/>
                <circle cx="17.5" cy="6.7" r="1.15" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a href="https://www.youtube.com/@t.i.libras" target="_blank" rel="noopener noreferrer" class="social-round youtube" aria-label="YouTube" title="YouTube">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
                <path fill-rule="evenodd" d="M3.7 5.3C5.3 4.8 8 4.7 12 4.7s6.7.1 8.3.6c1.3.4 2 1.5 2.3 3.1.5 2.4.5 4.8 0 7.2-.3 1.6-1 2.7-2.3 3.1-1.6.5-4.3.6-8.3.6s-6.7-.1-8.3-.6c-1.3-.4-2-1.5-2.3-3.1-.5-2.4-.5-4.8 0-7.2.3-1.6 1-2.7 2.3-3.1ZM10 8.4v7.2l6-3.6-6-3.6Z"/>
              </svg>
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

// Menu exclusivo para celular.
// Reaproveita os links existentes, sem duplicar IDs ou eventos.
(() => {
  function prepararMenuMobile(componente, indice) {
    const header = componente.querySelector('.header');
    const acoes = header?.querySelector('.header-actions');

    if (!header || !acoes) return;

    const telaMobile = window.matchMedia('(max-width: 600px)');

    // Elementos que entrarão no menu do celular.
    const itens = [
      header.querySelector('.nav-links'),
      ...acoes.querySelectorAll(':scope > .auth-btn')
    ].filter(Boolean);

    // Guarda a posição original de cada elemento no computador.
    const posicoes = itens.map((elemento) => {
      const marcador = document.createComment('Posição no computador');

      elemento.before(marcador);

      return { elemento, marcador };
    });

    // Botão de abrir e fechar.
    const botao = document.createElement('button');

    botao.type = 'button';
    botao.className = 'mobile-menu-toggle';
    botao.setAttribute('aria-label', 'Abrir menu');
    botao.setAttribute('aria-expanded', 'false');
    botao.setAttribute('aria-controls', `mobile-menu-${indice}`);

    botao.innerHTML = `
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    `;

    // Painel que receberá os links e botões.
    const painel = document.createElement('div');

    painel.id = `mobile-menu-${indice}`;
    painel.className = 'mobile-menu';
    painel.hidden = true;

    acoes.append(botao);
    header.append(painel);

    function fecharMenu(devolverFoco = false) {
      painel.hidden = true;

      botao.setAttribute('aria-expanded', 'false');
      botao.setAttribute('aria-label', 'Abrir menu');

      if (devolverFoco && telaMobile.matches) {
        botao.focus();
      }
    }

    function abrirMenu() {
      if (!telaMobile.matches) return;

      // Fecha a acessibilidade antes de abrir a navegação.
      const acessPainel = header.querySelector('#acessPainel');
      const acessBotao = header.querySelector('#acessBtn');

      if (acessPainel) acessPainel.hidden = true;

      acessBotao?.setAttribute('aria-expanded', 'false');

      painel.hidden = false;

      botao.setAttribute('aria-expanded', 'true');
      botao.setAttribute('aria-label', 'Fechar menu');

      // Coloca o foco na primeira opção visível.
      const primeiroItem = [...painel.querySelectorAll('a, button')]
        .find((el) => el.getClientRects().length > 0 && !el.disabled);

      primeiroItem?.focus();
    }

    function adaptarLayout() {
      const foco = document.activeElement;

      const precisaMoverFoco =
        painel.contains(foco) ||
        foco === botao ||
        posicoes.some(({ elemento }) => elemento.contains(foco));

      fecharMenu();

      posicoes.forEach(({ elemento, marcador }) => {
        if (telaMobile.matches) {
          painel.append(elemento);
        } else {
          marcador.after(elemento);
        }
      });

      if (precisaMoverFoco) {
        const destino = telaMobile.matches
          ? botao
          : header.querySelector('.logo');

        destino?.focus();
      }
    }

    botao.addEventListener('click', () => {
      if (painel.hidden) {
        abrirMenu();
      } else {
        fecharMenu(true);
      }
    });

    componente.addEventListener('click', (evento) => {
      const alvo = evento.target;

      if (!(alvo instanceof Element)) return;

      // Fecha a navegação quando abrir a acessibilidade.
      if (alvo.closest('#acessBtn')) {
        fecharMenu();
      }

      // Fecha ao escolher uma opção.
      if (painel.contains(alvo) && alvo.closest('a, button')) {
        fecharMenu(true);
      }
    });

    // Fecha ao clicar fora do cabeçalho.
    document.addEventListener('click', (evento) => {
      if (!header.contains(evento.target)) {
        fecharMenu();
      }
    });

    // Fecha quando a navegação por teclado sair do cabeçalho.
    document.addEventListener('focusin', (evento) => {
      if (!painel.hidden && !header.contains(evento.target)) {
        fecharMenu();
      }
    });

    // Fecha com Escape.
    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape' && !painel.hidden) {
        evento.preventDefault();
        fecharMenu(true);
      }
    });

    // A atualização da sessão continua sendo feita pelo código original.
    window.addEventListener('auth-changed', () => {
      fecharMenu(painel.contains(document.activeElement));
    });

    // Reorganiza ao passar entre celular e computador.
    telaMobile.addEventListener('change', adaptarLayout);

    adaptarLayout();
  }

  function iniciarMenusMobile() {
    document.querySelectorAll('app-header, app-header-home')
      .forEach(prepararMenuMobile);
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      iniciarMenusMobile,
      { once: true }
    );
  } else {
    iniciarMenusMobile();
  }
})();

customElements.define('app-header-home', AppHeaderHome);
customElements.define('app-header', AppHeader);
customElements.define('app-footer', AppFooter);
