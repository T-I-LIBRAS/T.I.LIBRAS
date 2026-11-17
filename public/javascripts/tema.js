// Tema escuro e alto contraste (podem ser usados juntos).
// Guarda a escolha no navegador e aplica antes da página aparecer, para não "piscar" o tema claro.
(function () {
  const CHAVE_TEMA = 'ti-libras-tema';
  const CHAVE_CONTRASTE = 'ti-libras-contraste';
  const raiz = document.documentElement;

  function ler(chave) {
    try { return localStorage.getItem(chave); } catch (e) { return null; }
  }

  function gravar(chave, valor) {
    try {
      if (valor) localStorage.setItem(chave, valor);
      else localStorage.removeItem(chave);
    } catch (e) { /* navegador sem armazenamento: a escolha vale só nesta página */ }
  }

  function estado() {
    return {
      tema: raiz.getAttribute('data-tema') === 'escuro' ? 'escuro' : 'claro',
      contraste: raiz.getAttribute('data-contraste') === 'alto' ? 'alto' : 'normal'
    };
  }

  function marcarBotoes() {
    const atual = estado();
    document.querySelectorAll('[data-tema-opcao]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.temaOpcao === atual.tema));
    });
    document.querySelectorAll('[data-contraste-opcao]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.contrasteOpcao === atual.contraste));
    });
  }

  function definirTema(tema) {
    if (tema === 'escuro') {
      raiz.setAttribute('data-tema', 'escuro');
      gravar(CHAVE_TEMA, 'escuro');
    } else {
      raiz.removeAttribute('data-tema');
      gravar(CHAVE_TEMA, null);
    }
    marcarBotoes();
  }

  function definirContraste(contraste) {
    if (contraste === 'alto') {
      raiz.setAttribute('data-contraste', 'alto');
      gravar(CHAVE_CONTRASTE, 'alto');
    } else {
      raiz.removeAttribute('data-contraste');
      gravar(CHAVE_CONTRASTE, null);
    }
    marcarBotoes();
  }

  // Aplica o que estava salvo
  if (ler(CHAVE_TEMA) === 'escuro') raiz.setAttribute('data-tema', 'escuro');
  if (ler(CHAVE_CONTRASTE) === 'alto') raiz.setAttribute('data-contraste', 'alto');

  function painel() { return document.getElementById('acessPainel'); }
  function botao() { return document.getElementById('acessBtn'); }

  function abrirPainel(abrir) {
    const p = painel();
    const b = botao();
    if (!p || !b) return;
    p.hidden = !abrir;
    b.setAttribute('aria-expanded', String(abrir));
    if (abrir) marcarBotoes();
  }

  // Eventos por delegação: funcionam mesmo com o cabeçalho criado depois.
  document.addEventListener('click', (evento) => {
    const alvo = evento.target;
    if (!(alvo instanceof Element)) return;

    if (alvo.closest('#acessBtn')) {
      const p = painel();
      abrirPainel(p ? p.hidden : false);
      return;
    }

    const temaBtn = alvo.closest('[data-tema-opcao]');
    if (temaBtn) { definirTema(temaBtn.dataset.temaOpcao); return; }

    const contrasteBtn = alvo.closest('[data-contraste-opcao]');
    if (contrasteBtn) { definirContraste(contrasteBtn.dataset.contrasteOpcao); return; }

    if (alvo.closest('#acessRestaurar')) {
      definirTema('claro');
      definirContraste('normal');
      return;
    }

    if (!alvo.closest('#acessPainel')) abrirPainel(false);
  });

  document.addEventListener('keydown', (evento) => {
    if (evento.key !== 'Escape') return;
    const p = painel();
    if (p && !p.hidden) {
      abrirPainel(false);
      const b = botao();
      if (b) b.focus();
    }
  });

  // Mantém várias abas sincronizadas
  window.addEventListener('storage', (evento) => {
    if (evento.key === CHAVE_TEMA) {
      if (evento.newValue === 'escuro') raiz.setAttribute('data-tema', 'escuro');
      else raiz.removeAttribute('data-tema');
    }
    if (evento.key === CHAVE_CONTRASTE) {
      if (evento.newValue === 'alto') raiz.setAttribute('data-contraste', 'alto');
      else raiz.removeAttribute('data-contraste');
    }
    marcarBotoes();
  });

  document.addEventListener('DOMContentLoaded', marcarBotoes);

  window.Tema = { definirTema, definirContraste, estado };
})();
