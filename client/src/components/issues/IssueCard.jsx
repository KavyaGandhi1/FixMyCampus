import React from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from '../common/StatusBadge';
import { MapPin, UserCheck, Calendar, ArrowRight, Tag } from 'lucide-react';

export const IssueCard = ({ issue }) => {
  const formattedDate = new Date(issue.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            {issue.ticketId}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-blue-50 px-2 py-0.5 rounded text-blue-700">
            <Tag className="w-3 h-3" />
            {issue.category}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={issue.priority} />
          <StatusBadge status={issue.status} />
        </div>
      </div>

      <Link to={`/issues/${issue._id}`}>
        <h3 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition mb-2">
          {issue.title}
        </h3>
      </Link>

      <p className="text-sm text-slate-500 line-clamp-2 mb-4">
        {issue.description}
      </p>

      <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500 gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{issue.building} • {issue.room}</span>
          </div>

          {issue.assignedTo ? (
            <div className="flex items-center gap-1 text-slate-600">
              <UserCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Assigned: <strong className="text-slate-700">{issue.assignedTo.name}</strong></span>
            </div>
          ) : (
            <span className="text-amber-600 font-medium">Unassigned</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>

          <Link
            to={`/issues/${issue._id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 ml-2"
          >
            Details <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
