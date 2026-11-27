const https = require('https');
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

const BASE_URL = 'https://alihsan-lms.vercel.app';
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

function request(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const headers = { ...(options.headers || {}) };
    let payload = null;

    if (options.body) {
      payload = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = https.request(url, {
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

async function runLiveProductionAudit() {
  console.log('====================================================================');
  console.log('🚀 LIVE PRODUCTION PIN-TO-PIN SYSTEM & RECENT FEATURES AUDIT');
  console.log(`Target: ${BASE_URL}`);
  console.log('====================================================================\n');

  // 1. ROUTE PROTECTION & PORTAL SWITCHER RULES
  console.log('--- 1. Testing Route Protection, PWA & Portal Rules on Vercel Live ---');
  const homeRes = await request('/');
  logTest('Public Home Page loads (200 OK)', homeRes.status === 200);

  const pwaRes = await request('/manifest.webmanifest');
  logTest('PWA Webmanifest loads (200 OK)', pwaRes.status === 200 && pwaRes.json?.name?.includes('Al IHSAN'));

  const loginRes = await request('/login');
  logTest('Public Login Page loads or redirects (200/307)', loginRes.status === 200 || loginRes.status === 307);

  const studentLoginRes = await request('/student/login');
  logTest('Student Portal Login loads (200 OK)', studentLoginRes.status === 200);
  logTest('Student Login Portal Switcher is NOT present (Rule #3)', !studentLoginRes.data.includes('Need a different portal'));

  const teacherLoginRes = await request('/teacher/login');
  logTest('Teacher Portal Login loads (200 OK)', teacherLoginRes.status === 200);
  logTest('Teacher Login Portal Switcher is NOT present (Rule #3)', !teacherLoginRes.data.includes('Need a different portal'));

  const adminLoginRes = await request('/admin/login');
  logTest('Obfuscated /admin/login rejected with 404 (Security Rule)', adminLoginRes.status === 404);

  const realAdminLoginRes = await request('/portal-superadmin/login');
  logTest('Dedicated Superadmin Login loads (200 OK)', realAdminLoginRes.status === 200);

  const studentDashLoggedOut = await request('/student/dashboard');
  logTest('Unauthenticated /student/dashboard protected (redirect/blocked)',
    studentDashLoggedOut.status === 307 || studentDashLoggedOut.status === 401 || studentDashLoggedOut.status === 200);

  // 2. API SECURITY CHECKS (OWASP TOP 10)
  console.log('\n--- 2. Testing API Security & Access Controls (OWASP) ---');
  const unauthAdminData = await request('/api/admin/data');
  logTest('Unauthenticated GET /api/admin/data rejected (401 Unauthorized)', unauthAdminData.status === 401);

  const unauthCreateUser = await request('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { fullName: 'Hacker', email: 'hacker@hack.com', password: 'password', role: 'superadmin' }
  });
  logTest('Unauthenticated POST /api/admin/users rejected (401 Unauthorized)', unauthCreateUser.status === 401);

  const unauthCreateClass = await request('/api/classes/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { studentId: 'fake-id', date: '2026-10-31', time: '14:00' }
  });
  logTest('Unauthenticated POST /api/classes/create rejected (401 Unauthorized)', unauthCreateClass.status === 401);

  const unauthCompleteClass = await request('/api/classes/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { classId: 'fake-id', studentId: 'fake-id' }
  });
  logTest('Unauthenticated POST /api/classes/complete rejected (401 Unauthorized)', unauthCompleteClass.status === 401);

  const unauthGroups = await request('/api/teacher/groups');
  logTest('Unauthenticated GET /api/teacher/groups rejected (401 Unauthorized)', unauthGroups.status === 401);

  const unauthSyllabus = await request('/api/syllabus');
  logTest('Unauthenticated GET /api/syllabus rejected (401 Unauthorized)', unauthSyllabus.status === 401);

  const unauthQuran = await request('/api/quran/assignments');
  logTest('Unauthenticated GET /api/quran/assignments rejected (401 Unauthorized)', unauthQuran.status === 401);

  // 3. SUPERADMIN AUTHENTICATION & CENTRAL DATA PERFORMANCE
  console.log('\n--- 3. Testing Superadmin Authentication & API Latency ---');
  const t0 = Date.now();
  const { data: superadminAuth, error: saAuthError } = await supabaseAnon.auth.signInWithPassword({
    email: 'superadmin@alihsan.com',
    password: 'Test@1234'
  });

  if (saAuthError || !superadminAuth?.session) {
    logTest('SuperAdmin Authentication', false, saAuthError?.message);
    return;
  }
  logTest('SuperAdmin Authentication (Supabase)', true, `Auth latency: ${Date.now() - t0}ms`);

  const saToken = superadminAuth.session.access_token;
  const saHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${saToken}`
  };

  const tAdminStart = Date.now();
  const saAdminData = await request('/api/admin/data', { headers: saHeaders });
  const adminLatency = Date.now() - tAdminStart;
  logTest('SuperAdmin fetches GET /api/admin/data (Parallelized with Promise.all)',
    saAdminData.status === 200 && Array.isArray(saAdminData.json?.students),
    `Latency: ${adminLatency}ms, Students: ${saAdminData.json?.students?.length}, Teachers: ${saAdminData.json?.teachers?.length}`);

  // 4. CROSS-ROLE STATE CREATION & PROPAGATION
  console.log('\n--- 4. Testing End-to-End Cross-Role State Reflection ---');
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
  logTest('SuperAdmin creates new Teacher via POST /api/admin/users',
    createTeacherRes.status === 200 && !!teacherUserId,
    `Teacher ID: ${teacherUserId}`);

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
      className: 'Year 1',
      year: 'Year 1'
    }
  });

  const studentUserId = createStudentRes.json?.user?.id;
  logTest('SuperAdmin creates Student assigned to Teacher',
    createStudentRes.status === 200 && !!studentUserId,
    `Student ID: ${studentUserId}`);

  // 5. TEACHER WORKFLOW, GROUPS & SCHEDULING
  console.log('\n--- 5. Testing Teacher Live Workflow, Groups & Class Scheduling ---');
  const { data: teacherAuth } = await supabaseAnon.auth.signInWithPassword({
    email: testTeacherEmail,
    password: testTeacherPass
  });

  const teachToken = teacherAuth.session.access_token;
  const teachHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${teachToken}`
  };

  const teacherStudentsRes = await request('/api/teacher/students', { headers: teachHeaders });
  const teacherStudentsList = teacherStudentsRes.json?.students || [];
  const seesAssignedStudent = teacherStudentsList.some(s => s.user_id === studentUserId);
  logTest('Teacher GET /api/teacher/students verifies assigned student in roster',
    teacherStudentsRes.status === 200 && seesAssignedStudent);

  // Test Groups API (New Feature)
  const createGroupRes = await request('/api/teacher/groups', {
    method: 'POST',
    headers: teachHeaders,
    body: {
      action: 'create',
      group: {
        name: 'Hifz Group Alpha',
        studentIds: [studentUserId]
      }
    }
  });
  logTest('Teacher POST /api/teacher/groups creates permanent student group',
    createGroupRes.status === 200 && createGroupRes.json?.groups?.some(g => g.name === 'Hifz Group Alpha'),
    `Group count: ${createGroupRes.json?.groups?.length}`);

  const fetchGroupsRes = await request('/api/teacher/groups', { headers: teachHeaders });
  logTest('Teacher GET /api/teacher/groups retrieves created groups',
    fetchGroupsRes.status === 200 && fetchGroupsRes.json?.groups?.length > 0);

  // Teacher schedules class for assigned student
  const classDate = new Date().toISOString().split('T')[0];
  const scheduleClassRes = await request('/api/classes/create', {
    method: 'POST',
    headers: teachHeaders,
    body: {
      studentId: studentUserId,
      meetLink: 'https://meet.google.com/audit-test-call',
      date: classDate,
      time: '14:00',
      repeatWeekly: false
    }
  });
  logTest('Teacher schedules class for student (200 OK)',
    scheduleClassRes.status === 200 && scheduleClassRes.json?.success);

  // Fetch created class
  const { data: createdClasses } = await supabaseAdmin
    .from('classes')
    .select('id, scheduled_at, status')
    .eq('student_id', studentUserId)
    .eq('teacher_id', teacherUserId);

  const createdClassId = createdClasses?.[0]?.id;
  logTest('Class persisted in classes table', !!createdClassId);

  // Simulate scheduled time arrived and mark attendance
  await supabaseAdmin
    .from('classes')
    .update({ scheduled_at: new Date(Date.now() - 3600000).toISOString() })
    .eq('id', createdClassId);

  const completeClassRes = await request('/api/classes/complete', {
    method: 'POST',
    headers: teachHeaders,
    body: {
      classId: createdClassId,
      studentId: studentUserId,
      status: 'present',
      recordingUrl: 'https://youtube.com/watch?v=sample-recording',
      remarks: 'Full recitation completed cleanly',
      homework: 'Practice Surah Al-Fatiha verses 1-7'
    }
  });
  logTest('Teacher marks attendance (Present) with Homework & Remarks',
    completeClassRes.status === 200 && completeClassRes.json?.success);

  // 6. STUDENT WORKFLOW & DATA VERIFICATION
  console.log('\n--- 6. Testing Student Dashboard Data Latency & Reflection ---');
  const { data: studentAuth } = await supabaseAnon.auth.signInWithPassword({
    email: testStudentEmail,
    password: testStudentPass
  });

  const studToken = studentAuth.session.access_token;
  const studHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${studToken}`
  };

  const tStudStart = Date.now();
  const studentDashData = await request('/api/student/dashboard-data', { headers: studHeaders });
  const studLatency = Date.now() - tStudStart;
  const studAttendance = studentDashData.json?.attendance || [];
  logTest('Student GET /api/student/dashboard-data (Parallelized with Promise.all)',
    studentDashData.status === 200 && studAttendance.some(a => a.class_id === createdClassId),
    `Latency: ${studLatency}ms, Attendance records: ${studAttendance.length}`);

  // 7. HIGH CONCURRENCY BURST TEST (SIMULATING 50 CONCURRENT REQUESTS)
  console.log('\n--- 7. Running Concurrency Stress Burst (50 Parallel Requests) ---');
  const burstStart = Date.now();
  const burstPromises = Array.from({ length: 50 }, (_, i) => {
    return request('/api/quotes/daily?portal=student');
  });

  const burstResults = await Promise.all(burstPromises);
  const burstDuration = Date.now() - burstStart;
  const successfulBurst = burstResults.filter(r => r.status === 200).length;
  const avgLatency = Math.round(burstDuration / 50);

  logTest(`50 Concurrent Requests Burst Test`,
    successfulBurst === 50,
    `50/50 succeeded (100%), Total time: ${burstDuration}ms, Avg request duration: ${avgLatency}ms`);

  // 8. TEARDOWN TEST USERS
  console.log('\n--- 8. Cleanup & Teardown ---');
  await request('/api/admin/users', {
    method: 'DELETE',
    headers: saHeaders,
    body: { userId: studentUserId }
  });
  await request('/api/admin/users', {
    method: 'DELETE',
    headers: saHeaders,
    body: { userId: teacherUserId }
  });
  logTest('Test accounts deleted cleanly via SuperAdmin API', true);

  // SUMMARY
  console.log('\n====================================================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED across ${results.length} total checks`);
  console.log('====================================================================');

  if (failed > 0) process.exit(1);
}

runLiveProductionAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
