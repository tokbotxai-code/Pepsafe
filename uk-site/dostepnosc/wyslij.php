<?php
// Called by the scanner workflow (GitHub Actions) with a shared key stored on this server. Sends the report link to the person who asked.
header('Content-Type: text/plain; charset=utf-8');
$root = dirname(__DIR__, 2); $q = $root . '/kolejka'; $kf = $q . '/.key';
$key = is_file($kf) ? trim((string)file_get_contents($kf)) : '';
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || $key === '' || !hash_equals($key, (string)($_POST['key'] ?? ''))) { http_response_code(403); exit('no'); }
$id = preg_replace('/[^a-f0-9]/', '', (string)($_POST['id'] ?? ''));
$token = preg_replace('/[^a-f0-9]/', '', (string)($_POST['token'] ?? ''));
$ok = (($_POST['status'] ?? '') === 'ok');
$f = $q . '/' . $id . '.json';
if ($id === '' || !is_file($f)) { http_response_code(404); exit('nojob'); }
$job = json_decode((string)file_get_contents($f), true);
if (!is_array($job)) { http_response_code(500); exit('bad'); }
$pdf = __DIR__ . '/raporty/' . $token . '.pdf';
if ($ok && (!$token || !is_file($pdf))) { http_response_code(500); exit('nopdf'); }
$email = $job['email']; $url = $job['adres_strony'];
$head = "From: PepSafe Studio <contact@pepsafe.info>\r\nReply-To: contact@pepsafe.info\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n";
$subj = function ($t) { return '=?UTF-8?B?' . base64_encode($t) . '?='; };
if ($ok) {
  $body = "Dzień dobry,\n\nprzygotowaliśmy wstępny raport dostępności dla strony: $url\n\nRaport (PDF, link ważny 30 dni):\nhttps://pepsafe.uk/dostepnosc/raporty/$token.pdf\n\nTo wstępna kontrola automatyczna jednej strony. Znajduje tylko część problemów, więc nie jest certyfikatem zgodności ani porady prawnej.\n\nMasz pytania albo nie chcesz więcej wiadomości od nas? Odpisz na ten adres (contact@pepsafe.info). Zgodę możesz wycofać w każdej chwili. Polityka prywatności: https://pepsafe.uk/dostepnosc/polityka.html\n\nPepSafe Studio";
  $s = 'Twój raport dostępności strony';
} else {
  $body = "Dzień dobry,\n\nniestety nie udało nam się automatycznie sprawdzić strony: $url\n(strona mogła nie odpowiadać albo blokować automatyczne sprawdzanie). Napisz do nas na contact@pepsafe.info, a sprawdzimy ją ręcznie.\n\nPepSafe Studio";
  $s = 'Nie udało się sprawdzić Twojej strony';
}
$sent = mail($email, $subj($s), $body, $head);
@mail('contact@pepsafe.info', $subj('Skaner: ' . ($ok ? 'raport wysłany' : 'błąd skanu')), "Zlecenie $id: " . ($ok ? 'ok' : 'błąd') . "\nStrona: $url\nE-mail: $email\nWysłano: " . ($sent ? 'tak' : 'NIE') . "\n", $head);
if ($sent) { if (!is_dir($q . '/done')) @mkdir($q . '/done', 0750, true); @rename($f, $q . '/done/' . $id . '.json'); }
// retention: reports 30 days, processed jobs 12 months
foreach (glob(__DIR__ . '/raporty/*.pdf') ?: [] as $p) if (filemtime($p) < time() - 30 * 86400) @unlink($p);
foreach (glob($q . '/done/*.json') ?: [] as $p) if (filemtime($p) < time() - 365 * 86400) @unlink($p);
echo $sent ? 'ok' : 'mailfail';
