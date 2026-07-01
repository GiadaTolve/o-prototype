<?php
/**
 * Entry point — stesse route di apps/tester-api (Bun) per il client React statico.
 * Deploy: cartella `api/` sotto public_html + `data/` scrivibile (vedi config.example.php).
 */
declare(strict_types=1);

$configFile = __DIR__ . '/config.php';
if (!is_readable($configFile)) {
  http_response_code(500);
  header('Content-Type: text/plain; charset=utf-8');
  echo 'Manca api/config.php. Copia config.example.php in config.php e compila.';
  exit;
}

/** @var array<string,mixed> $config */
$config = require $configFile;

require __DIR__ . '/inc/helpers.php';

$jwtSecret = trim((string) ($config['jwt_secret'] ?? ''));
$collabUsers = is_array($config['collab_users'] ?? null) ? $config['collab_users'] : [];
$authCollab = $jwtSecret !== '' && count($collabUsers) > 0;

$dataFile = (string) ($config['data_file'] ?? '');
$adminKey = trim((string) ($config['admin_key'] ?? ''));
$contributeKey = trim((string) ($config['contribute_key'] ?? ''));
$pdo = oat_db_connect($config);

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$rawPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$rawPath = '/' . trim($rawPath, '/');
if (strpos($rawPath, '/api') === 0) {
  $path = substr($rawPath, strlen('/api')) ?: '/';
} else {
  $path = $rawPath;
}
$path = rtrim($path, '/') ?: '/';

if ($method === 'OPTIONS') {
  oat_send_headers($config, 204);
  exit;
}

