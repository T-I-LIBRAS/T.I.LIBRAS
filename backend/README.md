# T.I. Libras — Backend (Node + Express + MySQL)

Este backend substitui o Supabase usado antes no projeto. Ele expõe uma API
REST simples para autenticação (com cookie de sessão em JWT) e para
salvar/carregar o progresso do usuário.

## 1. Instalar dependências

```bash
cd backend
npm install
```

## 2. Criar o banco de dados

Rode o script SQL em um MySQL já instalado:

```bash
mysql -u root -p < src/schema.sql
```

Isso cria o banco `ti_libras` com as tabelas `users` e `progresso_usuario`.

## 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o `.env` com os dados do seu MySQL e uma chave (`JWT_SECRET`) longa e
aleatória. `CORS_ORIGIN` deve ser a URL de onde o front-end é servido
(por exemplo, `http://localhost:5500` se você usa a extensão Live Server).

## 4. Rodar o servidor

```bash
npm start
```

O servidor sobe em `http://localhost:3000` (ou na porta definida em `PORT`).

## 5. Ajustar o front-end

No arquivo `js/api-config.js` do front-end, confirme que `API_BASE_URL`
aponta para onde o backend está rodando (`http://localhost:3000/api` por
padrão).

## Rotas disponíveis

- `POST /api/auth/register` — `{ name, email, password }`
- `POST /api/auth/login` — `{ email, password }`
- `POST /api/auth/logout`
- `GET  /api/auth/session` — retorna `{ user }` ou `{ user: null }`
- `GET  /api/progresso` — retorna o progresso do usuário logado
- `PUT  /api/progresso` — salva `{ sinais_vistos, termos_favoritos, quizzes_concluidos, pontuacoes }`

A sessão é mantida por um cookie `httpOnly` com um JWT — por isso o
front-end usa `fetch(..., { credentials: 'include' })` (já configurado em
`js/api-config.js`), e o CORS no backend precisa estar com `credentials: true`
e `origin` apontando exatamente para a URL do front-end (não pode ser `*`).
