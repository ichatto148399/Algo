<?php
// =============================================
// rooms.php - Room Management
// Backend by: [Your Name]
// =============================================

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

$action = $_POST['action'] ?? $_GET['action'] ?? '';

// =============================================
// GET ALL ROOMS
// =============================================
if ($action === 'get_all') {
  // Also count how many schedules are using each room
  $sql = "SELECT r.*,
          COUNT(s.id) as times_used
          FROM rooms r
          LEFT JOIN schedules s ON s.room_id = r.id
          GROUP BY r.id
          ORDER BY r.number";

  $result = $conn->query($sql);
  $rooms  = [];

  while ($row = $result->fetch_assoc()) {
    $rooms[] = $row;
  }

  echo json_encode(['success' => true, 'data' => $rooms]);
  exit;
}

// =============================================
// ADD ROOM
// =============================================
if ($action === 'add') {
  $number     = $_POST['number']     ?? '';
  $building   = $_POST['building']   ?? '';
  $type       = $_POST['type']       ?? 'Lecture';
  $capacity   = $_POST['capacity']   ?? 40;
  $status     = $_POST['status']     ?? 'available';
  $facilities = $_POST['facilities'] ?? '';

  // Normalize status to DB-valid values
  if (!in_array($status, ['available', 'unavailable'])) $status = 'available';

  if (empty($number)) {
    echo json_encode(['success' => false, 'message' => 'Room number is required.']);
    exit;
  }

  // Check if room number already exists
  $check = $conn->prepare("SELECT id FROM rooms WHERE number = ?");
  $check->bind_param('s', $number);
  $check->execute();
  $check->store_result();

  if ($check->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Room number already exists.']);
    $check->close();
    exit;
  }
  $check->close();

  // Check if building/facilities columns exist (added via migration)
  $cols = $conn->query("SHOW COLUMNS FROM rooms LIKE 'building'")->num_rows > 0;
  if ($cols) {
    $stmt = $conn->prepare("INSERT INTO rooms (number, building, type, capacity, status, facilities) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('sssiss', $number, $building, $type, $capacity, $status, $facilities);
  } else {
    $stmt = $conn->prepare("INSERT INTO rooms (number, type, capacity, status) VALUES (?, ?, ?, ?)");
    $stmt->bind_param('ssis', $number, $type, $capacity, $status);
  }

  if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Room added successfully.', 'id' => $conn->insert_id]);
  } else {
    echo json_encode(['success' => false, 'message' => 'Failed to add room.']);
  }

  $stmt->close();
  exit;
}

// =============================================
// EDIT ROOM
// =============================================
if ($action === 'edit') {
  $id         = $_POST['id']         ?? 0;
  $number     = $_POST['number']     ?? '';
  $building   = $_POST['building']   ?? '';
  $type       = $_POST['type']       ?? 'Lecture';
  $capacity   = $_POST['capacity']   ?? 40;
  $status     = $_POST['status']     ?? 'available';
  $facilities = $_POST['facilities'] ?? '';

  // Normalize status to DB-valid values
  if (!in_array($status, ['available', 'unavailable'])) $status = 'available';

  if (empty($id) || empty($number)) {
    echo json_encode(['success' => false, 'message' => 'ID and room number are required.']);
    exit;
  }

  // Check if building/facilities columns exist (added via migration)
  $cols = $conn->query("SHOW COLUMNS FROM rooms LIKE 'building'")->num_rows > 0;
  if ($cols) {
    $stmt = $conn->prepare("UPDATE rooms SET number = ?, building = ?, type = ?, capacity = ?, status = ?, facilities = ? WHERE id = ?");
    $stmt->bind_param('sssissi', $number, $building, $type, $capacity, $status, $facilities, $id);
  } else {
    $stmt = $conn->prepare("UPDATE rooms SET number = ?, type = ?, capacity = ?, status = ? WHERE id = ?");
    $stmt->bind_param('ssisi', $number, $type, $capacity, $status, $id);
  }

  if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Room updated successfully.']);
  } else {
    echo json_encode(['success' => false, 'message' => 'Failed to update room.']);
  }

  $stmt->close();
  exit;
}

// =============================================
// DELETE ROOM
// =============================================
if ($action === 'delete') {
  $id = $_POST['id'] ?? 0;

  // Check if room is currently used in any schedule
  $check = $conn->prepare("SELECT COUNT(*) as total FROM schedules WHERE room_id = ?");
  $check->bind_param('i', $id);
  $check->execute();
  $result = $check->get_result();
  $row    = $result->fetch_assoc();
  $check->close();

  if ($row['total'] > 0) {
    echo json_encode(['success' => false, 'message' => 'Cannot delete room. It is used in ' . $row['total'] . ' schedule(s).']);
    exit;
  }

  $stmt = $conn->prepare("DELETE FROM rooms WHERE id = ?");
  $stmt->bind_param('i', $id);

  if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Room deleted.']);
  } else {
    echo json_encode(['success' => false, 'message' => 'Failed to delete room.']);
  }

  $stmt->close();
  exit;
}

// =============================================
// TOGGLE ROOM STATUS
// =============================================
if ($action === 'toggle_status') {
  $id = $_POST['id'] ?? 0;

  $check = $conn->prepare("SELECT status FROM rooms WHERE id = ?");
  $check->bind_param('i', $id);
  $check->execute();
  $result = $check->get_result();
  $room   = $result->fetch_assoc();
  $check->close();

  if (!$room) {
    echo json_encode(['success' => false, 'message' => 'Room not found.']);
    exit;
  }

  $new_status = $room['status'] === 'available' ? 'unavailable' : 'available';

  $stmt = $conn->prepare("UPDATE rooms SET status = ? WHERE id = ?");
  $stmt->bind_param('si', $new_status, $id);

  if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Room status updated.', 'new_status' => $new_status]);
  } else {
    echo json_encode(['success' => false, 'message' => 'Failed to update status.']);
  }

  $stmt->close();
  exit;
}

// If no valid action
echo json_encode(['success' => false, 'message' => 'Invalid action.']);
?>