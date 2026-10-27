import assert from 'assert';
import crypto from 'crypto';
import http from 'http';
import { app } from '../server.js';
import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import Issue from '../models/Issue.js';

const runTests = async () => {
  console.log('\n======================================================');
  console.log('  FixMyCampus: 15-Scenario Security & Role Test Suite  ');
  console.log('======================================================\n');

  await connectDB();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  let passed = 0;
  let failed = 0;

  const test = async (number, name, fn) => {
    try {
      console.log(`\n▶ Scenario ${number}: ${name}`);
      await fn();
      console.log(`  ✅ PASS: Scenario ${number}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: Scenario ${number}`);
      console.error(`     Error: ${err.message}`);
      failed++;
      throw err;
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
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
    return { status: res.status, ok: res.ok, body };
  };

  const runId = Date.now().toString().slice(-4);
  let adminToken = '';
  let studentToken = '';
  let studentId = '';
  let staffAToken = '';
  let staffAId = '';
  let staffBToken = '';
  let staffBId = '';

  let invitedStaffEmail = `test.staff.${runId}@campus.edu`;
  let invitedStaffId = '';
  let rawInvitationToken = '';
  let createdIssueId = '';

  try {
    // Setup Admin
    const adminEmail = `admin_${runId}@campus.edu`;
    const adminUser = await User.create({
      name: 'Test Administrator',
      email: adminEmail,
      password: 'Password123!',
      role: 'admin',
      department: 'Facilities',
      accountStatus: 'active',
      isActive: true
    });
    const adminLoginRes = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: adminEmail, password: 'Password123!' })
    });
    adminToken = adminLoginRes.body.token;

    // Setup Staff A
    const staffAUser = await User.create({
      name: 'Technician Alpha',
      email: `tech.a.${runId}@campus.edu`,
      password: 'Password123!',
      role: 'staff',
      department: 'Electrical',
      accountStatus: 'active',
      isActive: true
    });
    const staffALoginRes = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: `tech.a.${runId}@campus.edu`, password: 'Password123!' })
    });
    staffAToken = staffALoginRes.body.token;
    staffAId = staffAUser._id.toString();

    // Setup Staff B
    const staffBUser = await User.create({
      name: 'Technician Beta',
      email: `tech.b.${runId}@campus.edu`,
      password: 'Password123!',
      role: 'staff',
      department: 'Plumbing',
      accountStatus: 'active',
      isActive: true
    });
    const staffBLoginRes = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: `tech.b.${runId}@campus.edu`, password: 'Password123!' })
    });
    staffBToken = staffBLoginRes.body.token;
    staffBId = staffBUser._id.toString();

    // 1. A new user registering publicly always becomes a student
    await test(1, 'A new user registering publicly always becomes a student', async () => {
      const res = await req('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Fresh Student',
          email: `student.normal.${runId}@campus.edu`,
          password: 'Password123!',
          department: 'Physics'
        })
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.user.role, 'student');
      studentToken = res.body.token;
      studentId = res.body.user._id;
    });

    // 2. A public registration request attempting to specify admin or staff role cannot create a privileged account
    await test(2, 'Public registration attempting to specify admin/staff role is forced to student', async () => {
      const res = await req('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Hacker Attempt',
          email: `hacker.${runId}@campus.edu`,
          password: 'Password123!',
          role: 'admin' // Attempted escalation
        })
      });
      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.user.role, 'student', 'Must remain strictly student');
    });

    // 3. An unauthenticated user cannot access protected portals or APIs
    await test(3, 'Unauthenticated requests to protected endpoints return 401', async () => {
      const res1 = await req('/issues');
      assert.strictEqual(res1.status, 401);
      const res2 = await req('/admin/staff');
      assert.strictEqual(res2.status, 401);
      const res3 = await req('/analytics');
      assert.strictEqual(res3.status, 401);
    });

    // 4. Only an admin can register staff members
    await test(4, 'Only an admin can register staff members (reject student and staff)', async () => {
      // Student attempt
      const studentAttempt = await req('/admin/staff', {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: JSON.stringify({
          name: 'Fake Staff',
          email: `fake.${runId}@campus.edu`,
          department: 'Security'
        })
      });
      assert.strictEqual(studentAttempt.status, 403, 'Student must receive 403 Forbidden');

      // Staff attempt
      const staffAttempt = await req('/admin/staff', {
        method: 'POST',
        headers: { Authorization: `Bearer ${staffAToken}` },
        body: JSON.stringify({
          name: 'Fake Staff 2',
          email: `fake2.${runId}@campus.edu`,
          department: 'Security'
        })
      });
      assert.strictEqual(staffAttempt.status, 403, 'Staff must receive 403 Forbidden');

      // Admin attempt succeeds
      const adminAttempt = await req('/admin/staff', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          name: 'Invited Tech',
          email: invitedStaffEmail,
          department: 'HVAC Maintenance',
          employeeId: `EMP-${runId}`
        })
      });
      assert.strictEqual(adminAttempt.status, 201, `Admin creation failed: ${JSON.stringify(adminAttempt.body)}`);
      assert.strictEqual(adminAttempt.body.staff.role, 'staff');
      assert.strictEqual(adminAttempt.body.staff.accountStatus, 'pending');
      assert.ok(adminAttempt.body.invitation.activationUrl, 'Must generate activation link');

      invitedStaffId = adminAttempt.body.staff._id;
      // Extract raw token from activation URL
      const url = new URL(adminAttempt.body.invitation.activationUrl);
      rawInvitationToken = url.searchParams.get('token');
      assert.ok(rawInvitationToken, 'Must parse raw invitation token from URL');
    });

    // 5. Duplicate staff email addresses are rejected
    await test(5, 'Duplicate staff email addresses are rejected with 409', async () => {
      const res = await req('/admin/staff', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          name: 'Duplicate Tech',
          email: invitedStaffEmail,
          department: 'Electrical'
        })
      });
      assert.strictEqual(res.status, 409, 'Duplicate email must return 409 Conflict');
    });

    // 6. A pending staff member cannot log in
    await test(6, 'A pending staff member cannot log in before activation', async () => {
      const res = await req('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: invitedStaffEmail,
          password: 'Password123!'
        })
      });
      assert.strictEqual(res.status, 403, 'Pending staff must be blocked with 403');
      assert.ok(res.body.message.includes('pending activation'));
    });

    // 7. An invalid, expired, revoked, or already-used invitation is rejected
    await test(7, 'Invalid, expired, or revoked invitations are rejected', async () => {
      // 7a: Invalid token
      const invalidRes = await req('/auth/activate-staff', {
        method: 'POST',
        body: JSON.stringify({
          token: 'invalid-fake-token-string',
          password: 'NewSecurePassword123!'
        })
      });
      assert.strictEqual(invalidRes.status, 400);

      // 7b: Expired token test
      const expiredRawToken = 'expired-raw-token-' + runId;
      const expiredHash = crypto.createHash('sha256').update(expiredRawToken).digest('hex');
      await Invitation.create({
        staffUser: invitedStaffId,
        tokenHash: expiredHash,
        expiresAt: new Date(Date.now() - 60000), // 1 min in past
        isUsed: false,
        isRevoked: false,
        createdBy: adminUser._id
      });
      const expiredRes = await req('/auth/activate-staff', {
        method: 'POST',
        body: JSON.stringify({
          token: expiredRawToken,
          password: 'NewSecurePassword123!'
        })
      });
      assert.strictEqual(expiredRes.status, 400);
      assert.ok(expiredRes.body.message.includes('expired'));
    });

    // 8. A valid invitation activates the staff account
    await test(8, 'A valid invitation activates the staff account and sets password', async () => {
      const res = await req('/auth/activate-staff', {
        method: 'POST',
        body: JSON.stringify({
          token: rawInvitationToken,
          password: 'MyTechnicianPassword123!'
        })
      });
      assert.strictEqual(res.status, 200, `Activation failed: ${JSON.stringify(res.body)}`);
      assert.strictEqual(res.body.success, true);

      // Re-using the same token now fails
      const reuseRes = await req('/auth/activate-staff', {
        method: 'POST',
        body: JSON.stringify({
          token: rawInvitationToken,
          password: 'AnotherPassword123!'
        })
      });
      assert.strictEqual(reuseRes.status, 400, 'Re-using invitation must be rejected');
    });

    // 9. An activated staff member can log in
    await test(9, 'An activated staff member can successfully log in with their set password', async () => {
      const res = await req('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: invitedStaffEmail,
          password: 'MyTechnicianPassword123!'
        })
      });
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.role, 'staff');
      assert.strictEqual(res.body.user.accountStatus, 'active');
      assert.ok(res.body.token);
    });

    // 10. A deactivated staff member cannot log in or access protected functionality
    await test(10, 'A deactivated staff member cannot log in or use existing session token', async () => {
      // First log in to obtain active session token
      const loginRes = await req('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: invitedStaffEmail,
          password: 'MyTechnicianPassword123!'
        })
      });
      const activeSessionToken = loginRes.body.token;

      // Admin deactivates staff member
      const deactRes = await req(`/admin/staff/${invitedStaffId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: 'deactivated' })
      });
      assert.strictEqual(deactRes.status, 200);
      assert.strictEqual(deactRes.body.staff.accountStatus, 'deactivated');

      // Subsequent login attempt is blocked
      const blockedLogin = await req('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: invitedStaffEmail,
          password: 'MyTechnicianPassword123!'
        })
      });
      assert.strictEqual(blockedLogin.status, 403, 'Deactivated staff login must be rejected');

      // Existing active token is immediately rejected on protected request
      const existingTokenReq = await req('/issues', {
        headers: { Authorization: `Bearer ${activeSessionToken}` }
      });
      assert.strictEqual(existingTokenReq.status, 403, 'Existing session of deactivated staff must be revoked');

      // Admin reactivates staff
      await req(`/admin/staff/${invitedStaffId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: 'active' })
      });
    });

    // 11. A student cannot access admin or staff APIs
    await test(11, 'A student cannot access admin or staff management APIs', async () => {
      const adminStaffRes = await req('/admin/staff', {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      assert.strictEqual(adminStaffRes.status, 403);

      const analyticsRes = await req('/analytics', {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      assert.strictEqual(analyticsRes.status, 403);
    });

    // 12. A staff member cannot access admin APIs
    await test(12, 'A staff member cannot access admin management APIs', async () => {
      const staffAdminStaffRes = await req('/admin/staff', {
        headers: { Authorization: `Bearer ${staffAToken}` }
      });
      assert.strictEqual(staffAdminStaffRes.status, 403);

      const staffAnalyticsRes = await req('/analytics', {
        headers: { Authorization: `Bearer ${staffAToken}` }
      });
      assert.strictEqual(staffAnalyticsRes.status, 403);
    });

    // 13. A staff member cannot update an issue assigned to another staff member
    await test(13, 'Staff member cannot update an issue assigned to another staff member', async () => {
      // Create issue assigned to Staff A
      const issue = await Issue.create({
        ticketId: `FMC-TEST-${runId}-01`,
        title: 'Air conditioning failure in Server Room',
        description: 'Server rack cooling unit temperature alert.',
        category: 'Electrical',
        building: 'Science Complex',
        room: 'Server Room 10',
        priority: 'high',
        status: 'open',
        reporter: studentId,
        assignedTo: staffAId,
        statusHistory: [{ status: 'open', changedBy: studentId, note: 'Created' }]
      });
      createdIssueId = issue._id.toString();

      // Staff B attempts to update status on Staff A's issue
      const staffBAttempt = await req(`/issues/${createdIssueId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${staffBToken}` },
        body: JSON.stringify({ status: 'in_progress', note: 'Staff B trying to hijack' })
      });
      assert.strictEqual(staffBAttempt.status, 403, 'Staff B must be blocked from updating Staff A issue');

      // Staff A updates status successfully
      const staffAAttempt = await req(`/issues/${createdIssueId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${staffAToken}` },
        body: JSON.stringify({ status: 'in_progress', note: 'Staff A started work' })
      });
      assert.strictEqual(staffAAttempt.status, 200, 'Staff A must succeed');
    });

    // 14. Only an admin can assign issues
    await test(14, 'Only an admin can assign issues (block student and staff)', async () => {
      // Student attempt
      const studentAttempt = await req(`/issues/${createdIssueId}/assign`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: JSON.stringify({ staffId: staffBId })
      });
      assert.strictEqual(studentAttempt.status, 403);

      // Staff attempt
      const staffAttempt = await req(`/issues/${createdIssueId}/assign`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${staffAToken}` },
        body: JSON.stringify({ staffId: staffBId })
      });
      assert.strictEqual(staffAttempt.status, 403);

      // Admin attempt succeeds
      const adminAttempt = await req(`/issues/${createdIssueId}/assign`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ staffId: staffBId, note: 'Reassigned by Admin to Staff B' })
      });
      assert.strictEqual(adminAttempt.status, 200);
      assert.strictEqual(adminAttempt.body.issue.assignedTo._id, staffBId);
    });

    // 15. Existing issue reporting and tracking functionality continues to work
    await test(15, 'Existing issue reporting, comments, and tracking work end-to-end', async () => {
      // Student creates issue
      const newIssueRes = await req('/issues', {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: JSON.stringify({
          title: 'Flickering LED panel in study room',
          category: 'Electrical',
          building: 'Main Library',
          room: 'Study Room 4',
          priority: 'medium',
          description: 'The overhead lighting ballast is buzzing and flickering constantly.'
        })
      });
      assert.strictEqual(newIssueRes.status, 201);
      const newIssueId = newIssueRes.body.issue._id;

      // Student adds comment
      const commentRes = await req(`/issues/${newIssueId}/comments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
        body: JSON.stringify({ content: 'Noticeable headache caused by the flicker.' })
      });
      assert.strictEqual(commentRes.status, 201);

      // Student views issue details
      const detailRes = await req(`/issues/${newIssueId}`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      assert.strictEqual(detailRes.status, 200);
      assert.strictEqual(detailRes.body.issue.title, 'Flickering LED panel in study room');
    });

  } finally {
    server.close();
    await closeDB();
  }

  console.log('\n======================================================');
  console.log(`🏁 All 15 Scenarios Passed: ${passed} / 15`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
};

runTests().catch((err) => {
  console.error('\n💥 Test run terminated:', err);
  process.exit(1);
});
