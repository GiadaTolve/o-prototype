<?php
/**
 * Copia questo file come `config.php` nella stessa cartella (non committare password).
 *
 * collab_users: username (minuscolo) => hash bcrypt (stesso formato di
 *   bun apps/tester-api/scripts/prepare-collab-env.ts oppure PHP password_hash).
 *
 * Upload Altervista (esempio):
 *   public_html/api/           → contenuto cartella `api/` (index.php, inc/, config.php, .htaccess)
 *   public_html/oyasumi-data/ → copia cartella `data/` (.htaccess + permessi scrittura)
 * Poi in config.php imposta data_file verso il path assoluto o relativo scrivibile.
 *
 * Hosting tipo Altervista (PHP 7.x): evitare solo tipi/parametri PHP 8+ (mixed, str_starts_with, …) in index.php.
 */
declare(strict_types=1);

return [
  /**
   * Configurazione MySQL (Altervista).
   * Se db_enabled=true, l'API usa il database; altrimenti resta su file JSONL.
   */
  'db_enabled' => true,
  'db_host' => 'localhost',
  'db_port' => 3306,
  'db_name' => '',
  'db_user' => '',
  'db_pass' => '',
  'db_charset' => 'utf8mb4',

  /** File JSONL (append-only), fuori dalla document root se possibile */
  'data_file' => dirname(__DIR__) . '/data/contributions.jsonl',

  /** Chiave segreta per JWT HS256 (es. 64 caratteri hex) */
  'jwt_secret' => '',

  /** ['utente_minuscolo' => '$2y$12$...'] — nel client il login usa username in minuscolo (es. alessandra, davide, nicolas, giada). Vuoto = solo X-Contribute-Key. */
  'collab_users' => [],

  /** Bearer o header X-Admin-Key per GET /api/contributions e GET /api/audit-log?hours=24 (registro modifiche) */
  'admin_key' =>'VENTIQUATTROORE',

  /** Opzionale: se valorizzata e login disattivo, richiesta header X-Contribute-Key su POST */
  'contribute_key' => '',

  /** Origini CORS consentite (no wildcard + credenziali; qui usiamo * o lista esplicita) */
  'cors_origins' => ['https://oyasumi.altervista.org', 'http://localhost:5173'],
];
