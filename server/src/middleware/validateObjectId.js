import mongoose from 'mongoose';

/**
 * Validates whether a route parameter is a valid MongoDB ObjectId
 * @param {string} paramName The parameter name to validate (defaults to 'id')
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid identifier format for parameter '${paramName}'. Expected a 24-character hexadecimal ObjectId.`
      });
    }
    next();
  };
};
