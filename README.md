# T.I. Libras

## Sobre o Projeto

O **T.I. Libras** é uma plataforma web para aprender termos de **Tecnologia da Informação em Libras**. O usuário consulta os sinais em um sinalário, pratica com quizzes por categoria e acompanha o próprio progresso.

O servidor Node/Express entrega as páginas, os arquivos estáticos e uma API REST. Ela substitui o Supabase usado antes no projeto e guarda usuários e progresso em MySQL.

---

## Funcionalidades

* Cadastro, login e logout (sessão por cookie `httpOnly` com JWT)
* **LGPD**: o cadastro exige o aceite dos Termos de Uso e da Política de Privacidade (checkbox obrigatório, com data do consentimento gravada no banco) e há uma página pública `/termos.html`
* **Exclusão de conta**: no perfil, o usuário apaga a própria conta (confirmando a senha). O progresso e as conquistas são apagados junto
* **Sinalário**: consulta dos termos por categoria (Hardware, Software, Programação, Redes e Eletricidade), com busca, vídeo do sinal, definição e exemplos
* **Praticar**: quiz prático por categoria
* **Quiz interativo**: perguntas com vídeo do sinal
* Termos favoritos
* **Perfil** com dados da conta (nome, e-mail, data de cadastro), edição do nome, estatísticas e progresso geral, tudo salvo no banco
* **Conquistas**: quatro medalhas (Primeiros sinais, Colecionador, Primeiro desafio e Especialista em TI), conferidas pelo servidor e registradas com a data de desbloqueio

---

## Tecnologias Utilizadas

### Frontend

* HTML5, CSS3 e JavaScript
* Font Awesome e Google Fonts (via CDN)

### Backend

* Node.js
* Express.js
* express-handlebars (views `.hbs`)
* JWT (`jsonwebtoken`) e `bcryptjs` para autenticação
* `express-rate-limit` no login

### Banco de Dados

* MySQL (driver `mysql2`)

---

## Estrutura de Pastas

```
.
├── app.js                  # configuração do Express (middlewares, rotas, erros)
├── bin/
│   └── www                 # inicia o servidor HTTP
├── config/
│   ├── database.js         # pool de conexões com o MySQL
│   └── schema.sql          # criação do banco e das tabelas
├── middlewares/
│   └── auth.js             # leitura/validação do cookie de sessão (JWT)
├── models/
│   ├── users.js            # acesso à tabela users
│   ├── progresso.js        # acesso à tabela progresso_usuario
│   └── conquistas.js       # catálogo e regras das conquistas + tabela conquistas_usuario
├── routes/
│   ├── index.js            # páginas (/, /home.html, /sinalario.html, ...)
│   ├── auth.js             # API: /api/auth
│   ├── progresso.js        # API: /api/progresso
│   └── conquistas.js       # API: /api/conquistas
├── public/                 # arquivos servidos como estão
│   ├── data/               # termos.js (dados dos termos)
│   ├── images/             # logo e imagens dos termos
│   ├── javascripts/        # scripts do front-end
│   ├── stylesheets/        # style.css (base) + um CSS por página
│   └── videos/             # vídeos dos sinais
├── views/
│   ├── layout.hbs          # molde comum de todas as páginas
│   ├── error.hbs           # tela de erro
│   ├── index.hbs           # página inicial (inclui login e cadastro)
│   ├── home/ perfil/ praticar/ quiz/ sinalario/ termos/ ficha-tecnica/   # uma pasta por página (index.hbs)
│   └── partials/           # trechos reaproveitados (login-view, register-view)
├── .env.example
└── package.json
```

---

## Como executar

### 1. Instalar as dependências

```bash
npm install
```

### 2. Criar o banco de dados

Com um MySQL já instalado, rode o script SQL:

```bash
mysql -u root -p < config/schema.sql
```

Isso cria o banco `ti_libras` com as tabelas `users`, `progresso_usuario` e `conquistas_usuario`.

**Banco criado antes da LGPD?** A coluna `users.consentimento_em` é criada automaticamente quando o servidor inicia (`Users.garantirEsquema()`). Se preferir fazer à mão: `ALTER TABLE users ADD COLUMN consentimento_em TIMESTAMP NULL DEFAULT NULL;`. Contas antigas ficam com essa coluna vazia.

**Já tinha o banco criado antes das conquistas?** Rode o mesmo comando de novo. O script usa `CREATE ... IF NOT EXISTS`, então só cria a tabela nova `conquistas_usuario` e não altera nem apaga nenhum dado existente. Enquanto a tabela não existir, o site continua funcionando e salvando o progresso normalmente; só a seção "Conquistas" do perfil mostra um aviso de erro.

