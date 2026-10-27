import React, { useState, useEffect } from 'react';
import { userApi } from '../api/userApi';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Users, Mail, Phone, Building2, HardHat, Shield } from 'lucide-react';

export const StaffDirectoryPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const res = await userApi.getStaffMembers();
        if (res.success) {
          setStaff(res.staff);
        }
      } catch (err) {
        setError('Failed to load campus maintenance staff.');
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading campus staff directory..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-600" />
          Campus Maintenance Staff Directory
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Registered facilities technicians available for work order assignment.
        </p>
      </div>

      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((person) => (
            <div
              key={person._id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                  {person.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{person.name}</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    <HardHat className="w-3 h-3" /> Technician
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{person.department || 'General Maintenance'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`mailto:${person.email}`} className="text-blue-600 hover:underline">
                    {person.email}
                  </a>
                </div>
                {person.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono text-slate-700">{person.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
