import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { issueApi } from '../api/issueApi';
import { StatCard } from '../components/dashboard/StatCard';
import { IssueCard } from '../components/issues/IssueCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { PlusCircle, Clock, AlertCircle, CheckCircle2, FileText, ArrowRight } from 'lucide-react';

export const StudentDashboardPage = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  });

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const res = await issueApi.getIssues({ limit: 10 });
        if (res.success) {
          setIssues(res.issues);
          const allIssues = res.issues;
          setStats({
            total: res.total,
            open: allIssues.filter((i) => i.status === 'open').length,
            inProgress: allIssues.filter((i) => i.status === 'in_progress').length,
            resolved: allIssues.filter((i) => i.status === 'resolved' || i.status === 'closed').length
          });
        }
      } catch (err) {
        console.error('Failed to load student issues:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading student dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-blue-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm mb-2">
            Student Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Notice a broken socket, Wi-Fi outage, or plumbing issue in your hostel or lecture hall? Submit a ticket and our facilities staff will resolve it.
          </p>
        </div>
        <Link
          to="/issues/new"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-md transition self-start sm:self-auto shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          Report New Issue
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reported"
          value={stats.total}
          subtext="Submitted by you"
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Awaiting Review"
          value={stats.open}
          subtext="New tickets"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          subtext="Technician working"
          icon={AlertCircle}
          color="purple"
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
          subtext="Fixed or closed"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Recent Reports</h2>
            <p className="text-xs text-slate-500">Track current status and technician progress</p>
          </div>
          {issues.length > 0 && (
            <Link
              to="/issues"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All ({stats.total}) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {issues.length === 0 ? (
          <EmptyState
            title="No issues reported yet"
            description="All campus facilities look good! If you notice any defect or breakdown, report it here."
            actionLabel="Submit Your First Ticket"
            onAction={() => window.location.assign('/issues/new')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issues.slice(0, 4).map((issue) => (
              <IssueCard key={issue._id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
