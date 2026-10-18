'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BrainCircuit, Mail, Lock, KeyRound, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

export const ForgotPasswordScreen: React.FC = () => {
  const { setActiveScreen, showToast } = useApp();
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [email, setEmail] = useState('dr.vance@vancepsychiatry.com');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('error', 'Email Required', 'Please enter your registered clinical email address.');
      return;
    }
    showToast('success', 'Reset Link Sent', `Password reset instructions sent to ${email}`);
    setStep('reset');
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('error', 'Weak Password', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Password Mismatch', 'New password and confirmation do not match.');
      return;
    }

    showToast('success', 'Password Updated', 'Your password has been reset successfully.');
    setStep('success');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/30 mb-4">
          <BrainCircuit className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Neuro Psychiatry Clinic</h2>
        <p className="text-xs text-slate-400 mt-1">EMR Account Recovery & Password Reset</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl border border-slate-800/20 sm:px-10 text-xs">
          {step === 'request' && (
            <form onSubmit={handleRequestReset} className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Forgot Clinical Access Password?</h3>
                <p className="text-slate-500 leading-relaxed">
                  Enter your registered clinic email address to receive a secure password recovery code.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email / Username</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@vancepsychiatry.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                Send Reset Code
              </button>

              <button
                type="button"
                onClick={() => setActiveScreen('login')}
                className="w-full text-center text-slate-500 hover:text-slate-800 font-semibold flex items-center justify-center gap-1 pt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Set New Password</h3>
                <p className="text-slate-500 leading-relaxed">
                  Enter your new secure clinical access password for <span className="font-semibold text-slate-800">{email}</span>.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Reset & Update Password
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Password Reset Complete</h3>
              <p className="text-slate-500 leading-relaxed">
                Your clinical password has been securely updated. You may now log into the EMR workspace.
              </p>
              <button
                type="button"
                onClick={() => setActiveScreen('login')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors"
              >
                Back to Login Screen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
