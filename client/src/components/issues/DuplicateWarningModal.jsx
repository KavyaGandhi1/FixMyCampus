import React from 'react';
import { AlertTriangle, ExternalLink, X } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const DuplicateWarningModal = ({
  isOpen,
  duplicates = [],
  onConfirmSubmit,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Potential Duplicate Issue Detected
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              We found unresolved maintenance ticket(s) in the same location and category. Another student or staff member may have already reported this problem.
            </p>
          </div>
        </div>

        {/* Existing Issues List */}
        <div className="space-y-2.5 max-h-56 overflow-y-auto my-4 pr-1">
          {duplicates.map((item) => (
            <div
              key={item._id}
              className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-left"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                  {item.ticketId}
                </span>
                <StatusBadge status={item.status} />
              </div>
              <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">
                {item.title}
              </h4>
              <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                <span>{item.building} • {item.room}</span>
                <a
                  href={`/issues/${item._id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Details <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            Review & Edit Form
          </button>
          <button
            type="button"
            onClick={onConfirmSubmit}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
          >
            Submit Anyway (Not a Duplicate)
          </button>
        </div>
      </div>
    </div>
  );
};
