import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  BarChart3,
  Users,
  CheckCircle,
  HelpCircle,
  Building2
} from 'lucide-react';

export const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { isStudent, isStaff, isAdmin } = useAuth();

  const getNavLinks = () => {
    if (isAdmin) {
      return [
        { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard },
        { to: '/issues', label: 'All Campus Issues', icon: ClipboardList },
        { to: '/issues/new', label: 'Report Issue', icon: PlusCircle },
        { to: '/admin/staff', label: 'Staff & Maintenance', icon: Users },
      ];
    }
    if (isStaff) {
      return [
        { to: '/staff', label: 'Staff Dashboard', icon: LayoutDashboard },
        { to: '/issues', label: 'Assigned Tickets', icon: ClipboardList },
        { to: '/issues?viewAll=true', label: 'All Campus Issues', icon: Building2 },
      ];
    }
    // Student
    return [
      { to: '/student', label: 'My Dashboard', icon: LayoutDashboard },
      { to: '/issues/new', label: 'Report an Issue', icon: PlusCircle },
      { to: '/issues', label: 'My Reported Issues', icon: ClipboardList },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar aside */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between`}
      >
        <div className="p-4 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Navigation
          </div>
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/student' || item.to === '/staff' || item.to === '/admin'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </div>

        {/* Quick Help Card */}
        <div className="p-4 m-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-1">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            Campus Emergency
          </div>
          <p className="text-xs text-slate-500 mb-2">
            For active water pipe bursts, gas leaks, or fire emergencies, call Campus Security immediately.
          </p>
          <div className="text-xs font-mono font-bold text-slate-800">
            Emergency Desk: Ext. 4444
          </div>
        </div>
      </aside>
    </>
  );
};
