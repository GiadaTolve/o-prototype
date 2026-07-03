<?php
/**
 * Catalogo automatico musica Oyasumi — carica in musicaoyasumi/ su Altervista.
 * URL: https://senmoyka.altervista.org/musicaoyasumi/catalog.php
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-store');

$allowed = ['mp3', 'wav', 'ogg', 'm4a'];
$files = [];

foreach (scandir(__DIR__) as $entry) {
    if ($entry === '.' || $entry === '..') {
        continue;
    }
    $path = __DIR__ . DIRECTORY_SEPARATOR . $entry;
    if (!is_file($path)) {
        continue;
    }
    $ext = strtolower(pathinfo($entry, PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed, true)) {
        continue;
    }
    $files[] = $entry;
}

sort($files, SORT_NATURAL | SORT_FLAG_CASE);

echo json_encode($files, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
