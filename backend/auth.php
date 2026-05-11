<?php
// =============================================
// auth.php - Login and Logout
// Backend by: [Your Name]
// =============================================

require_once 'config.php';

// Tell browser we are sending JSON
header('Content-Type: application/json');

// Allow requests from the frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

// Get the action from the request
$action = $_POST['action'] ?? $_GET['action'] ?? '';

// ---- LOGIN ----
if ($action === 'login') {

  $username = $_POST['username'] ?? '';
  $password = $_POST['password'] ?? '';

  // Basic validation
  if (empty($username) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Please enter username and password.']);
    exit;
  }

  // Find user in database
  $stmt = $conn->prepare("SELECT * FROM users WHERE username = ? AND status = 'active'");
  $stmt->bind_param('s', $username);
  $stmt->execute();
  $result = $stmt->get_result();
  $user   = $result->fetch_assoc();

  // Check if user exists and password matches
  if ($user && $user['password'] === $password) {
    // Save user info in session
    $_SESSION['user_id']   = $user['id'];
    $_SESSION['username']  = $user['username'];
    $_SESSION['role']      = $user['role'];
    $_SESSION['name']      = $user['name'];

    echo json_encode([
      'success' => true,
      'user'    => [
        'id'         => $user['id'],
        'username'   => $user['username'],
        'role'       => $user['role'],
        'name'       => $user['name'],
        'email'      => $user['email'],
        'department' => $user['department'],
        'status'     => $user['status'],
        'max_units'  => $user['max_units'],
      ]
    ]);
  } else {
    echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
  }

  $stmt->close();
  exit;
}

// ---- LOGOUT ----
if ($action === 'logout') {
  session_destroy();
  echo json_encode(['success' => true, 'message' => 'Logged out.']);
  exit;
}

// ---- CHECK SESSION (who is logged in?) ----
if ($action === 'check') {
  if (isset($_SESSION['user_id'])) {
    echo json_encode([
      'success'   => true,
      'logged_in' => true,
      'user'      => [
        'id'       => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'role'     => $_SESSION['role'],
        'name'     => $_SESSION['name'],
      ]
    ]);
  } else {
    echo json_encode(['success' => true, 'logged_in' => false]);
  }
  exit;
}

// If no valid action
echo json_encode(['success' => false, 'message' => 'Invalid action.']);
?>