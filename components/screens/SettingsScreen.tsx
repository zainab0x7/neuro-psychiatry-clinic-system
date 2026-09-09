'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Settings, User, Building, Lock, Bell, Save, Check } from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { clinicSettings, updateClinicSettings, currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'clinic' | 'security' | 'preferences'>('profile');

  // Clinic settings local form state
  const [clinicName, setClinicName] = useState(clinicSettings.clinicName || 'Neuro Psychiatry Clinic');
  const [department, setDepartment] = useState(clinicSettings.department || 'Psychiatry');
  const [doctorDesignation, setDoctorDesignation] = useState(clinicSettings.doctorDesignation || 'HOD & Consultant Psychiatrist');
  const [education, setEducation] = useState(clinicSettings.education || 'MBBS, MCPS, FCPS, CHPE');
  const [practiceName, setPracticeName] = useState(clinicSettings.practiceName || clinicSettings.clinicName || 'Neuro Psychiatry Clinic');
  const [doctorName, setDoctorName] = useState(clinicSettings.doctorName);
  const [licenseNumber, setLicenseNumber] = useState(clinicSettings.licenseNumber);
  const [phone, setPhone] = useState(clinicSettings.phone);
  const [email, setEmail] = useState(clinicSettings.email);
  const [address, setAddress] = useState(clinicSettings.address);

  // Clinic Hours
  const [clinicStart, setClinicStart] = useState(clinicSettings.clinicStart);
  const [clinicEnd, setClinicEnd] = useState(clinicSettings.clinicEnd);
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(clinicSettings.slotDurationMinutes);
  const [breakStart, setBreakStart] = useState(clinicSettings.breakStart);
  const [breakEnd, setBreakEnd] = useState(clinicSettings.breakEnd);

  // Preferences
  const [notifyEmail, setNotifyEmail] = useState(clinicSettings.notifyEmail);
  const [notifySMS, setNotifySMS] = useState(clinicSettings.notifySMS);
  const [autoRemind24h, setAutoRemind24h] = useState(clinicSettings.autoRemind24h);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateClinicSettings({
      clinicName,
      department,
      doctorDesignation,
      education,
      practiceName: clinicName,
      doctorName,
      licenseNumber,
      phone,
      email,
      address,
      clinicStart,
      clinicEnd,
      slotDurationMinutes,
      breakStart,
      breakEnd,
      notifyEmail,
      notifySMS,
      autoRemind24h,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Clinic & Account Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage medical practice details, operating parameters, and security preferences.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" /> Doctor Profile
        </button>

        <button
          onClick={() => setActiveTab('clinic')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'clinic'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4" /> Practice & Hours
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" /> Security & Sessions
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'preferences'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" /> Notifications & Reminders
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Attending Specialist Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Practitioner Name</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Doctor Designation</label>
                <input
                  type="text"
                  value={doctorDesignation}
                  onChange={(e) => setDoctorDesignation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Education & Qualifications</label>
                <input
                  type="text"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">State Medical License #</label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Practice Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Practice Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Practice & Hours */}
        {activeTab === 'clinic' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Clinic Operations & Consultation Slots
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinic Name</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => {
                    setClinicName(e.target.value);
                    setPracticeName(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Opening Time</label>
                <input
                  type="time"
                  value={clinicStart}
                  onChange={(e) => setClinicStart(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Closing Time</label>
                <input
                  type="time"
                  value={clinicEnd}
                  onChange={(e) => setClinicEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Slot Duration (Minutes)</label>
                <select
                  value={slotDurationMinutes}
                  onChange={(e) => setSlotDurationMinutes(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes (Default Neuropsych)</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lunch Break Period</label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={breakStart}
                    onChange={(e) => setBreakStart(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={breakEnd}
                    onChange={(e) => setBreakEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Security */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Authentication & Security Protocols
            </h3>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value="••••••••••••"
                  readOnly
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new strong password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">Two-Factor Authentication (2FA)</h4>
                <p className="text-slate-500">Requires authenticator app code on login.</p>
                <span className="inline-block bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[11px]">
                  Status: Active (Enforced)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Preferences */}
        {activeTab === 'preferences' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Automated Reminders & Messaging
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={notifySMS}
                  onChange={(e) => setNotifySMS(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Automated SMS Appointment Reminders</span>
                  <span className="text-slate-500">Sends SMS confirmation to patients 24 hours prior to appointment slot.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="font-bold text-slate-900 block">Email Calendar Invitations</span>
                  <span className="text-slate-500">Sends .ics invite & clinical prep checklist upon booking.</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Save */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4 text-teal-400" /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};
