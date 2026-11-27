const CHAVE_CELEBRACAO_PRATICAR = '_celebracao_sabe_tudo';

const TentativasQuiz = (() => {
  function embaralhar(itens) {
    const copia = [...itens];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
  }

  function chaveLocal(categoria) {
    return `ti-libras:praticar:${window.Progresso.usuarioId()}:${categoria}`;
  }

  // A cópia temporária cobre um recarregamento antes da confirmação do servidor.
  function gravar(categoria, campos) {
    const progresso = window.Progresso;
    progresso.registrarPontuacao(categoria, campos);
    const chave = chaveLocal(categoria);
    const copia = JSON.stringify(progresso.pontuacaoDe(categoria));
    try {
      localStorage.setItem(chave, copia);
    } catch { /* O servidor também funciona com armazenamento local desativado. */ }
    progresso.salvar().then((salvo) => {
      if (!salvo) return;
      try {
        if (localStorage.getItem(chave) === copia) localStorage.removeItem(chave);
      } catch { /* Sem acesso à cópia temporária. */ }
    });
  }

  async function carregar() {
    await window.Auth.pronta;
    await window.Progresso.carregar();
    if (!window.Progresso.usuarioId()) return false;
    for (const categoria of [...CATEGORIAS_DA_PROGRESSAO, CHAVE_CELEBRACAO_PRATICAR]) {
      const chave = chaveLocal(categoria);
      const remoto = window.Progresso.pontuacaoDe(categoria);
      let salvo;
      try {
        salvo = JSON.parse(localStorage.getItem(chave));
        if (!salvo || typeof salvo.atualizado_em !== 'string') continue;
        if (remoto.atualizado_em > salvo.atualizado_em || JSON.stringify(remoto) === JSON.stringify(salvo)) {
          localStorage.removeItem(chave);
          continue;
        }
      } catch { continue; }
      if (salvo.ultima_conclusao && CATEGORIAS_DA_PROGRESSAO.includes(categoria)) {
        window.Progresso.concluirQuiz(categoria);
      }
      gravar(categoria, salvo);
    }
    return true;
  }

  function placar(respostas) {
    const acertos = respostas.filter((valor) => valor === true).length;
    const erros = respostas.filter((valor) => valor === false).length;
    return { acertos, erros, semRegistro: respostas.length - acertos - erros };
  }

  function registrar(categoria, perguntas, respostas) {
    const total = perguntas.length;
    if (!total) return;
    if (respostas.length < total) {
      const anterior = Number(window.Progresso.pontuacaoDe(categoria).melhor_progresso) || 0;
      gravar(categoria, {
        tentativa: { ordem: perguntas.map((item) => item.id), respostas: respostas.slice() },
        melhor_progresso: Math.min(total, Math.max(anterior, respostas.length)),
        total_questoes: total
      });
      return;
    }

    const { acertos, erros, semRegistro } = placar(respostas);
    window.Progresso.concluirQuiz(categoria);
    window.Progresso.registrarUltimaAtividade('quiz', categoria);
    gravar(categoria, {
      tentativa: null,
      ultima_pontuacao: acertos,
      ultimo_erros: erros,
      questoes_sem_registro: semRegistro,
      total_questoes: total,
      melhor_progresso: total,
      ultima_conclusao: new Date().toISOString()
    });
  }

  function abrir(categoria, termos) {
    const registro = window.Progresso.pontuacaoDe(categoria);
    const tentativa = registro.tentativa;
    const porId = new Map(termos.map((item) => [item.id, item]));
    const feitas = [];
    const pendentes = [];
    const respostas = [];
    if (tentativa && Array.isArray(tentativa.ordem) && Array.isArray(tentativa.respostas)) {
      tentativa.ordem.forEach((id, indice) => {
        const item = porId.get(id);
        if (!item) return;
        porId.delete(id);
        const resposta = tentativa.respostas[indice];
        if (typeof resposta === 'boolean' || resposta === null) {
          feitas.push(item);
          respostas.push(resposta);
        } else {
          pendentes.push(item);
        }
      });
    } else if (!window.Progresso.quizConcluido(categoria)) {
      // A versão anterior guardava a quantidade, sem a ordem ou os acertos.
      const antigas = Math.min(termos.length, Math.max(0, Math.trunc(registro.melhor_progresso) || 0));
      for (let i = 0; i < antigas; i++) respostas.push(null);
    }
    // Se o catálogo mudar, conserva respostas dos IDs presentes e inclui termos novos.
    const perguntas = [...feitas, ...pendentes, ...embaralhar([...porId.values()])];
    registrar(categoria, perguntas, respostas);
    return { perguntas, respostas };
  }

  function resumoResultado(categoria, respostas) {
    const { acertos, erros, semRegistro } = placar(respostas);
    const avaliadas = acertos + erros;
    const percentual = avaliadas ? Math.round((100 * acertos) / avaliadas) : 0;
    if (!semRegistro) return `Você acertou ${percentual}% das ${avaliadas} questões de ${categoria}.`;
    const placarAtual = avaliadas ? `Você acertou ${acertos} de ${avaliadas} nesta retomada. ` : '';
    return placarAtual + `Respostas da versão anterior sem placar individual: ${semRegistro}.`;
  }

  return { carregar, abrir, registrar, gravar, embaralhar, placar, resumoResultado };
})();
