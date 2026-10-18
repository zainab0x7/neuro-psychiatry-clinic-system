'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { X, Calendar, Clock, User, Phone, Mail, FileText, CheckCircle2, Shield } from 'lucide-react';
import { AppointmentType } from '@/types';

interface PublicAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublicAppointmentModal: React.FC<PublicAppointmentModalProps> = ({ isOpen, onClose }) => {
  const { bookAppointment, showToast } = useApp();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [appointmentType, setAppointmentType] = useState<AppointmentType>('Initial Neuropsychiatric Eval');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('06:00 PM');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !preferredDate) {
      showToast('warning', 'Required Fields Missing', 'Please fill in your full name, phone number, and preferred appointment date.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Book using AppContext existing system (uses Dr. Shahab Muhammad Khan)
      bookAppointment({
        patientId: 'PX-PUB-' + Math.floor(1000 + Math.random() * 9000),
        patientName: fullName,
        patientPhone: phone,
        doctorName: 'DR SHAHAB MUHAMMAD',
        date: preferredDate,
        time: preferredTime,
        durationMinutes: 45,
        type: appointmentType,
        status: 'Scheduled',
        notes: `[Public Web Booking] Email: ${email}. Reason/Notes: ${notes}`,
      });

      setSubmitted(true);
      showToast('success', 'Appointment Request Submitted', 'Your appointment request has been recorded. Our clinic team will reach out to confirm your slot.');
    } catch (err) {
      showToast('error', 'Booking Error', 'Could not submit appointment request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setFullName('');
    setPhone('');
    setEmail('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 font-sans">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-white">Book an Appointment</h2>
              <p className="text-xs text-slate-400">Dr. Shahab Muhammad Khan — Consultant Psychiatrist</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-xl font-bold text-white">Request Received</h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
                Thank you, <strong className="text-white">{fullName}</strong>. Your appointment request for <strong className="text-teal-400">{preferredDate}</strong> at {preferredTime} has been logged.
              </p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Our clinic staff will contact you at <strong className="text-slate-200">{phone}</strong> to confirm your slot details.
              </p>
              <div className="pt-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition-all"
                >
                  Return to Website
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Patient Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name <span className="text-teal-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Muhammad Ali"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                </div>
              </div>

              {/* Contact Info (Phone & Email) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Phone Number <span className="text-teal-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92 300 0000000"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address <span className="text-slate-500">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="patient@example.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Consultation Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Consultation Service
                </label>
                <select
                  value={appointmentType}
                  onChange={(e) => setAppointmentType(e.target.value as AppointmentType)}
                  className="w-full px-3 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                >
                  <option value="Initial Neuropsychiatric Eval">Initial Psychiatric Evaluation</option>
                  <option value="Follow-up Consultation">Follow-up Consultation</option>
                  <option value="Medication Review">Medication Management & Review</option>
                  <option value="Psychotherapy Session">Mental Health Rehabilitation Consultation</option>
                  <option value="Urgent Crisis Consult">Urgent Consultation Request</option>
                </select>
              </div>

              {/* Preferred Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Preferred Date <span className="text-teal-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Preferred Time
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <select
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                    >
                      <option value="06:00 PM">06:00 PM</option>
                      <option value="06:45 PM">06:45 PM</option>
                      <option value="07:30 PM">07:30 PM</option>
                      <option value="08:15 PM">08:15 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Brief Reason / Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Brief Note <span className="text-slate-500">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mention any specific concerns or symptoms..."
                  className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all resize-none"
                />
              </div>

              {/* Privacy Reassurance Note */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-800 text-xs text-slate-400">
                <Shield className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Your information is held in strict professional clinical confidence.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium shadow-md shadow-teal-950/40 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  {isSubmitting ? 'Submitting...' : 'Confirm Appointment Request'}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};
