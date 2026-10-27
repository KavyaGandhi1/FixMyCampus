import assert from 'assert';
import http from 'http';
import { app } from '../server.js';
import { connectDB, closeDB } from '../config/db.js';
import { seedData } from '../seeds/seed.js';

const run = async () => {
  console.log('\n🧪 ===============================================');
  console.log('   FixMyCampus Backend Integration Test Runner    ');
  console.log('==================================================\n');

  await connectDB();
  await seedData();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  let passed = 0;
  let failed = 0;

  const test = async (name, fn) => {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      failed++;
    }
  };

  const req = async (endpoint, options = {}) => {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, ok: res.ok, body: data };
  };

  let studentToken = '';
  let adminToken = '';
  let staffToken = '';
  let studentId = '';
  let staffId = '';
  let createdIssueId = '';

  try {
    // 1. Health check
    await test('Health check endpoint returns ok and database connected', async () => {
      const res = await req('/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
      assert.strictEqual(res.body.database.connected, true);
    });

    // 2. Student Registration
    await test('Public registration creates a student and prevents privilege escalation', async () => {
      const res = await req('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Jane Doe',
          email: 'jane.doe@student.edu',
          password: 'Password123!',
          department: 'Architecture',
          role: 'admin' // Attempting to escalate role
        })
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.user.role, 'student', 'Should strictly remain student');
      assert.ok(res.body.token, 'Should return JWT token');
    });

    // 3. Duplicate Registration
    await test('Duplicate registration returns 409 conflict', async () => {
      const res = await req('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Jane Duplicate',
          email: 'jane.doe@student.edu',
          password: 'Password123!'
        })
      });
      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.success, false);
    });

    // 4. Invalid Login
    await test('Invalid login credentials return 401', async () => {
      const res = await req('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'jane.doe@student.edu',
          password: 'WrongPassword'
        })
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
    });

    // 5. Successful Logins for Roles
    await test('Login with student credentials returns valid JWT', async () => {
      const res = await req('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'alex.rivera@student.edu',
          password: 'Password123!'
        })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.role, 'student');
      assert.strictEqual(res.body.user.password, undefined, 'Password must never be returned');
      studentToken = res.body.token;
      studentId = res.body.user._id;
    });

    await test('Login with admin credentials returns admin JWT', async () => {
      const res = await req('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'admin@campus.edu',
          password: 'Password123!'
        })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.role, 'admin');
      adminToken = res.body.token;
    });

    await test('Login with staff credentials returns staff JWT', async () => {
      const res = await req('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'david.miller@campus.edu',
          password: 'Password123!'
        })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.role, 'staff');
      staffToken = res.body.token;
      staffId = res.body.user._id;
    });

    // 6. Current User Endpoint
    await test('GET /auth/me returns current user identity', async () => {
      const res = await req('/auth/me', {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.email, 'alex.rivera@student.edu');
    });

    // 7. Unauthorized Access without token
    await test('Protected endpoints reject unauthenticated requests with 401', async () => {
      const res = await req('/issues');
      assert.strictEqual(res.status, 401);
    });

    // 8. Create Issue
    await test('Student can create a new maintenance issue with auto-generated ticket ID', async () => {
      const res = await req('/issues', {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: JSON.stringify({
          title: 'AC unit blowing warm air in Seminar Room 102',
          description: 'The thermostat is set to 21C but the split AC is blowing warm air and humming loudly.',
          category: 'Electrical',
          building: 'Academic Block A',
          room: 'Seminar Room 102',
          priority: 'medium'
        })
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.issue.ticketId.startsWith('FMC-2026-'), 'Must have generated ticketId');
      assert.strictEqual(res.body.issue.status, 'open');
      assert.strictEqual(res.body.issue.priority, 'medium');
      createdIssueId = res.body.issue._id;
    });

    // 9. Duplicate detection
    await test('Duplicate detection identifies existing issues in same building and category', async () => {
      const res = await req('/issues/check-duplicates', {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: JSON.stringify({
          building: 'Academic Block A',
          room: 'Room 302',
          category: 'Projector/AV'
        })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.hasDuplicates, true);
      assert.ok(res.body.duplicates.length > 0);
      assert.strictEqual(res.body.duplicates[0].category, 'Projector/AV');
    });

    // 10. Role-based issue listing
    await test('Student only sees their own reported issues in GET /issues', async () => {
      const res = await req('/issues', {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      assert.strictEqual(res.status, 200);
      res.body.issues.forEach(issue => {
        assert.strictEqual(issue.reporter._id.toString(), studentId);
      });
    });

    await test('Admin sees all campus issues in GET /issues', async () => {
      const res = await req('/issues', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.total >= 5, 'Admin sees seeded issues');
    });

    // 11. Filtering and Searching
    await test('Filtering issues by category works accurately', async () => {
      const res = await req('/issues?category=Wi-Fi', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 200);
      res.body.issues.forEach(issue => {
        assert.strictEqual(issue.category, 'Wi-Fi');
      });
    });

    await test('Searching issues by title or ticketId matches correctly', async () => {
      const res = await req('/issues?search=FMC-2026-IT001', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.issues.length, 1);
      assert.strictEqual(res.body.issues[0].ticketId, 'FMC-2026-IT001');
    });

    // 12. Invalid ID validation
    await test('Invalid MongoDB ObjectId format returns 400 Bad Request', async () => {
      const res = await req('/issues/not-a-valid-id', {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    await test('Non-existent ObjectId returns 404 Not Found', async () => {
      const res = await req('/issues/507f1f77bcf86cd799439011', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 404);
    });

    // 13. Staff assignment permissions
    await test('Student cannot assign staff to an issue (403 Forbidden)', async () => {
      const res = await req(`/issues/${createdIssueId}/assign`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: JSON.stringify({ staffId })
      });
      assert.strictEqual(res.status, 403);
    });

    await test('Admin can assign staff to an issue', async () => {
      const res = await req(`/issues/${createdIssueId}/assign`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ staffId, note: 'Assigned to David Miller for inspection.' })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.issue.assignedTo._id.toString(), staffId);
    });

    // 14. Status Transitions and Validations
    await test('Rejects invalid status transitions (e.g. open -> closed by unauthorized)', async () => {
      const res = await req(`/issues/${createdIssueId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: JSON.stringify({ status: 'closed' })
      });
      assert.strictEqual(res.status, 403);
    });

    await test('Assigned staff can transition status from open to in_progress', async () => {
      const res = await req(`/issues/${createdIssueId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${staffToken}` },
        body: JSON.stringify({ status: 'in_progress', note: 'Technician on-site.' })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.issue.status, 'in_progress');
    });

    await test('Assigned staff can transition status from in_progress to resolved', async () => {
      const res = await req(`/issues/${createdIssueId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${staffToken}` },
        body: JSON.stringify({
          status: 'resolved',
          note: 'Replaced AC filter and refilled coolant. Running cool.'
        })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.issue.status, 'resolved');
      assert.ok(res.body.issue.resolvedAt, 'Resolved timestamp should be recorded');
    });

    // 15. Comments
    await test('Student can add comment to their own issue', async () => {
      const res = await req(`/issues/${createdIssueId}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: JSON.stringify({ content: 'Confirming the room is now cooled down. Thanks!' })
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.comment.content, 'Confirming the room is now cooled down. Thanks!');
    });

    await test('Empty comment is rejected with 400', async () => {
      const res = await req(`/issues/${createdIssueId}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: JSON.stringify({ content: '   ' })
      });
      assert.strictEqual(res.status, 400);
    });

    // 16. Admin Analytics
    await test('Admin analytics calculates real metrics from database records', async () => {
      const res = await req('/analytics', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.strictEqual(res.status, 200);
      const { summary, byCategory, byLocation } = res.body.data;
      assert.ok(summary.total >= 6);
      assert.ok(summary.resolved >= 2);
      assert.ok(typeof summary.avgResolutionHours === 'number');
      assert.ok(Array.isArray(byCategory));
      assert.ok(Array.isArray(byLocation));
    });

    await test('Non-admin cannot access analytics (403 Forbidden)', async () => {
      const res = await req('/analytics', {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      assert.strictEqual(res.status, 403);
    });

  } finally {
    server.close();
    await closeDB();
  }

  console.log('\n==================================================');
  console.log(`🏁 Test Summary: ${passed} passed, ${failed} failed`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
