'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  FileText, 
  Pill, 
  Clock, 
  AlertTriangle, 
  Edit3, 
  FilePlus2, 
  ArrowLeft,
  CheckCircle2,
  Printer,
  ChevronRight,
  Stethoscope
} from 'lucide-react';

export const PatientProfileScreen: React.FC = () => {
  const { 
    selectedPatientId, 
    activePatientProfileTab, 
    patients, 
    consultations, 
    appointments, 
    prescriptions, 
    followUps,
    setActiveScreen, 
    navigateToNewConsultation,
    navigateToBookAppointment,
    currentUser
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'consultations' | 'appointments' | 'prescriptions' | 'followups'>(
    activePatientProfileTab || 'overview'
  );

  const patient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const patientConsultations = consultations.filter(c => c.patientId === patient.id);
  const patientAppointments = appointments.filter(a => a.patientId === patient.id);
  const patientPrescriptions = prescriptions.filter(p => p.patientId === patient.id);
  const patientFollowups = followUps.filter(f => f.patientId === patient.id);

  return (
    <div className="space-y-6">
      {/* Back Button & Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveScreen('patients')}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Patient Roster
        </button>

        <span className="text-xs font-mono text-slate-400">
          Last Chart Synchronization: Today at 09:30 AM
        </span>
      </div>

      {/* Patient Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
              {patient.fullName.split(' ').map(n => n[0]).join('')}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{patient.fullName}</h1>
                <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                  {patient.id}
                </span>
                <StatusBadge status={patient.status} />
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600 mt-2 flex-wrap">
                <span><strong>Age:</strong> {patient.age} yrs ({patient.dateOfBirth})</span>
                <span>•</span>
                <span><strong>Gender:</strong> {patient.gender}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {patient.phone}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {patient.email}
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={() => navigateToBookAppointment(patient.id)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              Book Appointment
            </button>

            {currentUser.role === 'DOCTOR' && (
              <button
                onClick={() => navigateToNewConsultation(patient.id)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                New Consultation
              </button>
            )}

            <button
              onClick={() => alert(`Edit patient registration for ${patient.fullName}`)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Details
            </button>
          </div>
        </div>

        {/* Quick Clinical Highlights Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
            <span className="text-slate-400 text-[11px] block uppercase font-bold">Last Consultation</span>
            <span className="font-semibold text-slate-900">{patient.lastVisitDate}</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
            <span className="text-slate-400 text-[11px] block uppercase font-bold">Next Follow-up</span>
            <span className="font-semibold text-blue-700">{patient.nextFollowUpDate}</span>
          </div>

          <div className="bg-rose-50/60 p-2.5 rounded-xl border border-rose-200/70">
            <span className="text-rose-600 text-[11px] block uppercase font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Allergies
            </span>
            <span className="font-semibold text-rose-900 truncate block">
              {patient.clinicalIntake.allergies}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <User className="w-4 h-4" />
          Overview & Intake
        </button>

        <button
          onClick={() => setActiveTab('consultations')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'consultations'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          Consultation History ({patientConsultations.length})
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'appointments'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Appointments ({patientAppointments.length})
        </button>

        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'prescriptions'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Pill className="w-4 h-4" />
          Prescriptions ({patientPrescriptions.length})
        </button>

        <button
          onClick={() => setActiveTab('followups')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'followups'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          Follow-ups ({patientFollowups.length})
        </button>
      </div>

      {/* Tab Content 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 8 Cols: Intake & Psychiatric Details */}
          <div className="lg:col-span-8 space-y-6">
            {/* Presenting Complaint & History */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Presenting Complaint & Clinical Summary
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                {patient.clinicalIntake.presentingComplaint}
              </p>

              <h4 className="text-xs font-bold text-slate-900 pt-2">Psychiatric & Medical History</h4>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                {patient.clinicalIntake.psychiatricHistory}
              </p>
            </div>

            {/* Current Medications & Allergies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-teal-600" /> Current Medications
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-teal-50/40 p-3 rounded-xl border border-teal-200/60">
                  {patient.clinicalIntake.currentMedications}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
                <h4 className="text-xs font-bold text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" /> Allergies & Contraindications
                </h4>
                <p className="text-xs text-rose-900 font-semibold leading-relaxed bg-rose-50/50 p-3 rounded-xl border border-rose-200">
                  {patient.clinicalIntake.allergies}
                </p>
              </div>
            </div>

            {/* Family History */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-2">
              <h4 className="text-xs font-bold text-slate-900">Family History of Mental Disorders</h4>
              <p className="text-xs text-slate-700 leading-relaxed">
                {patient.clinicalIntake.familyHistory}
              </p>
            </div>
          </div>

          {/* Right 4 Cols: Contact & Emergency Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Emergency Contact</h4>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-900">{patient.emergencyContact.name}</p>
                <p className="text-slate-500">{patient.emergencyContact.relationship}</p>
                <p className="font-mono text-slate-700 pt-1 font-semibold">{patient.emergencyContact.phone}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Demographics & Address</h4>
              <div className="space-y-2 text-xs text-slate-700">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  {patient.address}
                </p>
                <p><strong>Registered Date:</strong> {patient.registeredDate}</p>
                <p><strong>Clinical Risk Tier:</strong> <StatusBadge status={patient.clinicalIntake.riskAssessment || 'Low'} size="sm" /></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: CONSULTATIONS */}
      {activeTab === 'consultations' && (
        <div className="space-y-4">
          {patientConsultations.length > 0 ? (
            patientConsultations.map((consult) => (
              <div key={consult.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                        {consult.id}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{consult.date} at {consult.time}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Attending Specialist: {consult.doctorName}</p>
                  </div>

                  <div className="text-right">
                    <span className="inline-block bg-blue-50 text-blue-800 font-bold px-2.5 py-1 rounded-md text-xs border border-blue-200">
                      ICD: {consult.diagnosis.primaryICD} - {consult.diagnosis.primaryTitle}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">Presenting Complaint & Observations</h4>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed">
                      {consult.presentingComplaint}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">Formulation & Treatment Plan</h4>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60 leading-relaxed whitespace-pre-line">
                      {consult.treatmentPlan}
                    </p>
                  </div>
                </div>

                {consult.medications.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-teal-800 mb-2">Prescribed Pharmacotherapy</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {consult.medications.map(m => (
                        <div key={m.id} className="p-2.5 bg-teal-50/50 rounded-lg border border-teal-200">
                          <p className="font-bold text-slate-900">{m.name} ({m.dosage})</p>
                          <p className="text-[11px] text-teal-800">{m.frequency} • Duration: {m.duration}</p>
                          <p className="text-[11px] text-slate-500 italic mt-0.5">"{m.instructions}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
              No recorded consultations yet for this patient.
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: APPOINTMENTS */}
      {activeTab === 'appointments' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patientAppointments.length > 0 ? (
                patientAppointments.map(appt => (
                  <tr key={appt.id}>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{appt.date} • {appt.time}</td>
                    <td className="py-3 px-4 text-slate-800 font-semibold">{appt.type}</td>
                    <td className="py-3 px-4 text-slate-600">{appt.doctorName}</td>
                    <td className="py-3 px-4"><StatusBadge status={appt.status} size="sm" /></td>
                    <td className="py-3 px-4 text-slate-500 italic">{appt.notes || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No appointment records.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content 4: PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          {patientPrescriptions.length > 0 ? (
            patientPrescriptions.map(rx => (
              <div key={rx.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                      {rx.id}
                    </span>
                    <h3 className="font-bold text-slate-900 text-xs">Issued on {rx.dateIssued}</h3>
                  </div>

                  <button
                    onClick={() => alert(`Printing Prescription ${rx.id} for ${rx.patientName}`)}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Rx
                  </button>
                </div>

                <p className="text-xs text-slate-600"><strong>Diagnosis:</strong> {rx.diagnosis}</p>

                <div className="space-y-2">
                  {rx.medications.map(m => (
                    <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{m.name} — {m.dosage}</p>
                        <p className="text-slate-600 mt-0.5">{m.frequency} (Duration: {m.duration})</p>
                        <p className="text-slate-500 italic mt-0.5">Instructions: {m.instructions}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded h-fit">
                        Refills: {m.refills}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              No prescriptions issued.
            </div>
          )}
        </div>
      )}

      {/* Tab Content 5: FOLLOW-UPS */}
      {activeTab === 'followups' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">Scheduled Follow-up Tasks</h3>
          <div className="space-y-2">
            {patientFollowups.length > 0 ? (
              patientFollowups.map(flp => (
                <div key={flp.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900">Due: {flp.dueDate}</span>
                    <p className="text-slate-600 mt-0.5">{flp.reason}</p>
                  </div>
                  <StatusBadge status={flp.status} size="sm" />
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-xs py-4 text-center">No pending follow-ups for this patient.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
