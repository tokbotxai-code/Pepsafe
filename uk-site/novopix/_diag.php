<?php
header('Content-Type: text/plain');
echo "php ", PHP_VERSION, "\nsendmail_path=", ini_get('sendmail_path'), "\nSMTP=", ini_get('SMTP'), "\nmail.add_x_header=", ini_get('mail.add_x_header'), "\ndisable_functions=", ini_get('disable_functions'), "\n";
$r = @mail('contact@pepsafe.info', 'diag', 'diag', "From: contact@pepsafe.info\r\n");
echo "mail() plain: ", var_export($r, true), "\n"; echo json_encode(error_get_last()), "\n";
$r = @mail('contact@pepsafe.info', 'diag2', 'diag2', "From: contact@pepsafe.info\r\n", '-fcontact@pepsafe.info');
echo "mail() with -f: ", var_export($r, true), "\n"; echo json_encode(error_get_last()), "\n";
$r = @mail('contact@pepsafe.info', 'diag3', 'diag3');
echo "mail() minimal: ", var_export($r, true), "\n"; echo json_encode(error_get_last()), "\n";
