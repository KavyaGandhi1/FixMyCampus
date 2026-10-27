import User from '../models/User.js';

// @desc    Get all staff members (for issue assignment)
// @route   GET /api/users/staff
// @access  Private (Admin & Staff)
export const getStaffMembers = async (req, res, next) => {
  try {
    const staff = await User.find({ role: 'staff', isActive: true })
      .select('name email department phone')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: staff.length,
      staff
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (with optional role filter)
// @route   GET /api/users
// @access  Private (Admin only)
export const getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const query = {};
    if (role && ['student', 'staff', 'admin'].includes(role)) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};
