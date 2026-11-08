<?php
// NovoPix contact form handler (own server, no third-party service). Sends a mail to contact@pepsafe.info.
header('Content-Type: application/json; charset=utf-8');
$o = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($o, ['https://novopix.uk', 'https://www.novopix.uk', 'https://pepsafe.uk'], true)) { header('Access-Control-Allow-Origin: ' . $o); header('Vary: Origin'); header('Access-Control-Allow-Headers: Accept, Content-Type'); header('Access-Control-Allow-Methods: POST, OPTIONS'); }
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
header('Cache-Control: no-store');
function out($ok, $msg, $code = 200) { http_response_code($code); echo json_encode(['ok' => $ok, 'msg' => $msg]); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(false, 'method', 405);
if (trim((string)($_POST['website'] ?? '')) !== '') out(true, 'ok'); // honeypot: pretend success
$name = trim(preg_replace('/[\r\n]+/', ' ', (string)($_POST['name'] ?? '')));
$email = trim((string)($_POST['email'] ?? ''));
$msg = trim((string)($_POST['message'] ?? ''));
if (mb_strlen($name) < 2 || mb_strlen($name) > 80) out(false, 'name', 422);
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 120 || preg_match('/[\r\n]/', $email)) out(false, 'email', 422);
if (mb_strlen($msg) < 2 || mb_strlen($msg) > 4000) out(false, 'message', 422);
// rate limit: 5 per hour per IP, stored outside the web root when possible
$ip = preg_replace('/[^0-9a-f:.]/i', '', (string)($_SERVER['REMOTE_ADDR'] ?? 'x'));
$dir = dirname(__DIR__, 2) . '/kolejka'; if (!is_dir($dir)) $dir = sys_get_temp_dir();
$f = $dir . '/kontakt-' . md5($ip) . '.json'; $now = time(); $log = [];
if (is_file($f)) { $d = json_decode((string)file_get_contents($f), true); if (is_array($d)) $log = array_values(array_filter($d, function ($t) use ($now) { return $t > $now - 3600; })); }
if (count($log) >= 5) out(false, 'rate', 429);
$subj = '=?UTF-8?B?' . base64_encode('NovoPix contact: ' . $name) . '?=';
$head = "From: NovoPix <contact@pepsafe.info>\r\nReply-To: $name <$email>\r\nMessage-ID: <" . bin2hex(random_bytes(8)) . "@pepsafe.info>\r\nDate: " . date('r') . "\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n";
$body = "Name: $name\nEmail: $email\n\n$msg\n\n--\nSent from the NovoPix contact form.";
// envelope sender = our own address, so mail clients do not show the hosting's technical address
$sent = false; $via = 'mail'; $note = (is_file(dirname(__DIR__, 2) . '/kolejka/smtp.json') ? 'cfg-found' : 'cfg-missing');
// Preferred: SMTP through a real mailbox (config kept outside the web root: ../kolejka/smtp.json). Fallback: PHP mail().
$cfgf = dirname(__DIR__, 2) . '/kolejka/smtp.json';
if (is_file($cfgf) && is_file(__DIR__ . '/lib/PHPMailer.php')) {
  $c = json_decode((string)file_get_contents($cfgf), true);
  if (is_array($c) && !empty($c['host']) && !empty($c['user']) && !empty($c['pass'])) {
    require_once __DIR__ . '/lib/Exception.php'; require_once __DIR__ . '/lib/PHPMailer.php'; require_once __DIR__ . '/lib/SMTP.php';
    $hosts = array_values(array_unique(array_filter([trim((string)$c['host']), 'smtp.ionos.co.uk', 'smtp.ionos.com'])));
    $tries = [];
    foreach ($hosts as $h) { $tries[] = [$h, 587, 'tls']; $tries[] = [$h, 465, 'ssl']; }
    $tries = array_slice($tries, 0, 4); $errs = [];
    foreach ($tries as $t) {
      try {
        $m = new PHPMailer\PHPMailer\PHPMailer(true);
        $m->isSMTP(); $m->Host = $t[0]; $m->Port = $t[1]; $m->SMTPAuth = true; $m->Username = $c['user']; $m->Password = $c['pass'];
        $m->SMTPSecure = ($t[2] === 'ssl') ? PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS : PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        if (!empty($c['insecure_local'])) { $m->SMTPSecure = ''; $m->SMTPAutoTLS = false; }
        $m->CharSet = 'UTF-8'; $m->Timeout = 6;
        $from = $c['from'] ?? $c['user']; $m->setFrom($from, 'NovoPix'); $m->addAddress($c['to'] ?? 'contact@pepsafe.info');
        $m->addReplyTo($email, $name); $m->Subject = 'NovoPix contact: ' . $name; $m->Body = $body; $m->isHTML(false);
        $sent = $m->send(); if ($sent) { $via = 'smtp'; $note = 'smtp-ok ' . $t[0] . ':' . $t[1]; break; }
      } catch (Throwable $e) { $errs[] = $t[0] . ':' . $t[1] . ' ' . preg_replace('/[^A-Za-z0-9 .:,_\\/-]/', '', substr($e->getMessage(), 0, 60)); $sent = false; }
    }
    if (!$sent && $errs) $note = 'smtp-error: ' . implode(' | ', $errs);
  }
}
if (!$sent) $sent = @mail('contact@pepsafe.info', $subj, $body, $head);
if (!$sent) out(false, 'mail', 500);
$log[] = $now; @file_put_contents($f, json_encode($log), LOCK_EX);
header('X-Mail-Transport: ' . $via); header('X-Mail-Note: ' . $note); out(true, 'ok');
