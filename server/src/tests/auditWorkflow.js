import assert from 'assert';

const BASE_URL = 'http://localhost:5000/api';

const runAudit = async () => {
  console.log('\n🔍 ===================================================');
  console.log('   FixMyCampus 12-Step Integration Audit Running...  ');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  const testStep = async (stepNumber, title, fn) => {
    try {
      console.log(`\n▶ Step ${stepNumber}: ${title}`);
      await fn();
      console.log(`  ✅ PASSED: Step ${stepNumber} - ${title}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAILED: Step ${stepNumber} - ${title}`);
      console.error(`     Error Details: ${err.message}`);
      failed++;
      throw err;
    }
  };

  const req = async (endpoint, options = {}) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
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

  const uniqueSuffix = Date.now().toString().slice(-4);
  const studentEmail = `student_${uniqueSuffix}@campus.edu`;
  const studentPassword = 'Password123!';
  let studentToken = '';
  let studentUser = null;
  let createdIssue = null;
  let adminToken = '';
  let staffToken = '';
  let assignedStaffMember = null;

  // 1. Register a student
  await testStep(1, 'Register a student', async () => {
    const res = await req('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: `Audit Student ${uniqueSuffix}`,
        email: studentEmail,
        password: studentPassword,
        department: 'Biotechnology',
        phone: '+1-555-9988'
      })
    });
    assert.strictEqual(res.status, 201, `Expected status 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.role, 'student');
    assert.strictEqual(res.body.user.email, studentEmail);
    assert.ok(res.body.token, 'Must return JWT token');
  });

  // 2. Log in as that student
  await testStep(2, 'Log in as that student', async () => {
    const res = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: studentEmail,
        password: studentPassword
      })
    });
    assert.strictEqual(res.status, 200, `Expected status 200, got ${res.status}`);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.role, 'student');
    studentToken = res.body.token;
    studentUser = res.body.user;
  });

  // 3. Create an issue
  await testStep(3, 'Create an issue', async () => {
    const issueData = {
      title: `Broken HVAC unit in Hallway B-${uniqueSuffix}`,
      category: 'Electrical',
      building: 'Science Complex',
      room: `Room 105-${uniqueSuffix}`,
      priority: 'high',
      description: 'The overhead AC unit is leaking condensation and causing an electrical hum.'
    };

    const res = await req('/issues', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify(issueData)
    });

    assert.strictEqual(res.status, 201, `Failed to create issue: ${JSON.stringify(res.body)}`);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.issue, 'Should return created issue');
    assert.ok(res.body.issue._id, 'Should have MongoDB ObjectId _id');
    assert.ok(res.body.issue.ticketId, 'Should have generated ticketId');
    assert.strictEqual(res.body.issue.status, 'open');
    assert.strictEqual(res.body.issue.priority, 'high');
    createdIssue = res.body.issue;
  });

  // 4. Confirm the issue is stored in MongoDB
  await testStep(4, 'Confirm the issue is stored in MongoDB', async () => {
    const res = await req(`/issues/${createdIssue._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(res.status, 200, 'Issue should be retrieved by its MongoDB ObjectId');
    assert.strictEqual(res.body.issue._id, createdIssue._id);
    assert.strictEqual(res.body.issue.ticketId, createdIssue.ticketId);
    assert.strictEqual(res.body.issue.reporter._id, studentUser._id);
  });

  // 5. Confirm the issue appears in the student\'s dashboard
  await testStep(5, "Confirm the issue appears in the student's dashboard list", async () => {
    const res = await req('/issues', {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.issues), 'Should return array of issues');
    const found = res.body.issues.find(i => i._id === createdIssue._id);
    assert.ok(found, 'Created issue must appear in student issue list');
    assert.strictEqual(found.ticketId, createdIssue.ticketId);
  });

  // 6. Open the issue details
  await testStep(6, 'Open the issue details and verify relations and status history', async () => {
    const res = await req(`/issues/${createdIssue._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(res.status, 200);
    const detail = res.body.issue;
    assert.strictEqual(detail.title, createdIssue.title);
    assert.strictEqual(detail.reporter.email, studentEmail);
    assert.ok(Array.isArray(detail.statusHistory));
    assert.strictEqual(detail.statusHistory[0].status, 'open');
  });

  // 7. Log in as an administrator
  await testStep(7, 'Log in as an administrator', async () => {
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

  // 8. Assign the issue to a staff member
  await testStep(8, 'Assign the issue to a staff member', async () => {
    // First get active staff members
    const staffRes = await req('/users/staff', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(staffRes.status, 200);
    assert.ok(staffRes.body.staff.length > 0, 'Staff directory must have at least one technician');
    assignedStaffMember = staffRes.body.staff[0]; // e.g. David Miller (Electrical)

    // Assign issue
    const assignRes = await req(`/issues/${createdIssue._id}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        staffId: assignedStaffMember._id,
        note: 'Assigned to technician for immediate electrical inspection.'
      })
    });
    assert.strictEqual(assignRes.status, 200, `Assignment failed: ${JSON.stringify(assignRes.body)}`);
    assert.strictEqual(assignRes.body.issue.assignedTo._id, assignedStaffMember._id);
  });

  // 9. Log in as the assigned staff member
  await testStep(9, 'Log in as the assigned staff member', async () => {
    const res = await req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: assignedStaffMember.email,
        password: 'Password123!'
      })
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.role, 'staff');
    staffToken = res.body.token;

    // Verify the issue shows in staff queue
    const staffIssuesRes = await req('/issues', {
      headers: { Authorization: `Bearer ${staffToken}` }
    });
    assert.strictEqual(staffIssuesRes.status, 200);
    const assigned = staffIssuesRes.body.issues.find(i => i._id === createdIssue._id);
    assert.ok(assigned, 'Issue must appear in assigned technician queue');
  });

  // 10. Update the issue status and add a progress comment
  await testStep(10, 'Update the issue status and add a progress comment', async () => {
    // 10a: Transition status from open -> in_progress
    const progressRes = await req(`/issues/${createdIssue._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({
        status: 'in_progress',
        note: 'Technician on-site with multimeter. Testing circuit and replacing condensation pump.'
      })
    });
    assert.strictEqual(progressRes.status, 200);
    assert.strictEqual(progressRes.body.issue.status, 'in_progress');

    // 10b: Add progress comment
    const commentRes = await req(`/issues/${createdIssue._id}/comments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({
        content: 'Pump replaced. Monitoring noise and cooling for 30 minutes.'
      })
    });
    assert.strictEqual(commentRes.status, 201);
    assert.strictEqual(commentRes.body.comment.author.role, 'staff');

    // 10c: Transition status from in_progress -> resolved
    const resolveRes = await req(`/issues/${createdIssue._id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffToken}` },
      body: JSON.stringify({
        status: 'resolved',
        note: 'HVAC pump replaced and electrical humming eliminated. Operational.'
      })
    });
    assert.strictEqual(resolveRes.status, 200);
    assert.strictEqual(resolveRes.body.issue.status, 'resolved');
    assert.ok(resolveRes.body.issue.resolvedAt, 'Must record resolvedAt timestamp');
  });

  // 11. Confirm the student can see the updated status and history
  await testStep(11, 'Confirm the student can see the updated status, history, and comments', async () => {
    const res = await req(`/issues/${createdIssue._id}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(res.status, 200);
    const updated = res.body.issue;
    assert.strictEqual(updated.status, 'resolved');
    assert.ok(updated.statusHistory.length >= 3, 'Should record open, in_progress, and resolved steps');
    assert.strictEqual(updated.statusHistory[updated.statusHistory.length - 1].status, 'resolved');

    // Confirm student can see comments
    const commentRes = await req(`/issues/${createdIssue._id}/comments`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.strictEqual(commentRes.status, 200);
    assert.ok(commentRes.body.comments.length >= 1);
    assert.strictEqual(commentRes.body.comments[0].content, 'Pump replaced. Monitoring noise and cooling for 30 minutes.');
  });

  // 12. Verify that admin analytics reflect the actual stored records
  await testStep(12, 'Verify that admin analytics reflect the actual stored records', async () => {
    const res = await req('/analytics', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    const { summary, byCategory, byLocation } = res.body.data;
    assert.ok(summary.total >= 6, `Expected at least 6 total issues, got ${summary.total}`);
    assert.ok(summary.resolved >= 1, `Expected at least 1 resolved, got ${summary.resolved}`);
    assert.ok(typeof summary.avgResolutionHours === 'number', 'avgResolutionHours must be numeric');
    
    // Check category includes Electrical
    const elecCategory = byCategory.find(c => c.category === 'Electrical');
    assert.ok(elecCategory && elecCategory.count >= 1, 'Analytics must aggregate Electrical category count');

    // Check location includes Science Complex
    const scienceBuilding = byLocation.find(b => b.building === 'Science Complex');
    assert.ok(scienceBuilding && scienceBuilding.count >= 1, 'Analytics must aggregate Science Complex location');
  });

  console.log('\n===================================================');
  console.log(`🎉 12-Step Audit Completed Successfully!`);
  console.log(`   Passed: ${passed} / 12 steps`);
  console.log('===================================================\n');
};

runAudit().catch((err) => {
  console.error('\n💥 Audit Terminated due to error:', err);
  process.exit(1);
});
