'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Calendar, ShieldCheck, Menu, X, ArrowRight, UserCheck } from 'lucide-react';

interface PublicHeaderProps {
  onOpenBooking: () => void;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ onOpenBooking }) => {
  const { setActiveScreen, isAuthenticated } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-sm transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo / Domain Identity */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => scrollToSection('hero')}
              className="group text-left flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-lg p-1 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600 to-slate-800 flex items-center justify-center text-white font-serif font-bold text-xl shadow-md border border-teal-500/30 group-hover:border-teal-400 transition-colors">
                N
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold tracking-tight text-white group-hover:text-teal-300 transition-colors">
                  NPCS<span className="text-teal-400 font-sans font-normal text-sm">.digital</span>
                </span>
                <span className="text-xs text-slate-400 tracking-wide font-medium">
                  Dr. Shahab Muhammad Khan
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <button 
              onClick={() => scrollToSection('hero')}
              className="hover:text-teal-400 transition-colors focus:outline-none focus:text-teal-400"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="hover:text-teal-400 transition-colors focus:outline-none focus:text-teal-400"
            >
              About
            </button>
            <button 
              onClick={() => scrollToSection('services')}
              className="hover:text-teal-400 transition-colors focus:outline-none focus:text-teal-400"
            >
              Services
            </button>
            <button 
              onClick={() => scrollToSection('approach')}
              className="hover:text-teal-400 transition-colors focus:outline-none focus:text-teal-400"
            >
              Approach
            </button>
            <button 
              onClick={() => scrollToSection('research')}
              className="hover:text-teal-400 transition-colors focus:outline-none focus:text-teal-400"
            >
              Research
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="hover:text-teal-400 transition-colors focus:outline-none focus:text-teal-400"
            >
              Contact
            </button>
          </nav>

          {/* Action CTAs */}
          <div className="hidden lg:flex items-center gap-4">
            {/* EMR Staff / Patient Portal Link */}
            <button
              onClick={() => setActiveScreen(isAuthenticated ? 'dashboard' : 'login')}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all focus:outline-none focus:ring-2 focus:ring-slate-600"
              title="Access Clinic Management & Patient System"
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>{isAuthenticated ? 'EMR Dashboard' : 'EMR Portal'}</span>
            </button>

            {/* Primary Appointment CTA */}
            <button
              onClick={onOpenBooking}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm shadow-sm hover:shadow-teal-900/30 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-6 space-y-4 animate-fade-in">
          <nav className="flex flex-col space-y-3 pt-2 text-base font-medium text-slate-300">
            <button 
              onClick={() => scrollToSection('hero')}
              className="text-left py-2 hover:text-teal-400 transition-colors border-b border-slate-800/50"
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="text-left py-2 hover:text-teal-400 transition-colors border-b border-slate-800/50"
            >
              About Dr. Shahab
            </button>
            <button 
              onClick={() => scrollToSection('services')}
              className="text-left py-2 hover:text-teal-400 transition-colors border-b border-slate-800/50"
            >
              Psychiatric Services
            </button>
            <button 
              onClick={() => scrollToSection('approach')}
              className="text-left py-2 hover:text-teal-400 transition-colors border-b border-slate-800/50"
            >
              Clinical Approach
            </button>
            <button 
              onClick={() => scrollToSection('research')}
              className="text-left py-2 hover:text-teal-400 transition-colors border-b border-slate-800/50"
            >
              Academic & Research
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="text-left py-2 hover:text-teal-400 transition-colors border-b border-slate-800/50"
            >
              Contact & Location
            </button>
          </nav>

          <div className="pt-2 flex flex-col gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBooking();
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm shadow-md"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setActiveScreen(isAuthenticated ? 'dashboard' : 'login');
              }}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-sm font-medium border border-slate-700"
            >
              <UserCheck className="w-4 h-4 text-teal-400" />
              <span>{isAuthenticated ? 'Open EMR Dashboard' : 'EMR Staff Login'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
