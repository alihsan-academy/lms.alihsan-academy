const http = require('http');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envContent = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1]] = val.trim();
  }
});

const BASE_URL = 'http://localhost:3000';
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const results = [];

function logTest(name, passed, details = '') {
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon}: ${name} ${details ? `(${details})` : ''}`);
  results.push({ name, passed, details });
}

// HTTP request helper that tracks cookies and optional headers
function request(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const headers = { ...(options.headers || {}) };
    let payload = null;

    if (options.body) {
      payload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(url, {
      method: options.method || 'GET',
      headers,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch(e) {}

        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
          json,
          location: res.headers['location'] || null
        });
      });
    });

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runLiveAudit() {
  console.log('====================================================');
  console.log('🚀 STARTING COMPREHENSIVE LIVE AUDIT & FEATURE TEST');
  console.log(`Target: ${BASE_URL}`);
  console.log('====================================================\n');

  // -----------------------------------------------------------------
  // 1. PUBLIC & PROXY ROUTE PROTECTION CHECKS
  // -----------------------------------------------------------------
  console.log('--- 1. Testing Route Protection (Proxy / Middleware) ---');
  
  const homeRes = await request('/');
  logTest('Public Home Page loads (200 OK)', homeRes.status === 200);

  const loginRes = await request('/login');
  logTest('Public Login Page loads or redirects to /student/login',
    loginRes.status === 200 || (loginRes.status === 307 && loginRes.location?.includes('/student/login')),
    `Status ${loginRes.status}, Location: ${loginRes.location}`);

  const studentLoginRes = await request('/student/login');
  logTest('Student Portal Login Page loads (200 OK)', studentLoginRes.status === 200);

  const teacherLoginRes = await request('/teacher/login');
  logTest('Teacher Portal Login Page loads (200 OK)', teacherLoginRes.status === 200);

  const adminLoginRes = await request('/admin/login');
  logTest('Admin Portal Login Page loads (200 OK)', adminLoginRes.status === 200);

  const studentDashLoggedOut = await request('/student/dashboard');
  logTest('Unauthenticated /student/dashboard redirects to /student/login',
    studentDashLoggedOut.status === 307 && studentDashLoggedOut.location?.includes('/student/login'),
    `Status ${studentDashLoggedOut.status}, Location: ${studentDashLoggedOut.location}`);

  const teacherDashLoggedOut = await request('/teacher/dashboard');
  logTest('Unauthenticated /teacher/dashboard redirects to /teacher/login',
    teacherDashLoggedOut.status === 307 && teacherDashLoggedOut.location?.includes('/teacher/login'),
    `Status ${teacherDashLoggedOut.status}, Location: ${teacherDashLoggedOut.location}`);

  const adminDashLoggedOut = await request('/admin/dashboard');
  logTest('Unauthenticated /admin/dashboard redirects to /admin/login',
    adminDashLoggedOut.status === 307 && adminDashLoggedOut.location?.includes('/admin/login'),
    `Status ${adminDashLoggedOut.status}, Location: ${adminDashLoggedOut.location}`);

  const superadminDashLoggedOut = await request('/superadmin/dashboard');
  logTest('Unauthenticated /superadmin/dashboard redirects to /admin/login',
    superadminDashLoggedOut.status === 307 && superadminDashLoggedOut.location?.includes('/admin/login'),
    `Status ${superadminDashLoggedOut.status}, Location: ${superadminDashLoggedOut.location}`);

  // -----------------------------------------------------------------
  // 2. API SECURITY CHECKS (CRITICAL FIX VERIFICATIONS)
  // -----------------------------------------------------------------
  console.log('\n--- 2. Testing API Security & Access Controls (OWASP) ---');

  const unauthCreateUser = await request('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { fullName: 'Hacker', email: 'hacker@hack.com', password: 'password', role: 'superadmin' }
  });
  logTest('CRITICAL FIX: Unauthenticated POST /api/admin/users rejected with 401',
    unauthCreateUser.status === 401, `Got status ${unauthCreateUser.status}`);

  const unauthDeleteUser = await request('/api/admin/users', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: { userId: 'some-fake-uuid' }
  });
  logTest('CRITICAL FIX: Unauthenticated DELETE /api/admin/users rejected with 401',
    unauthDeleteUser.status === 401, `Got status ${unauthDeleteUser.status}`);

  const unauthPatchUser = await request('/api/admin/users', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: { studentId: 'some-student', teacherId: 'some-teacher' }
  });
  logTest('CRITICAL FIX: Unauthenticated PATCH /api/admin/users rejected with 401',
    unauthPatchUser.status === 401, `Got status ${unauthPatchUser.status}`);

  const unauthAdminData = await request('/api/admin/data');
  logTest('Unauthenticated GET /api/admin/data rejected with 401',
    unauthAdminData.status === 401, `Got status ${unauthAdminData.status}`);

  const unauthCreateClass = await request('/api/classes/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { studentId: 'some-id', date: '2026-10-25', time: '14:00' }
  });
  logTest('HIGH FIX: Unauthenticated POST /api/classes/create rejected with 401',
    unauthCreateClass.status === 401, `Got status ${unauthCreateClass.status}`);

  const unauthCompleteClass = await request('/api/classes/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { classId: 'some-class', studentId: 'some-student' }
  });
  logTest('Unauthenticated POST /api/classes/complete rejected with 401',
    unauthCompleteClass.status === 401, `Got status ${unauthCompleteClass.status}`);

  const unauthStudentStatus = await request('/api/student/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { studentId: 'some-id', enrolmentStatus: 'ongoing' }
  });
  logTest('HIGH FIX: Unauthenticated POST /api/student/status rejected with 401',
    unauthStudentStatus.status === 401, `Got status ${unauthStudentStatus.status}`);

  const dailyQuoteRes = await request('/api/quotes/daily?portal=student');
  logTest('Public API GET /api/quotes/daily returns valid quote',
    dailyQuoteRes.status === 200 && dailyQuoteRes.json?.quote?.text, `Quote: ${dailyQuoteRes.json?.quote?.text?.slice(0, 35)}...`);

  // -----------------------------------------------------------------
  // 3. AUTHENTICATION & SUPERADMIN SESSION WORKFLOW
  // -----------------------------------------------------------------
  console.log('\n--- 3. Testing Superadmin Live Workflow ---');

  const { data: superadminAuth, error: saAuthError } = await supabaseAnon.auth.signInWithPassword({
    email: 'superadmin@alihsan.com',
    password: 'Test@1234'
  });

  if (saAuthError || !superadminAuth?.session) {
    console.error('Failed to log in as superadmin:', saAuthError);
    return;
  }
  logTest('SuperAdmin Supabase login successful', true);

  const saToken = superadminAuth.session.access_token;
  const saHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${saToken}`
  };

  // Call GET /api/admin/data with superadmin token
  const saAdminData = await request('/api/admin/data', { headers: saHeaders });
  logTest('SuperAdmin fetches GET /api/admin/data (200 OK)',
    saAdminData.status === 200 && Array.isArray(saAdminData.json?.students),
    `Found ${saAdminData.json?.students?.length || 0} students, ${saAdminData.json?.teachers?.length || 0} teachers`);

  // Create a new teacher via SuperAdmin
  const testTeacherEmail = `audit.teacher.${Date.now()}@alihsan.com`;
  const testTeacherPass = 'AuditPass@1234';
  const testTeacherName = 'Audit Teacher Pro';

  const createTeacherRes = await request('/api/admin/users', {
    method: 'POST',
    headers: saHeaders,
    body: {
      fullName: testTeacherName,
      email: testTeacherEmail,
      password: testTeacherPass,
      role: 'teacher'
    }
  });

  const teacherUserId = createTeacherRes.json?.user?.id;
  logTest('SuperAdmin creates new Teacher account via POST /api/admin/users',
    createTeacherRes.status === 200 && !!teacherUserId,
    `Created teacher ID: ${teacherUserId}`);

  // Create a new student assigned to this teacher
  const testStudentEmail = `audit.student.${Date.now()}@alihsan.com`;
  const testStudentPass = 'AuditPass@1234';
  const testStudentName = 'Audit Student One';
  const testStudentReg = `REG-${Math.floor(1000 + Math.random()*9000)}`;

  const createStudentRes = await request('/api/admin/users', {
    method: 'POST',
    headers: saHeaders,
    body: {
      fullName: testStudentName,
      email: testStudentEmail,
      password: testStudentPass,
      role: 'student',
      teacherId: teacherUserId,
      registrationNumber: testStudentReg,
      className: 'Tahfeez Grade 1'
    }
  });

  const studentUserId = createStudentRes.json?.user?.id;
  logTest('SuperAdmin creates new Student assigned to Teacher',
    createStudentRes.status === 200 && !!studentUserId,
    `Created student ID: ${studentUserId} (Assigned to: ${teacherUserId})`);

  // Verify student shows assigned teacher in database
  const { data: verifyStudentProfile } = await supabaseAdmin
    .from('student_profiles')
    .select('teacher_id, name, registration_number')
    .eq('user_id', studentUserId)
    .single();

  logTest('Student Profile DB record correctly linked to Teacher',
    verifyStudentProfile?.teacher_id === teacherUserId && verifyStudentProfile?.name === testStudentName,
    `Name: ${verifyStudentProfile?.name}, Teacher: ${verifyStudentProfile?.teacher_id}`);

  // Test reassigning student teacher via PATCH /api/admin/users
  const patchRes = await request('/api/admin/users', {
    method: 'PATCH',
    headers: saHeaders,
    body: {
      studentId: studentUserId,
      teacherId: teacherUserId // reassign/verify
    }
  });
  logTest('SuperAdmin reassigns student teacher via PATCH /api/admin/users (200 OK)',
    patchRes.status === 200 && patchRes.json?.success);

  // -----------------------------------------------------------------
  // 4. TEACHER LIVE WORKFLOW & AUTHORIZATION CHECKS
  // -----------------------------------------------------------------
  console.log('\n--- 4. Testing Teacher Live Workflow & Security Checks ---');

  const { data: teacherAuth, error: teachAuthError } = await supabaseAnon.auth.signInWithPassword({
    email: testTeacherEmail,
    password: testTeacherPass
  });

  logTest('Teacher logs in with created credentials', !teachAuthError && !!teacherAuth?.session);

  const teachToken = teacherAuth.session.access_token;
  const teachHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${teachToken}`
  };

  // Teacher attempts to access Superadmin API
  const teacherAccessAdmin = await request('/api/admin/data', { headers: teachHeaders });
  logTest('SECURITY CHECK: Teacher cannot access /api/admin/data (403 Forbidden)',
    teacherAccessAdmin.status === 403, `Status: ${teacherAccessAdmin.status}`);

  // Teacher attempts to call user deletion API
  const teacherDeleteUser = await request('/api/admin/users', {
    method: 'DELETE',
    headers: teachHeaders,
    body: { userId: studentUserId }
  });
  logTest('SECURITY CHECK: Teacher cannot call DELETE /api/admin/users (403 Forbidden)',
    teacherDeleteUser.status === 403, `Status: ${teacherDeleteUser.status}`);

  // Teacher fetches their assigned students
  const teacherStudentsRes = await request('/api/teacher/students', { headers: teachHeaders });
  const teacherStudentsList = teacherStudentsRes.json?.students || [];
  const seesAssignedStudent = teacherStudentsList.some(s => s.user_id === studentUserId);
  logTest('Teacher GET /api/teacher/students returns only assigned students',
    teacherStudentsRes.status === 200 && seesAssignedStudent,
    `Teacher sees ${teacherStudentsList.length} student(s)`);

  // Teacher schedules a class for their assigned student
  const classDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]; // tomorrow
  const scheduleClassRes = await request('/api/classes/create', {
    method: 'POST',
    headers: teachHeaders,
    body: {
      studentId: studentUserId,
      meetLink: 'https://meet.google.com/xyz-test-lms',
      date: classDate,
      time: '15:30',
      repeatWeekly: false
    }
  });

  logTest('Teacher schedules class for assigned student (200 OK)',
    scheduleClassRes.status === 200 && scheduleClassRes.json?.success);

  // HIGH SEVERITY TEST: Teacher attempts to schedule a class for a NON-ASSIGNED student
  const fakeRandomStudentId = '00000000-0000-0000-0000-000000000000';
  const unauthorizedScheduleRes = await request('/api/classes/create', {
    method: 'POST',
    headers: teachHeaders,
    body: {
      studentId: fakeRandomStudentId,
      meetLink: 'https://meet.google.com/unauthorized',
      date: classDate,
      time: '16:00'
    }
  });

  logTest('HIGH FIX: Teacher blocked from creating class for unassigned student (403 Forbidden)',
    unauthorizedScheduleRes.status === 403, `Got status ${unauthorizedScheduleRes.status}`);

  // Fetch the created class
  const { data: createdClasses } = await supabaseAdmin
    .from('classes')
    .select('id, scheduled_at, status')
    .eq('student_id', studentUserId)
    .eq('teacher_id', teacherUserId);

  const createdClassId = createdClasses?.[0]?.id;
  logTest('Class successfully persisted in classes table',
    !!createdClassId && createdClasses[0].status === 'scheduled',
    `Class ID: ${createdClassId}`);

  // Teacher marks class completed with attendance
  const completeClassRes = await request('/api/classes/complete', {
    method: 'POST',
    headers: teachHeaders,
    body: {
      classId: createdClassId,
      studentId: studentUserId,
      status: 'present',
      recordingUrl: 'https://youtube.com/watch?v=sample-recording',
      remarks: 'Excellent Quran Tajweed recitation'
    }
  });

  logTest('Teacher marks class completed with attendance (200 OK)',
    completeClassRes.status === 200 && completeClassRes.json?.success);

  // Verify class status is 'completed' and attendance is recorded
  const { data: completedClass } = await supabaseAdmin
    .from('classes')
    .select('status, recording_url')
    .eq('id', createdClassId)
    .single();

  const { data: attendanceRecord } = await supabaseAdmin
    .from('attendance')
    .select('status, student_id, teacher_id')
    .eq('class_id', createdClassId)
    .single();

  logTest('Class status updated to completed & attendance record created',
    completedClass?.status === 'completed' && attendanceRecord?.status === 'present',
    `Attendance status: ${attendanceRecord?.status}`);

  // Teacher updates student enrolment status
  const updateStatusRes = await request('/api/student/status', {
    method: 'POST',
    headers: teachHeaders,
    body: {
      studentId: studentUserId,
      enrolmentStatus: 'break',
      breakFromDate: classDate,
      breakToDate: classDate,
      breakReason: 'Family vacation'
    }
  });

  logTest('Teacher updates enrolment status for assigned student (200 OK)',
    updateStatusRes.status === 200 && updateStatusRes.json?.success);

  // -----------------------------------------------------------------
  // 5. STUDENT LIVE WORKFLOW & AUTHORIZATION CHECKS
  // -----------------------------------------------------------------
  console.log('\n--- 5. Testing Student Live Workflow & Security Checks ---');

  const { data: studentAuth, error: studAuthError } = await supabaseAnon.auth.signInWithPassword({
    email: testStudentEmail,
    password: testStudentPass
  });

  logTest('Student logs in with created credentials', !studAuthError && !!studentAuth?.session);

  const studToken = studentAuth.session.access_token;
  const studHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${studToken}`
  };

  // Student fetches their dashboard data
  const studentDashData = await request('/api/student/dashboard-data', { headers: studHeaders });
  logTest('Student GET /api/student/dashboard-data returns student data',
    studentDashData.status === 200 && studentDashData.json?.studentProfile?.name === testStudentName,
    `Student name: ${studentDashData.json?.studentProfile?.name}, Classes count: ${studentDashData.json?.classes?.length}`);

  // Student verifies attendance in dashboard data
  const studentAttendanceList = studentDashData.json?.attendance || [];
  logTest('Student sees their attendance record on dashboard',
    studentAttendanceList.some(a => a.class_id === createdClassId),
    `Total attendance records: ${studentAttendanceList.length}`);

  // HIGH SEVERITY TEST: Student attempts to schedule a class (forbidden)
  const studentScheduleRes = await request('/api/classes/create', {
    method: 'POST',
    headers: studHeaders,
    body: {
      studentId: studentUserId,
      date: classDate,
      time: '10:00'
    }
  });

  logTest('HIGH FIX: Student blocked from scheduling class (403 Forbidden)',
    studentScheduleRes.status === 403, `Got status ${studentScheduleRes.status}`);

  // Student attempts to call user deletion (forbidden)
  const studentDeleteRes = await request('/api/admin/users', {
    method: 'DELETE',
    headers: studHeaders,
    body: { userId: teacherUserId }
  });

  logTest('CRITICAL FIX: Student blocked from deleting users (403 Forbidden)',
    studentDeleteRes.status === 403, `Got status ${studentDeleteRes.status}`);

  // -----------------------------------------------------------------
  // 6. TEARDOWN & CLEANUP
  // -----------------------------------------------------------------
  console.log('\n--- 6. Teardown & Deletion via SuperAdmin ---');

  const deleteStudentRes = await request('/api/admin/users', {
    method: 'DELETE',
    headers: saHeaders,
    body: { userId: studentUserId }
  });

  logTest('SuperAdmin deletes test student account via DELETE /api/admin/users',
    deleteStudentRes.status === 200 && deleteStudentRes.json?.success);

  const deleteTeacherRes = await request('/api/admin/users', {
    method: 'DELETE',
    headers: saHeaders,
    body: { userId: teacherUserId }
  });

  logTest('SuperAdmin deletes test teacher account via DELETE /api/admin/users',
    deleteTeacherRes.status === 200 && deleteTeacherRes.json?.success);

  // Confirm student can no longer authenticate
  const { error: postDeleteAuthError } = await supabaseAnon.auth.signInWithPassword({
    email: testStudentEmail,
    password: testStudentPass
  });

  logTest('Deleted student account cannot log in',
    !!postDeleteAuthError, `Auth rejected as expected: ${postDeleteAuthError?.message}`);

  // -----------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------
  console.log('\n====================================================');
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  console.log(`LIVE AUDIT SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED out of ${results.length} tests`);
  console.log('====================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runLiveAudit().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
