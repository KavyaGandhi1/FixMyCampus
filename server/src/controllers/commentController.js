import Comment from '../models/Comment.js';
import Issue from '../models/Issue.js';

// @desc    Get comments for an issue
// @route   GET /api/issues/:issueId/comments
// @access  Private (Authorized users)
export const getComments = async (req, res, next) => {
  try {
    const { issueId } = req.params;

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.'
      });
    }

    // Authorization check
    if (
      req.user.role === 'student' &&
      issue.reporter.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view comments on your own reported tickets.'
      });
    }

    const commentQuery = { issue: issueId };
    // Students cannot view internal staff notes
    if (req.user.role === 'student') {
      commentQuery.isInternal = { $ne: true };
    }

    const comments = await Comment.find(commentQuery)
      .populate('author', 'name role department')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      comments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to an issue
// @route   POST /api/issues/:issueId/comments
// @access  Private (Authorized users)
export const addComment = async (req, res, next) => {
  try {
    const { issueId } = req.params;
    const { content, isInternal } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content cannot be empty.'
      });
    }

    if (content.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 1000 characters.'
      });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.'
      });
    }

    // Role check: Students cannot comment on tickets they don't own
    if (
      req.user.role === 'student' &&
      issue.reporter.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot comment on tickets you did not create.'
      });
    }

    // Only staff and admin can flag comments as internal notes
    const internalNoteFlag = (req.user.role === 'admin' || req.user.role === 'staff') && Boolean(isInternal);

    const comment = await Comment.create({
      issue: issueId,
      author: req.user._id,
      content: content.trim(),
      isInternal: internalNoteFlag
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name role department');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      comment: populatedComment
    });
  } catch (error) {
    next(error);
  }
};
