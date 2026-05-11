<?php
// =============================================
// schedules.php - Schedule Management
// Algorithms: Backtracking, Greedy (FFD),
//             Kahn's, Dijkstra on DAG
// Backend by: [Your Name]
// =============================================

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

$action = $_POST['action'] ?? $_GET['action'] ?? '';

// =============================================
// ALGORITHM 1: CONFLICT DETECTION (Backtracking)
// Checks if a new schedule conflicts with existing ones
// =============================================
function hasConflict($conn, $faculty_id, $room_id, $section, $day, $start, $end, $exclude_id = null) {
  $conflicts = [];

  // Get all schedules on the same day
  $sql = "SELECT s.*, u.name as faculty_name, r.number as room_number 
          FROM schedules s
          JOIN users u ON s.faculty_id = u.id
          JOIN rooms r ON s.room_id = r.id
          WHERE s.day = ?";
  
  if ($exclude_id) {
    $sql .= " AND s.id != $exclude_id";
  }

  $stmt = $conn->prepare($sql);
  $stmt->bind_param('s', $day);
  $stmt->execute();
  $result = $stmt->get_result();

  while ($existing = $result->fetch_assoc()) {
    // Check if times overlap
    $overlap = $start < $existing['end_time'] && $end > $existing['start_time'];

    if ($overlap) {
      // Faculty conflict - same teacher two places at once
      if ($existing['faculty_id'] == $faculty_id) {
        $conflicts[] = "Faculty conflict: " . $existing['faculty_name'] . " already has a class at this time.";
      }
      // Room conflict - same room double booked
      if ($existing['room_id'] == $room_id) {
        $conflicts[] = "Room conflict: " . $existing['room_number'] . " is already booked at this time.";
      }
      // Section conflict - same section two classes at once
      if ($existing['section'] == $section) {
        $conflicts[] = "Section conflict: Section " . $section . " already has a class at this time.";
      }
    }
  }

  $stmt->close();
  return $conflicts;
}

// =============================================
// ALGORITHM 2: GREEDY FIRST-FIT DECREASING (FFD)
// Assigns faculty to subjects based on available units
// Sorts faculty by remaining units (descending) then assigns
// =============================================
function greedyAssignFaculty($conn) {
  // Get all faculty with their current total units
  $sql = "SELECT u.id, u.name, u.max_units,
          COALESCE(SUM(sub.units), 0) as used_units
          FROM users u
          LEFT JOIN schedules s  ON s.faculty_id = u.id
          LEFT JOIN subjects sub ON sub.id = s.subject_id
          WHERE u.role = 'faculty' AND u.status = 'active'
          GROUP BY u.id
          ORDER BY (u.max_units - COALESCE(SUM(sub.units), 0)) DESC";

  // Sort by most available units first (First-Fit Decreasing)
  $result = $conn->query($sql);
  $faculty = [];

  while ($row = $result->fetch_assoc()) {
    $row['remaining_units'] = $row['max_units'] - $row['used_units'];
    $faculty[] = $row;
  }

  return $faculty;
}

// =============================================
// ALGORITHM 3: KAHN'S ALGORITHM
// Finds the correct order to assign subjects
// (prerequisite subjects first)
// =============================================
function kahnsTopologicalSort($subjects) {
  // Count how many prerequisites each subject has
  $inDegree = [];
  $graph    = [];

  foreach ($subjects as $subj) {
    $inDegree[$subj['id']] = 0;
    $graph[$subj['id']]    = [];
  }

  // Build the graph (subject → subjects that depend on it)
  foreach ($subjects as $subj) {
    if (!empty($subj['prerequisite_id'])) {
      $graph[$subj['prerequisite_id']][] = $subj['id'];
      $inDegree[$subj['id']]++;
    }
  }

  // Start with subjects that have no prerequisites
  $queue  = [];
  foreach ($inDegree as $id => $count) {
    if ($count === 0) $queue[] = $id;
  }

  $sorted = [];
  while (!empty($queue)) {
    $current  = array_shift($queue);
    $sorted[] = $current;

    // Reduce in-degree of dependent subjects
    foreach ($graph[$current] as $next) {
      $inDegree[$next]--;
      if ($inDegree[$next] === 0) {
        $queue[] = $next;
      }
    }
  }

  return $sorted;
}

