import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../api/analyticsApi';
import { StatCard } from '../components/dashboard/StatCard';
import { CategoryPieChart } from '../components/dashboard/CategoryPieChart';
import { BuildingBarChart } from '../components/dashboard/BuildingBarChart';
import { IssueCard } from '../components/issues/IssueCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Shield,
  Layers,
  Clock,
  Wrench,
  CheckCircle2,
  AlertOctagon,
  Timer,
  PieChart as PieIcon,
  BarChart3,
  ArrowRight,
  UserCheck
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await analyticsApi.getAnalytics();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load campus analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Computing real-time campus maintenance metrics..." />;
  }

  if (error || !data) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto">
        <AlertOctagon className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">Analytics Unavailable</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">{error || 'Could not load data'}</p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, byCategory, byLocation, recentIssues } = data;

  return (
    <div className="space-y-6">
      {/* Top Admin Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-200 border border-purple-400/30 backdrop-blur-sm mb-2">
            <Shield className="w-3.5 h-3.5 text-purple-300" />
            Campus Facilities Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Campus Operations Overview
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Live database analytics, incident resolution rates, workload distribution, and technician assignments.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/staff"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-semibold text-xs transition"
          >
            <UserCheck className="w-4 h-4" />
            Staff Management
          </Link>
          <Link
            to="/issues"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-semibold text-xs shadow transition"
          >
            <Layers className="w-4 h-4 text-purple-700" />
            View All Issues
          </Link>
        </div>
      </div>

      {/* KPI Statistic Cards (Actual MongoDB Calculations) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          title="Total Issues"
          value={summary.total}
          subtext="All-time reported"
          icon={Layers}
          color="blue"
        />
        <StatCard
          title="Open"
          value={summary.open}
          subtext="Awaiting triage"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="In Progress"
          value={summary.inProgress}
          subtext="Active maintenance"
          icon={Wrench}
          color="purple"
        />
        <StatCard
          title="Resolved"
          value={summary.resolved}
          subtext="Fixed issues"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Unassigned"
          value={summary.unassigned}
          subtext="Need crew assigned"
          icon={AlertOctagon}
          color="rose"
        />
        <StatCard
          title="Avg Resolution"
          value={`${summary.avgResolutionHours}h`}
          subtext="Calculated from DB"
          icon={Timer}
          color="slate"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-blue-600" />
                Issues by Category
              </h3>
              <p className="text-xs text-slate-500">Distribution across campus infrastructure</p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-400">Live DB Aggregation</span>
          </div>
          <CategoryPieChart data={byCategory} />
        </div>

        {/* Location Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Issues by Building Location
              </h3>
              <p className="text-xs text-slate-500">Top reported facility zones and hostels</p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-400">Top 10 Locations</span>
          </div>
          <BuildingBarChart data={byLocation} />
        </div>
      </div>

      {/* Recent Issues Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Incident Reports</h2>
            <p className="text-xs text-slate-500">Latest tickets submitted across campus buildings</p>
          </div>
          <Link
            to="/issues"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Manage All Issues ({summary.total}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentIssues?.map((issue) => (
            <IssueCard key={issue._id} issue={issue} />
          ))}
        </div>
      </div>
    </div>
  );
};
