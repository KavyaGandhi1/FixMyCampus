import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { issueApi } from '../api/issueApi';
import { StatCard } from '../components/dashboard/StatCard';
import { IssueCard } from '../components/issues/IssueCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { HardHat, ClipboardCheck, Clock, CheckCircle2, ArrowRight, Building2, Wrench } from 'lucide-react';

export const StaffDashboardPage = () => {
  const { user } = useAuth();
  const [assignedIssues, setAssignedIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  });

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        setLoading(true);
        const res = await issueApi.getIssues({ limit: 20 });
        if (res.success) {
          setAssignedIssues(res.issues);
          const issues = res.issues;
          setStats({
            total: res.total,
            open: issues.filter((i) => i.status === 'open').length,
            inProgress: issues.filter((i) => i.status === 'in_progress').length,
            resolved: issues.filter((i) => i.status === 'resolved' || i.status === 'closed').length
          });
        }
      } catch (err) {
        console.error('Failed to load staff dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading technician workspace..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-sm mb-2">
            <HardHat className="w-3.5 h-3.5 text-blue-400" />
            Facilities Technician Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Department: <strong className="text-white">{user?.department || 'General Maintenance'}</strong>.
            Review assigned maintenance tickets, update inspection notes, and record repairs.
          </p>
        </div>

        <Link
          to="/issues?viewAll=true"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition self-start sm:self-auto shrink-0"
        >
          <Building2 className="w-4 h-4" />
          Browse All Campus Tickets
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Tasks"
          value={stats.total}
          subtext="Total on your queue"
          icon={ClipboardCheck}
          color="blue"
        />
        <StatCard
          title="Pending Start"
          value={stats.open}
          subtext="Awaiting on-site inspection"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Under Active Work"
          value={stats.inProgress}
          subtext="Work in progress"
          icon={Wrench}
          color="purple"
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
          subtext="Completed tickets"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Tasks Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Maintenance Queue</h2>
            <p className="text-xs text-slate-500">Tickets assigned to your department</p>
          </div>
          {assignedIssues.length > 0 && (
            <Link
              to="/issues"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View Work Orders ({stats.total}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {assignedIssues.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Your queue is clear!"
            description="You currently have no outstanding maintenance tickets assigned to you."
            actionLabel="View All Campus Issues"
            onAction={() => window.location.assign('/issues?viewAll=true')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedIssues.map((issue) => (
              <IssueCard key={issue._id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
