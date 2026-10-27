import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { issueApi } from '../api/issueApi';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge';
import { StatusTimeline } from '../components/issues/StatusTimeline';
import { CommentSection } from '../components/issues/CommentSection';
import { AssignStaffModal } from '../components/issues/AssignStaffModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  UserCheck,
  CheckCircle2,
  Clock,
  Play,
  CheckCheck,
  AlertTriangle,
  Shield,
  Tag,
  FileText,
  AlertCircle
} from 'lucide-react';

export const IssueDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isStudent, isStaff, isAdmin } = useAuth();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const fetchIssue = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await issueApi.getIssueById(id);
      if (res.success) {
        setIssue(res.issue);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load issue details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchIssue();
    }
  }, [id]);

  const handleStatusUpdate = async (newStatus, note = '') => {
    try {
      setActionLoading(true);
      setError('');
      const res = await issueApi.updateIssueStatus(id, {
        status: newStatus,
        note: note || statusNote
      });
      if (res.success) {
        setIssue(res.issue);
        setStatusNote('');
        setShowResolveModal(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePriorityChange = async (e) => {
    const newPriority = e.target.value;
    try {
      setActionLoading(true);
      const res = await issueApi.updatePriority(id, { priority: newPriority });
      if (res.success) {
        setIssue((prev) => ({ ...prev, priority: newPriority }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update priority.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignStaff = async (staffId, note) => {
    const res = await issueApi.assignIssue(id, { staffId, note });
    if (res.success) {
      setIssue(res.issue);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading ticket details..." />;
  }

  if (error && !issue) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-lg mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Issue Unavailable</h2>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <button
          onClick={() => navigate('/issues')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Issues
        </button>
      </div>
    );
  }

  const isAssignedStaff =
    isStaff && issue?.assignedTo?._id?.toString() === user?._id?.toString();

  const isReporterStudent =
    isStudent && issue?.reporter?._id?.toString() === user?._id?.toString();

  return (
    <div className="space-y-6">
      {/* Back button & Ticket Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-200 px-2.5 py-0.5 rounded-md">
                {issue.ticketId}
              </span>
              <span className="text-xs text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md font-medium border border-blue-100">
                {issue.category}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PriorityBadge priority={issue.priority} />
          <StatusBadge status={issue.status} />
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details, Image, Timeline, Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Header & Description Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
              {issue.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pb-4 border-b border-slate-100 mb-4">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-slate-700">{issue.building}</strong> • {issue.room}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Reported {new Date(issue.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Reported by {issue.reporter?.name || 'Anonymous Student'}
              </span>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Problem Description
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {issue.description}
              </p>
            </div>

            {/* Attached Photo */}
            {issue.imageUrl && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Attached Photo Evidence
                </h4>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-w-md">
                  <img
                    src={issue.imageUrl}
                    alt="Issue attachment"
                    className="w-full h-auto max-h-72 object-contain"
                  />
                </div>
              </div>
            )}

            {/* Resolution Note if resolved */}
            {issue.resolutionNote && (
              <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Technician Resolution Report
                </h4>
                <p className="text-xs text-emerald-700 mt-1 whitespace-pre-wrap">
                  {issue.resolutionNote}
                </p>
                {issue.resolvedAt && (
                  <p className="text-[10px] text-emerald-600/80 mt-2 font-mono">
                    Resolved at: {new Date(issue.resolvedAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Workflow Action Buttons (Role Based) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
              Ticket Actions & State Transitions
            </h3>

            {/* Staff Actions */}
            {isAssignedStaff && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  You are the assigned technician for this ticket. Update the status as you work.
                </p>
                <div className="flex flex-wrap gap-2">
                  {issue.status === 'open' && (
                    <button
                      onClick={() => handleStatusUpdate('in_progress', 'Technician started active inspection')}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Work (Mark In Progress)
                    </button>
                  )}

                  {issue.status === 'in_progress' && (
                    <button
                      onClick={() => setShowResolveModal(true)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                    </button>
                  )}

                  {issue.status === 'resolved' && (
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      Issue marked resolved. Awaiting student or admin final closure.
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Student Action: Close when resolved */}
            {isReporterStudent && issue.status === 'resolved' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  The maintenance technician has reported this issue as resolved. If the problem is fixed to your satisfaction, please confirm and close this ticket.
                </p>
                <button
                  onClick={() => handleStatusUpdate('closed', 'Student verified and confirmed resolution')}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Confirm Resolution & Close Ticket
                </button>
              </div>
            )}

            {/* Admin Override Actions */}
            {isAdmin && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Adjust Status (Admin Override)
                    </label>
                    <select
                      value={issue.status}
                      onChange={(e) => handleStatusUpdate(e.target.value, 'Status changed by Admin')}
                      disabled={actionLoading}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Adjust Priority
                    </label>
                    <select
                      value={issue.priority}
                      onChange={handlePriorityChange}
                      disabled={actionLoading}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-xs text-slate-500">Assign maintenance crew:</span>
                  <button
                    onClick={() => setAssignModalOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    {issue.assignedTo ? 'Reassign Staff' : 'Assign Staff Member'}
                  </button>
                </div>
              </div>
            )}

            {!isAssignedStaff && !isReporterStudent && !isAdmin && (
              <p className="text-xs text-slate-400">
                You are viewing this ticket in read-only mode.
              </p>
            )}
          </div>

          {/* Comments and Discussion */}
          <CommentSection issueId={issue._id} />
        </div>

        {/* Right Column: Status Timeline & Metadata Cards */}
        <div className="space-y-6">
          {/* Personnel Details Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ticket Participants
            </h3>

            {/* Reporter */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0">
                {issue.reporter?.name?.slice(0, 2).toUpperCase() || 'ST'}
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-800">{issue.reporter?.name}</p>
                <p className="text-slate-400">{issue.reporter?.email}</p>
                <p className="text-emerald-700 font-medium mt-0.5">
                  Student • {issue.reporter?.department || 'General'}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              {/* Assignee */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center shrink-0">
                  {issue.assignedTo?.name?.slice(0, 2).toUpperCase() || '?'}
                </div>
                <div className="text-xs">
                  <p className="text-slate-400 text-[10px] uppercase font-semibold">Assigned Technician</p>
                  {issue.assignedTo ? (
                    <>
                      <p className="font-semibold text-slate-800">{issue.assignedTo.name}</p>
                      <p className="text-slate-400">{issue.assignedTo.department}</p>
                      {issue.assignedTo.phone && (
                        <p className="text-slate-500 font-mono mt-0.5">{issue.assignedTo.phone}</p>
                      )}
                    </>
                  ) : (
                    <p className="text-amber-600 font-medium mt-0.5">Unassigned</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Audit History Timeline Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              Status History Audit Trail
            </h3>
            <StatusTimeline history={issue.statusHistory} />
          </div>
        </div>
      </div>

      {/* Resolve Issue Modal (Prompts for Resolution Note) */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Mark Issue as Resolved
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Please summarize the maintenance work performed (e.g. parts replaced, circuit tested, leaks fixed).
            </p>

            <textarea
              rows={3}
              required
              placeholder="e.g. Replaced faulty circuit breaker and tested voltage on all sockets..."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleStatusUpdate('resolved', statusNote || 'Work completed')}
                disabled={actionLoading || !statusNote.trim()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Confirm Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Staff Modal (Admin) */}
      <AssignStaffModal
        isOpen={assignModalOpen}
        currentStaffId={issue.assignedTo?._id}
        onAssign={handleAssignStaff}
        onClose={() => setAssignModalOpen(false)}
      />
    </div>
  );
};
