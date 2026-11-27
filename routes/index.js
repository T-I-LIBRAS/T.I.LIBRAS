var express = require('express');
var router = express.Router();

// Font Awesome (CDN). Cada página mantém a versão que já usava.
const FONT_AWESOME_6_5_1 = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
const FONT_AWESOME_6_5_2 = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';

// Páginas do site. O front-end navega por URLs terminadas em ".html"
// (ver public/javascripts/auth.js), por isso elas continuam com esse formato.
//
// Para cada página:
//   urls        endereços que abrem a página
//   view        arquivo em views/ (sem a extensão)
//   title       <title> da página
//   styles      <link rel="stylesheet"> do <head>, na ordem
//   headScripts <script> do <head>, na ordem
//   scripts     <script> do fim do <body>, na ordem
// O layout (views/layout.hbs) monta o HTML com essas listas.
const paginas = [
  {
    urls: ['/', '/index.html'],
    view: 'index',
    title: 'T.I. Libras - Aprenda TI em Libras',
    styles: [FONT_AWESOME_6_5_1, '/stylesheets/style.css?v=2', '/stylesheets/inicio.css', '/stylesheets/auth.css'],
    headScripts: ['/javascripts/components.js?v=3', '/javascripts/api-config.js'],
    scripts: ['/javascripts/inicio.js', '/javascripts/auth.js', '/javascripts/auth-guard.js']
  },
  {
    urls: ['/home.html'],
    view: 'home/index',
    title: 'T.I Libras - Início',
    styles: [FONT_AWESOME_6_5_2, '/stylesheets/style.css?v=2', '/stylesheets/home.css?v=2'],
    // termos.js entra aqui para o "Progresso total" saber quantos termos existem
    headScripts: ['/javascripts/components.js?v=3', '/javascripts/api-config.js', '/data/termos.js'],
    scripts: ['/javascripts/auth.js', '/data/categorias-quiz.js', '/javascripts/progresso.js?v=4', '/javascripts/home.js?v=4']
  },
  {
    urls: ['/perfil.html'],
    view: 'perfil/index',
    title: 'T.I Libras - Meu Perfil',
    styles: [FONT_AWESOME_6_5_2, '/stylesheets/style.css?v=2', '/stylesheets/perfil.css'],
    // termos.js entra aqui para o progresso geral saber quantos termos existem
    headScripts: ['/javascripts/components.js?v=3', '/javascripts/api-config.js', '/data/termos.js'],
    scripts: ['/javascripts/auth.js', '/data/categorias-quiz.js', '/javascripts/progresso.js?v=4', '/javascripts/perfil.js?v=3']
  },
  {
    urls: ['/praticar.html'],
    view: 'praticar/index',
    title: 'T.I Libras - Quiz Prático',
    // Aqui o Font Awesome vem DEPOIS do CSS do site (era assim no <head> original).
    // quiz.css também é carregado porque as duas páginas de quiz dividem .quiz-card e .quiz-header.
    styles: ['/stylesheets/style.css?v=2', '/stylesheets/praticar.css?v=2', '/stylesheets/quiz.css', FONT_AWESOME_6_5_2],
    headScripts: ['/javascripts/components.js?v=3', '/javascripts/api-config.js', '/data/termos.js'],
    scripts: ['/javascripts/auth.js', '/data/categorias-quiz.js', '/javascripts/progresso.js?v=4', '/javascripts/tentativas-quiz.js', '/javascripts/youtube-video.js', '/javascripts/praticar.js?v=58']
  },
  {
    urls: ['/quiz.html'],
    view: 'quiz/index',
    title: 'T.I. Libras - Quiz Interativo',
    // Sem Font Awesome (como no original). praticar.css entra porque quiz-card/quiz-header estão definidos nele também.
    styles: ['/stylesheets/style.css?v=2', '/stylesheets/praticar.css?v=2', '/stylesheets/quiz.css'],
    headScripts: ['/javascripts/components.js?v=3', '/javascripts/api-config.js', '/data/termos.js'],
    scripts: ['/javascripts/auth.js', '/data/categorias-quiz.js', '/javascripts/progresso.js?v=4', '/javascripts/tentativas-quiz.js', '/javascripts/youtube-video.js', '/javascripts/quizes.js?v=50']
  },
  {
    urls: ['/ficha-tecnica.html'],
    view: 'ficha-tecnica/index',
    title: 'T.I Libras - Ficha Técnica',
    styles: [FONT_AWESOME_6_5_2, '/stylesheets/style.css?v=2', '/stylesheets/ficha-tecnica.css'],
    headScripts: ['/javascripts/components.js?v=3', '/javascripts/api-config.js'],
    scripts: ['/javascripts/auth.js']
  },
  {
    urls: ['/termos.html'],
    view: 'termos/index',
    title: 'T.I Libras - Termos de Uso e Privacidade',
    styles: [FONT_AWESOME_6_5_2, '/stylesheets/style.css?v=2', '/stylesheets/termos.css'],
    headScripts: ['/javascripts/components.js?v=3', '/javascripts/api-config.js'],
    scripts: ['/javascripts/auth.js']
  },
  {
    urls: ['/sinalario.html'],
    view: 'sinalario/index',
    title: 'T.I Libras - Sinalário',
    styles: [FONT_AWESOME_6_5_2, '/stylesheets/style.css?v=2', '/stylesheets/sinalario.css?v=2'],
    headScripts: ['/javascripts/components.js?v=3', '/javascripts/api-config.js', '/data/termos.js'],
    scripts: ['/javascripts/auth.js', '/data/categorias-quiz.js', '/javascripts/progresso.js?v=4', '/javascripts/youtube-video.js', '/javascripts/busca-sinalario.js', '/javascripts/sinalario.js?v=52']
  }
];

paginas.forEach(function (pagina) {
  router.get(pagina.urls, function (req, res, next) {
    res.render(pagina.view, {
      title: pagina.title,
      styles: pagina.styles,
      headScripts: pagina.headScripts,
      scripts: pagina.scripts
    });
  });
});

module.exports = router;
