const CHAVE_SESSAO = 'isLoggedIn';
const PAGINAS_PROTEGIDAS = ['/sinalario.html', '/praticar.html'];

function porId(id) {
  return document.getElementById(id);
}

function obterCliente() {
  return window.supabaseClient;
}

function paginaProtegida() {
  const caminho = window.location.pathname;
  return PAGINAS_PROTEGIDAS.some((pagina) => caminho.endsWith(pagina));
}

function redirecionarAposLogin(session) {
  if (!session) return;
  if (!window.location.pathname.endsWith('index.html')) return;
  const parametros = new URLSearchParams(window.location.search);
  const temIntencao = parametros.has('auth') || parametros.has('next');
  if (!temIntencao) return;
  const next = parametros.get('next');
  window.location.href = next ? decodeURIComponent(next) : 'praticar.html';
}

function aplicarUsuario(session) {
  if (session && session.user) {
    const usuario = session.user;
    const metadados = usuario.user_metadata || {};
    window.currentUser = {
      uid: usuario.id,
      email: usuario.email,
      name: metadados.name || metadados.full_name || usuario.email
    };
    localStorage.setItem(CHAVE_SESSAO, 'true');
  } else {
    window.currentUser = null;
    localStorage.removeItem(CHAVE_SESSAO);
  }
  window.dispatchEvent(new CustomEvent('auth-changed'));
  redirecionarAposLogin(session);
}

function irParaLogin() {
  localStorage.removeItem(CHAVE_SESSAO);
  window.currentUser = null;
  const destino = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `index.html?auth=login&next=${destino}`;
}

async function verificarSessao() {
  const cliente = obterCliente();
  if (!cliente) return;
  const { data } = await cliente.auth.getSession();
  const session = data ? data.session : null;
  if (!session && paginaProtegida()) {
    irParaLogin();
    return;
  }
  aplicarUsuario(session);
}

const clienteSupabase = obterCliente();

if (clienteSupabase) {
  clienteSupabase.auth.onAuthStateChange((evento, session) => {
    if (!session && paginaProtegida() && evento !== 'INITIAL_SESSION') {
      irParaLogin();
      return;
    }
    aplicarUsuario(session);
  });
  verificarSessao();
}

window.Auth = {
  isLoggedIn: () =>
    !!(window.currentUser && window.currentUser.uid) ||
    localStorage.getItem(CHAVE_SESSAO) === 'true',
  registerWithEmail: async (name, email, pass) => {
    const cliente = obterCliente();
    const { data, error } = await cliente.auth.signUp({
      email,
      password: pass,
      options: { data: { name } }
    });
    if (error) throw error;
    return data;
  },
  loginWithEmail: async (email, pass) => {
    const cliente = obterCliente();
    const { data, error } = await cliente.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    return data.user;
  },
  loginWithGoogle: async () => {
    const cliente = obterCliente();
    const parametros = new URLSearchParams(window.location.search);
    const next = parametros.get('next');
    const destino = new URLSearchParams();
    destino.set('auth', 'login');
    if (next) destino.set('next', next);
    const urlDeRetorno = `${window.location.origin}${window.location.pathname}?${destino.toString()}`;
    const { error } = await cliente.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: urlDeRetorno }
    });
    if (error) throw error;
  },
  logout: async () => {
    const cliente = obterCliente();
    if (cliente) {
      try {
        await cliente.auth.signOut();
      } catch (erro) {}
    }
    window.currentUser = null;
    localStorage.removeItem(CHAVE_SESSAO);
    window.dispatchEvent(new CustomEvent('auth-changed'));
  }
};

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
        const resultado = await window.Auth.registerWithEmail(nome, email, senha);
        if (resultado && resultado.session) {
          if (retorno) {
            retorno.style.color = '#059669';
            retorno.textContent = 'Conta criada com sucesso. Redirecionando...';
          }
          setTimeout(() => {
            window.location.href = 'praticar.html';
          }, 800);
        } else if (retorno) {
          retorno.style.color = '#059669';
          retorno.textContent = 'Conta criada! Confirme seu e-mail para poder entrar.';
        }
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
        const next = parametros.get('next');
        window.location.href = next ? decodeURIComponent(next) : 'praticar.html';
      } catch (erro) {
        if (retorno) {
          retorno.style.color = '#ef4444';
          retorno.textContent = erro.message || 'Erro ao entrar';
        }
      }
    });

    const botaoGoogle = porId('btnGoogle');
    if (botaoGoogle) {
      botaoGoogle.addEventListener('click', async () => {
        const retorno = porId('loginFeedback');
        if (retorno) retorno.textContent = '';
        try {
          await window.Auth.loginWithGoogle();
        } catch (erro) {
          if (retorno) {
            retorno.style.color = '#ef4444';
            retorno.textContent = 'Erro no login com Google';
          }
        }
      });
    }
  }

  const botaoGoogleCadastro = porId('btnGoogleRegister');
  if (botaoGoogleCadastro) {
    botaoGoogleCadastro.addEventListener('click', async () => {
      const retorno = porId('registerFeedback');
      if (retorno) retorno.textContent = '';
      try {
        await window.Auth.loginWithGoogle();
      } catch (erro) {
        if (retorno) {
          retorno.style.color = '#ef4444';
          retorno.textContent = 'Erro no cadastro com Google';
        }
      }
    });
  }
});
