require('dotenv').config(); // Carrega as variáveis do arquivo .env
const mysql = require('mysql2/promise');

// Pool de conexões com o MySQL. As credenciais vêm do .env (ver .env.example).
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ti_libras',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Permite que esse objeto seja utilizado por outros arquivos
module.exports = pool;
