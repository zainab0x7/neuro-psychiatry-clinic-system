'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { ShieldCheck, Lock, MapPin, Mail, Phone, ExternalLink } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  const { clinicSettings, setActiveScreen, isAuthenticated } = useApp();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 font-sans">
      {/* Main Footer Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          
          {/* Column 1: Identity & Credentials */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-600/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-serif font-bold text-lg">
                N
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-white">
                NPCS<span className="text-teal-400 font-sans font-normal text-sm">.digital</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Dr. Shahab Muhammad Khan
              <br />
              <span className="text-slate-300 font-medium">Consultant Psychiatrist</span>
              <br />
              <span className="text-xs text-slate-500">Department of Psychiatry • PNS Shifa Hospital</span>
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Dedicated to thoughtful psychiatric evaluation, evidence-informed psychopharmacology, and compassionate mental health rehabilitation.
            </p>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Practice Navigation
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <button 
                  onClick={() => scrollToSection('hero')} 
                  className="hover:text-teal-400 transition-colors focus:outline-none"
                >
                  Home & Overview
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('about')} 
                  className="hover:text-teal-400 transition-colors focus:outline-none"
                >
                  About Dr. Shahab
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('services')} 
                  className="hover:text-teal-400 transition-colors focus:outline-none"
                >
                  Psychiatric Services
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('approach')} 
                  className="hover:text-teal-400 transition-colors focus:outline-none"
                >
                  Clinical Approach
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('research')} 
                  className="hover:text-teal-400 transition-colors focus:outline-none"
                >
                  Soul Care Terrace Research
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Verified Affiliation & Practice Location */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Academic & Clinical Affiliation
            </h3>
            <div className="space-y-2.5 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span>
                  Department of Psychiatry
                  <br />
                  <strong className="text-slate-300">PNS Shifa Hospital</strong>
                  <br />
                  Karachi, Pakistan
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 pt-1">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                <span>Academic & Clinical Psychiatric Research</span>
              </div>
            </div>
          </div>

          {/* Column 4: Confidentiality & EMR Access */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Patient Care & Portal
            </h3>
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-teal-300 font-medium">
                <Lock className="w-3.5 h-3.5" />
                <span>Confidential Consultation</span>
              </div>
              <p className="text-slate-400 leading-normal">
                Patient privacy and clinical discretion are preserved at every stage of care.
              </p>
            </div>
            
            <button
              onClick={() => setActiveScreen(isAuthenticated ? 'dashboard' : 'login')}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white transition-colors focus:outline-none"
            >
              <span>{isAuthenticated ? 'Go to EMR Dashboard' : 'EMR Staff Portal Sign In'}</span>
              <ExternalLink className="w-3 h-3 text-teal-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Footer / Copyright */}
      <div className="border-t border-slate-900/80 bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} NPCS.digital • Dr. Shahab Muhammad Khan, Consultant Psychiatrist. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Confidentiality & Privacy Focused</span>
            <span>Neuro-Psychiatry Clinic System</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
