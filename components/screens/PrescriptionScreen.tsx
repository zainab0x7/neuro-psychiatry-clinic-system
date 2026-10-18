'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MedicationItem, Prescription } from '../../types';
import { Pill, Printer, Plus, Trash2, Save, FileText, ArrowLeft, CheckCircle2, RotateCcw, ShieldAlert } from 'lucide-react';

export const PrescriptionScreen: React.FC = () => {
  const { 
    selectedPatientId, 
    patients, 
    prescriptions, 
    addPrescription, 
    clinicSettings, 
    setActiveScreen, 
    currentUser,
    draftPrescription,
    setDraftPrescription,
    reusePrescription,
    showToast
  } = useApp();

  const isReception = currentUser.role === 'RECEPTION' || currentUser.role === 'RECEPTIONIST';

  const [patientId, setPatientId] = useState<string>(selectedPatientId || patients[0]?.id || 'PX-9402');
  const patient = patients.find(p => p.id === patientId) || patients[0];

  const [diagnosis, setDiagnosis] = useState('Adult ADHD (F90.2) / Executive Dysfunction');
  const [treatmentNotes, setTreatmentNotes] = useState('Maintain morning administration. Hydrate adequately throughout workday.');

  const [medications, setMedications] = useState<MedicationItem[]>([
    {
      id: 'm-1',
      name: 'Lisdexamfetamine Dimesylate (Vyvanse)',
      dosage: '50mg',
      frequency: 'Once daily in the morning',
      duration: '30 days',
      instructions: 'Take with morning meal or full glass of water. Dispense 30 capsules.',
      refills: 2,
    },
  ]);

  // Sync draft prescription into form state when draftPrescription is updated
  useEffect(() => {
    if (draftPrescription) {
      if (draftPrescription.patientId) setPatientId(draftPrescription.patientId);
      if (draftPrescription.diagnosis) setDiagnosis(draftPrescription.diagnosis);
      if (draftPrescription.treatmentNotes) setTreatmentNotes(draftPrescription.treatmentNotes);
      if (draftPrescription.medications && draftPrescription.medications.length > 0) {
        setMedications(draftPrescription.medications.map((m, idx) => ({
          ...m,
          id: m.id || `m-${Date.now()}-${idx}`,
        })));
      }
    }
  }, [draftPrescription]);

  const patientPrescriptions = prescriptions.filter(p => p.patientId === (patient?.id || patientId));

  const handleSaveRx = (e: React.FormEvent) => {
    e.preventDefault();

    if (isReception) {
      showToast('error', 'Access Denied', 'Reception staff are not authorized to issue prescriptions.');
      return;
    }

    if (!patient) {
      showToast('error', 'Selection Required', 'Please select a valid patient.');
      return;
    }

    if (medications.length === 0) {
      showToast('warning', 'Medications Missing', 'Please add at least one medication item.');
      return;
    }

    addPrescription({
      patientId: patient.id,
      patientName: patient.fullName,
      patientAge: patient.age,
      patientGender: patient.gender,
      doctorName: currentUser.name,
      doctorLicense: clinicSettings.licenseNumber,
      dateIssued: new Date().toISOString().split('T')[0],
      diagnosis,
      medications,
      treatmentNotes,
      status: 'Active',
    });

    setDraftPrescription(null);
    showToast('success', 'Prescription Issued', `Digital prescription generated and saved as a permanent record for ${patient.fullName}.`);
  };

  const handleRemoveMedication = (id: string) => {
    if (medications.length <= 1) {
      showToast('warning', 'Cannot Remove', 'Prescription must contain at least one medication.');
      return;
    }
    setMedications(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveScreen('dashboard')}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Pill className="w-5 h-5 text-teal-600" />
              Prescription & Pharmacotherapy Record
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Official medical prescription generator & historical log.
            </p>
          </div>
        </div>

        {draftPrescription && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold rounded-lg flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Reusing Existing Rx Template
            </span>
            <button
              onClick={() => setDraftPrescription(null)}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Clear Draft
            </button>
          </div>
        )}
      </div>

      {/* Role Restriction Banner for Reception */}
      {isReception && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="font-bold">Reception Access Restricted</p>
            <p className="text-amber-800 mt-0.5">
              Reception staff are permitted to view prescription metadata only. Creating, editing, or issuing digital prescriptions is restricted to Doctors and Administrators.
            </p>
          </div>
        </div>
      )}

      {/* Main Prescription Document Form */}
      <form onSubmit={handleSaveRx} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          {/* Clinic Header Document Style */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
            <div>
              <h2 className="font-extrabold text-slate-900 text-lg tracking-tight uppercase">
                {clinicSettings.clinicName || clinicSettings.practiceName || 'Neuro Psychiatry Clinic'}
              </h2>
              <p className="text-xs font-bold text-teal-700">{clinicSettings.department || 'Psychiatry'} Department</p>
              <p className="text-xs text-slate-600 mt-1">{clinicSettings.address} • Tel: {clinicSettings.phone}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Clinic Hours: Mon, Wed, Fri • 6:00 PM – 8:00 PM</p>
            </div>

            <div className="text-right text-xs">
              <p className="font-bold text-slate-900 text-sm">{clinicSettings.doctorName}</p>
              <p className="text-slate-700 font-semibold">{clinicSettings.doctorDesignation || 'HOD & Consultant Psychiatrist'}</p>
              <p className="text-slate-500 font-mono text-[11px]">{clinicSettings.education || 'MBBS, MCPS, FCPS, CHPE'}</p>
              <p className="text-slate-500 font-mono text-[11px] mt-0.5">Lic: {clinicSettings.licenseNumber}</p>
              <p className="text-slate-400 mt-1">Date: {new Date().toISOString().split('T')[0]}</p>
            </div>
          </div>

          {/* Patient Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">Select Patient *</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                disabled={isReception}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 disabled:opacity-60"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.id}) — Age: {p.age}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">Clinical Diagnosis *</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                disabled={isReception}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium disabled:opacity-60"
              />
            </div>
          </div>

          {/* Rx Medication Items */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <span className="text-teal-700 font-serif text-lg italic font-bold">℞</span> Prescribed Medication Details
              </h3>

              {!isReception && (
                <button
                  type="button"
                  onClick={() => setMedications(prev => [...prev, {
                    id: `m-${Date.now()}`,
                    name: 'Quetiapine Fumarate',
                    dosage: '25mg',
                    frequency: 'Once daily at bedtime PRN',
                    duration: '30 days',
                    instructions: 'Take for severe sleep latency.',
                    refills: 1
                  }])}
                  className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Drug
                </button>
              )}
            </div>

            <div className="space-y-3">
              {medications.map((m, idx) => (
                <div key={m.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 relative">
                  {!isReception && medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(m.id)}
                      className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove Medication"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pr-6">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Drug Name & Formulation</label>
                      <input
                        type="text"
                        value={m.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMedications(prev => prev.map(item => item.id === m.id ? { ...item, name: val } : item));
                        }}
                        disabled={isReception}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md font-bold text-slate-900 disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Dosage / Strength</label>
                      <input
                        type="text"
                        value={m.dosage}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMedications(prev => prev.map(item => item.id === m.id ? { ...item, dosage: val } : item));
                        }}
                        disabled={isReception}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Refills Authorized</label>
                      <input
                        type="number"
                        value={m.refills}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setMedications(prev => prev.map(item => item.id === m.id ? { ...item, refills: val } : item));
                        }}
                        disabled={isReception}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Frequency</label>
                      <input
                        type="text"
                        value={m.frequency}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMedications(prev => prev.map(item => item.id === m.id ? { ...item, frequency: val } : item));
                        }}
                        disabled={isReception}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md disabled:opacity-60"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 mb-1">Dispensing Instructions</label>
                      <input
                        type="text"
                        value={m.instructions}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMedications(prev => prev.map(item => item.id === m.id ? { ...item, instructions: val } : item));
                        }}
                        disabled={isReception}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Treatment Notes */}
          <div className="space-y-1 text-xs">
            <label className="block font-bold text-slate-800 uppercase tracking-wider">
              Treatment & Monitoring Directives
            </label>
            <textarea
              rows={2}
              value={treatmentNotes}
              onChange={(e) => setTreatmentNotes(e.target.value)}
              disabled={isReception}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 disabled:opacity-60"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print Document
          </button>

          {!isReception && (
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> Save & Issue Prescription
            </button>
          )}
        </div>
      </form>

      {/* Historical Prescriptions List */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
          <span>Historical Prescriptions for {patient?.fullName || 'Patient'} ({patientPrescriptions.length})</span>
          <span className="text-xs font-mono font-normal text-slate-400">Permanent Medical Log</span>
        </h3>

        {patientPrescriptions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
            No historical digital prescriptions recorded for this patient yet.
          </div>
        ) : (
          <div className="space-y-3">
            {patientPrescriptions.map(rx => (
              <div key={rx.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900">{rx.id}</span>
                    <span className="text-slate-400 font-normal">•</span>
                    <span className="text-slate-600 font-normal">Issued: {rx.dateIssued}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-teal-700 font-semibold">{rx.status}</span>
                    {!isReception && (
                      <button
                        type="button"
                        onClick={() => reusePrescription(rx)}
                        className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[11px] font-bold rounded-md transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Reuse Prescription
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-slate-700"><strong>Diagnosis:</strong> {rx.diagnosis}</p>

                <div className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider mb-0.5">Medications:</span>
                  {rx.medications.map((m, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] border-b border-slate-100 last:border-0 pb-1 last:pb-0">
                      <span className="font-bold text-slate-900">{m.name} ({m.dosage})</span>
                      <span className="text-slate-600 font-mono">
                        {m.frequency} • {m.duration}
                        {m.instructions && !m.instructions.includes('[Restricted') ? ` (${m.instructions})` : ''}
                      </span>
                    </div>
                  ))}
                </div>

                {rx.treatmentNotes && (
                  <p className="text-slate-600 text-[11px] italic">
                    <strong>Notes:</strong> {isReception ? '[Restricted: Clinical Note Access Limited for Reception]' : rx.treatmentNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

