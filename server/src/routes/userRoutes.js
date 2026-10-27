import express from 'express';
import { getStaffMembers, getUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/staff', protect, getStaffMembers);
router.get('/', protect, authorize('admin'), getUsers);

export default router;