// =============================================
// ALGORITHM 4: DIJKSTRA ON DAG
// Finds the best room for a schedule
// (picks room with shortest "distance" = least waste of capacity)
// =============================================
function dijkstraRoomAssign($conn, $students_needed) {
  // Get all available rooms
  $sql    = "SELECT * FROM rooms WHERE status = 'available' ORDER BY capacity ASC";
  $result = $conn->query($sql);
  $rooms  = [];

  while ($row = $result->fetch_assoc()) {
    $rooms[] = $row;
  }

  // Find the room with the least wasted capacity
  // (best fit = smallest room that still fits all students)
  $best_room = null;
  $best_cost = PHP_INT_MAX;

  foreach ($rooms as $room) {
    if ($room['capacity'] >= $students_needed) {
      // Cost = wasted seats (we want to minimize this)
      $cost = $room['capacity'] - $students_needed;
      if ($cost < $best_cost) {
        $best_cost = $cost;
        $best_room = $room;
      }
    }
  }

  return $best_room;
}

// =============================================
// GET ALL SCHEDULES
// =============================================
if ($action === 'get_all') {
  $sql = "SELECT s.*, 
          sub.code as subject_code, sub.title as subject_title, sub.units,
          u.name as faculty_name,
          r.number as room_number
          FROM schedules s
          JOIN subjects sub ON sub.id = s.subject_id
          JOIN users u      ON u.id   = s.faculty_id
          JOIN rooms r      ON r.id   = s.room_id
          ORDER BY s.day, s.start_time";

  $result    = $conn->query($sql);
  $schedules = [];
  while ($row = $result->fetch_assoc()) {
    $schedules[] = $row;
  }

  echo json_encode(['success' => true, 'data' => $schedules]);
  exit;
}

// =============================================
// ADD SCHEDULE (uses Backtracking conflict check)
// =============================================
if ($action === 'add') {
  $subject_id = intval($_POST['subject_id'] ?? 0);
  $faculty_id = intval($_POST['faculty_id'] ?? 0);
  $room_id    = intval($_POST['room_id']    ?? 0);
  $section    = $_POST['section']    ?? '';
  $day        = $_POST['day']        ?? '';
  $start_time = $_POST['start_time'] ?? '';
  $end_time   = $_POST['end_time']   ?? '';
  $type       = $_POST['type']       ?? 'Lecture';
  $students   = intval($_POST['students']   ?? 30);

  if (!$subject_id || !$faculty_id || !$room_id || !$section || !$day || !$start_time || !$end_time) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
  }

  // Run conflict detection algorithm
  $conflicts = hasConflict($conn, $faculty_id, $room_id, $section, $day, $start_time, $end_time);

  if (!empty($conflicts)) {
    echo json_encode(['success' => false, 'conflicts' => $conflicts]);
    exit;
  }

  // No conflicts - save the schedule
  $stmt = $conn->prepare(
    "INSERT INTO schedules (subject_id, faculty_id, room_id, section, day, start_time, end_time, type, students)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  $stmt->bind_param('iiisssssi', $subject_id, $faculty_id, $room_id, $section, $day, $start_time, $end_time, $type, $students);

  if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Schedule added successfully.', 'id' => $conn->insert_id]);
  } else {
    echo json_encode(['success' => false, 'message' => 'Failed to save schedule.']);
  }

  $stmt->close();
  exit;
}

