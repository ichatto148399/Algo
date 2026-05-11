<?php
// =============================================
// change_requests.php - Schedule Change Requests
// Backend by: [Your Name]
// =============================================

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

$action = $_POST['action'] ?? $_GET['action'] ?? '';

// =============================================
// GET ALL CHANGE REQUESTS
// =============================================
if ($action === 'get_all') {
  $sql = "SELECT cr.*,
          u.name as faculty_name,
          sub.code as subject_code, sub.title as subject_title,
          r.number as room_number,
          s.day, s.start_time, s.end_time, s.section
          FROM change_requests cr
          JOIN users u      ON u.id   = cr.faculty_id
          JOIN schedules s  ON s.id   = cr.schedule_id
          JOIN subjects sub ON sub.id = s.subject_id
          JOIN rooms r      ON r.id   = s.room_id
          ORDER BY cr.created_at DESC";

  $result   = $conn->query($sql);
  $requests = [];

  while ($row = $result->fetch_assoc()) {
    $requests[] = $row;
  }

  echo json_encode(['success' => true, 'data' => $requests]);
  exit;
}

// =============================================
// SUBMIT CHANGE REQUEST (Faculty)
// =============================================
if ($action === 'submit') {
  $faculty_id   = $_POST['faculty_id']   ?? 0;
  $schedule_id  = $_POST['schedule_id']  ?? 0;
  $reason       = $_POST['reason']       ?? '';
  $request_type = $_POST['request_type'] ?? 'Reschedule';
  $new_day      = $_POST['new_day']      ?? '';
  $new_time     = $_POST['new_time']     ?? '';
  $new_room_id  = $_POST['new_room_id']  ?? null;

  if (empty($faculty_id) || empty($schedule_id) || empty($reason)) {
    echo json_encode(['success' => false, 'message' => 'Faculty, schedule and reason are required.']);
    exit;
  }

  // Check if request_type column exists
  $hasType = $conn->query("SHOW COLUMNS FROM change_requests LIKE 'request_type'")->num_rows > 0;

  if ($hasType) {
    $stmt = $conn->prepare(
      "INSERT INTO change_requests (faculty_id, schedule_id, request_type, reason, new_day, new_time, new_room_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')"
    );
    $stmt->bind_param('iissssi', $faculty_id, $schedule_id, $request_type, $reason, $new_day, $new_time, $new_room_id);
  } else {
    $stmt = $conn->prepare(
      "INSERT INTO change_requests (faculty_id, schedule_id, reason, new_day, new_time, new_room_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')"
    );
    $stmt->bind_param('iisssi', $faculty_id, $schedule_id, $reason, $new_day, $new_time, $new_room_id);
  }

  if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Change request submitted.', 'id' => $conn->insert_id]);
  } else {
    echo json_encode(['success' => false, 'message' => 'Failed to submit request.']);
  }

  $stmt->close();
  exit;
}

// =============================================
// APPROVE CHANGE REQUEST (Admin/Registrar)
// =============================================
if ($action === 'approve') {
  $id = $_POST['id'] ?? 0;

  $stmt = $conn->prepare("UPDATE change_requests SET status = 'approved' WHERE id = ?");
  $stmt->bind_param('i', $id);

  if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Request approved.']);
  } else {
    echo json_encode(['success' => false, 'message' => 'Failed to approve request.']);
  }

  $stmt->close();
  exit;
}

// =============================================
// REJECT CHANGE REQUEST (Admin/Registrar)
// =============================================
if ($action === 'reject') {
  $id = $_POST['id'] ?? 0;

  $stmt = $conn->prepare("UPDATE change_requests SET status = 'rejected' WHERE id = ?");
  $stmt->bind_param('i', $id);

  if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Request rejected.']);
  } else {
    echo json_encode(['success' => false, 'message' => 'Failed to reject request.']);
  }

  $stmt->close();
  exit;
}

// =============================================
// DELETE CHANGE REQUEST
// =============================================
if ($action === 'delete') {
  $id = $_POST['id'] ?? 0;

  $stmt = $conn->prepare("DELETE FROM change_requests WHERE id = ?");
  $stmt->bind_param('i', $id);

  if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Request deleted.']);
  } else {
    echo json_encode(['success' => false, 'message' => 'Failed to delete request.']);
  }

  $stmt->close();
  exit;
}

// If no valid action
echo json_encode(['success' => false, 'message' => 'Invalid action.']);
?>