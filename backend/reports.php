<?php
// =============================================
// reports.php - Reports
// Backend by: [Your Name]
// =============================================

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

$action = $_POST['action'] ?? $_GET['action'] ?? '';

// =============================================
// FACULTY LOADING REPORT
// Shows how many units each faculty is handling
// =============================================
if ($action === 'faculty_loading') {
  $sql = "SELECT u.id, u.name, u.max_units,
          COUNT(s.id) as total_schedules,
          COALESCE(SUM(sub.units), 0) as total_units
          FROM users u
          LEFT JOIN schedules s   ON s.faculty_id  = u.id
          LEFT JOIN subjects sub  ON sub.id = s.subject_id
          WHERE u.role = 'faculty' AND u.status = 'active'
          GROUP BY u.id
          ORDER BY total_units DESC";

  $result  = $conn->query($sql);
  $loading = [];

  while ($row = $result->fetch_assoc()) {
    $row['remaining_units'] = $row['max_units'] - $row['total_units'];
    $row['status']          = $row['total_units'] > $row['max_units'] ? 'overloaded' : 'normal';
    $loading[]              = $row;
  }

  echo json_encode(['success' => true, 'data' => $loading]);
  exit;
}

// =============================================
// ROOM USAGE REPORT
// Shows which rooms are being used and how much
// =============================================
if ($action === 'room_usage') {
  $sql = "SELECT r.*,
          COUNT(s.id) as total_schedules
          FROM rooms r
          LEFT JOIN schedules s ON s.room_id = r.id
          GROUP BY r.id
          ORDER BY total_schedules DESC";

  $result = $conn->query($sql);
  $rooms  = [];

  while ($row = $result->fetch_assoc()) {
    $rooms[] = $row;
  }

  echo json_encode(['success' => true, 'data' => $rooms]);
  exit;
}

// =============================================
// MASTER SCHEDULE REPORT
// Shows all schedules in one view
// =============================================
if ($action === 'master_schedule') {
  $sql = "SELECT s.*,
          sub.code as subject_code, sub.title as subject_title, sub.units,
          u.name as faculty_name,
          r.number as room_number
          FROM schedules s
          JOIN subjects sub ON sub.id = s.subject_id
          JOIN users u      ON u.id   = s.faculty_id
          JOIN rooms r      ON r.id   = s.room_id
          ORDER BY FIELD(s.day,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'), s.start_time";

  $result    = $conn->query($sql);
  $schedules = [];

  while ($row = $result->fetch_assoc()) {
    $schedules[] = $row;
  }

  echo json_encode(['success' => true, 'data' => $schedules]);
  exit;
}

// =============================================
// CONFLICT REPORT
// Same conflict detection as schedules.php
// =============================================
if ($action === 'conflict_report') {
  $sql = "SELECT s.*,
          u.name as faculty_name,
          r.number as room_number,
          sub.title as subject_title
          FROM schedules s
          JOIN users u    ON u.id   = s.faculty_id
          JOIN rooms r    ON r.id   = s.room_id
          JOIN subjects sub ON sub.id = s.subject_id";

  $result    = $conn->query($sql);
  $schedules = [];
  while ($row = $result->fetch_assoc()) {
    $schedules[] = $row;
  }

  $conflicts = [];
  $count     = count($schedules);

  for ($i = 0; $i < $count; $i++) {
    for ($j = $i + 1; $j < $count; $j++) {
      $s1      = $schedules[$i];
      $s2      = $schedules[$j];
      if ($s1['day'] !== $s2['day']) continue;

      $overlap = $s1['start_time'] < $s2['end_time'] && $s1['end_time'] > $s2['start_time'];
      if (!$overlap) continue;

      if ($s1['faculty_id'] == $s2['faculty_id']) {
        $conflicts[] = ['type' => 'Faculty Conflict', 'detail' => $s1['faculty_name'] . ' is double-scheduled', 's1' => $s1, 's2' => $s2];
      }
      if ($s1['room_id'] == $s2['room_id']) {
        $conflicts[] = ['type' => 'Room Conflict', 'detail' => $s1['room_number'] . ' is double-booked', 's1' => $s1, 's2' => $s2];
      }
      if ($s1['section'] == $s2['section']) {
        $conflicts[] = ['type' => 'Section Conflict', 'detail' => 'Section ' . $s1['section'] . ' has overlapping classes', 's1' => $s1, 's2' => $s2];
      }
    }
  }

  echo json_encode(['success' => true, 'conflicts' => $conflicts]);
  exit;
}

// If no valid action
echo json_encode(['success' => false, 'message' => 'Invalid action.']);
?>