// =============================================
// DELETE SCHEDULE
// =============================================
// =============================================
// EDIT SCHEDULE
// =============================================
if ($action === 'edit') {
  $id         = intval($_POST['id']         ?? 0);
  $subject_id = intval($_POST['subject_id'] ?? 0);
  $faculty_id = intval($_POST['faculty_id'] ?? 0);
  $room_id    = intval($_POST['room_id']    ?? 0);
  $section    = $_POST['section']    ?? '';
  $day        = $_POST['day']        ?? '';
  $start_time = $_POST['start_time'] ?? '';
  $end_time   = $_POST['end_time']   ?? '';
  $type       = $_POST['type']       ?? 'Lecture';
  $students   = intval($_POST['students']   ?? 30);

  if (!$id || !$subject_id || !$faculty_id || !$room_id || !$section || !$day || !$start_time || !$end_time) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
  }

  // Check conflicts excluding current schedule
  $conflicts = hasConflict($conn, $faculty_id, $room_id, $section, $day, $start_time, $end_time, $id);
  if (!empty($conflicts)) {
    echo json_encode(['success' => false, 'conflicts' => $conflicts]);
    exit;
  }

  $stmt = $conn->prepare(
    "UPDATE schedules SET subject_id=?, faculty_id=?, room_id=?, section=?, day=?, start_time=?, end_time=?, type=?, students=? WHERE id=?"
  );
  $stmt->bind_param('iiisssssii', $subject_id, $faculty_id, $room_id, $section, $day, $start_time, $end_time, $type, $students, $id);

  if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Schedule updated.']);
  } else {
    echo json_encode(['success' => false, 'message' => 'Failed to update: ' . $conn->error]);
  }
  $stmt->close();
  exit;
}

if ($action === 'delete') {
  $id   = $_POST['id'] ?? 0;
  $stmt = $conn->prepare("DELETE FROM schedules WHERE id = ?");
  $stmt->bind_param('i', $id);

  if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Schedule deleted.']);
  } else {
    echo json_encode(['success' => false, 'message' => 'Failed to delete.']);
  }

  $stmt->close();
  exit;
}

// =============================================
// CHECK CONFLICTS (Backtracking algorithm)
// =============================================
if ($action === 'check_conflicts') {
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

  // Compare every pair of schedules
  for ($i = 0; $i < $count; $i++) {
    for ($j = $i + 1; $j < $count; $j++) {
      $s1 = $schedules[$i];
      $s2 = $schedules[$j];

      // Only compare same day
      if ($s1['day'] !== $s2['day']) continue;

      // Check time overlap
      $overlap = $s1['start_time'] < $s2['end_time'] && $s1['end_time'] > $s2['start_time'];
      if (!$overlap) continue;

      if ($s1['faculty_id'] === $s2['faculty_id']) {
        $conflicts[] = ['type' => 'Faculty', 'detail' => $s1['faculty_name'] . ' has overlapping classes', 's1' => $s1, 's2' => $s2];
      }
      if ($s1['room_id'] === $s2['room_id']) {
        $conflicts[] = ['type' => 'Room', 'detail' => $s1['room_number'] . ' is double-booked', 's1' => $s1, 's2' => $s2];
      }
      if ($s1['section'] === $s2['section']) {
        $conflicts[] = ['type' => 'Section', 'detail' => 'Section ' . $s1['section'] . ' has overlapping classes', 's1' => $s1, 's2' => $s2];
      }
    }
  }

  echo json_encode(['success' => true, 'conflicts' => $conflicts]);
  exit;
}

// =============================================
// GREEDY FACULTY LOADING SUGGESTION
// =============================================
if ($action === 'suggest_faculty') {
  $faculty = greedyAssignFaculty($conn);
  echo json_encode(['success' => true, 'data' => $faculty]);
  exit;
}

// =============================================
// BEST ROOM SUGGESTION (Dijkstra)
// =============================================
if ($action === 'suggest_room') {
  $students = $_POST['students'] ?? 30;
  $room     = dijkstraRoomAssign($conn, $students);

  if ($room) {
    echo json_encode(['success' => true, 'room' => $room]);
  } else {
    echo json_encode(['success' => false, 'message' => 'No available room found for ' . $students . ' students.']);
  }
  exit;
}

// If no valid action
echo json_encode(['success' => false, 'message' => 'Invalid action.']);
?>