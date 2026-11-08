<?php
// NovoPix contact form handler (own server, no third-party service). Sends a mail to contact@pepsafe.info.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function out($ok, $msg, $code = 200) { http_response_code($code); echo json_encode(['ok' => $ok, 'msg' => $msg]); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(false, 'method', 405);
if (trim((string)($_POST['website'] ?? '')) !== '') out(true, 'ok'); // honeypot: pretend success
$name = trim(preg_replace('/[\r\n]+/', ' ', (string)($_POST['name'] ?? '')));
$email = trim((string)($_POST['email'] ?? ''));
$msg = trim((string)($_POST['message'] ?? ''));
if (mb_strlen($name) < 2 || mb_strlen($name) > 80) out(false, 'name', 422);
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 120 || preg_match('/[\r\n]/', $email)) out(false, 'email', 422);
if (mb_strlen($msg) < 10 || mb_strlen($msg) > 4000) out(false, 'message', 422);
// rate limit: 5 per hour per IP, stored outside the web root when possible
$ip = preg_replace('/[^0-9a-f:.]/i', '', (string)($_SERVER['REMOTE_ADDR'] ?? 'x'));
$dir = dirname(__DIR__, 3) . '/kolejka'; if (!is_dir($dir)) $dir = sys_get_temp_dir();
$f = $dir . '/kontakt-' . md5($ip) . '.json'; $now = time(); $log = [];
if (is_file($f)) { $d = json_decode((string)file_get_contents($f), true); if (is_array($d)) $log = array_values(array_filter($d, function ($t) use ($now) { return $t > $now - 3600; })); }
if (count($log) >= 5) out(false, 'rate', 429);
$subj = '=?UTF-8?B?' . base64_encode('NovoPix contact: ' . $name) . '?=';
$head = "From: NovoPix <contact@pepsafe.info>\r\nReply-To: $name <$email>\r\nMessage-ID: <" . bin2hex(random_bytes(8)) . "@pepsafe.info>\r\nDate: " . date('r') . "\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n";
$body = "Name: $name\nEmail: $email\n\n$msg\n\n--\nSent from the NovoPix contact form.";
$sent = mail('contact@pepsafe.info', $subj, $body, $head);
if (!$sent) out(false, 'mail', 500);
$log[] = $now; @file_put_contents($f, json_encode($log), LOCK_EX);
out(true, 'ok');
