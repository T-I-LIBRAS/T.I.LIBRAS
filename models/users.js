const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

// Modelo de usuários (tabela `users`, ver config/schema.sql).
// Todo o SQL e o hash de senha ficam aqui; as rotas cuidam só do HTTP.
const Users = {
  // Formato público do usuário, o mesmo que o front-end já recebia.
  // `criadoEm` só aparece quando a consulta trouxe a data de cadastro (GET /api/auth/session).
  toPublic(row) {
    const usuario = { uid: row.id, email: row.email, name: row.name };
    if (row.criado_em) usuario.criadoEm = row.criado_em;
    return usuario;
  },

  async emailExists(email) {
    const [existentes] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    return existentes.length > 0;
  },

  // Cria o usuário com a senha já em hash. Quem chama valida os campos antes.
  // `consentimento_em` registra o aceite dos Termos/Política de Privacidade (LGPD).
  async register({ name, email, password }) {
    const id = uuidv4();
    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (id, name, email, password_hash, consentimento_em) VALUES (?, ?, ?, ?, NOW())',
      [id, name, email, hash]
    );

    return { id, name, email };
  },

  // Devolve o usuário se e-mail e senha conferem; senão, null.
  async login(email, password) {
    const [linhas] = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      [email]
    );
    const usuario = linhas[0];

    if (!usuario) return null;

    const senhaConfere = await bcrypt.compare(password, usuario.password_hash);
    return senhaConfere ? usuario : null;
  },

  async findById(id) {
    const [linhas] = await pool.query(
      'SELECT id, name, email, criado_em FROM users WHERE id = ?',
      [id]
    );
    return linhas[0] || null;
  },

  // Só o nome pode ser alterado pelo próprio usuário (e-mail e senha não passam por aqui).
  async updateName(id, name) {
    await pool.query('UPDATE users SET name = ? WHERE id = ?', [name, id]);
    return this.findById(id);
  },

  // Confere a senha do usuário já logado (usada para confirmar a exclusão da conta).
  async senhaConfere(id, password) {
    const [linhas] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [id]);
    if (linhas.length === 0) return false;
    return bcrypt.compare(password, linhas[0].password_hash);
  },

  // LGPD (direito de eliminação): apaga o usuário. As tabelas progresso_usuario e
  // conquistas_usuario têm ON DELETE CASCADE, então o progresso e as conquistas somem junto.
  async deleteAccount(id) {
    const [resultado] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return resultado.affectedRows > 0;
  },

  // Bancos criados antes da LGPD não têm a coluna do consentimento: cria sozinha na inicialização.
  async garantirEsquema() {
    const [colunas] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'consentimento_em'`
    );
    if (colunas.length === 0) {
      await pool.query('ALTER TABLE users ADD COLUMN consentimento_em TIMESTAMP NULL DEFAULT NULL');
      console.log('[banco] Coluna users.consentimento_em criada.');
    }
  }
};

module.exports = Users;
