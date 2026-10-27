import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supersecret_fixmycampus_jwt_token_key_change_in_production'
      );

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.'
        });
      }

      // Immediate session revocation for deactivated accounts
      if (req.user.accountStatus === 'deactivated' || req.user.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact an administrator.'
        });
      }

      // Pending staff members who have not activated their account
      if (req.user.accountStatus === 'pending') {
        return res.status(403).json({
          success: false,
          message: 'Your account is pending activation. Please set your password using your invitation link.'
        });
      }

      return next();
    } catch (error) {
      console.error('JWT verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed or expired.'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided.'
    });
  }
};
