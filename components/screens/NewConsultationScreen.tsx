'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MedicationItem } from '../../types';
import { 
  FileText, 
  User, 
  Brain, 
  Pill, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft,
  CheckCircle2,
  Stethoscope,
  ShieldAlert,
  FileCheck2,
  Printer,
  Sparkles
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

  // Section 2: HPI & Complaint
  const [presentingComplaint, setPresentingComplaint] = useState(
    'Patient presents for routine follow-up evaluation. Reports sleep consistency improved to 7.5 hrs/night. No acute suicidal ideation or psychotic features.'
  );

  // Section 3: MSE 11 Domains
  const [mseAppearance, setMseAppearance] = useState('Well-groomed, age-appropriate attire.');
  const [mseBehavior, setMseBehavior] = useState('Cooperative, appropriate eye contact, no motor restlessness.');
  const [mseSpeech, setMseSpeech] = useState('Normal rate, volume, and rhythm.');
  const [mseMood, setMseMood] = useState('Euthymic to slightly anxious.');
  const [mseAffect, setMseAffect] = useState('Full range, mood-congruent.');
  const [mseThoughtContent, setMseThoughtContent] = useState('No delusions, suicidal, or homicidal ideation.');
  const [mseThoughtProcess, setMseThoughtProcess] = useState('Linear, logical, goal-directed.');
  const [msePerception, setMsePerception] = useState('No hallucinations or perceptual disturbances.');
  const [mseCognition, setMseCognition] = useState('Alert, oriented x 4. Memory intact.');
  const [mseInsight, setMseInsight] = useState('Good / Full awareness.');
  const [mseJudgment, setMseJudgment] = useState('Intact.');

  // Section 4: Risk Assessment Matrix
  const [suicideRisk, setSuicideRisk] = useState('Low');
  const [violenceRisk, setViolenceRisk] = useState('Low');
  const [selfHarmRisk, setSelfHarmRisk] = useState('Low');
  const [vulnerabilityRisk, setVulnerabilityRisk] = useState('Low');
  const [riskMitigation, setRiskMitigation] = useState('Safety plan reviewed. Emergency hotline provided.');

  // Section 5: Psychometric Scale Scores
  const [phq9Score, setPhq9Score] = useState('8 (Mild)');
  const [gad7Score, setGad7Score] = useState('6 (Mild)');
  const [mocaScore, setMocaScore] = useState('28 / 30 (Normal)');

  // Section 6 & 7: Diagnostic & Multi-axial Formulation
  const [primaryICD, setPrimaryICD] = useState('F90.2');
  const [primaryTitle, setPrimaryTitle] = useState('Attention-Deficit Hyperactivity Disorder, Combined Presentation');
  const [biopsychosocialNotes, setBiopsychosocialNotes] = useState(
    'Bio: Executive dysfunction baseline.\nPsycho: High perfectionism under stress.\nSocial: Strong family support system.'
  );
  const [assessment, setAssessment] = useState(
    'Clinical response to psychotropic titration remains favorable with minimal reported adverse effects.'
  );

  // Section 8: Treatment Plan
  const [treatmentPlan, setTreatmentPlan] = useState(
    '1. Continue Vyvanse 50mg in the morning.\n2. Weekly CBT sessions focusing on time management.\n3. Re-evaluate in 30 days.'
  );

  // Section 9: Medication Builder
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

  // Section 10: Follow-up Scheduling
  const [followUpDate, setFollowUpDate] = useState('2026-10-08');
  const [followUpNotes, setFollowUpNotes] = useState('Monthly executive & clinical stability review.');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetPatientId) {
      alert('Please select a patient.');
      return;
    }

    const compiledObservations = `Appearance: ${mseAppearance}\nBehavior: ${mseBehavior}\nSpeech: ${mseSpeech}\nMood: ${mseMood}\nAffect: ${mseAffect}\nThought Content: ${mseThoughtContent}\nThought Process: ${mseThoughtProcess}\nPerception: ${msePerception}\nCognition: ${mseCognition}\nInsight: ${mseInsight}\nJudgment: ${mseJudgment}`;

    const mentalStatusExam = {
      appearance: mseAppearance,
      behavior: mseBehavior,
      speech: mseSpeech,
      moodAndAffect: `${mseMood} / ${mseAffect}`,
      thoughtProcess: mseThoughtProcess,
      thoughtContent: mseThoughtContent,
      perception: msePerception,
      cognition: mseCognition,
      insightAndJudgment: `Insight: ${mseInsight} | Judgment: ${mseJudgment}`,
    };

    addConsultation({
      patientId: patient.id,
      patientName: patient.fullName,
      doctorId: currentUser.id || 'USR-001',
      doctorName: currentUser.name || 'DR SHAHAB MUHAMMAD',
      date: new Date().toISOString().split('T')[0],
      consultationDate: new Date().toISOString().split('T')[0],
      time: '11:30 AM',
      visitType: 'Follow-up Consultation',
      presentingComplaint,
      clinicalObservations: compiledObservations,
      mentalStatusExam,
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

    navigateToPatientProfile(patient.id, 'consultations');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* 1. Patient Clinical Context Header & Snapshot */}
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
                Screen 06: New Consultation & Psychiatric Assessment Workstation
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Structured clinical intake workstation for {currentUser.name || 'DR SHAHAB MUHAMMAD'}
              </p>
            </div>
          </div>

          <span className="text-xs font-mono bg-blue-50 text-blue-800 font-bold px-3 py-1 rounded-full border border-blue-200">
            Session Date: {new Date().toISOString().split('T')[0]}
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
                Age: {patient.age} • Phone: {patient.phone} • Allergies: <span className="text-rose-700 font-bold">{patient.clinicalIntake.allergies}</span>
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
        {/* 2. Presenting Complaint & HPI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            2. Presenting Complaint & History of Present Illness (HPI)
          </h3>

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">
              Detailed HPI Narrative & Interval History *
            </label>
            <textarea
              rows={3}
              required
              value={presentingComplaint}
              onChange={(e) => setPresentingComplaint(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* 3. Mental Status Examination (MSE) 11 Core Domains */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600" />
            3. Mental Status Examination (MSE) — 11 Core Domains
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">1. Appearance & Hygiene</label>
              <input type="text" value={mseAppearance} onChange={(e) => setMseAppearance(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-md" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">2. Behavior & Psychomotor</label>
              <input type="text" value={mseBehavior} onChange={(e) => setMseBehavior(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-md" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">3. Speech & Articulation</label>
              <input type="text" value={mseSpeech} onChange={(e) => setMseSpeech(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-md" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">4. Subjective Mood</label>
              <input type="text" value={mseMood} onChange={(e) => setMseMood(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-md" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">5. Observed Affect</label>
              <input type="text" value={mseAffect} onChange={(e) => setMseAffect(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-md" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">6. Thought Content</label>
              <input type="text" value={mseThoughtContent} onChange={(e) => setMseThoughtContent(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-md" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">7. Thought Process</label>
              <input type="text" value={mseThoughtProcess} onChange={(e) => setMseThoughtProcess(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-md" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">8. Perception & Hallucinations</label>
              <input type="text" value={msePerception} onChange={(e) => setMsePerception(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-md" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">9. Cognition & Memory</label>
              <input type="text" value={mseCognition} onChange={(e) => setMseCognition(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-md" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">10. Insight Level</label>
              <input type="text" value={mseInsight} onChange={(e) => setMseInsight(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-md font-bold text-teal-700" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">11. Judgment Level</label>
              <input type="text" value={mseJudgment} onChange={(e) => setMseJudgment(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-md font-bold text-teal-700" />
            </div>
          </div>
        </div>

        {/* 4. Risk Assessment Matrix */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            4. Clinical Risk Assessment Matrix
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Suicide Risk Tier</label>
              <select value={suicideRisk} onChange={(e) => setSuicideRisk(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-md font-bold">
                <option value="Low">Low Risk</option>
                <option value="Moderate">Moderate Risk</option>
                <option value="High">High Risk</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Violence Risk Tier</label>
              <select value={violenceRisk} onChange={(e) => setViolenceRisk(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-md font-bold">
                <option value="Low">Low Risk</option>
                <option value="Moderate">Moderate Risk</option>
                <option value="High">High Risk</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Self-Harm (NSSI) Risk</label>
              <select value={selfHarmRisk} onChange={(e) => setSelfHarmRisk(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-md font-bold">
                <option value="Low">Low Risk</option>
                <option value="Moderate">Moderate Risk</option>
                <option value="High">High Risk</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vulnerability Risk</label>
              <select value={vulnerabilityRisk} onChange={(e) => setVulnerabilityRisk(e.target.value)} className="w-full px-2.5 py-1.5 bg-slate-50 border rounded-md font-bold">
                <option value="Low">Low Risk</option>
                <option value="Moderate">Moderate Risk</option>
                <option value="High">High Risk</option>
              </select>
            </div>
          </div>
        </div>

        {/* 5. Psychometric Scales */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-blue-600" />
            5. Psychometric Scale Scores & Rating Tools
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">PHQ-9 Depression Score</label>
              <input type="text" value={phq9Score} onChange={(e) => setPhq9Score(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border rounded-md" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">GAD-7 Anxiety Score</label>
              <input type="text" value={gad7Score} onChange={(e) => setGad7Score(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border rounded-md" />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">MoCA Cognitive Score</label>
              <input type="text" value={mocaScore} onChange={(e) => setMocaScore(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border rounded-md" />
            </div>
          </div>
        </div>

        {/* 6 & 7. Diagnostic Impression & Biopsychosocial Formulation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600" />
            6 & 7. Diagnostic Code & Biopsychosocial Formulation
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Preset ICD-10 Code</label>
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

          <div className="text-xs">
            <label className="block font-semibold text-slate-700 mb-1">Biopsychosocial Formulation (Bio / Psycho / Social)</label>
            <textarea
              rows={2}
              value={biopsychosocialNotes}
              onChange={(e) => setBiopsychosocialNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>
        </div>

        {/* 8. Treatment Plan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            8. Treatment Plan & Psychotherapy Directives
          </h3>

          <div className="text-xs">
            <textarea
              rows={3}
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
            />
          </div>
        </div>

        {/* 9. Integrated Pharmacotherapy Builder */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" />
              9. Pharmacotherapy & Prescription Builder
            </h3>

            <button
              type="button"
              onClick={addMedicationRow}
              className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Drug
            </button>
          </div>

          <div className="space-y-3">
            {medications.map((m) => (
              <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-slate-600 mb-1">Medication Name</label>
                    <input
                      type="text"
                      value={m.name}
                      onChange={(e) => updateMedicationRow(m.id, 'name', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Dosage</label>
                    <input
                      type="text"
                      value={m.dosage}
                      onChange={(e) => updateMedicationRow(m.id, 'dosage', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Frequency</label>
                    <input
                      type="text"
                      value={m.frequency}
                      onChange={(e) => updateMedicationRow(m.id, 'frequency', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 italic">Duration: {m.duration} • Instructions: {m.instructions}</span>
                  {medications.length > 1 && (
                    <button type="button" onClick={() => removeMedicationRow(m.id)} className="text-rose-600 font-bold hover:underline">
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 10. Follow-up Scheduling */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            10. Follow-up Scheduling & Clinical Review
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
              <label className="block font-semibold text-slate-700 mb-1">Reason / Clinical Directives</label>
              <input
                type="text"
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 p-4 z-40 shadow-lg">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500">
              Draft Autosaved • Chart: <strong className="text-slate-800">{patient.fullName}</strong>
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => alert('Consultation draft saved.')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Save Draft
              </button>

              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Complete Consultation & Issue Rx
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
