import express from 'express';
import {
  createIssue,
  getIssues,
  getIssueById,
  updateIssueStatus,
  assignIssue,
  updatePriority,
  checkDuplicates
} from '../controllers/issueController.js';
import { getComments, addComment } from '../controllers/commentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getIssues)
  .post(upload.single('image'), createIssue);

router.post('/check-duplicates', checkDuplicates);

router.route('/:id')
  .get(validateObjectId('id'), getIssueById);

router.patch('/:id/status', validateObjectId('id'), updateIssueStatus);
router.patch('/:id/assign', authorize('admin'), validateObjectId('id'), assignIssue);
router.patch('/:id/priority', authorize('admin'), validateObjectId('id'), updatePriority);

// Nested comment routes
router.route('/:issueId/comments')
  .get(validateObjectId('issueId'), getComments)
  .post(validateObjectId('issueId'), addComment);

export default router;