/** @param mixed $data */
function oat_json(array $config, $data, int $status = 200): void {
  oat_send_headers($config, $status);
  echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

function oat_text(array $config, string $body, int $status = 200): void {
  oat_send_headers($config, $status, 'text/plain');
  echo $body;
}

function oat_body_json(): array {
  $raw = file_get_contents('php://input') ?: '';
  $j = json_decode($raw, true);
  return is_array($j) ? $j : [];
}

function oat_assert_admin(array $config, string $adminKey): bool {
  if ($adminKey === '') {
    return false;
  }
  $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  $bearer = (strpos($auth, 'Bearer ') === 0) ? trim(substr($auth, 7)) : '';
  $hk = $_SERVER['HTTP_X_ADMIN_KEY'] ?? '';
  return ($bearer !== '' && hash_equals($adminKey, $bearer)) || ($hk !== '' && hash_equals($adminKey, trim($hk)));
}

function oat_assert_contribute(string $contributeKey): bool {
  if ($contributeKey === '') {
    return true;
  }
  $k = trim($_SERVER['HTTP_X_CONTRIBUTE_KEY'] ?? '');
  return $k !== '' && hash_equals($contributeKey, $k);
}

/** @return array{sub:string}|null */
function oat_require_collab_jwt(array $config, string $jwtSecret): ?array {
  $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  if (strpos($auth, 'Bearer ') !== 0) {
    return null;
  }
  $token = trim(substr($auth, 7));
  return oat_jwt_verify($token, $jwtSecret);
}

try {
  if ($path === '/health' && $method === 'GET') {
    oat_json($config, ['ok' => true, 'service' => 'tester-api-php', 'collabAuth' => $authCollab]);
    exit;
  }

  if ($path === '/auth/config' && $method === 'GET') {
    oat_json($config, ['collabLoginRequired' => $authCollab]);
    exit;
  }

  if ($path === '/auth/login' && $method === 'POST') {
    if (!$authCollab) {
      oat_text($config, 'Login collaboratori non configurato (jwt_secret + collab_users in config.php)', 503);
      exit;
    }
    $b = oat_body_json();
    $username = isset($b['username']) && is_string($b['username']) ? strtolower(trim($b['username'])) : '';
    $password = isset($b['password']) && is_string($b['password']) ? $b['password'] : '';
    if ($username === '' || $password === '') {
      oat_text($config, 'username e password obbligatori', 400);
      exit;
    }
    $hash = is_string($collabUsers[$username] ?? null) ? $collabUsers[$username] : null;
    if (!$hash || !password_verify($password, $hash)) {
      oat_text($config, 'Credenziali non valide', 401);
      exit;
    }
    $token = oat_jwt_sign($username, $jwtSecret);
    oat_json($config, ['ok' => true, 'token' => $token, 'user' => $username]);
    exit;
  }

  if ($dataFile === '') {
    oat_text($config, 'config data_file mancante', 500);
    exit;
  }

  if ($path === '/waza-accessori' && $method === 'GET') {
    $rows = oat_read_all_contributions($dataFile, $pdo);
    $agg = oat_aggregate_waza_accessori($rows);
    oat_json($config, $agg);
    exit;
  }

  if ($path === '/runtime/waza' && $method === 'GET') {
    $rows = oat_read_all_contributions($dataFile, $pdo);
    oat_json($config, oat_latest_waza_pool_overlays($rows));
    exit;
  }

  if ($path === '/runtime/skiru' && $method === 'GET') {
    $rows = oat_read_all_contributions($dataFile, $pdo);
    oat_json($config, oat_latest_skiru_pool($rows));
    exit;
  }

  if ($path === '/runtime/skiru-categories' && $method === 'GET') {
    $rows = oat_read_all_contributions($dataFile, $pdo);
    oat_json($config, oat_latest_skiru_categories($rows));
    exit;
  }

  if ($path === '/contributions/catalog' && $method === 'GET') {
    if (!$authCollab) {
      oat_text($config, 'Catalogo riservato: abilita login collaboratori', 503);
      exit;
    }
    $jwtv = oat_require_collab_jwt($config, $jwtSecret);
    if ($jwtv === null) {
      oat_text($config, 'Autenticazione richiesta (Bearer JWT)', 401);
      exit;
    }
    $rows = oat_read_all_contributions($dataFile, $pdo);
    $items = [];
    foreach ($rows as $r) {
      if (is_array($r)) {
        $items[] = oat_summarize_contribution($r);
      }
    }
    oat_json($config, ['count' => count($items), 'items' => $items]);
    exit;
  }

  if (preg_match('#^/contributions/([^/]+)$#', $path, $m) && $method === 'GET') {
    if (!$authCollab) {
      oat_text($config, 'Dettaglio riservato: abilita login collaboratori', 503);
      exit;
    }
    $jwtv = oat_require_collab_jwt($config, $jwtSecret);
    if ($jwtv === null) {
      oat_text($config, 'Autenticazione richiesta (Bearer JWT)', 401);
      exit;
    }
    $wantId = $m[1];
    $rows = oat_read_all_contributions($dataFile, $pdo);
    $hit = null;
    foreach ($rows as $r) {
      if (is_array($r) && isset($r['id']) && (string) $r['id'] === $wantId) {
        $hit = $r;
        break;
      }
    }
    if ($hit === null) {
      oat_text($config, 'Contributo non trovato', 404);
      exit;
    }
    oat_json($config, $hit);
    exit;
  }

  if ($path === '/contributions' && $method === 'GET') {
    if ($adminKey === '') {
      oat_text($config, 'admin_key non impostata in config.php', 503);
      exit;
    }
    if (!oat_assert_admin($config, $adminKey)) {
      oat_text($config, 'Non autorizzato', 401);
      exit;
    }
    $rows = oat_read_all_contributions($dataFile, $pdo);
    oat_json($config, ['count' => count($rows), 'contributions' => $rows]);
    exit;
  }

  if ($path === '/audit-log' && $method === 'GET') {
    if ($adminKey === '') {
      oat_text($config, 'admin_key non impostata in config.php', 503);
      exit;
    }
    if (!oat_assert_admin($config, $adminKey)) {
      oat_text($config, 'Non autorizzato', 401);
      exit;
    }
    $qh = isset($_GET['hours']) && is_string($_GET['hours']) ? (int) $_GET['hours'] : 24;
    if ($qh < 1) {
      $qh = 24;
    }
    $rows = oat_read_all_contributions($dataFile, $pdo);
    oat_json($config, oat_build_audit_log($rows, $qh));
    exit;
  }

  if ($path === '/contributions' && $method === 'POST') {
    if ($authCollab) {
      $jwtv = oat_require_collab_jwt($config, $jwtSecret);
      if ($jwtv === null) {
        oat_text($config, 'Autenticazione richiesta (Bearer JWT)', 401);
        exit;
      }
      $b = oat_body_json();
      if (!isset($b['type']) || !is_string($b['type']) || trim($b['type']) === '') {
        oat_text($config, 'Campo "type" obbligatorio', 400);
        exit;
      }
      $type = trim($b['type']);
      $id = oat_uuid_v4();
      $createdAt = gmdate('c');
      $payload = isset($b['payload']) && is_array($b['payload']) ? $b['payload'] : ['raw' => $b];
      $record = [
        'id' => $id,
        'createdAt' => $createdAt,
        'type' => $type,
        'author' => $jwtv['sub'],
        'payload' => $payload,
      ];
      if (isset($b['subkind']) && is_string($b['subkind']) && trim($b['subkind']) !== '') {
        $record['subkind'] = trim($b['subkind']);
      }
      if (isset($b['pool']) && is_string($b['pool']) && trim($b['pool']) !== '') {
        $record['pool'] = trim($b['pool']);
      }
      oat_append_contribution($dataFile, $record, $pdo);
      oat_json($config, ['ok' => true, 'id' => $id, 'createdAt' => $createdAt], 201);
      exit;
    }

    if (!oat_assert_contribute($contributeKey)) {
      oat_text($config, 'X-Contribute-Key mancante o errata', 401);
      exit;
    }
    $b = oat_body_json();
    if (!isset($b['type']) || !is_string($b['type']) || trim($b['type']) === '') {
      oat_text($config, 'Campo "type" obbligatorio', 400);
      exit;
    }
    $type = trim($b['type']);
    $id = oat_uuid_v4();
    $createdAt = gmdate('c');
    $payload = isset($b['payload']) && is_array($b['payload']) ? $b['payload'] : ['raw' => $b];
    $author = isset($b['author']) && is_string($b['author']) ? substr(trim($b['author']), 0, 120) : null;
    $record = [
      'id' => $id,
      'createdAt' => $createdAt,
      'type' => $type,
      'payload' => $payload,
    ];
    if ($author !== null && $author !== '') {
      $record['author'] = $author;
    }
    if (isset($b['subkind']) && is_string($b['subkind']) && trim($b['subkind']) !== '') {
      $record['subkind'] = trim($b['subkind']);
    }
    if (isset($b['pool']) && is_string($b['pool']) && trim($b['pool']) !== '') {
      $record['pool'] = trim($b['pool']);
    }
    oat_append_contribution($dataFile, $record, $pdo);
    oat_json($config, ['ok' => true, 'id' => $id, 'createdAt' => $createdAt], 201);
    exit;
  }

  oat_text($config, 'Not found', 404);
} catch (Throwable $e) {
  oat_text($config, 'Errore server: ' . $e->getMessage(), 500);
}
