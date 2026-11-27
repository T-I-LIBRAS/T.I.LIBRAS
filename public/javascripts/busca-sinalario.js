// Cada chave é o nome de um sinal. Os apelidos ajudam na busca em português.
// Adicionar um apelido não cria um termo nem uma pergunta no quiz.
const BuscaSinalario = (() => {
  const sinonimos = {
    'Monitor': ['tela', 'ecrã', 'monitor de computador'],
    'Mouse': ['rato', 'mouse de computador'],
    'Teclado': ['keyboard'],
    'Fone de ouvido': ['fone', 'headphone', 'headset', 'auricular'],
    'Microfone': ['mic', 'microphone'],
    'Webcam': ['câmera de computador', 'web cam'],
    'Impressora': ['printer'],
    'Placa Mãe': ['motherboard', 'mainboard'],
    'Memória RAM': ['RAM', 'memória de acesso aleatório'],
    'Fonte de alimentação': ['fonte', 'PSU'],
    'HD': ['disco rígido', 'hard disk', 'HDD'],
    'SSD': ['unidade de estado sólido', 'solid state drive'],
    'Processador': ['CPU', 'unidade central de processamento'],
    'Gabinete': ['torre do computador', 'case'],
    'Laptop': ['notebook', 'computador portátil'],
    'Cooler': ['ventoinha', 'ventilador do computador'],
    'Pendrive': ['pen drive', 'memória USB', 'flash drive'],
    'Linux': ['GNU Linux'],
    'Windows': ['Microsoft Windows'],
    'Office': ['Microsoft Office', 'pacote Office'],
    'Aplicativo': ['app', 'aplicação'],
    'Kernel': ['núcleo do sistema', 'núcleo do sistema operacional'],
    'E-Mail': ['email', 'correio eletrônico', 'mensagem'],
    'Mac': ['Macintosh', 'computador da Apple'],
    'Word': ['Microsoft Word', 'editor de textos da Microsoft'],
    'Excel': ['Microsoft Excel', 'planilha da Microsoft'],
    'PowerPoint': ['Power Point', 'Microsoft PowerPoint'],
    'Algoritmo': ['algorithm'],
    'Variável': ['variable'],
    'Laço de Repetição': ['loop', 'loop de repetição', 'laço'],
    'Java': ['linguagem Java', 'café'],
    'HTML': ['hypertext markup language'],
    'CSS': ['folhas de estilo em cascata', 'cascading style sheets'],
    'JavaScript': ['JS', 'Java Script', 'ECMAScript'],
    'Python': ['linguagem Python'],
    'VSCode': ['VS Code', 'Visual Studio Code'],
    'GitHub': ['Git Hub'],
    'Potência': ['potência elétrica', 'electric power'],
    'Resistor': ['componente resistivo'],
    'Tensão': ['voltagem', 'diferença de potencial', 'DDP', 'volts'],
    'Corrente Elétrica': ['amperagem', 'intensidade de corrente'],
    'Cabo': ['cabo elétrico', 'cable'],
    'Circuito em Série': ['ligação em série'],
    'Circuito em Paralelo': ['ligação em paralelo'],
    'Alicate Universal': ['alicate combinado'],
    'Alicate de Corte': ['alicate de cortar fios'],
    'Alicate Decapador': ['desencapador de fios', 'alicate de desencapar'],
    'Multímetro': ['multiteste', 'multimeter'],
    'Navegador de Internet': ['browser', 'navegador web', 'navegador'],
    'Internet Explorer': ['IE', 'Microsoft Internet Explorer'],
    'Safari': ['Apple Safari'],
    'Edge': ['Microsoft Edge'],
    'Google Chrome': ['Chrome'],
    'Firefox': ['Mozilla Firefox'],
    'Abas': ['guias', 'aba do navegador', 'tabs'],
    'Maximizar': ['ampliar janela', 'maximizar janela', 'aumentar'],
    'Minimizar': ['recolher janela', 'minimizar janela', 'diminuir'],
    'Vírus': ['vírus de computador', 'malware', 'trojan'],
    'Antivírus': ['anti vírus', 'antivírus de computador'],
    'Backup': ['cópia de segurança', 'cópia de reserva', 'fazer backup'],
    'Link': ['hiperlink', 'hiperligação', 'hyperlink'],
    'Download': ['baixar', 'baixar arquivo', 'baixar arquivos', 'fazer download']
  };

  function normalizar(texto) {
    return String(texto).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').trim();
  }

  // Distância de edição com troca de duas letras vizinhas (ex.: tecaldo).
  function distancia(a, b) {
    let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);
    let penultima;
    for (let i = 1; i <= a.length; i++) {
      const linha = [i];
      for (let j = 1; j <= b.length; j++) {
        const custo = a[i - 1] === b[j - 1] ? 0 : 1;
        linha[j] = Math.min(linha[j - 1] + 1, anterior[j] + 1, anterior[j - 1] + custo);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          linha[j] = Math.min(linha[j], penultima[j - 2] + 1);
        }
      }
      penultima = anterior;
      anterior = linha;
    }
    return anterior[b.length];
  }

  const porNome = new Map(Object.entries(sinonimos).map(([nome, lista]) => [normalizar(nome), lista]));

  function criarIndice(termos) {
    const entradas = termos.map((termo) => {
      const nome = normalizar(termo.termo);
      const extras = Array.isArray(termo.sinonimos) ? termo.sinonimos : [];
      const nomes = [nome, ...(porNome.get(nome) || []), ...extras].map(normalizar).filter(Boolean);
      const palavras = new Set(nomes.flatMap((forma) => [forma, ...forma.split(' ')]));
      return { termo, nomes, palavras };
    });
    const presentes = new Set(entradas.map((entrada) => entrada.nomes[0]));
    const ausentes = Object.entries(sinonimos)
      .filter(([nome]) => !presentes.has(normalizar(nome)))
      .map(([nome, apelidos]) => ({ nome, formas: [nome, ...apelidos].map(normalizar) }));

    return function pesquisar(texto, incluir) {
      const busca = normalizar(texto);
      const candidatos = entradas.filter(({ termo }) => incluir(termo));
      if (!busca) return { termos: candidatos.map((item) => item.termo), aviso: '' };

      const encontrados = [];
      for (const entrada of candidatos) {
        let prioridade = Infinity;
        entrada.nomes.forEach((forma, indice) => {
          if (forma === busca) prioridade = Math.min(prioridade, indice === 0 ? 0 : 1);
          else if (forma.includes(busca)) prioridade = Math.min(prioridade, indice === 0 ? 2 : 3);
        });
        if (Number.isFinite(prioridade)) encontrados.push({ termo: entrada.termo, prioridade });
      }
      if (encontrados.length) {
        encontrados.sort((a, b) => a.prioridade - b.prioridade);
        return { termos: encontrados.map((item) => item.termo), aviso: '' };
      }

      const proximos = [];
      const aproximar = busca.length >= 4 && busca.length <= 60;
      const indisponivel = ausentes.find((item) => item.formas.includes(busca));
      if (!indisponivel && aproximar) {
        const limite = busca.length >= 7 ? 2 : 1;
        for (const entrada of candidatos) {
          let melhor = Infinity;
          for (const palavra of entrada.palavras) {
            if (Math.abs(palavra.length - busca.length) <= limite) {
              melhor = Math.min(melhor, distancia(busca, palavra));
            }
          }
          if (melhor <= limite) proximos.push({ termo: entrada.termo, distancia: melhor });
        }
      }
      if (!proximos.length) {
        const semelhante = indisponivel || (aproximar && ausentes.find((item) => item.formas.some((forma) =>
          Math.abs(forma.length - busca.length) <= 1 && distancia(busca, forma) <= 1)));
        return { termos: [], aviso: semelhante ? `O sinal de ${semelhante.nome} ainda não está no catálogo.` : 'Nenhum sinal encontrado para esta busca.' };
      }
      proximos.sort((a, b) => a.distancia - b.distancia);
      return {
        termos: proximos.map((item) => item.termo),
        aviso: 'Resultados com grafia parecida.'
      };
    };
  }

  return { criarIndice };
})();
