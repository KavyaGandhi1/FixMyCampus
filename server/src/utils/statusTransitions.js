export const ISSUE_STATUSES = ['open', 'in_progress', 'resolved', 'closed', 'rejected'];

export const VALID_STATUS_TRANSITIONS = {
  open: ['in_progress', 'rejected'],
  in_progress: ['resolved', 'open', 'rejected'],
  resolved: ['closed', 'in_progress'],
  rejected: ['open'],
  closed: ['open']
};

/**
 * Validates whether a status transition is permitted
 * @param {string} currentStatus 
 * @param {string} newStatus 
 * @param {string} userRole 
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateStatusTransition = (currentStatus, newStatus, userRole) => {
  if (!ISSUE_STATUSES.includes(newStatus)) {
    return { valid: false, error: `Invalid status: ${newStatus}. Allowed statuses: ${ISSUE_STATUSES.join(', ')}` };
  }

  if (currentStatus === newStatus) {
    return { valid: false, error: `Issue is already in ${newStatus} status.` };
  }

  // Admins have override privileges for reopening or rejecting, but must follow reasonable workflow
  const allowedNext = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(newStatus) && userRole !== 'admin') {
    return {
      valid: false,
      error: `Cannot transition status from '${currentStatus}' to '${newStatus}'. Allowed next steps: ${allowedNext.join(', ')}`
    };
  }

  // Students cannot update status directly unless confirming closure of a resolved issue
  if (userRole === 'student' && newStatus !== 'closed') {
    return { valid: false, error: 'Students can only confirm resolution (close) their own issues.' };
  }

  return { valid: true };
};
