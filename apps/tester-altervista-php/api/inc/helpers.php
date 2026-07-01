<?php
/**
 * Logica condivisa — micro API contributi (compatibile con apps/tester-api Bun).
 * PHP 8.1+ consigliato (Altervista).
 */

declare(strict_types=1);

function oat_db_enabled(array $config): bool {
  return (bool) ($config['db_enabled'] ?? false);
}

function oat_db_connect(array $config): ?PDO {
  if (!oat_db_enabled($config)) {
    return null;
  }

  $host = trim((string) ($config['db_host'] ?? 'localhost'));
  $port = (int) ($config['db_port'] ?? 3306);
  $name = trim((string) ($config['db_name'] ?? ''));
  $user = trim((string) ($config['db_user'] ?? ''));
  $pass = (string) ($config['db_pass'] ?? '');
  $charset = trim((string) ($config['db_charset'] ?? 'utf8mb4'));

  if ($name === '' || $user === '') {
    throw new RuntimeException('Configurazione DB incompleta (db_name/db_user).');
  }

  $dsn = 'mysql:host=' . $host . ';port=' . $port . ';dbname=' . $name . ';charset=' . $charset;
  $pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
  ]);
  return $pdo;
}

function oat_cors_allow_origin(array $config, ?string $origin): string {
  $origins = $config['cors_origins'] ?? ['*'];
  if (in_array('*', $origins, true)) {
    return '*';
  }
  if ($origin && in_array($origin, $origins, true)) {
    return $origin;
  }
  return $origins[0] ?? '*';
}

function oat_send_headers(array $config, int $status = 200, string $contentType = 'application/json'): void {
  $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
  $allow = oat_cors_allow_origin($config, $origin);
  header('Access-Control-Allow-Origin: ' . $allow);
  header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Contribute-Key, X-Admin-Key');
  header('Access-Control-Max-Age: 86400');
  header('Content-Type: ' . $contentType . '; charset=utf-8');
  http_response_code($status);
}

function oat_uuid_v4(): string {
  $b = random_bytes(16);
  $b[6] = chr(ord($b[6]) & 0x0f | 0x40);
  $b[8] = chr(ord($b[8]) & 0x3f | 0x80);
  $h = bin2hex($b);
  return substr($h, 0, 8) . '-' . substr($h, 8, 4) . '-' . substr($h, 12, 4) . '-' . substr($h, 16, 4) . '-' . substr($h, 20, 12);
}

function oat_b64url_encode(string $bin): string {
  return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
}

function oat_b64url_decode(string $s): string {
  $pad = 4 - (strlen($s) % 4);
  if ($pad < 4) {
    $s .= str_repeat('=', $pad);
  }
  return base64_decode(strtr($s, '-_', '+/'), true) ?: '';
}

function oat_jwt_sign(string $sub, string $secret, int $ttlSeconds = 36000): string {
  $header = oat_b64url_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256'], JSON_UNESCAPED_SLASHES));
  $now = time();
  $payload = oat_b64url_encode(json_encode([
    'sub' => $sub,
    'iat' => $now,
    'exp' => $now + $ttlSeconds,
  ], JSON_UNESCAPED_SLASHES));
  $signing = $header . '.' . $payload;
  $sig = hash_hmac('sha256', $signing, $secret, true);
  return $signing . '.' . oat_b64url_encode($sig);
}

/** @return array{sub:string}|null */
function oat_jwt_verify(string $token, string $secret): ?array {
  $parts = explode('.', $token);
  if (count($parts) !== 3) {
    return null;
  }
  [$h, $p, $s] = $parts;
  $signing = $h . '.' . $p;
  $expected = oat_b64url_encode(hash_hmac('sha256', $signing, $secret, true));
  if (!hash_equals($expected, $s)) {
    return null;
  }
  $json = oat_b64url_decode($p);
  $data = json_decode($json, true);
  if (!is_array($data)) {
    return null;
  }
  $exp = $data['exp'] ?? 0;
  if (!is_int($exp) && !is_float($exp)) {
    return null;
  }
  if ((int) $exp < time()) {
    return null;
  }
  $sub = $data['sub'] ?? '';
  if (!is_string($sub) || $sub === '') {
    return null;
  }
  return ['sub' => trim($sub)];
}

