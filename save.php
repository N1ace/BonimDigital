<?php
/**
 * save.php — receives the portfolio contact form and appends each
 * submission to a protected file on the server. Upload this next to
 * index.html in your cPanel public_html folder.
 *
 * Submissions are stored in the private folder defined below, OUTSIDE
 * public_html when possible, so visitors can never open them in a browser.
 */

header('Content-Type: application/json; charset=utf-8');

// ---- config ------------------------------------------------------------
// Where to store submissions. Recommended: a folder ABOVE public_html.
// If you can't use ../ , set $storeDir to __DIR__ . '/contact-data' and
// rely on contact-data/.htaccess to block public access.
$parentDir = __DIR__ . '/../contact-data';    // e.g. /home/USER/contact-data
$localDir  = __DIR__ . '/contact-data';      // local dev & restricted hosts
$storeDir  = (is_dir($parentDir) && is_writable($parentDir)) ? $parentDir : $localDir;
$csvFile   = $storeDir . '/messages.csv';
$notifyTo  = 'andrewfwork0@gmail.com';        // set '' to disable email
$emailCopy = true;                            // also email you each message
// ------------------------------------------------------------------------

function fail($msg, $code = 400) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('Method not allowed', 405);
}

// Honeypot: real users never fill this hidden field.
if (!empty($_POST['website'])) {
    // Pretend success so bots don't retry.
    echo json_encode(['ok' => true]);
    exit;
}

// Collect + clean input
$name    = trim($_POST['name']    ?? '');
$email   = trim($_POST['email']   ?? '');
$message = trim($_POST['message'] ?? '');

if ($name === '' || $email === '' || $message === '') {
    fail('Please fill in name, email, and message.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail('Please enter a valid email address.');
}
if (mb_strlen($name) > 80 || mb_strlen($email) > 120 || mb_strlen($message) > 2000) {
    fail('One of the fields is too long.');
}

// Strip control chars / newlines from short fields
$name  = preg_replace('/[\r\n\t]+/', ' ', $name);
$email = preg_replace('/[\r\n\t]+/', ' ', $email);

// Ensure storage exists
if (!is_dir($storeDir)) {
    @mkdir($storeDir, 0700, true);
}
if (!is_dir($storeDir) || !is_writable($storeDir)) {
    fail('Server storage is not writable. Check folder permissions.', 500);
}

// Write header row once
$newFile = !file_exists($csvFile);
$fh = fopen($csvFile, 'a');
if (!$fh) {
    fail('Could not open storage file.', 500);
}
if (flock($fh, LOCK_EX)) {
    if ($newFile) {
        fputcsv($fh, ['datetime', 'name', 'email', 'message', 'ip']);
    }
    fputcsv($fh, [
        date('Y-m-d H:i:s'),
        $name,
        $email,
        $message,
        $_SERVER['REMOTE_ADDR'] ?? '',
    ]);
    fflush($fh);
    flock($fh, LOCK_UN);
}
fclose($fh);

// Optional email notification
if ($emailCopy && $notifyTo !== '') {
    $subject = 'New portfolio message from ' . $name;
    $body    = "Name: $name\nEmail: $email\n\nMessage:\n$message\n";
    $headers = 'From: website@' . ($_SERVER['SERVER_NAME'] ?? 'localhost') . "\r\n"
             . 'Reply-To: ' . $email . "\r\n"
             . 'Content-Type: text/plain; charset=utf-8';
    @mail($notifyTo, $subject, $body, $headers);
}

echo json_encode(['ok' => true]);
