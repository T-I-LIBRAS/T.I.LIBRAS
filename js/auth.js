const PAGINAS_PROTEGIDAS = ['/sinalario.html', '/praticar.html', '/quiz.html'];
const PAGINA_INICIAL = 'sinalario.html';

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

function estaNaPaginaInicial() {
  const caminho = window.location.pathname;
  return caminho.endsWith('index.html') || caminho.endsWith('/') || caminho === '';
}

/* Resolve o destino pós-login garantindo que ele nunca aponte de volta
   para a apresentação, evitando qualquer laço de redirecionamento. */
function destinoSeguro(next) {
  if (!next) return PAGINA_INICIAL;
  const alvo = decodeURIComponent(next);
  if (alvo.includes('index.html') || alvo === '/' || alvo === '') return PAGINA_INICIAL;
  return alvo;
}

/* Regra restritiva de sessão: enquanto houver sessão ativa o usuário não
   pode permanecer na página de apresentação (index.html). Ele é sempre
   enviado para o Sinalário — ou para o destino indicado em ?next=.
   A apresentação só volta a ficar acessível após o logout. */
function redirecionarUsuarioLogado(session) {
  if (!session) return;
  if (!estaNaPaginaInicial()) return;
  const parametros = new URLSearchParams(window.location.search);
  window.location.replace(destinoSeguro(parametros.get('next')));
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
  } else {
    window.currentUser = null;
  }

  window.sessaoSupabase = session || null;
  window.dispatchEvent(new CustomEvent('auth-changed'));
  redirecionarUsuarioLogado(session);
}

function irParaLogin() {
  window.currentUser = null;
  window.sessaoSupabase = null;
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
    !!(window.sessaoSupabase && window.sessaoSupabase.user),
  getSession: async () => {
    const cliente = obterCliente();
    if (!cliente) return null;
    const { data } = await cliente.auth.getSession();
    return data ? data.session : null;
  },
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
  logout: async () => {
    const cliente = obterCliente();
    if (cliente) {
      try {
        await cliente.auth.signOut();
      } catch (erro) {}
    }
    window.currentUser = null;
    window.sessaoSupabase = null;
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
            window.location.href = PAGINA_INICIAL;
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
