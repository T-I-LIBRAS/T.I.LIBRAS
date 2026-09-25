CREATE DATABASE IF NOT EXISTS ti_libras
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ti_libras;

CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  criado_em     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS progresso_usuario (
  user_id            CHAR(36) NOT NULL PRIMARY KEY,
  sinais_vistos      JSON     NOT NULL,
  termos_favoritos   JSON     NOT NULL,
  quizzes_concluidos JSON     NOT NULL,
  pontuacoes         JSON     NOT NULL,
  atualizado_em      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_progresso_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
