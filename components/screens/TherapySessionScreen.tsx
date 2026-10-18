'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HeartHandshake, User, Calendar, Clock, Save, FileText, Activity, Plus, ArrowLeft } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

export const TherapySessionScreen: React.FC = () => {
  const { 
    selectedPatientId, 
    patients, 
    therapySessions, 
    addTherapySession, 
    currentUser, 
    activeRole,
    navigateToPatientProfile, 
    setActiveScreen 
  } = useApp();

  const [activeView, setActiveView] = useState<'new' | 'history'>('new');

  // Filter patients based on role (Therapists see assigned patients or all active)
  const accessiblePatients = activeRole === 'THERAPIST' 
    ? patients.filter(p => p.status === 'Active' || p.status === 'In Treatment')
    : patients;

  const [targetPatientId, setTargetPatientId] = useState<string>(selectedPatientId || accessiblePatients[0]?.id || 'PX-9405');
  const patient = patients.find(p => p.id === targetPatientId) || patients[0];

  // Form states
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [sessionType, setSessionType] = useState<'CBT' | 'Psychodynamic' | 'Supportive Psychotherapy' | 'Family Therapy' | 'Interpersonal (IPT)' | 'Mindfulness-Based (MBCT)' | 'Exposure & Response Prevention (ERP)'>('CBT');
  const [assessment, setAssessment] = useState('Patient presented with moderate affective distress related to occupational stress and cognitive over-thinking.');
  const [counselling, setCounselling] = useState('Reviewed cognitive distortions (catastrophizing and all-or-nothing thinking). Guided Socratic questioning.');
  const [intervention, setIntervention] = useState('Practiced 2-column thought restructuring log. Instructed 4-7-8 diaphragmatic breathing during panic triggers.');
  const [progressNotes, setProgressNotes] = useState('Patient engaged actively during role-play exercise. Good insight into behavioral triggers.');
  const [psychometrics, setPsychometrics] = useState('GAD-7: 9 (Mild) • PHQ-9: 8 (Mild) • Y-BOCS: 14');
  const [lifestyleInterventions, setLifestyleInterventions] = useState('15-min daily morning walk, strict sleep onset deadline at 11:00 PM.');
  const [followUpPlan, setFollowUpPlan] = useState('Weekly 50-min CBT psychotherapy session. Review homework log.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addTherapySession({
      patientId: patient.id,
      patientName: patient.fullName,
      therapistId: currentUser.id,
      therapistName: currentUser.name,
      sessionDate,
      durationMinutes,
      sessionType,
      assessment,
      counselling,
      intervention,
      progressNotes,
      psychometrics,
      lifestyleInterventions,
      followUpPlan,
      responsibleClinician: currentUser.name,
      status: 'Completed',
    });

    setActiveView('history');
  };

  const patientSessions = therapySessions
    .filter(ts => ts.patientId === patient?.id)
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime());

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  const handleEdit = (session: typeof therapySessions[0]) => {
    setEditingSessionId(session.id);
    setSessionDate(session.sessionDate);
    setDurationMinutes(session.durationMinutes);
    setSessionType(session.sessionType as any);
    setAssessment(session.assessment);
    setCounselling(session.counselling);
    setIntervention(session.intervention);
    setProgressNotes(session.progressNotes);
    setPsychometrics(session.psychometrics);
    setLifestyleInterventions(session.lifestyleInterventions);
    setFollowUpPlan(session.followUpPlan);
    setActiveView('new');
  };

  const isReception = activeRole === 'RECEPTION' || activeRole === 'RECEPTIONIST';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-900/20">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Psychotherapy & Extended Session Notes</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Structured documentation for CBT, ERP, Psychodynamic, and Behavioral therapy sessions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isReception && (
            <button
              onClick={() => {
                setEditingSessionId(null);
                setActiveView('new');
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                activeView === 'new'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {editingSessionId ? 'Edit Session' : 'New Session Entry'}
            </button>
          )}
          <button
            onClick={() => setActiveView('history')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
              activeView === 'history' || isReception
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Session History ({patientSessions.length})
          </button>
        </div>
      </div>

      {isReception && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 font-medium">
          Notice: Reception staff access to psychotherapy clinical notes is restricted for patient privacy. Standard session header metadata is shown below.
        </div>
      )}

      {activeView === 'new' && !isReception ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Header & Selection Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-5">
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Select Assigned Patient *
                </label>
                <select
                  value={targetPatientId}
                  onChange={(e) => setTargetPatientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  {accessiblePatients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.id}) — {p.age}y/{p.gender}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-7 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{patient?.fullName}</span>
                  <span className="text-slate-500 font-mono ml-2">({patient?.id})</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Attending Clinician: <strong>{currentUser.name}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => patient && navigateToPatientProfile(patient.id)}
                  className="text-blue-600 font-semibold hover:underline"
                >
                  View Profile →
                </button>
              </div>
            </div>

            {/* Session Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Session Date *</label>
                <input
                  type="date"
                  required
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Psychotherapy Modality *</label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold"
                >
                  <option value="CBT">Cognitive Behavioral Therapy (CBT)</option>
                  <option value="Exposure & Response Prevention (ERP)">Exposure & Response Prevention (ERP)</option>
                  <option value="Psychodynamic">Psychodynamic Psychotherapy</option>
                  <option value="Supportive Psychotherapy">Supportive Psychotherapy</option>
                  <option value="Family Therapy">Family & Systemic Therapy</option>
                  <option value="Interpersonal (IPT)">Interpersonal Therapy (IPT)</option>
                  <option value="Mindfulness-Based (MBCT)">Mindfulness-Based Cognitive Therapy</option>
                </select>
              </div>
            </div>
          </div>

          {/* Therapy Clinical Sections */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Clinical Assessment & Therapy Documentation
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Psychotherapeutic Assessment</label>
                <textarea
                  rows={3}
                  value={assessment}
                  onChange={(e) => setAssessment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Counselling & Psychoeducation</label>
                <textarea
                  rows={3}
                  value={counselling}
                  onChange={(e) => setCounselling(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Interventions & Techniques Applied</label>
                <textarea
                  rows={3}
                  value={intervention}
                  onChange={(e) => setIntervention(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Session Progress Notes & Behavioral Observations</label>
                <textarea
                  rows={3}
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Psychometrics & Lifestyle Interventions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Psychometrics & Lifestyle / Homework Interventions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Standardized Psychometrics Score</label>
                <input
                  type="text"
                  value={psychometrics}
                  onChange={(e) => setPsychometrics(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-semibold"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Behavioral & Lifestyle Directives / Homework</label>
                <input
                  type="text"
                  value={lifestyleInterventions}
                  onChange={(e) => setLifestyleInterventions(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Therapy Follow-up & Goal Milestone Plan</label>
              <input
                type="text"
                value={followUpPlan}
                onChange={(e) => setFollowUpPlan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setActiveScreen('dashboard')}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {editingSessionId ? 'Update Psychotherapy Session Record' : 'Save Psychotherapy Session Record'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Therapy Records for {patient?.fullName} ({patientSessions.length})
            </h3>
            {!isReception && (
              <button
                onClick={() => {
                  setEditingSessionId(null);
                  setActiveView('new');
                }}
                className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Log New Session
              </button>
            )}
          </div>

          {patientSessions.length > 0 ? (
            patientSessions.map((session) => (
              <div key={session.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                        {session.id}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm">{session.sessionType}</h3>
                    </div>
                    <p className="text-slate-500 mt-0.5">
                      Date: {session.sessionDate} • Duration: {session.durationMinutes} mins • Clinician: {session.responsibleClinician}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={session.status} size="sm" />
                    {!isReception && (
                      <button
                        type="button"
                        onClick={() => handleEdit(session)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px]"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">Assessment & Counselling</h4>
                    <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed text-slate-700">
                      {session.assessment}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">Interventions Applied</h4>
                    <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed text-slate-700">
                      {session.intervention}
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-800">
                  <p><strong>Psychometrics:</strong> {session.psychometrics || 'N/A'}</p>
                  <p><strong>Lifestyle/Homework:</strong> {session.lifestyleInterventions}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              No therapy sessions documented for this patient yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