function oat_read_all_contributions(string $jsonlPath, ?PDO $pdo = null): array {
  if ($pdo !== null) {
    $stmt = $pdo->query(
      'SELECT id, created_at, type, author, subkind, pool, payload_json
       FROM contributions
       ORDER BY created_at ASC'
    );
    $out = [];
    while (($row = $stmt->fetch()) !== false) {
      $payload = [];
      if (isset($row['payload_json']) && is_string($row['payload_json']) && $row['payload_json'] !== '') {
        $decoded = json_decode($row['payload_json'], true);
        if (is_array($decoded)) {
          $payload = $decoded;
        }
      }
      $item = [
        'id' => (string) $row['id'],
        'createdAt' => gmdate('c', strtotime((string) $row['created_at'])),
        'type' => (string) $row['type'],
        'payload' => $payload,
      ];
      if (isset($row['author']) && $row['author'] !== null && (string) $row['author'] !== '') {
        $item['author'] = (string) $row['author'];
      }
      if (isset($row['subkind']) && $row['subkind'] !== null && (string) $row['subkind'] !== '') {
        $item['subkind'] = (string) $row['subkind'];
      }
      if (isset($row['pool']) && $row['pool'] !== null && (string) $row['pool'] !== '') {
        $item['pool'] = (string) $row['pool'];
      }
      $out[] = $item;
    }
    return $out;
  }

  if (!is_readable($jsonlPath)) {
    return [];
  }
  $raw = file_get_contents($jsonlPath);
  if ($raw === false || $raw === '') {
    return [];
  }
  $out = [];
  foreach (explode("\n", $raw) as $line) {
    $t = trim($line);
    if ($t === '') {
      continue;
    }
    $j = json_decode($t, true);
    if (is_array($j)) {
      $out[] = $j;
    }
  }
  return $out;
}

