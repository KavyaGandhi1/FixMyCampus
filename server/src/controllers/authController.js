import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'supersecret_fixmycampus_jwt_token_key_change_in_production',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

// @desc    Register a new student account (Public Registration)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, department, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    // Security requirement: Public registration can NEVER create staff or admin
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      department: department?.trim() || '',
      phone: phone?.trim() || '',
      role: 'student',
      accountStatus: 'active',
      isActive: true
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Student registration successful.',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check if staff account is still pending activation
    if (user.accountStatus === 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Your staff account is pending activation. Please use the activation link sent by your administrator to set your password.'
      });
    }

    // Check if account has been deactivated
    if (user.accountStatus === 'deactivated' || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact campus admin.'
      });
    }

    if (!(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user._id, user.role);

    // Remove password before sending response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Activate staff account via invitation token and set password
// @route   POST /api/auth/activate-staff
// @access  Public
export const activateStaff = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Invitation token is required.'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    // Hash the incoming raw token to look up in the database
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    const invitation = await Invitation.findOne({
      tokenHash,
      isUsed: false,
      isRevoked: false
    });

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid, revoked, or already-used invitation link. Please request a new invitation from your administrator.'
      });
    }

    // Check expiration
    if (new Date() > invitation.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'This invitation link has expired. Please contact your administrator to resend an invitation.'
      });
    }

    const staffUser = await User.findById(invitation.staffUser);
    if (!staffUser) {
      return res.status(404).json({
        success: false,
        message: 'Associated staff account no longer exists.'
      });
    }

    if (staffUser.accountStatus === 'deactivated') {
      return res.status(403).json({
        success: false,
        message: 'This staff account has been deactivated by an administrator.'
      });
    }

    // Activate staff account and set password
    staffUser.password = password;
    staffUser.accountStatus = 'active';
    staffUser.isActive = true;
    await staffUser.save();

    // Mark invitation as used
    invitation.isUsed = true;
    invitation.usedAt = new Date();
    await invitation.save();

    // Invalidate any other pending invitations for this user
    await Invitation.updateMany(
      { staffUser: staffUser._id, _id: { $ne: invitation._id }, isUsed: false },
      { isRevoked: true }
    );

    res.status(200).json({
      success: true,
      message: 'Staff account activated successfully! You can now log in to the Staff Portal.',
      email: staffUser.email
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear token on client
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
};
