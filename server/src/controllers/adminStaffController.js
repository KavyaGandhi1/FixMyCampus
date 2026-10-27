import crypto from 'crypto';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import Issue from '../models/Issue.js';

// @desc    List all registered staff members with task counts and invitation status
// @route   GET /api/admin/staff
// @access  Private (Admin only)
export const getStaffList = async (req, res, next) => {
  try {
    const staffList = await User.find({ role: 'staff' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    // Attach assigned issues count and latest invitation status to each staff member
    const enrichedStaff = await Promise.all(
      staffList.map(async (staff) => {
        const [assignedCount, latestInvitation] = await Promise.all([
          Issue.countDocuments({ assignedTo: staff._id }),
          Invitation.findOne({ staffUser: staff._id })
            .sort({ createdAt: -1 })
            .select('expiresAt isUsed isRevoked createdAt')
            .lean()
        ]);

        let invitationStatus = 'none';
        let invitationExpiresAt = null;

        if (latestInvitation) {
          invitationExpiresAt = latestInvitation.expiresAt;
          if (latestInvitation.isUsed) {
            invitationStatus = 'used';
          } else if (latestInvitation.isRevoked) {
            invitationStatus = 'revoked';
          } else if (new Date() > new Date(latestInvitation.expiresAt)) {
            invitationStatus = 'expired';
          } else {
            invitationStatus = 'pending';
          }
        }

        return {
          ...staff,
          assignedIssuesCount: assignedCount,
          invitationStatus,
          invitationExpiresAt
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enrichedStaff.length,
      staff: enrichedStaff
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new staff member and issue an activation invitation
// @route   POST /api/admin/staff
// @access  Private (Admin only)
export const createStaffMember = async (req, res, next) => {
  try {
    const { name, email, department, employeeId } = req.body;

    if (!name || !email || !department) {
      return res.status(400).json({
        success: false,
        message: 'Name, official email, and department are required.'
      });
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Check email uniqueness
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    // 1. Create the staff record in pending state
    const staffUser = await User.create({
      name: name.trim(),
      email: trimmedEmail,
      department: department.trim(),
      employeeId: employeeId ? employeeId.trim() : '',
      role: 'staff',
      accountStatus: 'pending',
      isActive: true
    });

    // 2. Generate cryptographically secure invitation token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store only the hash in the database
    await Invitation.create({
      staffUser: staffUser._id,
      tokenHash,
      expiresAt,
      isUsed: false,
      isRevoked: false,
      createdBy: req.user._id
    });

    // 3. Construct activation link for local testing or email dispatch
    const clientBase = process.env.CLIENT_URL || 'http://localhost:5173';
    const activationUrl = `${clientBase}/activate-staff?token=${rawToken}`;

    res.status(201).json({
      success: true,
      message: 'Staff member registered successfully. Single-use invitation link generated.',
      staff: {
        _id: staffUser._id,
        name: staffUser.name,
        email: staffUser.email,
        department: staffUser.department,
        employeeId: staffUser.employeeId,
        accountStatus: staffUser.accountStatus,
        role: staffUser.role
      },
      invitation: {
        activationUrl,
        expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate or reactivate a staff member
// @route   PATCH /api/admin/staff/:id/status
// @access  Private (Admin only)
export const updateStaffStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const staffUser = await User.findOne({ _id: id, role: 'staff' });
    if (!staffUser) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found.'
      });
    }

    if (status && ['active', 'deactivated'].includes(status)) {
      staffUser.accountStatus = status;
      staffUser.isActive = status === 'active';
    } else {
      // Toggle
      const newStatus = staffUser.accountStatus === 'deactivated' ? 'active' : 'deactivated';
      staffUser.accountStatus = newStatus;
      staffUser.isActive = newStatus === 'active';
    }

    await staffUser.save();

    res.status(200).json({
      success: true,
      message: `Staff member account marked as ${staffUser.accountStatus}.`,
      staff: {
        _id: staffUser._id,
        name: staffUser.name,
        email: staffUser.email,
        department: staffUser.department,
        employeeId: staffUser.employeeId,
        accountStatus: staffUser.accountStatus,
        isActive: staffUser.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Revoke previous invitation and issue a new single-use invitation
// @route   POST /api/admin/staff/:id/resend-invitation
// @access  Private (Admin only)
export const resendStaffInvitation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const staffUser = await User.findOne({ _id: id, role: 'staff' });
    if (!staffUser) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found.'
      });
    }

    if (staffUser.accountStatus === 'deactivated') {
      return res.status(400).json({
        success: false,
        message: 'Cannot issue an invitation to a deactivated account. Reactivate the account first.'
      });
    }

    // Revoke any previous unused invitations
    await Invitation.updateMany(
      { staffUser: staffUser._id, isUsed: false },
      { isRevoked: true }
    );

    // Generate new secure invitation
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await Invitation.create({
      staffUser: staffUser._id,
      tokenHash,
      expiresAt,
      isUsed: false,
      isRevoked: false,
      createdBy: req.user._id
    });

    // Reset account status to pending if it was previously pending
    if (staffUser.accountStatus !== 'active') {
      staffUser.accountStatus = 'pending';
      await staffUser.save();
    }

    const clientBase = process.env.CLIENT_URL || 'http://localhost:5173';
    const activationUrl = `${clientBase}/activate-staff?token=${rawToken}`;

    res.status(200).json({
      success: true,
      message: 'New invitation generated successfully. Previous invitations revoked.',
      invitation: {
        activationUrl,
        expiresAt
      }
    });
  } catch (error) {
    next(error);
  }
};
