<?php
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function out($ok, $code = 200) { http_response_code($code); echo json_encode(['ok' => $ok]); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(false, 405);
$raw = file_get_contents('php://input');
$in = json_decode($raw, true);
if (!is_array($in)) $in = $_POST;
if (!empty($in['_honey'])) out(true);                       // honeypot: pretend success
$clean = function ($v, $max) { $v = trim((string)$v); $v = preg_replace('/[\r\n\t]+/', ' ', $v); return mb_substr($v, 0, $max); };
$url   = $clean($in['adres_strony'] ?? '', 300);
$name  = $clean($in['placowka'] ?? '', 200);
$email = $clean($in['email'] ?? '', 200);
$zgoda = (($in['zgoda'] ?? '') === 'tak');
if (!$zgoda) out(false, 422);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) out(false, 422);
$p = parse_url($url);
if (!$p || empty($p['host']) || !in_array(strtolower($p['scheme'] ?? ''), ['http', 'https'], true) || strpos($p['host'], '.') === false) out(false, 422);
// simple rate limit: 6 submissions per IP per hour
$ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
$f = sys_get_temp_dir() . '/zglos_' . md5($ip) . '.txt';
$now = time(); $hits = [];
if (is_file($f)) foreach (explode(',', (string)file_get_contents($f)) as $t) if ($t !== '' && $now - (int)$t < 3600) $hits[] = (int)$t;
if (count($hits) >= 6) out(false, 429);
$hits[] = $now; @file_put_contents($f, implode(',', $hits));
// queue job for the automatic scanner (outside the public folder)
$root = dirname(__DIR__, 2); $q = $root . '/kolejka';
if (!is_dir($q)) @mkdir($q, 0750, true);
if (!is_file($q . '/.key')) { @file_put_contents($q . '/.key', bin2hex(random_bytes(24))); @chmod($q . '/.key', 0600); }
if (count(glob($q . '/*.json') ?: []) >= 20) out(false, 503);   // trial cap: at most 20 waiting jobs
$id = bin2hex(random_bytes(8));
@file_put_contents($q . '/' . $id . '.json', json_encode(['id' => $id, 'adres_strony' => $url, 'placowka' => $name, 'email' => $email, 'created' => gmdate('c')], JSON_UNESCAPED_UNICODE));
$to = 'contact@pepsafe.info';
$subject = '=?UTF-8?B?' . base64_encode('Darmowy skan dostępności: nowe zgłoszenie') . '?=';
$body = "Nowe zgłoszenie z pepsafe.uk/dostepnosc\n\nAdres strony: $url\nPlacówka: $name\nE-mail: $email\nZgoda na raport i informacje o usługach: tak\nData (UTC): " . gmdate('Y-m-d H:i:s') . "\nIP: $ip\n";
$headers = "From: PepSafe Studio <contact@pepsafe.info>\r\nReply-To: $email\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n";
$ok = mail($to, $subject, $body, $headers, '-fcontact@pepsafe.info');
out($ok, $ok ? 200 : 500);
