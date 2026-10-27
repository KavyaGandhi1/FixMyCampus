import React, { useState, useEffect } from 'react';
import { commentApi } from '../../api/commentApi';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Send, ShieldAlert, Lock, User, Clock } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const CommentSection = ({ issueId }) => {
  const { user, isStaff, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [error, setError] = useState('');

  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await commentApi.getComments(issueId);
      if (res.success) {
        setComments(res.comments);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (issueId) {
      fetchComments();
    }
  }, [issueId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (content.length > 1000) {
      setError('Comment cannot exceed 1000 characters.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await commentApi.addComment(issueId, {
        content: content.trim(),
        isInternal: (isStaff || isAdmin) && isInternal
      });

      if (res.success) {
        setContent('');
        setIsInternal(false);
        setComments((prev) => [...prev, res.comment]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit comment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Issue Activity & Discussion ({comments.length})
        </h3>
        {(isStaff || isAdmin) && (
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-amber-500" /> Internal notes visible only to Staff/Admin
          </span>
        )}
      </div>

      {/* Comments List */}
      {loading ? (
        <LoadingSpinner text="Loading discussion..." />
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          No comments or updates yet. Be the first to leave a message.
        </div>
      ) : (
        <div className="space-y-4 mb-6">
          {comments.map((comment) => {
            const isStaffOrAdminAuthor =
              comment.author?.role === 'admin' || comment.author?.role === 'staff';
            const formattedTime = new Date(comment.createdAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={comment._id}
                className={`p-4 rounded-xl border transition ${
                  comment.isInternal
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-slate-50/80 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                      {comment.author?.name ? comment.author.name.slice(0, 2).toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {comment.author?.name}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        comment.author?.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : comment.author?.role === 'staff'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {comment.author?.role}
                    </span>
                    {comment.isInternal && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">
                        <Lock className="w-2.5 h-2.5" /> Staff Only Note
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formattedTime}
                  </span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap pl-9">
                  {comment.content}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="pt-4 border-t border-slate-200">
        {error && (
          <div className="mb-3 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-3">
          <textarea
            rows={3}
            placeholder="Write a message, progress note, or resolution update..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              {(isStaff || isAdmin) && (
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>Post as internal staff note (hidden from student)</span>
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
