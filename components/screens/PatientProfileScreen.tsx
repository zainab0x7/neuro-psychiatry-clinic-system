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
  Printer,
  Brain,
  ShieldAlert,
  Activity,
  Heart,
  Users,
  Home,
  FileCheck2,
  ChevronRight,
  Plus,
  Stethoscope,
  RotateCcw
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
    therapySessions,
    setActiveScreen, 
    navigateToNewConsultation,
    navigateToBookAppointment,
    reusePrescription,
    currentUser
  } = useApp();

  type TabKey = 
    | 'overview' 
    | 'consultations'
    | 'psych-history' 
    | 'med-history' 
    | 'personal-history' 
    | 'family-history' 
    | 'social-history' 
    | 'mse-risk' 
    | 'psychometrics' 
    | 'medications-allergies';

  const [activeTab, setActiveTab] = useState<TabKey>(
    (activePatientProfileTab as TabKey) || 'overview'
  );

  const patient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const patientConsultations = consultations.filter(c => c.patientId === patient.id);
  const patientAppointments = appointments.filter(a => a.patientId === patient.id);
  const patientPrescriptions = prescriptions.filter(p => p.patientId === patient.id);
  const patientFollowups = followUps.filter(f => f.patientId === patient.id);
  const patientTherapy = therapySessions.filter(t => t.patientId === patient.id);

  // Psychometric Test Preset Mock Data
  const psychometricScores = [
    { name: 'PHQ-9 (Patient Health Questionnaire)', score: '18 / 27', severity: 'Moderately Severe Depression', date: '2026-09-10', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { name: 'GAD-7 (Generalized Anxiety Scale)', score: '14 / 21', severity: 'Moderate Anxiety', date: '2026-09-10', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { name: 'BDI-II (Beck Depression Inventory)', score: '28 / 63', severity: 'Moderate Depression', date: '2026-08-15', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { name: 'HAM-A (Hamilton Anxiety Rating Scale)', score: '22 / 56', severity: 'Moderate Severity', date: '2026-08-15', color: 'text-purple-700 bg-purple-50 border-purple-200' },
    { name: 'MoCA (Montreal Cognitive Assessment)', score: '27 / 30', severity: 'Normal Cognitive Function', date: '2026-07-20', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  ];

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
          Chart ID: <strong className="text-slate-700">{patient.id}</strong> • Last Sync: Today at 09:30 AM
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
              onClick={() => alert(`Edit patient registration details for ${patient.fullName}`)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Details
            </button>
          </div>
        </div>

        {/* Quick Clinical Highlights Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
            <span className="text-slate-400 text-[11px] block uppercase font-bold">Primary Diagnosis</span>
            <span className="font-bold text-slate-900 truncate block">F90.2 — Adult ADHD / MDD</span>
          </div>

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

      {/* 9 Tabs EMR Navigation Header */}
      <div className="border-b border-slate-200 flex items-center gap-1 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Activity className="w-4 h-4" /> 1. Overview & Timeline
        </button>

        <button
          onClick={() => setActiveTab('consultations')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'consultations'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Stethoscope className="w-4 h-4 text-blue-600" /> 2. Consultation History ({patientConsultations.length})
        </button>

        <button
          onClick={() => setActiveTab('psych-history')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'psych-history'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Brain className="w-4 h-4" /> 2. Psychiatric History
        </button>

        <button
          onClick={() => setActiveTab('med-history')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'med-history'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Heart className="w-4 h-4" /> 3. Medical History
        </button>

        <button
          onClick={() => setActiveTab('personal-history')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'personal-history'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <User className="w-4 h-4" /> 4. Personal History
        </button>

        <button
          onClick={() => setActiveTab('family-history')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'family-history'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Users className="w-4 h-4" /> 5. Family History
        </button>

        <button
          onClick={() => setActiveTab('social-history')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'social-history'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Home className="w-4 h-4" /> 6. Social History
        </button>

        <button
          onClick={() => setActiveTab('mse-risk')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'mse-risk'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> 7. MSE & Risk Assessment
        </button>

        <button
          onClick={() => setActiveTab('psychometrics')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'psychometrics'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <FileCheck2 className="w-4 h-4" /> 8. Psychometrics
        </button>

        <button
          onClick={() => setActiveTab('medications-allergies')}
          className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'medications-allergies'
              ? 'border-blue-600 text-blue-600 bg-white rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/60'
          }`}
        >
          <Pill className="w-4 h-4" /> 9. Meds & Allergies
        </button>
      </div>

      {/* TAB 1: OVERVIEW & LONGITUDINAL TIMELINE */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {/* Presenting Complaint */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Presenting Complaint & HPI Summary
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                {patient.clinicalIntake.presentingComplaint}
              </p>
            </div>

            {/* Longitudinal Event Stream Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Longitudinal Patient Care Stream & Timeline
                </h3>
                <span className="text-xs text-slate-500 font-mono">Sorted Chronologically</span>
              </div>

              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                {/* Recent Consultation Event */}
                {patientConsultations.map((c) => (
                  <div key={c.id} className="relative group">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xs" />
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>Consultation Record • {c.id}</span>
                        <span className="text-blue-700 font-mono">{c.date}</span>
                      </div>
                      <p className="text-slate-700"><strong>Doctor:</strong> {c.doctorName}</p>
                      <p className="text-slate-600"><strong>Diagnosis:</strong> {c.diagnosis.primaryICD} — {c.diagnosis.primaryTitle}</p>
                      <p className="text-slate-500 italic">"{c.presentingComplaint.slice(0, 100)}..."</p>
                    </div>
                  </div>
                ))}

                {/* Therapy Event */}
                {patientTherapy.map((t) => (
                  <div key={t.id} className="relative group">
                    <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-teal-600 border-2 border-white shadow-xs" />
                    <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-200 text-xs space-y-2">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>Therapy Session ({t.sessionType})</span>
                        <span className="text-teal-800 font-mono">{t.sessionDate}</span>
                      </div>
                      <p className="text-slate-700"><strong>Therapist:</strong> {t.therapistName}</p>
                      <p className="text-slate-600"><strong>Interventions:</strong> {t.intervention}</p>
                    </div>
                  </div>
                ))}

                {/* Initial Intake Marker */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-slate-400 border-2 border-white shadow-xs" />
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <span className="font-bold text-slate-900">Patient Initial Registration & Baseline Intake</span>
                    <span className="text-slate-400 font-mono text-[11px] block">{patient.registeredDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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

      {/* TAB: CONSULTATIONS HISTORY */}
      {activeTab === 'consultations' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                Chronological Consultation & Assessment History
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Permanently associated clinical records for {patient.fullName} ({patient.id})
              </p>
            </div>

            {currentUser.role === 'DOCTOR' && (
              <button
                onClick={() => navigateToNewConsultation(patient.id)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> New Consultation
              </button>
            )}
          </div>

          {(currentUser.role === 'RECEPTION' || currentUser.role === 'RECEPTIONIST') && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
              Notice: Reception staff access to detailed clinical notes is restricted. Standard header details are displayed below.
            </div>
          )}

          {patientConsultations.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
              No previous consultation records found for this patient.
            </div>
          ) : (
            <div className="space-y-4">
              {patientConsultations.map((c) => (
                <div key={c.id} className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{c.id}</span>
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold text-[11px]">
                        {c.visitType || 'Follow-up Consultation'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-slate-600 font-mono text-[11px]">
                      <span><strong>Date:</strong> {c.date || c.consultationDate} at {c.time || '10:00 AM'}</span>
                      <span>•</span>
                      <span><strong>Clinician:</strong> {c.doctorName}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-bold text-slate-800 block mb-1">Primary Diagnosis</span>
                      <p className="font-semibold text-slate-900 bg-white p-2 rounded border border-slate-200">
                        {c.diagnosis?.primaryICD} — {c.diagnosis?.primaryTitle}
                        {c.diagnosis?.secondaryICD ? ` | ${c.diagnosis.secondaryICD} — ${c.diagnosis.secondaryTitle}` : ''}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-slate-800 block mb-1">Follow-Up Directives</span>
                      <p className="text-slate-700 bg-white p-2 rounded border border-slate-200">
                        {c.followUpDate ? `Scheduled for: ${c.followUpDate}` : 'No follow-up date set'}
                        {c.followUpNotes ? ` (${c.followUpNotes})` : ''}
                      </p>
                    </div>
                  </div>

                  {currentUser.role !== 'RECEPTION' && currentUser.role !== 'RECEPTIONIST' ? (
                    <>
                      <div>
                        <span className="font-bold text-slate-800 block mb-1">Presenting Complaint & Observations</span>
                        <p className="text-slate-700 bg-white p-2.5 rounded border border-slate-200 leading-relaxed whitespace-pre-line">
                          {c.presentingComplaint}
                        </p>
                      </div>

                      {c.treatmentPlan && (
                        <div>
                          <span className="font-bold text-slate-800 block mb-1">Treatment Plan</span>
                          <p className="text-slate-700 bg-white p-2.5 rounded border border-slate-200 leading-relaxed whitespace-pre-line">
                            {c.treatmentPlan}
                          </p>
                        </div>
                      )}

                      {c.medications && c.medications.length > 0 && (
                        <div>
                          <span className="font-bold text-slate-800 block mb-1">Prescribed Pharmacotherapy</span>
                          <div className="bg-white p-2 rounded border border-slate-200 space-y-1">
                            {c.medications.map((m, idx) => (
                              <div key={idx} className="flex justify-between text-[11px]">
                                <span className="font-bold text-slate-900">{m.name} ({m.dosage})</span>
                                <span className="text-slate-500">{m.frequency} • {m.duration}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-3 bg-amber-50 text-amber-800 text-[11px] rounded border border-amber-200 font-medium italic">
                      Clinical notes and observations are restricted for Reception staff.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PSYCHIATRIC HISTORY */}
      {activeTab === 'psych-history' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600" />
            2. Detailed Past Psychiatric & Treatment History
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Previous Psychiatric Episodes & Onset</h4>
              <p className="text-slate-700 leading-relaxed">
                First onset of depressive symptoms reported at age 22 during university exams. Episodes characterized by insomnia, low mood, and executive dysfunction.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Hospitalizations & Emergency Admits</h4>
              <p className="text-slate-700 leading-relaxed">
                No past involuntary or voluntary psychiatric inpatient hospitalizations recorded. Zero past ICU admissions for deliberate overdose.
              </p>
            </div>

            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 space-y-2">
              <h4 className="font-bold text-rose-900">Self-Harm & Suicidality History</h4>
              <p className="text-rose-800 leading-relaxed font-medium">
                Denies previous suicide attempts. Mild non-suicidal self-injury (scratching) reported during high-stress periods in early adulthood, currently resolved.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Past Response to Psychotropic Agents</h4>
              <p className="text-slate-700 leading-relaxed">
                Previous trial with Escitalopram 10mg was discontinued due to excessive somnolence. Favorable clinical response noted with Sertraline and Vyvanse titration.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MEDICAL HISTORY */}
      {activeTab === 'med-history' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-600" />
            3. General Medical & Neurological History
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Chronic Medical Conditions</h4>
              <p className="text-slate-700 leading-relaxed">
                Mild essential hypertension managed with lifestyle modifications. No history of diabetes mellitus, asthma, or thyroid dysfunctions.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Neurological History & Head Trauma</h4>
              <p className="text-slate-700 leading-relaxed">
                Denies history of loss of consciousness, traumatic brain injury (TBI), seizures, stroke, or focal neurological deficits.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Surgical History</h4>
              <p className="text-slate-700 leading-relaxed">
                Appendectomy in 2018 (uncomplicated). No major cardiovascular or neurosurgical procedures.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Current Physical Illnesses & Review of Systems</h4>
              <p className="text-slate-700 leading-relaxed">
                Occasional tension-type headaches associated with prolonged screen time. Vital signs within normal limits.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PERSONAL HISTORY */}
      {activeTab === 'personal-history' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            4. Personal, Developmental & Occupational History
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Birth & Perinatal History</h4>
              <p className="text-slate-700 leading-relaxed">
                Full-term spontaneous vaginal delivery without perinatal complications or prolonged hypoxia. Normal birth weight.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Developmental Milestones</h4>
              <p className="text-slate-700 leading-relaxed">
                Achieved motor, speech, and social milestones on time. No early childhood neurodevelopmental delays noted.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Educational & Scholastic History</h4>
              <p className="text-slate-700 leading-relaxed">
                Bachelor's Degree in Business Administration. Reported mild executive dysfunction and procrastination during college years.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Occupational & Work History</h4>
              <p className="text-slate-700 leading-relaxed">
                Currently employed full-time as a Senior Financial Analyst. Reports good peer relationships with occasional workload burnout.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: FAMILY HISTORY */}
      {activeTab === 'family-history' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            5. Family Psychiatric & Genogram History
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Family Mental Health Disorders</h4>
              <p className="text-slate-700 leading-relaxed">
                Maternal aunt diagnosed with Generalized Anxiety Disorder. Maternal grandfather had history of late-life depression.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Family History of Substance Misuse</h4>
              <p className="text-slate-700 leading-relaxed">
                Paternal uncle had alcohol use disorder (currently in sustained remission for 12 years).
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Family Completed Suicides</h4>
              <p className="text-slate-700 leading-relaxed">
                Negative family history for completed suicides or violent self-harm acts.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Family Structure & Dynamics</h4>
              <p className="text-slate-700 leading-relaxed">
                Raised in a supportive two-parent household. Maintains strong ongoing contact with parents and sibling.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SOCIAL HISTORY */}
      {activeTab === 'social-history' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Home className="w-4 h-4 text-amber-600" />
            6. Social, Environmental & Substance History
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Living Situation & Support System</h4>
              <p className="text-slate-700 leading-relaxed">
                Lives in private apartment with spouse. Reports supportive domestic relationship and active social network.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Current Psychosocial Stressors</h4>
              <p className="text-slate-700 leading-relaxed">
                Workplace deadline pressure ahead of quarterly corporate audits. Financially stable without acute debts.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Substance Use Profile</h4>
              <p className="text-slate-700 leading-relaxed">
                <strong>Alcohol:</strong> Social consumption (1-2 drinks/week).<br />
                <strong>Tobacco / Nicotine:</strong> Non-smoker.<br />
                <strong>Illicit Substances:</strong> Denies cannabis, opioids, or illicit stimulant usage.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900">Legal History</h4>
              <p className="text-slate-700 leading-relaxed">
                Negative legal history. No pending litigation, arrests, or probation orders.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: MSE & RISK ASSESSMENT */}
      {activeTab === 'mse-risk' && (
        <div className="space-y-6">
          {/* Mental Status Examination Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-600" />
              Mental Status Examination (11 Clinical Domains)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">1. Appearance & Hygiene</span>
                <span className="text-slate-600">Well-groomed, casually dressed, congruent with age.</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">2. Behavior & Psychomotor</span>
                <span className="text-slate-600">Cooperative, good eye contact. No agitation or retardation.</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">3. Speech & Language</span>
                <span className="text-slate-600">Normal rate, tone, and latency. Fluent articulation.</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">4. Subjective Mood</span>
                <span className="text-slate-600 font-semibold text-blue-700">"Slightly anxious about work deadlines."</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">5. Observed Affect</span>
                <span className="text-slate-600">Euthymic to mildly reactive, full range, congruent.</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">6. Thought Content</span>
                <span className="text-slate-600">Preoccupied with executive organization. No delusions.</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">7. Thought Process</span>
                <span className="text-slate-600">Goal-directed, linear, logical. No flight of ideas.</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">8. Perception</span>
                <span className="text-slate-600">No auditory/visual hallucinations or illusions reported.</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">9. Cognition & Orientation</span>
                <span className="text-slate-600">Oriented to person, place, time, situation.</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">10. Insight</span>
                <span className="text-slate-600 font-bold text-teal-700">Good / Full awareness of clinical state.</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block">11. Judgment</span>
                <span className="text-slate-600 font-bold text-teal-700">Intact sound decision making.</span>
              </div>
            </div>
          </div>

          {/* Risk Assessment Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Clinical Risk Assessment Matrix
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-900 block">Suicide Risk Tier</span>
                <span className="inline-block px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[11px]">
                  LOW RISK
                </span>
                <p className="text-emerald-800 text-[11px] pt-1">No active plan or intent.</p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-900 block">Homicide / Violence Risk</span>
                <span className="inline-block px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[11px]">
                  LOW RISK
                </span>
                <p className="text-emerald-800 text-[11px] pt-1">Zero aggressive ideation.</p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-900 block">Self-Harm (NSSI) Risk</span>
                <span className="inline-block px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[11px]">
                  LOW RISK
                </span>
                <p className="text-emerald-800 text-[11px] pt-1">Resolved self-injurious behavior.</p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                <span className="font-bold text-emerald-900 block">Vulnerability & Neglect</span>
                <span className="inline-block px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[11px]">
                  LOW RISK
                </span>
                <p className="text-emerald-800 text-[11px] pt-1">Adequate social support network.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: PSYCHOMETRICS */}
      {activeTab === 'psychometrics' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-blue-600" />
              Psychometric Scales & Clinical Rating Instruments
            </h3>

            <button
              onClick={() => alert(`Initiate new psychometric assessment for ${patient.fullName}`)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> New Scale Entry
            </button>
          </div>

          <div className="space-y-3">
            {psychometricScores.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900">{item.name}</h4>
                  <p className="text-slate-500 mt-0.5">Administered on: {item.date}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-900 text-sm">{item.score}</span>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${item.color}`}>
                    {item.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: MEDICATIONS & ALLERGIES */}
      {activeTab === 'medications-allergies' && (
        <div className="space-y-6">
          {/* Active Medications */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" />
              Current Active Pharmacotherapy Regimen
            </h3>

            <p className="text-xs text-slate-700 leading-relaxed bg-teal-50/50 p-3 rounded-xl border border-teal-200 font-semibold">
              {patient.clinicalIntake.currentMedications}
            </p>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-800 mb-2">Historical Prescriptions</h4>
              {patientPrescriptions.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                  No historical digital prescriptions recorded for this patient.
                </p>
              ) : (
                <div className="space-y-2 text-xs">
                  {patientPrescriptions.map((rx) => (
                    <div key={rx.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 font-mono font-bold text-slate-900">
                          <span>{rx.id}</span>
                          <span className="text-slate-400 font-normal">•</span>
                          <span className="text-slate-600 font-normal">Issued: {rx.dateIssued}</span>
                          <StatusBadge status={rx.status} size="sm" />
                        </div>
                        <p className="text-slate-700 font-medium">
                          {rx.medications.map(m => `${m.name} (${m.dosage})`).join(', ')}
                        </p>
                      </div>

                      {currentUser.role !== 'RECEPTION' && currentUser.role !== 'RECEPTIONIST' && (
                        <button
                          type="button"
                          onClick={() => reusePrescription(rx)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 self-start sm:self-center"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Reuse Prescription
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Allergies & Adverse Reactions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-rose-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Allergies, Contraindications & Failed Trials
            </h3>

            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-xs space-y-2">
              <h4 className="font-bold text-rose-900">Documented Drug Allergies</h4>
              <p className="text-rose-900 font-semibold">{patient.clinicalIntake.allergies}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <h4 className="font-bold text-slate-900">Discontinued / Failed Medication Trials</h4>
              <p className="text-slate-700">
                <strong>Escitalopram 10mg:</strong> Discontinued in 2024 due to persistent somnolence and GI upset.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
