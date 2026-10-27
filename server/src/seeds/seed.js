import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import crypto from 'crypto';
import { connectDB, closeDB } from '../config/db.js';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import Comment from '../models/Comment.js';
import Invitation from '../models/Invitation.js';

export const seedData = async () => {
  try {
    console.log('🌱 Starting FixMyCampus database seed...');

    // Clear existing data
    await User.deleteMany({});
    await Issue.deleteMany({});
    await Comment.deleteMany({});
    await Invitation.deleteMany({});
    console.log('🧹 Existing collections cleaned.');

    // 1. Create Users
    const admin = await User.create({
      name: 'Campus Facilities Admin',
      email: 'admin@campus.edu',
      password: 'Password123!',
      role: 'admin',
      department: 'Facilities & Operations',
      employeeId: 'ADM-001',
      phone: '+1-555-0100',
      accountStatus: 'active',
      isActive: true
    });

    const staffIT = await User.create({
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@campus.edu',
      password: 'Password123!',
      role: 'staff',
      department: 'IT & Network Infrastructure',
      employeeId: 'EMP-IT-01',
      phone: '+1-555-0101',
      accountStatus: 'active',
      isActive: true
    });

    const staffElec = await User.create({
      name: 'David Miller',
      email: 'david.miller@campus.edu',
      password: 'Password123!',
      role: 'staff',
      department: 'Electrical Maintenance',
      employeeId: 'EMP-EL-02',
      phone: '+1-555-0102',
      accountStatus: 'active',
      isActive: true
    });

    const staffPlumb = await User.create({
      name: 'Robert Chang',
      email: 'robert.chang@campus.edu',
      password: 'Password123!',
      role: 'staff',
      department: 'Plumbing & Sanitation',
      employeeId: 'EMP-PL-03',
      phone: '+1-555-0103',
      accountStatus: 'active',
      isActive: true
    });

    // Sample pending staff member with an active invitation
    const staffPending = await User.create({
      name: 'Marcus Vance',
      email: 'marcus.vance@campus.edu',
      role: 'staff',
      department: 'HVAC & Refrigeration',
      employeeId: 'EMP-HVAC-04',
      phone: '+1-555-0104',
      accountStatus: 'pending',
      isActive: true
    });

    const demoRawToken = 'test-staff-invitation-token-2026';
    const demoTokenHash = crypto.createHash('sha256').update(demoRawToken).digest('hex');
    await Invitation.create({
      staffUser: staffPending._id,
      tokenHash: demoTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isUsed: false,
      isRevoked: false,
      createdBy: admin._id
    });

    const studentAlex = await User.create({
      name: 'Alex Rivera',
      email: 'alex.rivera@student.edu',
      password: 'Password123!',
      role: 'student',
      department: 'Computer Science',
      phone: '+1-555-0201',
      accountStatus: 'active',
      isActive: true
    });

    const studentEmma = await User.create({
      name: 'Emma Watson',
      email: 'emma.watson@student.edu',
      password: 'Password123!',
      role: 'student',
      department: 'Mechanical Engineering',
      phone: '+1-555-0202',
      accountStatus: 'active',
      isActive: true
    });

    console.log('👤 Users created (1 Admin, 3 Staff, 2 Students).');

    // 2. Create Realistic Campus Issues
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const twoDays = 48 * 60 * 60 * 1000;
    const threeDays = 72 * 60 * 60 * 1000;

    // Issue 1: Wi-Fi outage (in_progress)
    const issue1 = await Issue.create({
      ticketId: 'FMC-2026-IT001',
      title: 'High latency and intermittent Wi-Fi drops in Study Hall',
      description: 'The Eduroam access point in the 2nd floor west study area keeps disconnecting every few minutes during peak hours.',
      category: 'Wi-Fi',
      building: 'Main Library',
      room: '2nd Floor West Wing',
      priority: 'high',
      status: 'in_progress',
      reporter: studentAlex._id,
      assignedTo: staffIT._id,
      createdAt: new Date(now - twoDays),
      statusHistory: [
        {
          status: 'open',
          changedBy: studentAlex._id,
          changedAt: new Date(now - twoDays),
          note: 'Ticket submitted by student.'
        },
        {
          status: 'in_progress',
          changedBy: staffIT._id,
          changedAt: new Date(now - oneDay),
          note: 'Assigned to IT. Investigating AP switch ports and DHCP pool.'
        }
      ]
    });

    // Issue 2: Broken Projector (open, unassigned)
    const issue2 = await Issue.create({
      ticketId: 'FMC-2026-AV002',
      title: 'Overheating HDMI Projector in Lecture Hall 3',
      description: 'Projector turns on for 3 minutes, displays orange error warning, and powers off automatically.',
      category: 'Projector/AV',
      building: 'Academic Block A',
      room: 'Room 302',
      priority: 'high',
      status: 'open',
      reporter: studentEmma._id,
      assignedTo: null,
      createdAt: new Date(now - oneDay),
      statusHistory: [
        {
          status: 'open',
          changedBy: studentEmma._id,
          changedAt: new Date(now - oneDay),
          note: 'Ticket submitted. Upcoming exam review sessions need this room.'
        }
      ]
    });

    // Issue 3: Water Leakage (resolved)
    const issue3Created = new Date(now - threeDays);
    const issue3Resolved = new Date(now - oneDay);
    const issue3 = await Issue.create({
      ticketId: 'FMC-2026-PL003',
      title: 'Pressurized water pipe leakage beneath sink',
      description: 'Continuous leaking puddle forming near washbasin counter. Slip hazard for residents.',
      category: 'Plumbing',
      building: 'Hostel 3',
      room: 'Ground Floor Restroom',
      priority: 'medium',
      status: 'resolved',
      reporter: studentAlex._id,
      assignedTo: staffPlumb._id,
      createdAt: issue3Created,
      resolvedAt: issue3Resolved,
      resolutionNote: 'Replaced ruptured valve gasket and tightened brass compression coupling.',
      statusHistory: [
        {
          status: 'open',
          changedBy: studentAlex._id,
          changedAt: issue3Created,
          note: 'Reported leak.'
        },
        {
          status: 'in_progress',
          changedBy: staffPlumb._id,
          changedAt: new Date(issue3Created.getTime() + 6 * 60 * 60 * 1000),
          note: 'Inspected leak location and ordered replacement seal.'
        },
        {
          status: 'resolved',
          changedBy: staffPlumb._id,
          changedAt: issue3Resolved,
          note: 'Replaced ruptured valve gasket and tightened brass compression coupling.'
        }
      ]
    });

    // Issue 4: Electrical socket fault (open, unassigned)
    const issue4 = await Issue.create({
      ticketId: 'FMC-2026-EL004',
      title: 'Sparks observed from 230V wall socket',
      description: 'Left side power outlet on bench 4 is loose and sparks when plugging in laptop charger.',
      category: 'Electrical',
      building: 'Science Complex',
      room: 'Physics Lab B10',
      priority: 'high',
      status: 'open',
      reporter: studentEmma._id,
      assignedTo: null,
      createdAt: new Date(now - 12 * 60 * 60 * 1000),
      statusHistory: [
        {
          status: 'open',
          changedBy: studentEmma._id,
          changedAt: new Date(now - 12 * 60 * 60 * 1000),
          note: 'Urgent safety hazard reported.'
        }
      ]
    });

    // Issue 5: Cleanliness issue (closed)
    const issue5Created = new Date(now - fourDaysAgo(4));
    const issue5Resolved = new Date(now - twoDays);
    const issue5Closed = new Date(now - oneDay);
    const issue5 = await Issue.create({
      ticketId: 'FMC-2026-CL005',
      title: 'Recycling bin overflow and beverage spill in cafeteria hallway',
      description: 'Multiple recycling bins full and liquid spill across corridor floor.',
      category: 'Cleanliness',
      building: 'Dining Hall & Cafeteria',
      room: 'North Entrance Hallway',
      priority: 'low',
      status: 'closed',
      reporter: studentAlex._id,
      assignedTo: staffPlumb._id,
      createdAt: issue5Created,
      resolvedAt: issue5Resolved,
      closedAt: issue5Closed,
      resolutionNote: 'Sanitation crew cleared bins and machine-mopped corridor.',
      statusHistory: [
        {
          status: 'open',
          changedBy: studentAlex._id,
          changedAt: issue5Created,
          note: 'Reported spill.'
        },
        {
          status: 'resolved',
          changedBy: staffPlumb._id,
          changedAt: issue5Resolved,
          note: 'Area cleared and disinfected.'
        },
        {
          status: 'closed',
          changedBy: admin._id,
          changedAt: issue5Closed,
          note: 'Confirmed inspected and closed.'
        }
      ]
    });

    console.log('📋 Sample maintenance issues seeded.');

    // 3. Add Comments
    await Comment.create([
      {
        issue: issue1._id,
        author: studentAlex._id,
        content: 'Any updates? Many students studying for midterms are affected.',
        isInternal: false,
        createdAt: new Date(now - oneDay + 2 * 60 * 60 * 1000)
      },
      {
        issue: issue1._id,
        author: staffIT._id,
        content: 'We identified firmware packet drop on Cisco AP-3800. Updating firmware tonight at 11 PM.',
        isInternal: false,
        createdAt: new Date(now - oneDay + 4 * 60 * 60 * 1000)
      },
      {
        issue: issue1._id,
        author: staffIT._id,
        content: 'Internal note: If firmware flash does not resolve, replace PoE injector switch module.',
        isInternal: true,
        createdAt: new Date(now - oneDay + 5 * 60 * 60 * 1000)
      },
      {
        issue: issue3._id,
        author: studentAlex._id,
        content: 'Thank you for fixing it promptly! Verified no water on floor.',
        isInternal: false,
        createdAt: new Date(issue3Resolved.getTime() + 2 * 60 * 60 * 1000)
      }
    ]);

    console.log('💬 Realistic issue comments seeded.');
    console.log('🎉 FixMyCampus database seed completed successfully!');
    console.log('\nDefault Test Credentials:');
    console.log('----------------------------------------------------');
    console.log('Admin:   admin@campus.edu        / Password123!');
    console.log('Staff:   david.miller@campus.edu / Password123! (Electrical)');
    console.log('Staff:   sarah.jenkins@campus.edu/ Password123! (IT)');
    console.log('Staff:   robert.chang@campus.edu / Password123! (Plumbing)');
    console.log('Student: alex.rivera@student.edu / Password123!');
    console.log('Student: emma.watson@student.edu / Password123!');
    console.log('----------------------------------------------------\n');

    return true;
  } catch (error) {
    console.error('❌ Database seed error:', error);
    throw error;
  }
};

function fourDaysAgo(days) {
  return days * 24 * 60 * 60 * 1000;
}

// If executed directly from command line: node src/seeds/seed.js
if (process.argv[1]?.endsWith('seed.js')) {
  (async () => {
    try {
      await connectDB();
      await seedData();
      await closeDB();
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}
