import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  GraduationCap,
  HardHat,
  Shield,
  ArrowRight,
  UserPlus,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

export const LandingPage = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                FixMy<span className="text-blue-600">Campus</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold text-slate-400 border-l border-slate-200 pl-2">
                Campus Facilities SaaS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={user?.role === 'admin' ? '/admin' : user?.role === 'staff' ? '/staff' : '/student'}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
              >
                Go to Your Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="text-xs text-slate-500 font-medium">
                Select your designated portal below
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 flex flex-col items-center">
        <div className="text-center max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            University Maintenance & Incident Operations
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Campus Maintenance Made <span className="text-blue-600">Fast & Transparent</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Report facilities breakdowns, dispatch certified technicians, and oversee resolution workflows across classrooms, laboratories, and hostels.
          </p>
        </div>

        {/* EXACTLY THREE PORTAL SECTIONS */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl">
          {/* Card 1: Student Portal */}
          <div className="bg-white rounded-2xl border-2 border-emerald-100 p-7 shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200 border border-emerald-100">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-slate-900">Student Portal</h2>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Campus Residents
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mt-2 mb-6">
                Report plumbing issues, electrical faults, Wi-Fi outages, and broken furniture in your hostel or lecture halls. Track repair history and chat directly with technicians.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <Link
                to="/student/login"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition"
              >
                Enter Student Portal <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="text-center">
                <Link
                  to="/student/register"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  New student? Register account
                </Link>
              </div>
            </div>
          </div>

          {/* Card 2: Staff Portal */}
          <div className="bg-white rounded-2xl border-2 border-blue-100 p-7 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200 border border-blue-100">
                <HardHat className="w-7 h-7" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-slate-900">Staff Portal</h2>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Technicians
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mt-2 mb-6">
                For registered maintenance technicians. Review assigned work orders, update on-site repair statuses (In Progress, Resolved), record diagnostic notes, and post progress updates.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <Link
                to="/staff/login"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition"
              >
                Enter Staff Portal <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-center text-[11px] text-slate-400">
                Accounts created via admin invitation
              </p>
            </div>
          </div>

          {/* Card 3: Admin Portal */}
          <div className="bg-white rounded-2xl border-2 border-purple-100 p-7 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200 border border-purple-100">
                <Shield className="w-7 h-7" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-slate-900">Admin Portal</h2>
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                  Operations
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed mt-2 mb-6">
                Campus-wide facilities oversight. Onboard staff with single-use invitations, triage and assign tickets, adjust priority levels, and inspect live aggregated analytics.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <Link
                to="/admin/login"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-sm shadow-md shadow-purple-700/20 transition"
              >
                Enter Admin Portal <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-center text-[11px] text-slate-400">
                Authorized facilities personnel only
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} FixMyCampus. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Facilities Helpdesk: Ext. 4444</span>
            <span>•</span>
            <span>Hostels & Campus Infrastructure</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
