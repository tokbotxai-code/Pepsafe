<?php header('Content-Type: text/plain');
$root = dirname(__DIR__, 2);
echo "dir=", __DIR__, "\nroot=", $root, "\nopen_basedir=", ini_get('open_basedir'), "\n";
$q = $root . '/kolejka';
echo "mkdir: ", (is_dir($q) || @mkdir($q, 0750, true)) ? "ok" : "FAIL", "\n";
echo "write: ", (@file_put_contents($q . '/_probe.txt', 'x') !== false) ? "ok" : "FAIL", "\n";
echo "listing root: ", implode(',', array_slice(scandir($root), 0, 12)), "\n";
@unlink($q . '/_probe.txt');
