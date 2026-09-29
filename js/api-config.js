// Ajuste para a URL onde o backend Node/Express está rodando.
const API_BASE_URL = 'http://localhost:3000/api';

// Wrapper de fetch: envia/recebe cookies de sessão e já trata JSON/erros.
window.apiFetch = async function apiFetch(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(opcoes.headers || {})
    },
    ...opcoes
  });

  let dados = null;
  try {
    dados = await resposta.json();
  } catch (erro) {
    dados = null;
  }

  if (!resposta.ok) {
    const mensagem = (dados && dados.message) || 'Erro na requisição';
    throw new Error(mensagem);
  }

  return dados;
};
