import React from 'react';
import { Clock, AlertCircle, CheckCircle2, CheckCheck, XCircle } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const config = {
    open: {
      label: 'Open',
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      icon: Clock
    },
    in_progress: {
      label: 'In Progress',
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
      icon: AlertCircle
    },
    resolved: {
      label: 'Resolved',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle2
    },
    closed: {
      label: 'Closed',
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
      icon: CheckCheck
    },
    rejected: {
      label: 'Rejected',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      icon: XCircle
    }
  };

  const item = config[status] || {
    label: status || 'Unknown',
    bg: 'bg-gray-50 text-gray-700 border-gray-200',
    dot: 'bg-gray-400',
    icon: Clock
  };

  const Icon = item.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${item.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
      <Icon className="w-3.5 h-3.5" />
      {item.label}
    </span>
  );
};

export const PriorityBadge = ({ priority }) => {
  const config = {
    low: {
      label: 'Low',
      bg: 'bg-slate-100 text-slate-600 border-slate-200'
    },
    medium: {
      label: 'Medium',
      bg: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    high: {
      label: 'High Priority',
      bg: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
    }
  };

  const item = config[priority?.toLowerCase()] || config.medium;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${item.bg}`}
    >
      {item.label}
    </span>
  );
};
