const PAGINAS_PROTEGIDAS = ['/home.html', '/sinalario.html', '/praticar.html', '/quiz.html', '/perfil.html'];
const PAGINA_INICIAL = 'home.html';

function porId(id) {
  return document.getElementById(id);
}

function paginaProtegida() {
  const caminho = window.location.pathname;
  return PAGINAS_PROTEGIDAS.some((pagina) => caminho.endsWith(pagina));
}

function estaNaPaginaInicial() {
  const caminho = window.location.pathname;
  return caminho.endsWith('index.html') || caminho.endsWith('/') || caminho === '';
}

function destinoSeguro(next) {
  if (!next) return PAGINA_INICIAL;
  const alvo = decodeURIComponent(next);
  if (alvo.includes('index.html') || alvo === '/' || alvo === '') return PAGINA_INICIAL;
  return alvo;
}

function redirecionarUsuarioLogado(usuario) {
  if (!usuario) return;
  if (!estaNaPaginaInicial()) return;
  const parametros = new URLSearchParams(window.location.search);
  window.location.replace(destinoSeguro(parametros.get('next')));
}

function aplicarUsuario(usuario) {
  window.currentUser = usuario || null;
  window.dispatchEvent(new CustomEvent('auth-changed'));
  redirecionarUsuarioLogado(usuario);
}

function irParaLogin() {
  window.currentUser = null;
  const destino = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `index.html?auth=login&next=${destino}`;
}

async function verificarSessao() {
  try {
    const dados = await window.apiFetch('/auth/session');
    const usuario = dados ? dados.user : null;
    if (!usuario && paginaProtegida()) {
      irParaLogin();
      return;
    }
    aplicarUsuario(usuario);
  } catch (erro) {
    if (paginaProtegida()) {
      irParaLogin();
      return;
    }
    aplicarUsuario(null);
  }
}

window.Auth = {
  isLoggedIn: () => !!(window.currentUser && window.currentUser.uid),

  getSession: async () => {
    try {
      const dados = await window.apiFetch('/auth/session');
      return dados ? dados.user : null;
    } catch (erro) {
      return null;
    }
  },

  registerWithEmail: async (name, email, pass) => {
    const dados = await window.apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password: pass })
    });
    aplicarUsuario(dados.user);
    return dados;
  },

  loginWithEmail: async (email, pass) => {
    const dados = await window.apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass })
    });
    aplicarUsuario(dados.user);
    return dados.user;
  },

  logout: async () => {
    try {
      await window.apiFetch('/auth/logout', { method: 'POST' });
    } catch (erro) {
      // segue o fluxo mesmo se a chamada falhar
    }
    window.currentUser = null;
    window.dispatchEvent(new CustomEvent('auth-changed'));
  }
};

verificarSessao();

document.addEventListener('DOMContentLoaded', () => {
  const formularioCadastro = porId('registerForm');
  if (formularioCadastro) {
    formularioCadastro.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const nome = porId('regName').value.trim();
      const email = porId('regEmail').value.trim();
      const senha = porId('regPass').value;
      const retorno = porId('registerFeedback');
      if (retorno) retorno.textContent = '';
      try {
        await window.Auth.registerWithEmail(nome, email, senha);
        if (retorno) {
          retorno.style.color = '#059669';
          retorno.textContent = 'Conta criada com sucesso. Redirecionando...';
        }
        setTimeout(() => {
          window.location.href = PAGINA_INICIAL;
        }, 800);
      } catch (erro) {
        if (retorno) {
          retorno.style.color = '#ef4444';
          retorno.textContent = erro.message || 'Erro ao criar conta';
        }
      }
    });
  }

  const formularioLogin = porId('loginForm');
  if (formularioLogin) {
    formularioLogin.addEventListener('submit', async (evento) => {
      evento.preventDefault();
      const email = porId('loginEmail').value.trim();
      const senha = porId('loginPass').value;
      const retorno = porId('loginFeedback');
      if (retorno) retorno.textContent = '';
      try {
        await window.Auth.loginWithEmail(email, senha);
        const parametros = new URLSearchParams(window.location.search);
        window.location.href = destinoSeguro(parametros.get('next'));
      } catch (erro) {
        if (retorno) {
          retorno.style.color = '#ef4444';
          retorno.textContent = erro.message || 'Erro ao entrar';
        }
      }
    });
  }
});
