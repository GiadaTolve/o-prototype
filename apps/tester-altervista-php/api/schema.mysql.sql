-- Schema MySQL per Altervista (PHP + PDO)
-- Esegui una volta dal pannello phpMyAdmin.

CREATE TABLE IF NOT EXISTS contributions (
  id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL,
  type VARCHAR(80) NOT NULL,
  author VARCHAR(120) NULL,
  subkind VARCHAR(60) NULL,
  pool VARCHAR(60) NULL,
  payload_json LONGTEXT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_created_at (created_at),
  KEY idx_type_created (type, created_at),
  KEY idx_pool_created (pool, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
