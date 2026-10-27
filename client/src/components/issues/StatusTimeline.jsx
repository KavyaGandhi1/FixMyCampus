import React from 'react';
import { StatusBadge } from '../common/StatusBadge';
import { Clock, Shield, HardHat, GraduationCap } from 'lucide-react';

export const StatusTimeline = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return <p className="text-xs text-slate-400">No status updates recorded yet.</p>;
  }

  const getRoleIcon = (role) => {
    if (role === 'admin') return <Shield className="w-3 h-3 text-purple-600" />;
    if (role === 'staff') return <HardHat className="w-3 h-3 text-blue-600" />;
    return <GraduationCap className="w-3 h-3 text-emerald-600" />;
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {history.map((step, idx) => {
        const dateStr = new Date(step.changedAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        return (
          <div key={step._id || idx} className="relative">
            {/* Timeline bullet */}
            <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-2">
                <StatusBadge status={step.status} />
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  by <strong className="text-slate-700">{step.changedBy?.name || 'System User'}</strong>
                  {step.changedBy?.role && getRoleIcon(step.changedBy.role)}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {dateStr}
              </span>
            </div>

            {step.note && (
              <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200/60 rounded-lg p-2.5 mt-2">
                {step.note}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
};
