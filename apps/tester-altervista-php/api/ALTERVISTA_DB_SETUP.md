## Setup Database su Altervista

1. Apri phpMyAdmin dal pannello Altervista.
2. Seleziona il database associato al tuo account.
3. Esegui lo script `api/schema.mysql.sql`.
4. Copia `api/config.example.php` in `api/config.php`.
5. Compila i campi DB:
   - `db_enabled => true`
   - `db_host`, `db_port`, `db_name`, `db_user`, `db_pass`
6. Carica la cartella `api/` su `public_html/api/`.

### Note

- Quando `db_enabled` e' `true`, l'API salva/legge da MySQL.
- Quando `db_enabled` e' `false`, resta attivo il fallback JSONL (`data_file`).
- Le route restano invariate (`/auth/login`, `/contributions`, `/runtime/*`, ecc.).
