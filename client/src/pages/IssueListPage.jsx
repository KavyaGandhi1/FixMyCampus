import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { issueApi } from '../api/issueApi';
import { useAuth } from '../context/AuthContext';
import { IssueCard } from '../components/issues/IssueCard';
import { IssueFilterBar } from '../components/issues/IssueFilterBar';
import { Pagination } from '../components/common/Pagination';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { ClipboardList, PlusCircle, AlertCircle } from 'lucide-react';

export const IssueListPage = () => {
  const { user, isStudent, isStaff, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    category: searchParams.get('category') || '',
    priority: searchParams.get('priority') || '',
    building: searchParams.get('building') || '',
    viewAll: searchParams.get('viewAll') || ''
  });

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: currentPage,
        limit: 10,
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.category && { category: filters.category }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.building && { building: filters.building }),
        ...(filters.viewAll && { viewAll: filters.viewAll })
      };

      const res = await issueApi.getIssues(params);
      if (res.success) {
        setIssues(res.issues);
        setTotalCount(res.total);
        setTotalPages(res.totalPages);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load maintenance issues.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [currentPage, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      status: '',
      category: '',
      priority: '',
      building: '',
      viewAll: isStaff ? searchParams.get('viewAll') || '' : ''
    });
    setCurrentPage(1);
  };

  const getPageTitle = () => {
    if (isAdmin) return 'All Campus Maintenance Tickets';
    if (isStaff) {
      return filters.viewAll === 'true'
        ? 'All Campus Issues (Directory)'
        : 'My Assigned Work Orders';
    }
    return 'My Reported Tickets';
  };

  const getPageSubtitle = () => {
    if (isAdmin) return 'Monitor, prioritize, and assign maintenance tickets across campus';
    if (isStaff) {
      return filters.viewAll === 'true'
        ? 'Browse all campus facilities reports'
        : 'Tickets assigned to you for inspection and resolution';
    }
    return 'Track updates and technician notes on issues you submitted';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            {getPageTitle()}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{getPageSubtitle()}</p>
        </div>

        <Link
          to="/issues/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Report Issue
        </Link>
      </div>

      {/* Filter Bar */}
      <IssueFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Issues Content */}
      {loading ? (
        <LoadingSpinner text="Searching maintenance records..." />
      ) : issues.length === 0 ? (
        <EmptyState
          title="No issues found"
          description="There are no maintenance tickets matching your search or filters."
          actionLabel="Clear Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-medium text-slate-500 px-1">
            Showing <strong className="text-slate-800">{issues.length}</strong> of{' '}
            <strong className="text-slate-800">{totalCount}</strong> tickets
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issues.map((issue) => (
              <IssueCard key={issue._id} issue={issue} />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
};
