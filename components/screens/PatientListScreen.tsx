'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { 
  Search, 
  UserPlus, 
  Filter, 
  Phone, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Calendar, 
  FileText,
  MoreVertical,
  Edit2
} from 'lucide-react';
import { Gender, PatientStatus, Patient } from '../../types';

export const PatientListScreen: React.FC = () => {
  const { 
    patients, 
    setActiveScreen, 
    navigateToPatientProfile,
    navigateToBookAppointment,
    navigateToNewConsultation,
    currentUser
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [serverPatients, setServerPatients] = useState<Patient[] | null>(null);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const itemsPerPage = 6;

  // Debounce search input (300ms)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch paginated & filtered patient data from server
  React.useEffect(() => {
    let isMounted = true;
    async function fetchServerPatients() {
      setIsSearching(true);
      try {
        const BACKEND_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const token = typeof window !== 'undefined' ? localStorage.getItem('psychiatrist_token') : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const url = `${BACKEND_API}/api/patients?search=${encodeURIComponent(debouncedSearch)}&gender=${genderFilter}&status=${statusFilter}&page=${currentPage}&limit=${itemsPerPage}`;
        const res = await fetch(url, { headers, credentials: 'include' });
        const json = await res.json();
        if (isMounted && json.success) {
          const mapped = (json.data || []).map((p: any) => ({
            ...p,
            id: p.patientId || p.id || p._id,
          }));
          setServerPatients(mapped);
          if (json.pagination) {
            setServerTotal(json.pagination.total);
          }
        }
      } catch (err) {
        console.error('Server search error:', err);
      } finally {
        if (isMounted) setIsSearching(false);
      }
    }
    fetchServerPatients();
    return () => { isMounted = false; };
  }, [debouncedSearch, genderFilter, statusFilter, currentPage]);

  // Fallback or Server Data
  const displayPatients = serverPatients !== null ? serverPatients : patients;
  const displayTotal = serverTotal !== null ? serverTotal : displayPatients.length;
  const totalPages = Math.ceil(displayTotal / itemsPerPage) || 1;
  const paginatedPatients = serverPatients !== null 
    ? serverPatients 
    : displayPatients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Patient Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Total {patients.length} registered patient records in clinical database.
          </p>
        </div>

        <button
          onClick={() => setActiveScreen('add-patient')}
          className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          + Add Patient
        </button>
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Patient ID, name or phone number..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden md:inline" />
            <select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
            >
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="In Treatment">In Treatment</option>
              <option value="Pending Intake">Pending Intake</option>
              <option value="Discharged">Discharged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Patient Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Patient ID</th>
                <th className="py-3.5 px-4">Patient Name</th>
                <th className="py-3.5 px-4">Age / Gender</th>
                <th className="py-3.5 px-4">Phone Number</th>
                <th className="py-3.5 px-4">Last Visit</th>
                <th className="py-3.5 px-4">Next Follow-up</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedPatients.length > 0 ? (
                paginatedPatients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {patient.id}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => navigateToPatientProfile(patient.id)}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left"
                      >
                        {patient.fullName}
                      </button>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">
                        {patient.clinicalIntake.presentingComplaint}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      {patient.age} yrs • {patient.gender}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {patient.phone}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {patient.lastVisitDate}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-semibold">
                      {patient.nextFollowUpDate !== 'N/A' ? patient.nextFollowUpDate : 'None'}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={patient.status} size="sm" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigateToPatientProfile(patient.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Chart"
                        >
                          View Chart
                        </button>

                        <button
                          onClick={() => navigateToBookAppointment(patient.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Book Appointment"
                        >
                          Book
                        </button>

                        {currentUser.role === 'DOCTOR' && (
                          <button
                            onClick={() => navigateToNewConsultation(patient.id)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                            title="New Consultation"
                          >
                            Consult
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-medium">No patient records match the selected criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>
            Showing <strong>{displayTotal > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to{' '}
            <strong>{Math.min(currentPage * itemsPerPage, displayTotal)}</strong> of{' '}
            <strong>{displayTotal}</strong> patients
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <span className="font-mono text-xs">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
