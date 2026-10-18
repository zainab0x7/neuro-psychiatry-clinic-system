'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AppointmentType } from '../../types';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  Check, 
  Printer,
  CalendarCheck
} from 'lucide-react';

export const BookAppointmentScreen: React.FC = () => {
  const { 
    selectedPatientId, 
    patients, 
    appointments, 
    bookAppointment, 
    clinicSettings,
    setActiveScreen, 
    navigateToPatientProfile 
  } = useApp();

  const [patientId, setPatientId] = useState<string>(selectedPatientId || patients[0]?.id || 'PX-9402');
  const [date, setDate] = useState<string>('2026-09-09');
  const [selectedSlot, setSelectedSlot] = useState<string>('06:00 PM');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('Follow-up Consultation');
  const [notes, setNotes] = useState('Routine clinical review & pharmacotherapy monitoring.');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [lastBookedAppt, setLastBookedAppt] = useState<any>(null);

  const targetPatient = patients.find(p => p.id === patientId) || patients[0];

  // Dynamic time slots with occupied status derived from real appointments
  const doctorName = clinicSettings.doctorName || 'DR SHAHAB MUHAMMAD';
  const baseSlots = ['06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM'];

  const timeSlots = baseSlots.map(time => {
    const existing = appointments.find(a => 
      a.date === date && 
      a.time === time && 
      a.status !== 'Cancelled'
    );
    return {
      time,
      duration: 30,
      isOccupied: Boolean(existing),
      bookedBy: existing?.patientName,
    };
  });

  // Check if selected time slot conflicts with an existing appointment
  const isConflict = appointments.some(a => 
    a.date === date && 
    a.time === selectedSlot && 
    a.status !== 'Cancelled'
  );

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();

    if (isConflict) {
      alert(`Selected time slot (${selectedSlot} on ${date}) is already booked for ${doctorName}. Please choose an open slot.`);
      return;
    }

    const appt = bookAppointment({
      patientId: targetPatient.id,
      patientName: targetPatient.fullName,
      patientPhone: targetPatient.phone,
      doctorName: clinicSettings.doctorName || 'DR SHAHAB MUHAMMAD',
      date,
      time: selectedSlot,
      durationMinutes: appointmentType.includes('Eval') ? 60 : 45,
      type: appointmentType,
      status: 'Confirmed',
      notes,
      room: 'Consultation Suite 1',
    });

    setLastBookedAppt(appt);
    setIsConfirmed(true);
  };

  if (isConfirmed && lastBookedAppt) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-2xl border border-emerald-200 p-8 shadow-md text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Appointment Successfully Booked!</h2>
          <p className="text-xs text-slate-500">
            Automated SMS & Email notification sent to patient.
          </p>

          {/* Printable Receipt Card */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-left space-y-3 text-xs max-w-lg mx-auto">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Appointment Receipt</span>
              <span className="font-mono font-bold text-blue-700">{lastBookedAppt.id}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-700">
              <p><strong>Patient:</strong> {lastBookedAppt.patientName}</p>
              <p><strong>Patient ID:</strong> {lastBookedAppt.patientId}</p>
              <p><strong>Date & Time:</strong> {lastBookedAppt.date} at {lastBookedAppt.time}</p>
              <p><strong>Type:</strong> {lastBookedAppt.type}</p>
              <p><strong>Specialist:</strong> {lastBookedAppt.doctorName}</p>
              <p><strong>Location:</strong> {lastBookedAppt.room}</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsConfirmed(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Book Another
            </button>

            <button
              onClick={() => navigateToPatientProfile(lastBookedAppt.patientId, 'appointments')}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              Go to Patient Chart
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveScreen('appointments')}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Book Clinical Appointment</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Select patient, date, and available time slot.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleBooking} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          {/* Step 1: Select Patient */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
              1. Select Patient *
            </label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.id}) — Phone: {p.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Date & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-900 uppercase tracking-wider mb-1">
                2. Select Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-900 uppercase tracking-wider mb-1">
                3. Consultation Category *
              </label>
              <select
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500"
              >
                <option value="Follow-up Consultation">Follow-up Consultation (45 min)</option>
                <option value="Initial Neuropsychiatric Eval">Initial Neuropsychiatric Eval (60 min)</option>
                <option value="Medication Review">Medication Review (30 min)</option>
                <option value="ADHD / Cognitive Assessment">ADHD / Cognitive Assessment (45 min)</option>
                <option value="Psychotherapy Session">Psychotherapy Session (50 min)</option>
              </select>
            </div>
          </div>

          {/* Step 3: Interactive Time Slot Picker */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                4. Select Available Time Slot *
              </label>
              <span className="text-[11px] text-slate-500">
                Operating days: Mon, Wed, Fri • 6:00 PM – 8:00 PM
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {timeSlots.map((slot) => {
                const isSelected = selectedSlot === slot.time;
                const isOccupied = slot.isOccupied;

                return (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={isOccupied}
                    onClick={() => setSelectedSlot(slot.time)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all relative ${
                      isOccupied
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        : isSelected
                        ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-mono font-bold text-xs">{slot.time}</div>
                    <div className="text-[10px] mt-0.5 opacity-80">
                      {isOccupied ? `Occupied (${slot.bookedBy?.split(' ')[0]})` : `${slot.duration} min slot`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4: Notes */}
          <div className="space-y-1 text-xs">
            <label className="block font-bold text-slate-900 uppercase tracking-wider">
              5. Appointment Notes & Preparation
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Clinical reason, pre-consult blood work required..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setActiveScreen('appointments')}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <CalendarCheck className="w-4 h-4 text-teal-400" />
            Confirm & Book Appointment
          </button>
        </div>
      </form>
    </div>
  );
};
