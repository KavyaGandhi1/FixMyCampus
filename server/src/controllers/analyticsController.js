import Issue from '../models/Issue.js';

// @desc    Get comprehensive campus maintenance analytics
// @route   GET /api/analytics
// @access  Private (Admin only)
export const getAnalytics = async (req, res, next) => {
  try {
    const [
      totalIssues,
      openIssues,
      inProgressIssues,
      resolvedIssues,
      closedIssues,
      rejectedIssues,
      unassignedIssues,
      avgResolutionAgg,
      categoryAgg,
      locationAgg,
      priorityAgg,
      recentIssues
    ] = await Promise.all([
      Issue.countDocuments(),
      Issue.countDocuments({ status: 'open' }),
      Issue.countDocuments({ status: 'in_progress' }),
      Issue.countDocuments({ status: 'resolved' }),
      Issue.countDocuments({ status: 'closed' }),
      Issue.countDocuments({ status: 'rejected' }),
      Issue.countDocuments({ assignedTo: null, status: { $in: ['open', 'in_progress'] } }),
      // Calculate average resolution time in hours for resolved/closed issues
      Issue.aggregate([
        {
          $match: {
            resolvedAt: { $ne: null },
            createdAt: { $ne: null }
          }
        },
        {
          $project: {
            durationHours: {
              $divide: [
                { $subtract: ['$resolvedAt', '$createdAt'] },
                1000 * 60 * 60
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgHours: { $avg: '$durationHours' }
          }
        }
      ]),
      // Issues grouped by Category
      Issue.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      // Issues grouped by Location (Building)
      Issue.aggregate([
        {
          $group: {
            _id: '$building',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      // Issues grouped by Priority
      Issue.aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ]),
      // 5 most recent issues
      Issue.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('reporter', 'name email')
        .populate('assignedTo', 'name email')
        .lean()
    ]);

    const avgResolutionHours = avgResolutionAgg.length > 0 && avgResolutionAgg[0].avgHours != null
      ? Number(avgResolutionAgg[0].avgHours.toFixed(1))
      : 0;

    const issuesByCategory = categoryAgg.map(item => ({
      category: item._id || 'Unspecified',
      count: item.count
    }));

    const issuesByLocation = locationAgg.map(item => ({
      building: item._id || 'Unspecified',
      count: item.count
    }));

    const issuesByPriority = priorityAgg.map(item => ({
      priority: item._id || 'medium',
      count: item.count
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total: totalIssues,
          open: openIssues,
          inProgress: inProgressIssues,
          resolved: resolvedIssues,
          closed: closedIssues,
          rejected: rejectedIssues,
          unassigned: unassignedIssues,
          avgResolutionHours
        },
        byCategory: issuesByCategory,
        byLocation: issuesByLocation,
        byPriority: issuesByPriority,
        recentIssues
      }
    });
  } catch (error) {
    next(error);
  }
};
