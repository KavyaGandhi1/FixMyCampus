import React, { useState, useEffect } from 'react';
import { userApi } from '../../api/userApi';
import { UserCheck, X, AlertCircle } from 'lucide-react';

export const AssignStaffModal = ({
  isOpen,
  currentStaffId,
  onAssign,
  onClose
}) => {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(currentStaffId || '');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedStaffId(currentStaffId || '');
      setAssignmentNote('');
      setError('');
      loadStaff();
    }
  }, [isOpen, currentStaffId]);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await userApi.getStaffMembers();
      if (res.success) {
        setStaffList(res.staff);
      }
    } catch (err) {
      setError('Failed to load campus maintenance staff.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      await onAssign(selectedStaffId || null, assignmentNote);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to assign staff.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Assign Staff Member
            </h3>
            <p className="text-xs text-slate-500">
              Select maintenance technician responsible for resolving this issue.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assigned Technician
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Unassigned --</option>
              {staffList.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name} ({st.department || 'General Maintenance'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assignment Note (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Please bring replacement fuse or check circuit breaker..."
              value={assignmentNote}
              onChange={(e) => setAssignmentNote(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Update Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
