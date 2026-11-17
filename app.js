require('dotenv').config(); // Carrega as variáveis do arquivo .env

var express = require('express');
var path = require('path');
var cors = require('cors');
var cookieParser = require('cookie-parser');
var { engine } = require('express-handlebars');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET deve existir e ter pelo menos 32 caracteres');
}

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var progressoRouter = require('./routes/progresso');
var conquistasRouter = require('./routes/conquistas');

var app = express();

// View engine setup
// layout.hbs é o "molde" de todas as páginas; partials/ guarda trechos reaproveitáveis.
var viewsDir = path.join(__dirname, 'views');
app.engine('hbs', engine({
  extname: '.hbs',
  layoutsDir: viewsDir,
  defaultLayout: 'layout',
  partialsDir: path.join(viewsDir, 'partials')
}));
app.set('view engine', 'hbs');
app.set('views', viewsDir);

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5500',
  credentials: true
}));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Rotas
app.use('/', indexRouter); // páginas (home.html, sinalario.html, ...)
app.use('/api/auth', authRouter);
app.use('/api/progresso', progressoRouter);
app.use('/api/conquistas', conquistasRouter);

app.get('/api/health', function (req, res) {
  res.json({ ok: true });
});

// Catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Página não encontrada');
  err.status = 404;
  next(err);
});

// Error handler
app.use(function (err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  var status = err.status || 500;
  var emDesenvolvimento = req.app.get('env') === 'development';

  // Chamadas da API recebem JSON (o front-end lê o campo "message").
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(status).json({
      message: status < 500 || emDesenvolvimento ? err.message : 'Erro interno do servidor'
    });
  }

  // Páginas recebem a tela de erro. Só mostra detalhes em desenvolvimento.
  res.status(status).render('error', {
    title: 'Erro',
    styles: ['/stylesheets/style.css'],
    message: err.message,
    error: emDesenvolvimento ? err : {}
  });
});

module.exports = app;
