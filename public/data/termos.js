// Sinalário com vídeos locais servidos pela pasta public/videos.
const TERMOS = [
  {
    id: 'monitor',
    termo: 'Monitor',
    categoria: 'Hardware',
    video: '/videos/monitor.mp4',
    imagem: '/images/monitor.avif',
    descricao: 'Dispositivo de saída que exibe a interface visual do computador.',
    exemploPt: 'O monitor exibe a imagem em alta definição.',
    exemploGlosa: 'MONITOR MOSTRAR IMAGEM BONITO'
  },
  {
    id: 'mouse',
    termo: 'Mouse',
    categoria: 'Hardware',
    video: '/videos/mouse.mp4',
    imagem: '/images/mouse.jpg',
    descricao: 'Periférico de entrada usado para mover o ponteiro na tela.',
    exemploPt: 'Clique com o botão direito do mouse.',
    exemploGlosa: 'MOUSE APONTAR CLICAR TELA'
  },
  {
    id: 'teclado',
    termo: 'Teclado',
    categoria: 'Hardware',
    video: '/videos/teclado.mp4',
    imagem: '/images/teclado.jpg',
    descricao: 'Periférico de entrada com teclas para digitação de texto e comandos.',
    exemploPt: 'Estou digitando o código no teclado.',
    exemploGlosa: 'TECLADO DIGITAR RÁPIDO CÓDIGO'
  },
  {
    id: 'fone-de-ouvido',
    termo: 'Fone de ouvido',
    categoria: 'Hardware',
    video: '/videos/fone.mp4',
    imagem: '/images/fone-de-ouvido.avif',
    descricao: 'Dispositivo de áudio individual colocado nas orelhas.',
    exemploPt: 'Coloque os fones de ouvido para ouvir a aula.',
    exemploGlosa: 'FONE ORELHA OUVIR AULA'
  },
  {
    id: 'microfone',
    termo: 'Microfone',
    categoria: 'Hardware',
    video: '/videos/microfone.mp4',
    imagem: '/images/microfone.jpg',
    descricao: 'Equipamento que capta ondas sonoras e as converte em sinal elétrico.',
    exemploPt: 'O microfone está mudo na reunião.',
    exemploGlosa: 'MICROFONE FALAR SOM ENTAR'
  },
  {
    id: 'webcam',
    termo: 'Webcam',
    categoria: 'Hardware',
    video: '/videos/webcam.mp4',
    imagem: '/images/webcam.jpg',
    descricao: 'Câmera de vídeo conectada ao computador para transmissões ao vivo.',
    exemploPt: 'Ligue a webcam para a videochamada.',
    exemploGlosa: 'WEBCAM MOSTRAR ROSTO REUNIÃO'
  },
  {
    id: 'impressora',
    termo: 'Impressora',
    categoria: 'Hardware',
    video: '/videos/impressora.mp4',
    imagem: '/images/impressora.jpg',
    descricao: 'Dispositivo que imprime documentos em papel.',
    exemploPt: 'A impressora precisa de mais papel.',
    exemploGlosa: 'IMPRESSORA PAPEL SAIR TEXTO'
  },
  {
    id: 'placa-mae',
    termo: 'Placa Mãe',
    categoria: 'Hardware',
    video: '/videos/placa-mae.mp4',
    imagem: '/images/placa-mae.jpg',
    descricao: 'Placa principal que conecta e interliga todos os componentes do computador.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'memoria-ram',
    termo: 'Memória RAM',
    categoria: 'Hardware',
    video: '/videos/memoria-ram.mp4',
    imagem: '/images/memoria-ram.jpg',
    descricao: 'Memória volátil que guarda temporariamente os dados em uso pelo sistema.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'fonte-de-alimentacao',
    termo: 'Fonte de alimentação',
    categoria: 'Hardware',
    video: '/videos/fonte.mp4',
    imagem: '/images/fonte-de-alimentacao.jpg',
    descricao: 'Componente que converte a energia da tomada nas tensões usadas pelo computador.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'hd',
    termo: 'HD',
    categoria: 'Hardware',
    video: '/videos/hd.mp4',
    imagem: '/images/hd.webp',
    descricao: 'Disco rígido magnético usado para armazenar arquivos de forma permanente.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'ssd',
    termo: 'SSD',
    categoria: 'Hardware',
    video: '/videos/ssd.mp4',
    imagem: '/images/ssd.jpg',
    descricao: 'Unidade de armazenamento em estado sólido, mais rápida e silenciosa que o HD.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'processador',
    termo: 'Processador',
    categoria: 'Hardware',
    video: '/videos/processador.mp4',
    imagem: '/images/processador.jpg',
    descricao: 'Chip que executa as instruções e processa os dados do computador.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'gabinete',
    termo: 'Gabinete',
    categoria: 'Hardware',
    video: '/videos/gabinete.mp4',
    imagem: '/images/gabinete.jpg',
    descricao: 'Estrutura que abriga e protege os componentes internos do computador.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'laptop',
    termo: 'Laptop',
    categoria: 'Hardware',
    video: '/videos/laptop.mp4',
    imagem: '/images/laptop.jpg',
    descricao: 'Computador portátil que reúne tela, teclado e bateria em uma única peça.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'cooler',
    termo: 'Cooler',
    categoria: 'Hardware',
    video: '/videos/cooler.mp4',
    imagem: '/images/cooler.jpg',
    descricao: 'Ventilador responsável por resfriar os componentes internos do computador.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'pendrive',
    termo: 'Pendrive',
    categoria: 'Hardware',
    video: '/videos/pendrive.mp4',
    imagem: '/images/pendrive.jpg',
    descricao: 'Dispositivo removível de armazenamento conectado pela porta USB.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'linux',
    termo: 'Linux',
    categoria: 'Software',
    video: '/videos/linux.mp4',
    imagem: '/images/linux.png',
    descricao: 'Sistema operacional de código aberto bastante utilizado por desenvolvedores.',
    exemploPt: 'Aprendemos a usar o terminal no Linux.',
    exemploGlosa: 'LINUX SISTEMA LIVRE CÓDIGO'
  },
  {
    id: 'windows',
    termo: 'Windows',
    categoria: 'Software',
    video: '/videos/windows.mp4',
    imagem: '/images/windows.png',
    descricao: 'Sistema operacional desenvolvido pela empresa Microsoft.',
    exemploPt: 'O Windows atualizou ontem à noite.',
    exemploGlosa: 'WINDOWS SISTEMA JANELAS POPULAR'
  },
  {
    id: 'office',
    termo: 'Office',
    categoria: 'Software',
    video: '/videos/office.mp4',
    imagem: '/images/office.avif',
    descricao: 'Pacote de programas de escritório para textos, planilhas e apresentações.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'aplicativo',
    termo: 'Aplicativo',
    categoria: 'Software',
    video: '/videos/aplicativo.mp4',
    imagem: '/images/aplicativo.png',
    descricao: 'Programa com função específica instalado no computador ou no celular.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'kernel',
    termo: 'Kernel',
    categoria: 'Software',
    video: '/videos/kernel.mp4',
    imagem: '/images/kernel.webp',
    descricao: 'Núcleo do sistema operacional que faz a ponte entre o software e o hardware.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'email',
    termo: 'E-Mail',
    categoria: 'Software',
    video: '/videos/email.mp4',
    imagem: '/images/email.webp',
    descricao: 'Serviço de mensagens eletrônicas enviadas pela internet.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'mac',
    termo: 'Mac',
    categoria: 'Software',
    video: '/videos/mac.mp4',
    imagem: '/images/mac.jpg',
    descricao: 'Sistema operacional da Apple usado nos computadores Macintosh.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'word',
    termo: 'Word',
    categoria: 'Software',
    video: '/videos/word.mp4',
    imagem: '/images/word.png',
    descricao: 'Editor de textos do pacote Office usado para criar documentos.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'excel',
    termo: 'Excel',
    categoria: 'Software',
    video: '/videos/excel.mp4',
    imagem: '/images/excel.jpg',
    descricao: 'Programa de planilhas do pacote Office usado para cálculos e gráficos.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'powerpoint',
    termo: 'PowerPoint',
    categoria: 'Software',
    video: '/videos/powerpoint.mp4',
    imagem: '/images/powerpoint.png',
    descricao: 'Programa do pacote Office usado para criar apresentações de slides.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'algoritmo',
    termo: 'Algoritmo',
    categoria: 'Programação',
    video: '/videos/algoritmo.mp4',
    imagem: '/images/algoritmo.gif',
    descricao: 'Sequência finita de passos lógicos para resolver um problema.',
    exemploPt: 'O algoritmo ordena a lista de nomes.',
    exemploGlosa: 'ALGORITMO PASSO PASSO RESOLVER'
  },
  {
    id: 'variavel',
    termo: 'Variável',
    categoria: 'Programação',
    video: '/videos/variavel.mp4',
    imagem: '/images/variavel.jpg',
    descricao: 'Espaço na memória reservado para armazenar dados que podem mudar.',
    exemploPt: 'Declare uma variável para guardar a idade.',
    exemploGlosa: 'VARIÁVEL MEMÓRIA GUARDAR MUDAR'
  },
  {
    id: 'laco-de-repeticao',
    termo: 'Laço de Repetição',
    categoria: 'Programação',
    video: '/videos/laco-de-repeticao.mp4',
    imagem: '/images/laco-de-repeticao.png',
    descricao: 'Estrutura que repete um bloco de comandos enquanto a condição for verdadeira.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'java',
    termo: 'Java',
    categoria: 'Programação',
    video: '/videos/java.mp4',
    imagem: '/images/java.png',
    descricao: 'Linguagem de programação orientada a objetos muito usada em sistemas corporativos.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'html',
    termo: 'HTML',
    categoria: 'Programação',
    video: '/videos/html.mp4',
    imagem: '/images/html.png',
    descricao: 'Linguagem de marcação que estrutura o conteúdo das páginas web.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'css',
    termo: 'CSS',
    categoria: 'Programação',
    video: '/videos/css.mp4',
    imagem: '/images/css.png',
    descricao: 'Linguagem de estilo que define a aparência das páginas web.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'javascript',
    termo: 'JavaScript',
    categoria: 'Programação',
    video: '/videos/javascript.mp4',
    imagem: '/images/javascript.jpg',
    descricao: 'Linguagem de programação que adiciona interatividade às páginas web.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'python',
    termo: 'Python',
    categoria: 'Programação',
    video: '/videos/python.mp4',
    imagem: '/images/python.webp',
    descricao: 'Linguagem de programação de alto nível conhecida pela sintaxe simples.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'vscode',
    termo: 'VSCode',
    categoria: 'Programação',
    video: '/videos/vscode.mp4',
    imagem: '/images/vscode.png',
    descricao: 'Editor de código utilizado para escrever e editar programas.',
    exemploPt: 'Estou utilizando o VSCode para programar.',
    exemploGlosa: 'VSCODE EDITOR CÓDIGO PROGRAMAR'
  },
  {
    id: 'github',
    termo: 'GitHub',
    categoria: 'Programação',
    video: '/videos/github.mp4',
    imagem: '/images/github.jpg',
    descricao: 'Plataforma de hospedagem de código que usa o sistema de controle de versão Git.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'potencia',
    termo: 'Potência',
    categoria: 'Eletricidade',
    video: '/videos/potencia.mp4',
    imagem: '/images/potencia.jpg',
    descricao: 'Grandeza que mede a quantidade de energia elétrica consumida por segundo.',
    exemploPt: 'A potência da fonte é de 500 Watts.',
    exemploGlosa: 'POTÊNCIA ENERGIA FORÇA MEDIR'
  },
  {
    id: 'resistor',
    termo: 'Resistor',
    categoria: 'Eletricidade',
    video: '/videos/resistor.mp4',
    imagem: '/images/resistor.jpg',
    descricao: 'Componente elétrico que limita e opõe resistência à passagem de corrente.',
    exemploPt: 'O resistor protege o LED contra sobrecarga.',
    exemploGlosa: 'RESISTOR SEGURAR CORRENTE ELÉTRICA'
  },
  {
    id: 'tensao',
    termo: 'Tensão',
    categoria: 'Eletricidade',
    video: '/videos/tensao.mp4',
    imagem: '/images/tensao.png',
    descricao: 'Diferença de potencial elétrico entre dois pontos do circuito, medida em volts.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'corrente-eletrica',
    termo: 'Corrente Elétrica',
    categoria: 'Eletricidade',
    video: '/videos/corrente-eletrica.mp4',
    imagem: '/images/corrente-eletrica.jpg',
    descricao: 'Fluxo ordenado de cargas elétricas que percorre um condutor.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'cabo',
    termo: 'Cabo',
    categoria: 'Eletricidade',
    video: '/videos/cabo.mp4',
    imagem: '/images/cabo.jpg',
    descricao: 'Fio condutor coberto por isolante usado para ligar pontos de um circuito.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'circuito-serie',
    termo: 'Circuito em Série',
    categoria: 'Eletricidade',
    video: '/videos/circuito-serie.mp4',
    imagem: '/images/circuito-serie.jpg',
    descricao: 'Circuito onde os componentes estão conectados em sequência, formando um único caminho para a corrente.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'circuito-paralelo',
    termo: 'Circuito em Paralelo',
    categoria: 'Eletricidade',
    video: '/videos/circuito-paralelo.mp4',
    imagem: '/images/circuito-paralelo.jpg',
    descricao: 'Circuito onde os componentes estão conectados em paralelo, formando múltiplos caminhos para a corrente.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'alicate-universal',
    termo: 'Alicate Universal',
    categoria: 'Eletricidade',
    video: '/videos/alicate-universal.mp4',
    imagem: '/images/alicate.jpg',
    descricao: 'Ferramenta de mão usada para segurar, cortar e dobrar fios elétricos.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'alicate-de-corte',
    termo: 'Alicate de Corte',
    categoria: 'Eletricidade',
    video: '/videos/alicate-corte.mp4',
    imagem: '/images/alicate-de-corte.jpg',
    descricao: 'Ferramenta de mão usada para cortar fios elétricos.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'alicate-decapador',
    termo: 'Alicate Decapador',
    categoria: 'Eletricidade',
    video: '/videos/alicate-decapador.mp4',
    imagem: '/images/alicate-decapador.jpg',
    descricao: 'Ferramenta de mão usada para remover o isolante dos fios elétricos.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'multimetro',
    termo: 'Multímetro',
    categoria: 'Eletricidade',
    video: '/videos/multimetro.mp4',
    imagem: '/images/multimetro.webp',
    descricao: 'Instrumento de medição de tensão, corrente e resistência elétrica.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'navegador-de-internet',
    termo: 'Navegador de Internet',
    categoria: 'Redes',
    video: '/videos/navegador-de-internet.mp4',
    imagem: '/images/navegador-de-internet.png',
    descricao: 'Software que permite acessar e visualizar páginas da World Wide Web.',
    exemploPt: 'Abra o navegador de internet para pesquisar.',
    exemploGlosa: 'NAVEGADOR PROGRAMA ENTRAR INTERNET'
  },
  {
    id: 'internet-explorer',
    termo: 'Internet Explorer',
    categoria: 'Redes',
    video: '/videos/internet-explorer.mp4',
    imagem: '/images/internet-explorer.jpg',
    descricao: 'Navegador de internet desenvolvido pela Microsoft.',
    exemploPt: 'O Internet Explorer era usado para acessar sites.',
    exemploGlosa: 'INTERNET EXPLORER NAVEGADOR ACESSAR SITE'
  },
  {
    id: 'safari',
    termo: 'Safari',
    categoria: 'Redes',
    video: '/videos/safari.mp4',
    imagem: '/images/safari.jpg',
    descricao: 'Navegador de internet desenvolvido pela Apple.',
    exemploPt: 'O Safari permite acessar páginas da internet.',
    exemploGlosa: 'SAFARI NAVEGADOR INTERNET ACESSAR'
  },
  {
    id: 'edge',
    termo: 'Edge',
    categoria: 'Redes',
    video: '/videos/edge.mp4',
    imagem: '/images/edge.jpg',
    descricao: 'Navegador de internet desenvolvido pela Microsoft.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'Google Chrome',
    termo: 'Google Chrome',
    categoria: 'Redes',
    video: '/videos/google-chrome.mp4',
    imagem: '/images/google-chrome.jpg',
    descricao: 'Navegador de internet desenvolvido pelo Google.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'firefox',
    termo: 'Firefox',
    categoria: 'Redes',
    video: '/videos/firefox.mp4',
    imagem: '/images/firefox.jpg',
    descricao: 'Navegador de internet de código aberto desenvolvido pela Mozilla.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'abas',
    termo: 'Abas',
    categoria: 'Redes',
    video: '/videos/abas.mp4',
    imagem: '/images/abas.webp',
    descricao: 'Recurso do navegador que permite abrir várias páginas na mesma janela.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'maximizar',
    termo: 'Maximizar',
    categoria: 'Redes',
    video: '/videos/maximizar.mp4',
    imagem: '/images/maximizar-e-minimizar.jpg',
    descricao: 'Ação da janela que amplia o tamanho na tela.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'minimizar',
    termo: 'Minimizar',
    categoria: 'Redes',
    video: '/videos/minimizar.mp4',
    imagem: '/images/maximizar-e-minimizar.jpg',
    descricao: 'Ação da janela que reduz o tamanho na tela.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'virus',
    termo: 'Vírus',
    categoria: 'Redes',
    video: '/videos/virus.mp4',
    imagem: '/images/virus.jpg',
    descricao: 'Programa malicioso que se espalha e danifica os arquivos do computador.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'antivirus',
    termo: 'Antivírus',
    categoria: 'Redes',
    video: '/videos/antivirus.mp4',
    imagem: '/images/antivirus.webp',
    descricao: 'Programa que detecta e remove ameaças digitais do computador.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'backup',
    termo: 'Backup',
    categoria: 'Redes',
    video: '/videos/backup.mp4',
    imagem: '/images/backup.jpg',
    descricao: 'Cópia de segurança dos arquivos para evitar perdas de dados.',
    exemploPt: '',
    exemploGlosa: ''
  },
  {
    id: 'link',
    termo: 'Link',
    categoria: 'Redes',
    video: '/videos/link.mp4',
    imagem: '/images/link.jpg',
    descricao: 'Endereço clicável que leva a outra página ou arquivo na internet.',
    exemploPt: '',
    exemploGlosa: ''
  }
];

// O quiz usa os mesmos vídeos locais, com apenas os campos necessários.
// As alternativas são o termo atual e os três seguintes da mesma categoria.
// Os scripts do quiz embaralham essas opções ao exibir a pergunta.
const TERMOS_LOCAIS = TERMOS.map(({ id, termo, categoria, video }) => {
  const termosDaCategoria = TERMOS.filter((item) => item.categoria === categoria);
  const indiceAtual = termosDaCategoria.findIndex((item) => item.id === id);

  const opcoes = Array.from({ length: 4 }, (_, deslocamento) => {
    const indiceOpcao = (indiceAtual + deslocamento) % termosDaCategoria.length;
    return termosDaCategoria[indiceOpcao].termo;
  });

  return { id, termo, categoria, video, opcoes };
});