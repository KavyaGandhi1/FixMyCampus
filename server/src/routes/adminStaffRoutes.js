import express from 'express';
import {
  getStaffList,
  createStaffMember,
  updateStaffStatus,
  resendStaffInvitation
} from '../controllers/adminStaffController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { invitationLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getStaffList)
  .post(invitationLimiter, createStaffMember);

router.patch('/:id/status', validateObjectId('id'), updateStaffStatus);
router.post('/:id/resend-invitation', validateObjectId('id'), invitationLimiter, resendStaffInvitation);

export default router;
