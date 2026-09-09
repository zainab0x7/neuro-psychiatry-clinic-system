'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MedicationItem } from '../../types';
import { 
  FileText, 
  User, 
  BrainCircuit, 
  Pill, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft,
  CheckCircle2,
  Stethoscope
} from 'lucide-react';

export const NewConsultationScreen: React.FC = () => {
  const { 
    selectedPatientId, 
    patients, 
    addConsultation, 
    setActiveScreen, 
    navigateToPatientProfile,
    currentUser
  } = useApp();

  const [targetPatientId, setTargetPatientId] = useState<string>(selectedPatientId || patients[0]?.id || 'PX-9402');
  const patient = patients.find(p => p.id === targetPatientId) || patients[0];

  // Form states
  const [presentingComplaint, setPresentingComplaint] = useState(
    'Patient presents for routine follow-up evaluation. Reports sleep consistency improved to 7.5 hrs/night. No acute suicidal ideation or psychotic features.'
  );
  const [clinicalObservations, setClinicalObservations] = useState(
    'Alert, oriented x 4. Grooming appropriate. Speech fluent, normal rate and volume. Mood euthymic, affect congruent. Cognition grossly intact.'
  );
  const [primaryICD, setPrimaryICD] = useState('F90.2');
  const [primaryTitle, setPrimaryTitle] = useState('Attention-Deficit Hyperactivity Disorder, Combined Presentation');
  const [assessment, setAssessment] = useState(
    'Clinical response to psychotropic titration remains favorable with minimal reported adverse effects.'
  );
  const [treatmentPlan, setTreatmentPlan] = useState(
    '1. Continue current medication regimen.\n2. Maintain weekly cognitive behavioral strategies.\n3. Re-evaluate in 30 days.'
  );

  // Medication Builder items
  const [medications, setMedications] = useState<MedicationItem[]>([
    {
      id: 'med-1',
      name: 'Lisdexamfetamine (Vyvanse)',
      dosage: '50mg',
      frequency: 'Once daily in the morning',
      duration: '30 days',
      instructions: 'Take with breakfast. Avoid caffeine late in day.',
      refills: 2,
    },
  ]);

  // Follow-up date
  const [followUpDate, setFollowUpDate] = useState('2026-10-08');
  const [followUpNotes, setFollowUpNotes] = useState('Monthly executive & clinical stability review.');

  // Pre-fill diagnostic codes dropdown helper
  const commonDiagnoses = [
    { icd: 'F90.2', title: 'Attention-Deficit Hyperactivity Disorder, Combined Presentation' },
    { icd: 'F31.3', title: 'Bipolar I Disorder, Current Episode Depressed, Mild' },
    { icd: 'F31.81', title: 'Bipolar II Disorder, Currently in Remission' },
    { icd: 'F32.2', title: 'Major Depressive Disorder, Single Episode, Severe without Psychotic Features' },
    { icd: 'F41.1', title: 'Generalized Anxiety Disorder' },
    { icd: 'F42.2', title: 'Obsessive-Compulsive Disorder, Mixed Obsessional Thoughts and Acts' },
    { icd: 'F25.1', title: 'Schizoaffective Disorder, Depressive Type' },
    { icd: 'S06.2', title: 'Diffuse Traumatic Brain Injury & Sequelae' },
  ];

  const addMedicationRow = () => {
    setMedications(prev => [
      ...prev,
      {
        id: `med-${Date.now()}`,
        name: 'Sertraline Hydrochloride',
        dosage: '50mg',
        frequency: 'Once daily in the morning',
        duration: '30 days',
        instructions: 'Take with food.',
        refills: 1,
      },
    ]);
  };

  const removeMedicationRow = (id: string) => {
    setMedications(prev => prev.filter(m => m.id !== id));
  };

  const updateMedicationRow = (id: string, field: keyof MedicationItem, value: any) => {
    setMedications(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetPatientId) {
      alert('Please select a patient.');
      return;
    }

    addConsultation({
      patientId: patient.id,
      patientName: patient.fullName,
      doctorName: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      time: '11:30 AM',
      presentingComplaint,
      clinicalObservations,
      assessment,
      diagnosis: {
        primaryICD,
        primaryTitle,
      },
      treatmentPlan,
      medications,
      followUpDate,
      followUpNotes,
    });

    // Redirect to patient profile consultations tab!
    navigateToPatientProfile(patient.id, 'consultations');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Patient Summary Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveScreen('dashboard')}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                New Neuropsychiatric Consultation
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Fast clinical entry workspace for {currentUser.name || 'DR SHAHAB MUHAMMAD'}
              </p>
            </div>
          </div>

          <span className="text-xs font-mono bg-blue-50 text-blue-800 font-bold px-3 py-1 rounded-full border border-blue-200">
            Intake Session • {new Date().toISOString().split('T')[0]}
          </span>
        </div>

        {/* Selected Patient Selector & Card */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Select Patient Chart *
            </label>
            <select
              value={targetPatientId}
              onChange={(e) => setTargetPatientId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 font-bold focus:ring-2 focus:ring-blue-500"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.id}) — {p.age}y/{p.gender}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-8 bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-900">{patient.fullName}</span>
              <span className="text-slate-500 ml-2 font-mono">({patient.id})</span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Age: {patient.age} • Phone: {patient.phone}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-semibold">Last Visit</span>
              <span className="font-bold text-slate-700">{patient.lastVisitDate}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: HPI & Observations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            1. Presenting Complaint & Clinical Observations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Presenting Complaint / History of Present Illness (HPI) *
              </label>
              <textarea
                rows={4}
                required
                value={presentingComplaint}
                onChange={(e) => setPresentingComplaint(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mental Status Examination (MSE) & Observations
              </label>
              <textarea
                rows={4}
                value={clinicalObservations}
                onChange={(e) => setClinicalObservations(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Diagnosis & Formulation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-purple-600" />
            2. Diagnostic Impression & Formulation
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Preset ICD-11 / ICD-10 Code</label>
              <select
                onChange={(e) => {
                  const selected = commonDiagnoses.find(d => d.icd === e.target.value);
                  if (selected) {
                    setPrimaryICD(selected.icd);
                    setPrimaryTitle(selected.title);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
              >
                {commonDiagnoses.map(d => (
                  <option key={d.icd} value={d.icd}>
                    {d.icd} — {d.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Diagnostic Code</label>
              <input
                type="text"
                value={primaryICD}
                onChange={(e) => setPrimaryICD(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Diagnostic Classification</label>
              <input
                type="text"
                value={primaryTitle}
                onChange={(e) => setPrimaryTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Clinical Assessment</label>
              <textarea
                rows={3}
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Treatment Plan & Psychotherapy Directives</label>
              <textarea
                rows={3}
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Medication Builder */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" />
              3. Pharmacotherapy & Prescription Builder
            </h3>

            <button
              type="button"
              onClick={addMedicationRow}
              className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Medication
            </button>
          </div>

          <div className="space-y-3">
            {medications.map((m, index) => (
              <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-600 mb-1">Medication Name</label>
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => updateMedicationRow(m.id, 'name', e.target.value)}
                      placeholder="e.g. Lisdexamfetamine Dimesylate"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Dosage</label>
                    <input
                      type="text"
                      value={m.dosage}
                      onChange={(e) => updateMedicationRow(m.id, 'dosage', e.target.value)}
                      placeholder="e.g. 50mg"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Frequency</label>
                    <input
                      type="text"
                      value={m.frequency}
                      onChange={(e) => updateMedicationRow(m.id, 'frequency', e.target.value)}
                      placeholder="e.g. Once daily in morning"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Duration</label>
                    <input
                      type="text"
                      value={m.duration}
                      onChange={(e) => updateMedicationRow(m.id, 'duration', e.target.value)}
                      placeholder="e.g. 30 days"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-600 mb-1">Instructions / Rx Notes</label>
                    <input
                      type="text"
                      value={m.instructions}
                      onChange={(e) => updateMedicationRow(m.id, 'instructions', e.target.value)}
                      placeholder="e.g. Take with food."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                    />
                  </div>

                  <div className="flex items-center justify-end">
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicationRow(m.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove medication"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Follow-up Scheduling */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            4. Follow-up Planning & Clinical Review
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Follow-up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Reason for Follow-up / Instructions</label>
              <input
                type="text"
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                placeholder="e.g. Monthly medication review & lab check"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveScreen('dashboard')}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Consultation Record & Issue Rx
          </button>
        </div>
      </form>
    </div>
  );
};
