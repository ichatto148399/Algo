<?php
// =============================================
// subjects.php - Departments, Programs & Subjects
// =============================================

require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET');
header('Access-Control-Allow-Headers: Content-Type');

$action = $_POST['action'] ?? $_GET['action'] ?? '';

// GET DEPARTMENTS
if ($action === 'get_departments') {
  $result = $conn->query("SELECT id, code, name FROM departments ORDER BY code");
  $data = [];
  while ($row = $result->fetch_assoc()) $data[] = $row;
  echo json_encode(['success' => true, 'data' => $data]);
  exit;
}

// ADD DEPARTMENT
if ($action === 'add_department') {
  $code = strtoupper(trim($_POST['code'] ?? ''));
  $name = trim($_POST['name'] ?? '');
  if (empty($code) || empty($name)) { echo json_encode(['success'=>false,'message'=>'Code and name required.']); exit; }
  $check = $conn->prepare("SELECT id FROM departments WHERE code = ?");
  $check->bind_param('s', $code); $check->execute(); $check->store_result();
  if ($check->num_rows > 0) { echo json_encode(['success'=>false,'message'=>'Department code already exists.']); $check->close(); exit; }
  $check->close();
  $stmt = $conn->prepare("INSERT INTO departments (code, name) VALUES (?, ?)");
  $stmt->bind_param('ss', $code, $name);
  if ($stmt->execute()) { echo json_encode(['success'=>true,'message'=>'Department added.','id'=>$conn->insert_id]); }
  else { echo json_encode(['success'=>false,'message'=>'Failed to add department.']); }
  $stmt->close(); exit;
}

// DELETE DEPARTMENT
if ($action === 'delete_department') {
  $id = intval($_POST['id'] ?? 0);
  $check = $conn->prepare("SELECT COUNT(*) as total FROM programs WHERE department_id = ?");
  $check->bind_param('i', $id); $check->execute();
  $row = $check->get_result()->fetch_assoc(); $check->close();
  if ($row['total'] > 0) { echo json_encode(['success'=>false,'message'=>'Delete programs under this department first.']); exit; }
  $stmt = $conn->prepare("DELETE FROM departments WHERE id = ?");
  $stmt->bind_param('i', $id);
  if ($stmt->execute()) { echo json_encode(['success'=>true]); } else { echo json_encode(['success'=>false,'message'=>'Failed.']); }
  $stmt->close(); exit;
}

// GET PROGRAMS
if ($action === 'get_programs') {
  $result = $conn->query("SELECT id, code, name, department_id FROM programs ORDER BY code");
  $data = [];
  while ($row = $result->fetch_assoc()) $data[] = $row;
  echo json_encode(['success' => true, 'data' => $data]);
  exit;
}

// ADD PROGRAM
if ($action === 'add_program') {
  $code    = strtoupper(trim($_POST['code'] ?? ''));
  $name    = trim($_POST['name'] ?? '');
  $dept_id = intval($_POST['department_id'] ?? 0);
  if (empty($code) || empty($name) || !$dept_id) { echo json_encode(['success'=>false,'message'=>'Code, name and department required.']); exit; }
  $check = $conn->prepare("SELECT id FROM programs WHERE code = ?");
  $check->bind_param('s', $code); $check->execute(); $check->store_result();
  if ($check->num_rows > 0) { echo json_encode(['success'=>false,'message'=>'Program code already exists.']); $check->close(); exit; }
  $check->close();
  $stmt = $conn->prepare("INSERT INTO programs (code, name, department_id) VALUES (?, ?, ?)");
  $stmt->bind_param('ssi', $code, $name, $dept_id);
  if ($stmt->execute()) { echo json_encode(['success'=>true,'message'=>'Program added.','id'=>$conn->insert_id]); }
  else { echo json_encode(['success'=>false,'message'=>'Failed to add program.']); }
  $stmt->close(); exit;
}

// DELETE PROGRAM
if ($action === 'delete_program') {
  $id = intval($_POST['id'] ?? 0);
  $check = $conn->prepare("SELECT COUNT(*) as total FROM subjects WHERE program_id = ?");
  $check->bind_param('i', $id); $check->execute();
  $row = $check->get_result()->fetch_assoc(); $check->close();
  if ($row['total'] > 0) { echo json_encode(['success'=>false,'message'=>'Cannot delete: subjects are assigned to this program.']); exit; }
  $stmt = $conn->prepare("DELETE FROM programs WHERE id = ?");
  $stmt->bind_param('i', $id);
  if ($stmt->execute()) { echo json_encode(['success'=>true]); } else { echo json_encode(['success'=>false,'message'=>'Failed.']); }
  $stmt->close(); exit;
}