### 3. Configurar as variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com os dados do seu MySQL e uma chave `JWT_SECRET` longa e aleatória (mínimo de 32 caracteres; o servidor não inicia sem isso).

| Variável | Para que serve |
| --- | --- |
| `PORT` | porta do servidor (padrão `3000`) |
| `CORS_ORIGIN` | URL permitida no CORS (com cookies, não pode ser `*`) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | conexão com o MySQL |
| `JWT_SECRET` | chave que assina o cookie de sessão |
| `JWT_EXPIRES_IN` | validade do token (padrão `7d`) |
| `NODE_ENV` | `development` ou `production` (em produção o cookie é `secure`) |

O `.env` fica na **raiz** do projeto e nunca deve ser enviado ao GitHub (já está no `.gitignore`).

### 4. Rodar o servidor

```bash
npm start
```

Para reiniciar sozinho a cada alteração, use `npm run dev`.

O site abre em `http://localhost:3000` (ou na porta definida em `PORT`).

### 5. Vídeos e imagens dos termos

O `public/data/termos.js` aponta para `/videos/<termo>.mp4` (ou para um link do YouTube) e `/images/<termo>.png`. Para os vídeos locais, coloque os arquivos em `public/videos/` e as imagens em `public/images/` com esses nomes. O vídeo da página inicial é `public/videos/apresentacao.mp4`.

---

## Rotas

### Páginas

* `GET /` e `GET /index.html`
* `GET /home.html`
* `GET /sinalario.html`
* `GET /praticar.html`
* `GET /quiz.html`
* `GET /perfil.html`
* `GET /termos.html` (Termos de Uso e Política de Privacidade, pública)
* `GET /ficha-tecnica.html` (ficha técnica do projeto, pública)

### API

* `POST /api/auth/register`: `{ name, email, password, consentimento }` (`consentimento` precisa ser `true`, senão responde 400)
* `POST /api/auth/login`: `{ email, password }`
* `POST /api/auth/logout`
* `GET  /api/auth/session`: retorna `{ user }` ou `{ user: null }`
* `GET  /api/progresso`: retorna o progresso do usuário logado
* `PUT  /api/auth/profile`: edita o nome do próprio usuário (`{ name }`, de 1 a 150 caracteres). E-mail e senha não são alterados por aqui
* `PUT  /api/progresso`: salva `{ sinais_vistos, termos_favoritos, quizzes_concluidos, pontuacoes }`. A resposta traz `novas_conquistas` com as conquistas desbloqueadas por esse salvamento
* `GET  /api/conquistas`: lista as conquistas do usuário logado (`conquistas`, `total`, `desbloqueadas`, `novas`). Antes de listar, registra as que o progresso já cumpre
* `DELETE /api/auth/account`: `{ password }`. Exclui a conta do usuário logado, depois de conferir a senha (máx. 5 tentativas a cada 15 min)
* `GET  /api/health`

A sessão é mantida por um cookie `httpOnly` com um JWT. Por isso o front-end usa `fetch(..., { credentials: 'include' })` (já configurado em `public/javascripts/api-config.js`, que usa `API_BASE_URL = '/api'`, na mesma origem do servidor).

---

## Conquistas

As regras ficam em `models/conquistas.js`, no catálogo `CATALOGO`. Cada item informa qual lista do progresso é contada e a meta:

| Conquista | Requisito |
| --- | --- |
| Primeiros sinais | visualizar 1 sinal |
| Colecionador | favoritar 10 termos |
| Primeiro desafio | concluir 1 quiz |
| Especialista em TI | visualizar 50 sinais |

* Contam apenas itens **distintos**: o mesmo sinal repetido não soma duas vezes.
* O servidor confere as conquistas toda vez que o progresso é salvo e quando o perfil é aberto. O desbloqueio é gravado em `conquistas_usuario` com a data. A chave única `(user_id, codigo_conquista)` impede registro duplicado, mesmo com requisições simultâneas.
* Uma conquista desbloqueada continua desbloqueada mesmo que o usuário depois remova favoritos ou refaça um quiz.
* **Limite:** o progresso é enviado pelo navegador (`PUT /api/progresso`) e o servidor só valida o formato. Por isso as conquistas valem como incentivo de estudo, não como prova de que a pessoa realmente abriu os sinais.

## Progresso geral

`progresso geral = sinais vistos que existem no sinalário ÷ total de termos` (de 0 a 100%). Os quizzes e favoritos não entram na conta, porque medem coisas diferentes. A fórmula está em `public/javascripts/progresso.js` (`percentualGeral`) e é usada na home e no perfil.
