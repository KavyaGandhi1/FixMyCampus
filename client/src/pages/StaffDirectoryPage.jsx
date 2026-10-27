import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Users,
  UserPlus,
  Mail,
  Building2,
  HardHat,
  Search,
  CheckCircle2,
  Clock,
  Ban,
  RefreshCw,
  Copy,
  ExternalLink,
  X,
  AlertCircle,
  FileText,
  BadgeCheck
} from 'lucide-react';

export const StaffDirectoryPage = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add staff modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '',
    email: '',
    department: '',
    employeeId: ''
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Invitation Generated Modal
  const [invitationModalOpen, setInvitationModalOpen] = useState(false);
  const [activeInvitation, setActiveInvitation] = useState(null);
  const [copied, setCopied] = useState(false);

  // Status update loading
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminApi.getStaffList();
      if (res.success) {
        setStaffList(res.staff);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load staff directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const { name, email, department, employeeId } = addFormData;

    if (!name || !email || !department) {
      setAddError('Full name, official email, and department are required.');
      return;
    }

    try {
      setAddLoading(true);
      setAddError('');
      const res = await adminApi.createStaff({
        name,
        email,
        department,
        employeeId
      });

      if (res.success) {
        setIsAddModalOpen(false);
        setAddFormData({ name: '', email: '', department: '', employeeId: '' });
        setActiveInvitation({
          staffName: res.staff.name,
          email: res.staff.email,
          activationUrl: res.invitation.activationUrl,
          expiresAt: res.invitation.expiresAt
        });
        setInvitationModalOpen(true);
        fetchStaff();
      }
    } catch (err) {
      setAddError(err.response?.data?.message || err.message || 'Failed to register staff member.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleStatus = async (staff) => {
    const actionName = staff.accountStatus === 'deactivated' ? 'reactivate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${actionName} account access for ${staff.name}?`)) {
      return;
    }

    try {
      setActionLoadingId(staff._id);
      const newStatus = staff.accountStatus === 'deactivated' ? 'active' : 'deactivated';
      const res = await adminApi.updateStaffStatus(staff._id, newStatus);
      if (res.success) {
        setSuccessMessage(`Account for ${staff.name} is now ${newStatus}.`);
        fetchStaff();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update account status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResendInvitation = async (staff) => {
    try {
      setActionLoadingId(staff._id);
      const res = await adminApi.resendStaffInvitation(staff._id);
      if (res.success) {
        setActiveInvitation({
          staffName: staff.name,
          email: staff.email,
          activationUrl: res.invitation.activationUrl,
          expiresAt: res.invitation.expiresAt
        });
        setInvitationModalOpen(true);
        fetchStaff();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to re-issue invitation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Filter staff
  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(search.toLowerCase()) ||
      staff.email.toLowerCase().includes(search.toLowerCase()) ||
      staff.department.toLowerCase().includes(search.toLowerCase()) ||
      (staff.employeeId && staff.employeeId.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter ? staff.accountStatus === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <BadgeCheck className="w-3.5 h-3.5" /> Active
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5" /> Invitation Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <Ban className="w-3.5 h-3.5" /> Deactivated
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Staff Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administer campus maintenance technicians, issue single-use activation invitations, and control portal access.
          </p>
        </div>

        <button
          onClick={() => {
            setAddError('');
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff by name, email, dept..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Account Statuses</option>
            <option value="active">Active Only</option>
            <option value="pending">Invitation Pending</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      {loading ? (
        <LoadingSpinner text="Loading staff records and assignment metrics..." />
      ) : filteredStaff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <HardHat className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No staff members found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {search || statusFilter ? 'Try clearing your filters.' : 'Click "Add Staff Member" to onboard your first technician.'}
          </p>
          {(search || statusFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
              }}
              className="text-xs font-semibold text-purple-700 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="px-5 py-3">Technician</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-center">Assigned Issues</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStaff.map((staff) => (
                  <tr key={staff._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 font-bold flex items-center justify-center shrink-0">
                          {staff.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{staff.name}</p>
                          {staff.employeeId && (
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              ID: {staff.employeeId}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-slate-600">
                      {staff.email}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {staff.department || 'General Maintenance'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {getStatusBadge(staff.accountStatus)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-800 text-xs">
                        {staff.assignedIssuesCount || 0}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {staff.accountStatus === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleResendInvitation(staff)}
                            disabled={actionLoadingId === staff._id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition"
                            title="Resend invitation link"
                          >
                            <RefreshCw className={`w-3 h-3 ${actionLoadingId === staff._id ? 'animate-spin' : ''}`} />
                            Resend Link
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(staff)}
                          disabled={actionLoadingId === staff._id}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                            staff.accountStatus === 'deactivated'
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                              : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
                          }`}
                        >
                          {staff.accountStatus === 'deactivated' ? 'Reactivate' : 'Deactivate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Staff Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Staff Member</h3>
                <p className="text-xs text-slate-500">
                  Register a technician. An invitation link will be created for them to set their password.
                </p>
              </div>
            </div>

            {addError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={addFormData.name}
                  onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. j.doe@campus.edu"
                  value={addFormData.email}
                  onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department / Trade Designation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electrical Maintenance, Plumbing, IT & AV"
                  value={addFormData.department}
                  onChange={(e) => setAddFormData({ ...addFormData, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. EMP-2026-042"
                  value={addFormData.employeeId}
                  onChange={(e) => setAddFormData({ ...addFormData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg transition disabled:opacity-50"
                >
                  {addLoading ? 'Creating...' : 'Register & Generate Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invitation Generated Modal with Copyable URL */}
      {invitationModalOpen && activeInvitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setInvitationModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Staff Invitation Link Generated
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Send this single-use activation link to <strong className="text-slate-800">{activeInvitation.staffName}</strong> ({activeInvitation.email}).
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 my-4">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Single-Use Activation URL
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={activeInvitation.activationUrl}
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(activeInvitation.activationUrl)}
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Expires in 7 days ({new Date(activeInvitation.expiresAt).toLocaleDateString()}). The staff member will set their own password upon clicking.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <a
                href={activeInvitation.activationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-800"
              >
                Test Activation Link Now <ExternalLink className="w-3 h-3" />
              </a>

              <button
                type="button"
                onClick={() => setInvitationModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
