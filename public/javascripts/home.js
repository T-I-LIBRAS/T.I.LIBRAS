(function () {
  function atualizarSaudacao() {
    const usuario = window.currentUser;
    const saudacao = document.getElementById('homeSaudacao');
    if (!usuario || !saudacao) return;

    const nome = usuario.name || (usuario.email ? usuario.email.split('@')[0] : 'por aqui');
    saudacao.textContent = `Olá, ${nome}!`;
  }

  function mostrarProgresso(percentual) {
    const valor = document.getElementById('statProgresso');
    if (valor) valor.textContent = `${percentual}%`;
  }

  function renderizarOfensiva() {
    const semanaEl = document.getElementById('streakSemana');
    if (!semanaEl || !window.Ofensiva || typeof window.Ofensiva.resumo !== 'function') return;

    const resumo = window.Ofensiva.resumo();
    const diasEl = document.getElementById('streakDias');
    const rotuloEl = document.getElementById('streakDiasLabel');
    const statusEl = document.getElementById('streakStatus');
    const chama = document.getElementById('streakFlame');

    if (diasEl) diasEl.textContent = String(resumo.atual);
    if (rotuloEl) rotuloEl.textContent = resumo.atual === 1 ? 'dia de ofensiva' : 'dias de ofensiva';
    if (chama) chama.classList.toggle('ativa', resumo.ativoHoje);

    semanaEl.innerHTML = resumo.semana
      .map((dia) => {
        const classes = ['streak-day'];
        if (dia.ativo) classes.push('ativo');
        if (dia.hoje) classes.push('hoje');
        const estado = dia.ativo ? 'com prática' : 'sem prática';
        const etiqueta = `${dia.letra} - ${estado}${dia.hoje ? ' (hoje)' : ''}`;
        return `<span class="${classes.join(' ')}" role="listitem" title="${etiqueta}" aria-label="${etiqueta}">${dia.letra}</span>`;
      })
      .join('');

    if (statusEl) {
      if (resumo.atual === 0) {
        statusEl.textContent = 'Faça uma atividade hoje e comece sua ofensiva!';
      } else if (resumo.ativoHoje) {
        statusEl.textContent = 'Ofensiva ativa hoje! Continue assim.';
      } else {
        statusEl.textContent = 'Estude hoje para manter sua ofensiva!';
      }
    }
  }

  function escapar(texto) {
    return String(texto).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function formatarQuando(iso) {
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) return '';
    const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const hoje = new Date();
    const ontem = new Date();
    ontem.setDate(hoje.getDate() - 1);
    if (data.toDateString() === hoje.toDateString()) return `Hoje, às ${hora}`;
    if (data.toDateString() === ontem.toDateString()) return `Ontem, às ${hora}`;
    return `${data.toLocaleDateString('pt-BR')}, às ${hora}`;
  }

  function mostrarUltimaAtividade() {
    const area = document.getElementById('ultimaAtividade');
    if (!area || !window.Progresso) return;

    const atividade = window.Progresso.ultimaAtividade();
    if (!atividade) {
      area.innerHTML = '<p class="home-box-vazio">Você ainda não tem atividades. Comece pelo <a href="sinalario.html">Sinalário</a>!</p>';
      return;
    }

    const ehQuiz = atividade.tipo === 'quiz';
    const icone = ehQuiz ? 'fa-graduation-cap' : 'fa-hand';
    const titulo = ehQuiz ? `Quiz de ${atividade.rotulo} concluído` : `Sinal visto: ${atividade.rotulo}`;
    const destino = ehQuiz ? 'praticar.html' : 'sinalario.html';

    area.innerHTML = `
      <a href="${destino}" class="home-atividade">
        <span class="home-atividade-icone"><i class="fa-solid ${icone}"></i></span>
        <span class="home-atividade-texto">
          <strong>${escapar(titulo)}</strong>
          <span>${escapar(formatarQuando(atividade.data))}</span>
        </span>
        <span class="home-atividade-seta"><i class="fa-solid fa-arrow-right"></i></span>
      </a>`;
  }

  async function atualizarEstatisticas() {
    renderizarOfensiva();
    if (!window.Progresso) return;
    const dados = await window.Progresso.carregar();
    const statSinais = document.getElementById('statSinais');
    const statFavoritos = document.getElementById('statFavoritos');
    const statQuizzes = document.getElementById('statQuizzes');
    if (statSinais) statSinais.textContent = dados.sinais_vistos.length;
    if (statFavoritos) statFavoritos.textContent = dados.termos_favoritos.length;
    if (statQuizzes) statQuizzes.textContent = window.Progresso.quizzesConcluidos().length;
    const percentual = window.Progresso.percentualGeral();
    mostrarProgresso(percentual === null ? 0 : percentual);
    mostrarUltimaAtividade();
  }

  window.addEventListener('auth-changed', () => {
    atualizarSaudacao();
    renderizarOfensiva();
    atualizarEstatisticas();
  });
  window.addEventListener('progresso-carregado', atualizarEstatisticas);
  window.addEventListener('ofensiva-atualizada', renderizarOfensiva);

  document.addEventListener('DOMContentLoaded', () => {
    atualizarSaudacao();
    renderizarOfensiva();
    atualizarEstatisticas();
  });

  // Recalcula a ofensiva ao voltar para a aba (o dia pode ter mudado).
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) renderizarOfensiva();
  });
})();
