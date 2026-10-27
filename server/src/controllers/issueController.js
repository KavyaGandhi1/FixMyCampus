import Issue from '../models/Issue.js';
import User from '../models/User.js';
import { generateTicketId } from '../utils/ticketGenerator.js';
import { validateStatusTransition } from '../utils/statusTransitions.js';
import { processImageUpload } from '../middleware/uploadMiddleware.js';

// @desc    Create a new maintenance issue
// @route   POST /api/issues
// @access  Private (Student, Staff, Admin)
export const createIssue = async (req, res, next) => {
  try {
    const { title, description, category, building, room, priority } = req.body;

    if (!title || !description || !category || !building || !room) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, building, and room are required.'
      });
    }

    // Process image if uploaded
    let imageUrl = null;
    let imagePublicId = null;
    if (req.file) {
      const uploadResult = await processImageUpload(req.file);
      imageUrl = uploadResult.url;
      imagePublicId = uploadResult.publicId;
    }

    // Generate unique ticket ID with collision protection
    let ticketId;
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      ticketId = generateTicketId();
      const existing = await Issue.findOne({ ticketId });
      if (!existing) isUnique = true;
      attempts++;
    }

    const initialHistory = [{
      status: 'open',
      changedBy: req.user._id,
      changedAt: new Date(),
      note: 'Ticket created and reported.'
    }];

    const issue = await Issue.create({
      ticketId,
      title: title.trim(),
      description: description.trim(),
      category,
      building: building.trim(),
      room: room.trim(),
      priority: priority && ['low', 'medium', 'high'].includes(priority.toLowerCase()) ? priority.toLowerCase() : 'medium',
      status: 'open',
      reporter: req.user._id,
      imageUrl,
      imagePublicId,
      statusHistory: initialHistory
    });

    const populatedIssue = await Issue.findById(issue._id)
      .populate('reporter', 'name email department phone role');

    res.status(201).json({
      success: true,
      message: 'Maintenance ticket created successfully.',
      issue: populatedIssue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of issues with pagination, search, and filters
// @route   GET /api/issues
// @access  Private (Role-based access)
export const getIssues = async (req, res, next) => {
  try {
    const {
      search,
      status,
      category,
      priority,
      building,
      assigned,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Role-based visibility
    if (req.user.role === 'student') {
      // Students only see their own reported issues
      query.reporter = req.user._id;
    } else if (req.user.role === 'staff') {
      // Staff see assigned issues, or issues specifically filtered
      if (req.query.viewAll !== 'true') {
        query.assignedTo = req.user._id;
      }
    }
    // Admin sees all issues across campus

    // Search by title or ticket ID
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { ticketId: searchRegex },
        { room: searchRegex }
      ];
    }

    // Filters
    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    if (priority) {
      query.priority = priority.toLowerCase();
    }

    if (building) {
      query.building = building;
    }

    if (assigned === 'false' || assigned === 'unassigned') {
      query.assignedTo = null;
    } else if (assigned === 'true') {
      query.assignedTo = { $ne: null };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [issues, total] = await Promise.all([
      Issue.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .populate('reporter', 'name email department')
        .populate('assignedTo', 'name email department phone')
        .lean(),
      Issue.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: issues.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      limit: limitNum,
      issues
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single issue details
// @route   GET /api/issues/:id
// @access  Private (Authorized roles only)
export const getIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reporter', 'name email department phone role')
      .populate('assignedTo', 'name email department phone role')
      .populate('statusHistory.changedBy', 'name role email');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.'
      });
    }

    // Role authorization check
    if (
      req.user.role === 'student' &&
      issue.reporter._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view tickets that you submitted.'
      });
    }

    res.status(200).json({
      success: true,
      issue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update issue status with workflow constraints
// @route   PATCH /api/issues/:id/status
// @access  Private (Admin, Assigned Staff, Student confirm close)
export const updateIssueStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'New status is required.'
      });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.'
      });
    }

    // Authorization check
    if (req.user.role === 'student') {
      if (issue.reporter.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not the reporter of this issue.'
        });
      }
      if (status !== 'closed' || issue.status !== 'resolved') {
        return res.status(403).json({
          success: false,
          message: 'Students can only close issues that have been marked as resolved.'
        });
      }
    } else if (req.user.role === 'staff') {
      if (!issue.assignedTo || issue.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Staff can only update issues assigned to them.'
        });
      }
    }

    // Validate transition
    const transitionCheck = validateStatusTransition(issue.status, status, req.user.role);
    if (!transitionCheck.valid) {
      return res.status(400).json({
        success: false,
        message: transitionCheck.error
      });
    }

    // Apply status change
    issue.status = status;
    issue.statusHistory.push({
      status,
      changedBy: req.user._id,
      changedAt: new Date(),
      note: note ? note.trim() : `Status changed to ${status}`
    });

    if (status === 'resolved') {
      issue.resolvedAt = new Date();
      if (note) issue.resolutionNote = note.trim();
    } else if (status === 'closed') {
      issue.closedAt = new Date();
    } else if (status === 'in_progress') {
      // If re-opened or moved in progress
      issue.resolvedAt = null;
    }

    await issue.save();

    const updatedIssue = await Issue.findById(issue._id)
      .populate('reporter', 'name email department')
      .populate('assignedTo', 'name email department phone')
      .populate('statusHistory.changedBy', 'name role email');

    res.status(200).json({
      success: true,
      message: `Issue status updated to '${status}'.`,
      issue: updatedIssue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign issue to staff member
// @route   PATCH /api/issues/:id/assign
// @access  Private (Admin only)
export const assignIssue = async (req, res, next) => {
  try {
    const { staffId, note } = req.body;

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.'
      });
    }

    let staff = null;
    if (staffId) {
      staff = await User.findById(staffId);
      if (!staff || staff.role !== 'staff' || staff.accountStatus !== 'active' || !staff.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Selected user is not an active staff member.'
        });
      }
    }

    issue.assignedTo = staff ? staff._id : null;
    issue.statusHistory.push({
      status: issue.status,
      changedBy: req.user._id,
      changedAt: new Date(),
      note: staff
        ? `Assigned to staff: ${staff.name} (${staff.department || 'General'})`
        : 'Issue unassigned.'
    });

    await issue.save();

    const updatedIssue = await Issue.findById(issue._id)
      .populate('reporter', 'name email department')
      .populate('assignedTo', 'name email department phone')
      .populate('statusHistory.changedBy', 'name role email');

    res.status(200).json({
      success: true,
      message: staff ? `Issue assigned to ${staff.name}.` : 'Issue unassigned.',
      issue: updatedIssue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Adjust issue priority
// @route   PATCH /api/issues/:id/priority
// @access  Private (Admin only)
export const updatePriority = async (req, res, next) => {
  try {
    const { priority } = req.body;

    if (!priority || !['low', 'medium', 'high'].includes(priority.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Valid priority (low, medium, high) is required.'
      });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.'
      });
    }

    const oldPriority = issue.priority;
    issue.priority = priority.toLowerCase();
    issue.statusHistory.push({
      status: issue.status,
      changedBy: req.user._id,
      changedAt: new Date(),
      note: `Priority changed from ${oldPriority} to ${issue.priority}.`
    });

    await issue.save();

    res.status(200).json({
      success: true,
      message: `Priority updated to ${issue.priority}.`,
      issue
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check potential duplicate issues in same location/category
// @route   POST /api/issues/check-duplicates
// @access  Private (Any authenticated user)
export const checkDuplicates = async (req, res, next) => {
  try {
    const { building, room, category } = req.body;

    if (!building || !category) {
      return res.status(400).json({
        success: false,
        message: 'Building and category are required to check duplicates.'
      });
    }

    const query = {
      building: { $regex: new RegExp(`^${building.trim()}$`, 'i') },
      category,
      status: { $in: ['open', 'in_progress'] }
    };

    if (room && room.trim()) {
      query.room = { $regex: new RegExp(`^${room.trim()}$`, 'i') };
    }

    const duplicates = await Issue.find(query)
      .select('ticketId title building room category priority status createdAt')
      .populate('reporter', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      hasDuplicates: duplicates.length > 0,
      count: duplicates.length,
      duplicates
    });
  } catch (error) {
    next(error);
  }
};
