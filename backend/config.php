<?php
// =============================================
// config.php - Database Connection
// Backend by: [Your Name]
// =============================================

// Database settings
define('DB_HOST', 'localhost');
define('DB_USER', 'root');       // default XAMPP username
define('DB_PASS', '');           // default XAMPP password (empty)
define('DB_NAME', 'umsync');

// Connect to MySQL
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Check if connection failed
if ($conn->connect_error) {
  die(json_encode([
    'success' => false,
    'message' => 'Database connection failed: ' . $conn->connect_error
  ]));
}

// Set character encoding to UTF-8
$conn->set_charset('utf8');

// Start session so we can track who is logged in
if (session_status() === PHP_SESSION_NONE) {
  session_start();
}
?>