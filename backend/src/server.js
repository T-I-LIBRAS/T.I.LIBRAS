require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { engine } = require('express-handlebars');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET deve existir e ter pelo menos 32 caracteres');
}

const authRoutes = require('./routes/auth');
const progressoRoutes = require('./routes/progresso');

const app = express();
const projeto = path.resolve(__dirname, '../..');
const views = path.join(__dirname, '../views');

app.engine('hbs', engine({ extname: '.hbs', defaultLayout: false }));
app.set('view engine', 'hbs');
app.set('views', views);

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5500',
  credentials: true
}));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use('/assets', express.static(path.join(projeto, 'assets')));
app.use('/css', express.static(path.join(projeto, 'css')));
app.use('/data', express.static(path.join(projeto, 'data')));
app.use('/js', express.static(path.join(projeto, 'js')));

app.get(['/', '/index.html'], (req, res) => res.render('index'));
app.get('/home.html', (req, res) => res.render('home'));
app.get('/perfil.html', (req, res) => res.render('perfil'));
app.get('/praticar.html', (req, res) => res.render('praticar'));
app.get('/quiz.html', (req, res) => res.render('quiz'));
app.get('/sinalario.html', (req, res) => res.render('sinalario'));

app.use('/api/auth', authRoutes);
app.use('/api/progresso', progressoRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