// GET SUBJECTS
if ($action === 'get_subjects') {
  $sql = "SELECT s.id, s.code, s.title, s.units, s.type, s.year_level, s.semester,
                 COALESCE(s.lec_hours, s.units, 3) as lec,
                 COALESCE(s.lab_hours, 0) as lab,
                 d.code as department, p.code as program, s.program_id
          FROM subjects s
          LEFT JOIN programs p ON p.id = s.program_id
          LEFT JOIN departments d ON d.id = p.department_id
          ORDER BY s.code";
  $result = $conn->query($sql);
  $data = [];
  while ($row = $result->fetch_assoc()) {
    $row['yearLevel'] = $row['year_level'];
    $data[] = $row;
  }
  echo json_encode(['success' => true, 'data' => $data]);
  exit;
}

// ADD SUBJECT
if ($action === 'add_subject') {
  $code       = strtoupper(trim($_POST['code'] ?? ''));
  $title      = trim($_POST['title'] ?? '');
  $units      = intval($_POST['units'] ?? 3);
  $type       = $_POST['type'] ?? 'Major';
  $program_id = intval($_POST['program_id'] ?? 0) ?: null;
  $year_level = intval($_POST['year_level'] ?? 1);
  $semester   = $_POST['semester'] ?? '1st';

  if (empty($code) || empty($title) || !$units) { echo json_encode(['success'=>false,'message'=>'Code, title and units required.']); exit; }
  $check = $conn->prepare("SELECT id FROM subjects WHERE code = ?");
  $check->bind_param('s', $code); $check->execute(); $check->store_result();
  if ($check->num_rows > 0) { echo json_encode(['success'=>false,'message'=>'Subject code already exists.']); $check->close(); exit; }
  $check->close();

  $haslec = $conn->query("SHOW COLUMNS FROM subjects LIKE 'lec_hours'")->num_rows > 0;
  $lec = intval($_POST['lec'] ?? $units);
  $lab = intval($_POST['lab'] ?? 0);

  if ($haslec) {
    $stmt = $conn->prepare("INSERT INTO subjects (code,title,units,type,program_id,year_level,semester,lec_hours,lab_hours) VALUES (?,?,?,?,?,?,?,?,?)");
    $stmt->bind_param('ssissisii', $code,$title,$units,$type,$program_id,$year_level,$semester,$lec,$lab);
  } else {
    $stmt = $conn->prepare("INSERT INTO subjects (code,title,units,type,program_id,year_level,semester) VALUES (?,?,?,?,?,?,?)");
    $stmt->bind_param('ssissis', $code,$title,$units,$type,$program_id,$year_level,$semester);
  }
  if ($stmt->execute()) { echo json_encode(['success'=>true,'id'=>$conn->insert_id]); }
  else { echo json_encode(['success'=>false,'message'=>'Failed: '.$conn->error]); }
  $stmt->close(); exit;
}

// EDIT SUBJECT
if ($action === 'edit_subject') {
  $id         = intval($_POST['id'] ?? 0);
  $code       = strtoupper(trim($_POST['code'] ?? ''));
  $title      = trim($_POST['title'] ?? '');
  $units      = intval($_POST['units'] ?? 3);
  $type       = $_POST['type'] ?? 'Major';
  $program_id = intval($_POST['program_id'] ?? 0) ?: null;
  $year_level = intval($_POST['year_level'] ?? 1);
  $semester   = $_POST['semester'] ?? '1st';

  if (!$id || empty($code) || empty($title)) { echo json_encode(['success'=>false,'message'=>'ID, code and title required.']); exit; }

  $haslec = $conn->query("SHOW COLUMNS FROM subjects LIKE 'lec_hours'")->num_rows > 0;
  $lec = intval($_POST['lec'] ?? $units);
  $lab = intval($_POST['lab'] ?? 0);

  if ($haslec) {
    $stmt = $conn->prepare("UPDATE subjects SET code=?,title=?,units=?,type=?,program_id=?,year_level=?,semester=?,lec_hours=?,lab_hours=? WHERE id=?");
    $stmt->bind_param('ssissiisii', $code,$title,$units,$type,$program_id,$year_level,$semester,$lec,$lab,$id);
  } else {
    $stmt = $conn->prepare("UPDATE subjects SET code=?,title=?,units=?,type=?,program_id=?,year_level=?,semester=? WHERE id=?");
    $stmt->bind_param('ssissisi', $code,$title,$units,$type,$program_id,$year_level,$semester,$id);
  }
  if ($stmt->execute()) { echo json_encode(['success'=>true]); }
  else { echo json_encode(['success'=>false,'message'=>'Failed: '.$conn->error]); }
  $stmt->close(); exit;
}

// DELETE SUBJECT
if ($action === 'delete_subject') {
  $id = intval($_POST['id'] ?? 0);
  $stmt = $conn->prepare("DELETE FROM subjects WHERE id = ?");
  $stmt->bind_param('i', $id);
  if ($stmt->execute()) { echo json_encode(['success'=>true]); }
  else { echo json_encode(['success'=>false,'message'=>'Failed.']); }
  $stmt->close(); exit;
}

echo json_encode(['success' => false, 'message' => 'Invalid action.']);
?>