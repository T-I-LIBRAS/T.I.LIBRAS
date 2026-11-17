(function () {
  const $ = (id) => document.getElementById(id);

  let uidConquistas = null;
  let carregandoConquistas = false;

  /* ---------- Dados da conta ---------- */

  // curta = 10/10/2026; senão, "10 de outubro de 2026"
  function formatarData(valor, curta) {
    const data = new Date(valor);
    if (!valor || Number.isNaN(data.getTime())) return '';
    return curta
      ? data.toLocaleDateString('pt-BR')
      : data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function atualizarPerfil() {
    const usuario = window.currentUser;
    if (!usuario) return;

    const nome = usuario.name || (usuario.email ? usuario.email.split('@')[0] : 'Usuário');
    const inicial = (nome || '?').trim().charAt(0).toUpperCase();

    if ($('perfilAvatar')) $('perfilAvatar').textContent = inicial || '?';
    if ($('perfilNome')) $('perfilNome').textContent = nome;
    if ($('perfilEmail')) $('perfilEmail').textContent = usuario.email || '';
    if ($('infoNome')) $('infoNome').textContent = nome;
    if ($('infoEmail')) $('infoEmail').textContent = usuario.email || '-';

    // "Cadastro em" só aparece quando o servidor informou a data de cadastro
    const cadastro = formatarData(usuario.criadoEm);
    if ($('linhaCadastro')) $('linhaCadastro').hidden = !cadastro;
    if ($('infoCadastro')) $('infoCadastro').textContent = cadastro || '-';
  }

  /* ---------- Estatísticas e progresso geral ---------- */

  async function atualizarEstatisticas() {
    if (!window.Progresso) return;
    const dados = await window.Progresso.carregar();
    if ($('perfilSinais')) $('perfilSinais').textContent = dados.sinais_vistos.length;
    if ($('perfilFavoritos')) $('perfilFavoritos').textContent = dados.termos_favoritos.length;
    if ($('perfilQuizzes')) $('perfilQuizzes').textContent = dados.quizzes_concluidos.length;

    // Sem a lista de termos não há como calcular a porcentagem: o bloco fica escondido
    const percentual = window.Progresso.percentualGeral();
    const bloco = $('blocoProgressoGeral');
    if (bloco) bloco.hidden = percentual === null;
    if (percentual !== null) {
      if ($('perfilPercentual')) $('perfilPercentual').textContent = `${percentual}%`;
      if ($('perfilBarra')) $('perfilBarra').setAttribute('aria-valuenow', String(percentual));
      if ($('perfilBarraPreenchida')) $('perfilBarraPreenchida').style.width = `${percentual}%`;
    }
  }

  /* ---------- Conquistas ---------- */

  function elemento(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
  }

  function icone(classes) {
    const i = elemento('i', classes);
    i.setAttribute('aria-hidden', 'true');
    return i;
  }

  function criarCartaoConquista(c) {
    const item = elemento('li', `conquista ${c.desbloqueada ? 'desbloqueada' : 'bloqueada'}`);

    const medalha = elemento('span', 'conquista-icone');
    // o nome do ícone vem do servidor: só aceita o formato "fa-algo"
    medalha.appendChild(icone(`fa-solid ${/^fa-[a-z-]+$/.test(c.icone) ? c.icone : 'fa-medal'}`));

    const estado = elemento('p', 'conquista-estado');
    if (c.desbloqueada) {
      estado.appendChild(icone('fa-solid fa-circle-check'));
      const data = formatarData(c.desbloqueada_em, true);
      estado.appendChild(document.createTextNode(data ? ` Desbloqueada em ${data}` : ' Desbloqueada'));
    } else {
      estado.appendChild(icone('fa-solid fa-lock'));
      estado.appendChild(document.createTextNode(` Bloqueada · ${c.atual} de ${c.meta}`));
    }

    item.append(
      medalha,
      elemento('h3', 'conquista-nome', c.nome),
      elemento('p', 'conquista-desc', c.descricao),
      elemento('p', 'conquista-req', `Requisito: ${c.requisito}`),
      estado
    );
    return item;
  }

  function mostrarEstadoConquistas(texto, comRetentativa) {
    const estado = $('conquistasEstado');
    if (estado) { estado.textContent = texto; estado.hidden = !texto; }
    if ($('btnRecarregarConquistas')) $('btnRecarregarConquistas').hidden = !comRetentativa;
    if ($('listaConquistas')) $('listaConquistas').hidden = true;
    if ($('perfilResumoConquistas')) $('perfilResumoConquistas').textContent = '';
  }

  function renderizarConquistas(dados) {
    const lista = $('listaConquistas');
    if (!lista) return;
    lista.replaceChildren(...dados.conquistas.map(criarCartaoConquista));
    lista.hidden = false;
    if ($('conquistasEstado')) $('conquistasEstado').hidden = true;
    if ($('btnRecarregarConquistas')) $('btnRecarregarConquistas').hidden = true;

    if ($('perfilResumoConquistas')) {
      $('perfilResumoConquistas').textContent = `Conquistas desbloqueadas: ${dados.desbloqueadas} de ${dados.total}`;
    }
  }

  async function carregarConquistas() {
    const uid = window.currentUser && window.currentUser.uid;
    if (!uid || carregandoConquistas) return;

    carregandoConquistas = true;
    mostrarEstadoConquistas('Carregando conquistas...', false);

    try {
      const dados = await window.apiFetch('/conquistas');
      uidConquistas = uid;
      renderizarConquistas(dados);
      // Pendências registradas agora (ex.: progresso antigo): avisa como nas demais páginas
      if (dados.novas && dados.novas.length && window.Progresso) {
        window.Progresso.avisarConquistas({ novas_conquistas: dados.novas });
      }
    } catch (erro) {
      console.error('[Perfil] Falha ao carregar conquistas:', erro && erro.message ? erro.message : erro);
      mostrarEstadoConquistas('Não foi possível carregar as conquistas.', true);
    } finally {
      carregandoConquistas = false;
    }
  }

  function carregarConquistasSeNecessario() {
    const uid = window.currentUser && window.currentUser.uid;
    if (uid && uid !== uidConquistas) carregarConquistas();
  }

  /* ---------- Editar nome ---------- */

  function abrirEdicao() {
    const form = $('formEditarNome');
    const usuario = window.currentUser || {};
    if (!form) return;
    $('inputNome').value = usuario.name || '';
    $('erroNome').hidden = true;
    form.hidden = false;
    $('btnEditarPerfil').setAttribute('aria-expanded', 'true');
    $('inputNome').focus();
  }

  function fecharEdicao() {
    const form = $('formEditarNome');
    if (!form) return;
    form.hidden = true;
    $('btnEditarPerfil').setAttribute('aria-expanded', 'false');
    $('btnEditarPerfil').focus();
  }

  function mostrarErroNome(mensagem) {
    const erro = $('erroNome');
    erro.textContent = mensagem;
    erro.hidden = false;
    $('inputNome').focus();
  }

  async function salvarNome(evento) {
    evento.preventDefault();
    const nome = $('inputNome').value.trim();

    if (!nome) return mostrarErroNome('Informe seu nome.');
    if (nome.length > 150) return mostrarErroNome('O nome pode ter no máximo 150 caracteres.');

    const botao = $('btnSalvarNome');
    botao.disabled = true;
    $('erroNome').hidden = true;

    try {
      const resposta = await window.apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: nome })
      });
      // O servidor confirmou: só agora a tela (e o cabeçalho) passam a mostrar o nome novo
      window.currentUser = { ...window.currentUser, ...resposta.user };
      window.dispatchEvent(new CustomEvent('auth-changed'));
      fecharEdicao();
      const aviso = $('avisoPerfil');
      aviso.textContent = 'Nome atualizado.';
      aviso.hidden = false;
      setTimeout(() => { aviso.hidden = true; }, 5000);
    } catch (erro) {
      mostrarErroNome(erro && erro.message ? erro.message : 'Não foi possível salvar. Tente novamente.');
    } finally {
      botao.disabled = false;
    }
  }

  /* ---------- Excluir conta (LGPD) ---------- */

  function abrirDialogoExclusao() {
    const dialogo = $('dialogoExcluir');
    if (!dialogo) return;
    $('inputSenhaExcluir').value = '';
    $('erroExcluir').hidden = true;
    dialogo.showModal();
    $('inputSenhaExcluir').focus();
  }

  function fecharDialogoExclusao() {
    const dialogo = $('dialogoExcluir');
    if (dialogo && dialogo.open) dialogo.close();
    if ($('btnExcluirConta')) $('btnExcluirConta').focus();
  }

  function mostrarErroExclusao(mensagem) {
    const erro = $('erroExcluir');
    erro.textContent = mensagem;
    erro.hidden = false;
    $('inputSenhaExcluir').focus();
  }

  async function excluirConta(evento) {
    evento.preventDefault();
    const senha = $('inputSenhaExcluir').value;
    if (!senha) return mostrarErroExclusao('Digite a sua senha para confirmar.');

    const botao = $('btnConfirmarExcluir');
    botao.disabled = true;
    $('erroExcluir').hidden = true;

    try {
      await window.apiFetch('/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ password: senha })
      });
      // Conta apagada: limpa a sessão local e volta para a página inicial
      window.currentUser = null;
      window.dispatchEvent(new CustomEvent('auth-changed'));
      window.location.href = 'index.html';
    } catch (erro) {
      mostrarErroExclusao(erro && erro.message ? erro.message : 'Não foi possível excluir a conta. Tente novamente.');
      botao.disabled = false;
    }
  }

  /* ---------- Eventos ---------- */

  window.addEventListener('auth-changed', () => {
    atualizarPerfil();
    atualizarEstatisticas();
    carregarConquistasSeNecessario();
  });
  window.addEventListener('progresso-carregado', atualizarEstatisticas);
  // Se uma conquista for desbloqueada com esta página aberta, a lista é atualizada
  window.addEventListener('conquistas-desbloqueadas', () => {
    if (carregandoConquistas) return;
    uidConquistas = null;
    carregarConquistasSeNecessario();
  });

  document.addEventListener('DOMContentLoaded', () => {
    atualizarPerfil();
    atualizarEstatisticas();
    carregarConquistasSeNecessario();

    if ($('btnEditarPerfil')) $('btnEditarPerfil').addEventListener('click', abrirEdicao);
    if ($('btnCancelarEdicao')) $('btnCancelarEdicao').addEventListener('click', fecharEdicao);
    if ($('formEditarNome')) {
      $('formEditarNome').addEventListener('submit', salvarNome);
      $('formEditarNome').addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharEdicao(); });
    }
    if ($('btnRecarregarConquistas')) $('btnRecarregarConquistas').addEventListener('click', carregarConquistas);

    if ($('btnExcluirConta')) $('btnExcluirConta').addEventListener('click', abrirDialogoExclusao);
    if ($('btnCancelarExcluir')) $('btnCancelarExcluir').addEventListener('click', fecharDialogoExclusao);
    if ($('formExcluirConta')) $('formExcluirConta').addEventListener('submit', excluirConta);
    // Clicar no fundo escuro (fora da caixa) também fecha o aviso
    if ($('dialogoExcluir')) {
      $('dialogoExcluir').addEventListener('click', (e) => {
        if (e.target === $('dialogoExcluir')) fecharDialogoExclusao();
      });
    }

    const btnSair = $('btnSairPerfil');
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
