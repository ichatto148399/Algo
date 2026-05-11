<?php
// =============================================
// users.php - User Management
// Backend by: [Your Name]
// =============================================

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

$action = $_POST['action'] ?? $_GET['action'] ?? '';

// =============================================
// GET ALL USERS
// =============================================
if ($action === 'get_all') {
  $result = $conn->query("SELECT id, username, role, name, email, department, status, max_units FROM users");
  $users  = [];

  while ($row = $result->fetch_assoc()) {
    $users[] = $row;
  }

  echo json_encode(['success' => true, 'data' => $users]);
  exit;
}

// =============================================
// ADD USER
// =============================================
if ($action === 'add') {
  $username   = $_POST['username']   ?? '';
  $password   = $_POST['password']   ?? '';
  $role       = $_POST['role']       ?? 'faculty';
  $name       = $_POST['name']       ?? '';
  $email      = $_POST['email']      ?? '';
  $department = $_POST['department'] ?? '';
  $max_units  = $_POST['max_units']  ?? 21;

  // Basic validation
  if (empty($username) || empty($password) || empty($name)) {
    echo json_encode(['success' => false, 'message' => 'Username, password and name are required.']);
    exit;
  }

  // Check if username already exists
  $check = $conn->prepare("SELECT id FROM users WHERE username = ?");
  $check->bind_param('s', $username);
  $check->execute();
  $check->store_result();

  if ($check->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Username already exists.']);
    $check->close();
    exit;
  }
  $check->close();

  // Save new user
  $stmt = $conn->prepare(
    "INSERT INTO users (username, password, role, name, email, department, status, max_units)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?)"
  );
  $stmt->bind_param('ssssssi', $username, $password, $role, $name, $email, $department, $max_units);

  if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'User added successfully.', 'id' => $conn->insert_id]);
  } else {
    echo json_encode(['success' => false, 'message' => 'Failed to add user.']);
  }

  $stmt->close();
  exit;
}

// =============================================
// EDIT USER
// =============================================
if ($action === 'edit') {
  $id         = $_POST['id']         ?? 0;
  $name       = $_POST['name']       ?? '';
  $email      = $_POST['email']      ?? '';
  $department = $_POST['department'] ?? '';
  $role       = $_POST['role']       ?? 'faculty';
  $max_units  = $_POST['max_units']  ?? 21;
  $password   = $_POST['password']   ?? '';

  if (empty($id) || empty($name)) {
    echo json_encode(['success' => false, 'message' => 'ID and name are required.']);
    exit;
  }

  // Update with password if provided, without if not
  if (!empty($password)) {
    $stmt = $conn->prepare(
      "UPDATE users SET name = ?, email = ?, department = ?, role = ?, max_units = ?, password = ? WHERE id = ?"
    );
    $stmt->bind_param('sssssii', $name, $email, $department, $role, $max_units, $password, $id);
  } else {
    $stmt = $conn->prepare(
      "UPDATE users SET name = ?, email = ?, department = ?, role = ?, max_units = ? WHERE id = ?"
    );
    $stmt->bind_param('ssssii', $name, $email, $department, $role, $max_units, $id);
  }

  if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'User updated successfully.']);
  } else {
    echo json_encode(['success' => false, 'message' => 'Failed to update user.']);
  }

  $stmt->close();
  exit;
}

// =============================================
// TOGGLE STATUS (active / inactive)
// =============================================
if ($action === 'toggle_status') {
  $id = $_POST['id'] ?? 0;

  // Get current status
  $stmt = $conn->prepare("SELECT status FROM users WHERE id = ?");
  $stmt->bind_param('i', $id);
  $stmt->execute();
  $result = $stmt->get_result();
  $user   = $result->fetch_assoc();
  $stmt->close();

  if (!$user) {
    echo json_encode(['success' => false, 'message' => 'User not found.']);
    exit;
  }

  // Flip the status
  $new_status = $user['status'] === 'active' ? 'inactive' : 'active';

  $stmt = $conn->prepare("UPDATE users SET status = ? WHERE id = ?");
  $stmt->bind_param('si', $new_status, $id);

  if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Status updated.', 'new_status' => $new_status]);
  } else {
    echo json_encode(['success' => false, 'message' => 'Failed to update status.']);
  }

  $stmt->close();
  exit;
}

// =============================================
// DELETE USER
// =============================================
if ($action === 'delete') {
  $id = $_POST['id'] ?? 0;

  // Don't allow deleting admin
  $check = $conn->prepare("SELECT role FROM users WHERE id = ?");
  $check->bind_param('i', $id);
  $check->execute();
  $result = $check->get_result();
  $user   = $result->fetch_assoc();
  $check->close();

  if ($user && $user['role'] === 'admin') {
    echo json_encode(['success' => false, 'message' => 'Cannot delete admin account.']);
    exit;
  }

  $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
  $stmt->bind_param('i', $id);

  if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'User deleted.']);
  } else {
    echo json_encode(['success' => false, 'message' => 'Failed to delete user.']);
  }

  $stmt->close();
  exit;
}

// If no valid action
echo json_encode(['success' => false, 'message' => 'Invalid action.']);
?>