function oat_append_contribution(string $jsonlPath, array $record, ?PDO $pdo = null): void {
  if ($pdo !== null) {
    $id = isset($record['id']) ? (string) $record['id'] : oat_uuid_v4();
    $createdAt = isset($record['createdAt']) ? (string) $record['createdAt'] : gmdate('c');
    $type = isset($record['type']) ? (string) $record['type'] : '';
    if ($type === '') {
      throw new RuntimeException('Campo type mancante nel record');
    }
    $author = isset($record['author']) && is_string($record['author']) ? $record['author'] : null;
    $subkind = isset($record['subkind']) && is_string($record['subkind']) ? $record['subkind'] : null;
    $pool = isset($record['pool']) && is_string($record['pool']) ? $record['pool'] : null;
    $payload = isset($record['payload']) && is_array($record['payload']) ? $record['payload'] : [];
    $payloadJson = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

    $stmt = $pdo->prepare(
      'INSERT INTO contributions (id, created_at, type, author, subkind, pool, payload_json)
       VALUES (:id, :created_at, :type, :author, :subkind, :pool, :payload_json)'
    );
    $stmt->execute([
      ':id' => $id,
      ':created_at' => date('Y-m-d H:i:s', strtotime($createdAt)),
      ':type' => $type,
      ':author' => $author,
      ':subkind' => $subkind,
      ':pool' => $pool,
      ':payload_json' => $payloadJson,
    ]);
    return;
  }

  $dir = dirname($jsonlPath);
  if (!is_dir($dir)) {
    if (!mkdir($dir, 0755, true) && !is_dir($dir)) {
      throw new RuntimeException('Impossibile creare cartella dati: ' . $dir);
    }
  }
  $line = json_encode($record, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n";
  if (file_put_contents($jsonlPath, $line, FILE_APPEND | LOCK_EX) === false) {
    throw new RuntimeException('Scrittura jsonl fallita');
  }
}

function oat_sort_by_created_at(array $rows): array {
  usort($rows, static function ($a, $b) {
    $ta = is_array($a) && isset($a['createdAt']) ? (string) $a['createdAt'] : '';
    $tb = is_array($b) && isset($b['createdAt']) ? (string) $b['createdAt'] : '';
    return strcmp($ta, $tb);
  });
  return $rows;
}

function oat_aggregate_waza_accessori(array $rows): array {
  $list = [];
  foreach ($rows as $r) {
    if (!is_array($r)) {
      continue;
    }
    $t = $r['type'] ?? '';
    if (($t !== 'waza_accessorio' && $t !== 'waza_accessorio_delete') || empty($r['subkind']) || !is_string($r['subkind'])) {
      continue;
    }
    $list[] = $r;
  }
  usort($list, static function ($a, $b) {
    return strcmp((string) ($a['createdAt'] ?? ''), (string) ($b['createdAt'] ?? ''));
  });
  $cond = [];
  $st = [];
  $ct = [];
  /** ID soppressi anche se non erano mai stati aggiunti via contributo (rimuove voci del bundle statico). */
  $delCond = [];
  $delSt = [];
  $delCt = [];
  foreach ($list as $r) {
    $sk = $r['subkind'];
    $payload = is_array($r['payload'] ?? null) ? $r['payload'] : [];
    $id = isset($payload['id']) && is_string($payload['id']) ? trim($payload['id']) : '';
    if ($id === '') {
      continue;
    }
    if ($r['type'] === 'waza_accessorio_delete') {
      if ($sk === 'condizione') {
        unset($cond[$id]);
        $delCond[$id] = true;
      } elseif ($sk === 'status') {
        unset($st[$id]);
        $delSt[$id] = true;
      } elseif ($sk === 'counter') {
        unset($ct[$id]);
        $delCt[$id] = true;
      }
      continue;
    }
    $label = isset($payload['label']) && is_string($payload['label']) ? trim($payload['label']) : '';
    $lab = $label !== '' ? $label : $id;
    if ($sk === 'condizione') {
      $cond[$id] = $lab;
      unset($delCond[$id]);
    } elseif ($sk === 'status') {
      $st[$id] = $lab;
      unset($delSt[$id]);
    } elseif ($sk === 'counter') {
      $ct[$id] = $lab;
      unset($delCt[$id]);
    }
  }
  $toArr = static function (array $m): array {
    $o = [];
    foreach ($m as $id => $label) {
      $o[] = ['id' => $id, 'label' => $label];
    }
    return $o;
  };
  $idList = static function (array $set): array {
    return array_values(array_keys($set));
  };
  return [
    'condizioni' => $toArr($cond),
    'status' => $toArr($st),
    'counter' => $toArr($ct),
    'deletedCondizioneIds' => $idList($delCond),
    'deletedStatusIds' => $idList($delSt),
    'deletedCounterIds' => $idList($delCt),
    'sourceRows' => count($list),
  ];
}

function oat_waza_pool_extract_id_from_entry(string $entry): ?string {
  if (preg_match("/id:\\s*['\"]([^'\"]+)['\"]/", $entry, $m)) {
    return trim($m[1]);
  }
  return null;
}

/**
 * Overlay Waza da contributi pool=waza (stesso schema adottabile dal client con WAZA_POOL statico).
 *
 * @param array<int, mixed> $rows
 * @return array{hasOverlay: bool, replacements: list<array{id: string, entry: string}>, removedIds: list<string>}
 */
function oat_latest_waza_pool_overlays(array $rows): array {
  $list = array_values(array_filter($rows, 'is_array'));
  usort($list, static function ($a, $b) {
    return strcmp((string) ($a['createdAt'] ?? ''), (string) ($b['createdAt'] ?? ''));
  });
  $map = [];
  $removed = [];
  foreach ($list as $r) {
    if (($r['pool'] ?? '') !== 'waza') {
      continue;
    }
    $t = $r['type'] ?? '';
    $payload = is_array($r['payload'] ?? null) ? $r['payload'] : [];
    if ($t === 'pool_entry_delete') {
      $rid = isset($payload['removeId']) && is_string($payload['removeId']) ? trim($payload['removeId']) : '';
      if ($rid !== '') {
        unset($map[$rid]);
        $removed[$rid] = true;
      }
      continue;
    }
    if ($t === 'pool_entry_replace') {
      $rid = isset($payload['replaceId']) && is_string($payload['replaceId']) ? trim($payload['replaceId']) : '';
      $entry = isset($payload['entry']) && is_string($payload['entry']) ? $payload['entry'] : '';
      if ($rid !== '' && $entry !== '') {
        $map[$rid] = $entry;
        unset($removed[$rid]);
      }
      continue;
    }
    if ($t === 'pool_entry') {
      $entry = isset($payload['entry']) && is_string($payload['entry']) ? $payload['entry'] : '';
      $eid = oat_waza_pool_extract_id_from_entry($entry);
      if ($eid !== null && $entry !== '') {
        $map[$eid] = $entry;
        unset($removed[$eid]);
      }
    }
  }
  $replacements = [];
  foreach ($map as $id => $entry) {
    $replacements[] = ['id' => $id, 'entry' => $entry];
  }
  $has = count($replacements) > 0 || count($removed) > 0;
  return [
    'hasOverlay' => $has,
    'replacements' => $replacements,
    'removedIds' => array_values(array_keys($removed)),
  ];
}

function oat_latest_skiru_pool(array $rows): array {
  $list = oat_sort_by_created_at(array_values(array_filter($rows, 'is_array')));
  for ($i = count($list) - 1; $i >= 0; $i--) {
    $r = $list[$i];
    if (($r['type'] ?? '') !== 'skiru_pool_snapshot' || !is_array($r['payload'] ?? null)) {
      continue;
    }
    $e = $r['payload']['entries'] ?? null;
    if (is_array($e) && count($e) > 0) {
      return [
        'hasSnapshot' => true,
        'entries' => $e,
        'contributionId' => isset($r['id']) ? (string) $r['id'] : null,
        'createdAt' => isset($r['createdAt']) ? (string) $r['createdAt'] : null,
      ];
    }
  }
  return ['hasSnapshot' => false];
}

function oat_latest_skiru_categories(array $rows): array {
  $list = oat_sort_by_created_at(array_values(array_filter($rows, 'is_array')));
  for ($i = count($list) - 1; $i >= 0; $i--) {
    $r = $list[$i];
    if (($r['type'] ?? '') !== 'skiru_categories_snapshot' || !is_array($r['payload'] ?? null)) {
      continue;
    }
    $p = $r['payload'];
    $order = $p['order'] ?? null;
    $labels = $p['labels'] ?? null;
    if (!is_array($order) || count($order) === 0 || !is_array($labels)) {
      continue;
    }
    $lab = [];
    foreach ($labels as $k => $v) {
      if (is_string($v)) {
        $lab[(string) $k] = $v;
      }
    }
    $ord = [];
    foreach ($order as $x) {
      if (is_string($x)) {
        $ord[] = $x;
      }
    }
    if (count($ord) > 0) {
      return [
        'hasSnapshot' => true,
        'order' => $ord,
        'labels' => $lab,
        'contributionId' => isset($r['id']) ? (string) $r['id'] : null,
        'createdAt' => isset($r['createdAt']) ? (string) $r['createdAt'] : null,
      ];
    }
  }
  return ['hasSnapshot' => false];
}

function oat_extract_id_pool_entry(string $entry): ?string {
  if (preg_match('/id:\s*[\'"]([^\'"]+)[\'"]/', $entry, $m)) {
    return $m[1];
  }
  return null;
}

function oat_extract_name_pool_entry(string $entry): ?string {
  if (preg_match('/name:\s*[\'"]([^\'"]*)[\'"]/', $entry, $m)) {
    return $m[1];
  }
  return null;
}

function oat_summarize_contribution(array $r): array {
  $type = $r['type'] ?? null;
  $payload = is_array($r['payload'] ?? null) ? $r['payload'] : null;
  $entityId = null;
  $title = null;
  if ($type === 'pool_entry' || $type === 'pool_entry_replace') {
    $entry = is_string($payload['entry'] ?? null) ? $payload['entry'] : '';
    $entityId = oat_extract_id_pool_entry($entry);
    $title = oat_extract_name_pool_entry($entry);
  } elseif ($type === 'pool_entry_delete') {
    $entityId = isset($payload['removeId']) && is_string($payload['removeId']) ? trim($payload['removeId']) : null;
    $title = 'Remove pool entry';
  } elseif ($type === 'waza_accessorio') {
    $entityId = isset($payload['id']) && is_string($payload['id']) ? $payload['id'] : null;
    $title = isset($payload['label']) && is_string($payload['label']) ? $payload['label'] : null;
  } elseif ($type === 'waza_accessorio_delete') {
    $entityId = isset($payload['id']) && is_string($payload['id']) ? $payload['id'] : null;
    $title = 'Remove accessorio';
  } elseif ($type === 'skiru_pool_snapshot') {
    $entries = $payload['entries'] ?? null;
    if (is_array($entries)) {
      $title = count($entries) . ' voci Skiru';
      $first = $entries[0] ?? null;
      $entityId = is_array($first) && isset($first['id']) && is_string($first['id']) ? $first['id'] : 'pool';
    }
  } elseif ($type === 'skiru_categories_snapshot') {
    $title = 'Categorie Skiru';
    $entityId = 'taxonomy';
  } elseif ($type === 'file_snapshot') {
    $p = isset($payload['path']) && is_string($payload['path']) ? $payload['path'] : '';
    $entityId = $p !== '' ? $p : null;
    $title = $p !== '' ? (basename($p) ?: $p) : null;
  }
  return [
    'id' => $r['id'] ?? null,
    'createdAt' => $r['createdAt'] ?? null,
    'type' => $type,
    'pool' => $r['pool'] ?? null,
    'subkind' => $r['subkind'] ?? null,
    'author' => $r['author'] ?? null,
    'entityId' => $entityId,
    'title' => $title,
  ];
}

/**
 * Mappa id → testo entry pool (waza/madosho/patti) dopo aver applicato le righe [0, stopBeforeIndex).
 *
 * @param array<int, mixed> $sortedAsc
 * @return array<string, string>
 */
function oat_pool_text_map_up_to_index(array $sortedAsc, string $poolKind, int $stopBeforeIndex): array {
  $map = [];
  $n = min(max(0, $stopBeforeIndex), count($sortedAsc));
  for ($i = 0; $i < $n; $i++) {
    $r = $sortedAsc[$i];
    if (!is_array($r) || ($r['pool'] ?? '') !== $poolKind) {
      continue;
    }
    $t = $r['type'] ?? '';
    $payload = is_array($r['payload'] ?? null) ? $r['payload'] : [];
    if ($t === 'pool_entry_delete') {
      $rid = isset($payload['removeId']) && is_string($payload['removeId']) ? trim($payload['removeId']) : '';
      if ($rid !== '') {
        unset($map[$rid]);
      }
      continue;
    }
    if ($t === 'pool_entry_replace') {
      $rid = isset($payload['replaceId']) && is_string($payload['replaceId']) ? trim($payload['replaceId']) : '';
      $entry = isset($payload['entry']) && is_string($payload['entry']) ? $payload['entry'] : '';
      if ($rid !== '' && $entry !== '') {
        $map[$rid] = $entry;
      }
      continue;
    }
    if ($t === 'pool_entry') {
      $entry = isset($payload['entry']) && is_string($payload['entry']) ? $payload['entry'] : '';
      $eid = oat_extract_id_pool_entry($entry);
      if ($eid !== null && $entry !== '') {
        $map[$eid] = $entry;
      }
    }
  }
  return $map;
}

/**
 * Log audit per registro modifiche (finestra mobile ultime N ore).
 *
 * @param array<int, mixed> $rows
 * @return array{windowHours: int, generatedAt: string, count: int, entries: list<array<string, mixed>>}
 */
function oat_build_audit_log(array $rows, int $hoursWindow): array {
  $hoursWindow = max(1, min(24 * 90, $hoursWindow));
  $list = array_values(array_filter($rows, 'is_array'));
  usort($list, static function ($a, $b) {
    return strcmp((string) ($a['createdAt'] ?? ''), (string) ($b['createdAt'] ?? ''));
  });
  $cutoff = time() - $hoursWindow * 3600;
  $poolKinds = ['waza', 'madosho', 'patti'];
  $out = [];
  foreach ($list as $idx => $r) {
    $created = $r['createdAt'] ?? '';
    $ts = is_string($created) ? strtotime($created) : false;
    if ($ts === false || $ts < $cutoff) {
      continue;
    }
    $type = (string) ($r['type'] ?? '');
    $payload = is_array($r['payload'] ?? null) ? $r['payload'] : [];
    $pool = isset($r['pool']) && is_string($r['pool']) ? $r['pool'] : '';
    $author = isset($r['author']) && is_string($r['author']) && trim($r['author']) !== ''
      ? trim($r['author'])
      : '—';
    $azione = 'altro';
    $riepilogo = $type;
    $blocco = '';

    if ($type === 'pool_entry') {
      $azione = 'aggiunta';
      $entry = isset($payload['entry']) && is_string($payload['entry']) ? $payload['entry'] : '';
      $eid = oat_extract_id_pool_entry($entry);
      $name = oat_extract_name_pool_entry($entry);
      $poolLabel = $pool !== '' ? $pool : '?';
      $riepilogo = 'Aggiunta pool «' . $poolLabel . '»' . ($eid !== null ? ': ' . $eid : '');
      if ($name !== null && $name !== '') {
        $riepilogo .= ' — ' . $name;
      }
      $blocco = $entry;
    } elseif ($type === 'pool_entry_replace') {
      $azione = 'modifica';
      $rid = isset($payload['replaceId']) && is_string($payload['replaceId']) ? trim($payload['replaceId']) : '';
      $entry = isset($payload['entry']) && is_string($payload['entry']) ? $payload['entry'] : '';
      $poolLabel = $pool !== '' ? $pool : '?';
      $riepilogo = 'Modifica pool «' . $poolLabel . '» id «' . $rid . '»';
      $blocco = $entry;
    } elseif ($type === 'pool_entry_delete') {
      $azione = 'rimozione';
      $rid = isset($payload['removeId']) && is_string($payload['removeId']) ? trim($payload['removeId']) : '';
      $poolLabel = $pool !== '' ? $pool : '?';
      $riepilogo = 'Rimozione pool «' . $poolLabel . '» id «' . $rid . '»';
      $rec = null;
      if ($pool !== '' && in_array($pool, $poolKinds, true)) {
        $map = oat_pool_text_map_up_to_index($list, $pool, $idx);
        $rec = $map[$rid] ?? null;
      }
      if ($rec !== null && $rec !== '') {
        $blocco = $rec;
      } else {
        $blocco = json_encode(
          [
            'removeId' => $rid,
            'nota' => 'Nessun blocco precedente ricostruibile dal log (id mai inserito o già rimosso prima).',
          ],
          JSON_UNESCAPED_UNICODE,
        );
      }
    } elseif ($type === 'waza_accessorio') {
      $azione = 'aggiunta';
      $sk = isset($r['subkind']) && is_string($r['subkind']) ? $r['subkind'] : '';
      $pid = isset($payload['id']) && is_string($payload['id']) ? $payload['id'] : '';
      $lab = isset($payload['label']) && is_string($payload['label']) ? $payload['label'] : '';
      $riepilogo = 'Accessorio Waza (' . $sk . '): «' . $pid . '» — ' . $lab;
      $blocco = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    } elseif ($type === 'waza_accessorio_delete') {
      $azione = 'rimozione';
      $sk = isset($r['subkind']) && is_string($r['subkind']) ? $r['subkind'] : '';
      $pid = isset($payload['id']) && is_string($payload['id']) ? $payload['id'] : '';
      $riepilogo = 'Rimozione accessorio (' . $sk . '): «' . $pid . '»';
      $blocco = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    } elseif ($type === 'skiru_pool_snapshot') {
      $azione = 'snapshot';
      $riepilogo = 'Snapshot completo Skiru';
      $c = $payload['content'] ?? null;
      $blocco = is_string($c) ? $c : json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    } elseif ($type === 'skiru_categories_snapshot') {
      $azione = 'snapshot';
      $riepilogo = 'Snapshot categorie Skiru';
      $blocco = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    } elseif ($type === 'file_snapshot') {
      $azione = 'modifica';
      $p = isset($payload['path']) && is_string($payload['path']) ? $payload['path'] : '';
      $riepilogo = 'Snapshot file: ' . $p;
      $c = $payload['content'] ?? null;
      $blocco = is_string($c) ? $c : json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    } else {
      $riepilogo = 'Contributo: ' . $type;
      $blocco = json_encode($r, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    $out[] = [
      'contributionId' => $r['id'] ?? null,
      'createdAt' => $created,
      'utente' => $author,
      'azione' => $azione,
      'tipoTecnico' => $type,
      'riepilogo' => $riepilogo,
      'blocco' => $blocco,
    ];
  }
  return [
    'windowHours' => $hoursWindow,
    'generatedAt' => gmdate('c'),
    'count' => count($out),
    'entries' => array_reverse($out),
  ];
}
