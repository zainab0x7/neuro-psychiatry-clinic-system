'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useApp } from '@/context/AppContext';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import { PublicAppointmentModal } from './PublicAppointmentModal';
import { 
  ShieldCheck, 
  Calendar, 
  HeartHandshake, 
  Stethoscope, 
  Pill, 
  Activity, 
  MessageSquare, 
  Trees, 
  Leaf, 
  ArrowRight, 
  Lock, 
  CheckCircle, 
  BookOpen, 
  Building2, 
  Sparkles,
  Phone,
  Mail,
  MapPin,
  X
} from 'lucide-react';

export const NPCSLandingPage: React.FC = () => {
  const { setActiveScreen, isAuthenticated } = useApp();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isResearchModalOpen, setIsResearchModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-white">
      
      {/* Navigation Header */}
      <PublicHeader onOpenBooking={() => setIsBookingModalOpen(true)} />

      {/* Main Content Sections */}
      <main>
        
        {/* ========================================== */}
        {/* 1. HERO SECTION */}
        {/* ========================================== */}
        <section 
          id="hero" 
          className="relative min-h-[85vh] lg:min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 pt-8 pb-16 lg:py-24"
        >
          {/* Ambient Lighting & Background Accent */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-900/20 via-slate-950 to-slate-950 pointer-events-none" />
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Column: Editorial Headline & Actions */}
              <div className="lg:col-span-7 space-y-6 lg:space-y-8 animate-slide-up">
                
                {/* Doctor Verification Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/60 border border-teal-500/30 text-teal-300 text-xs font-medium backdrop-blur-sm">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Dr. Shahab Muhammad Khan • Consultant Psychiatrist</span>
                </div>

                {/* Main Hero Headline */}
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15]">
                  Mental Health Care,
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-200 to-slate-100 italic">
                    With Clinical Expertise
                  </span>
                  <br />
                  and Compassion.
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
                  Dedicated private psychiatric consultations focused on thoughtful diagnostic assessment, evidence-informed psychopharmacology, and a compassionate patient experience.
                </p>

                {/* CTA Button Group */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <button
                    onClick={() => setIsBookingModalOpen(true)}
                    className="inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-base shadow-lg shadow-teal-950/50 hover:shadow-teal-900/60 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Book an Appointment</span>
                  </button>

                  <a
                    href="#services"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white font-medium text-base border border-slate-800 hover:border-slate-700 transition-all focus:outline-none"
                  >
                    <span>Explore Services</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </a>
                </div>

                {/* Key Pillars Row */}
                <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-xs text-slate-400">
                  <div>
                    <strong className="block text-slate-200 text-sm font-semibold">Evidence-Based</strong>
                    Diagnostic Precision
                  </div>
                  <div>
                    <strong className="block text-slate-200 text-sm font-semibold">Confidential</strong>
                    Discreet Consultations
                  </div>
                  <div>
                    <strong className="block text-slate-200 text-sm font-semibold">Patient-Centered</strong>
                    Holistic Recovery
                  </div>
                </div>

              </div>

              {/* Right Column: Editorial Visual Treatment Frame */}
              <div className="lg:col-span-5 relative animate-fade-in">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  {/* Subtle Frame Glow */}
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-slate-700/20 blur-xl opacity-70" />

                  <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
                    <div className="relative aspect-[4/3] sm:aspect-[16/11] w-full">
                      <Image
                        src="/images/hero.jpg"
                        alt="Serene Psychiatric Practice Consultation Room"
                        fill
                        priority
                        className="object-cover object-center transform hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 1024px) 100vw, 45vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    </div>

                    {/* Image Caption Bar */}
                    <div className="p-5 bg-slate-900/90 backdrop-blur-md border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-serif text-sm font-semibold text-white">Department of Psychiatry</p>
                          <p className="text-xs text-slate-400">PNS Shifa Hospital • Consultant Services</p>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 text-xs font-bold">
                          NPCS
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 2. ABOUT DR. SHAHAB SECTION */}
        {/* ========================================== */}
        <section id="about" className="py-20 lg:py-28 bg-slate-900/60 border-y border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              {/* Doctor Visual & Credentials Card */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl bg-gradient-to-b from-slate-850 to-slate-900 p-8 border border-slate-800 shadow-xl space-y-6">
                  
                  {/* Portrait Placeholder / Symbol Frame */}
                  <div className="relative w-28 h-28 mx-auto rounded-2xl bg-gradient-to-br from-teal-700 to-slate-800 flex items-center justify-center border-2 border-teal-500/30 text-white font-serif text-3xl font-bold shadow-lg">
                    SK
                    <div className="absolute -bottom-2 -right-2 bg-teal-600 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-slate-900">
                      Psychiatrist
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <h3 className="font-serif text-2xl font-bold text-white">Dr. Shahab Muhammad Khan</h3>
                    <p className="text-teal-400 text-sm font-medium">Consultant Psychiatrist</p>
                    <p className="text-xs text-slate-400">Department of Psychiatry • PNS Shifa Hospital</p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 space-y-3 text-xs text-slate-300">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Department of Psychiatry, PNS Shifa Hospital, Karachi</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Published Academic Research in Psychiatry</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>Evidence-Informed Psychiatric Assessment & Care</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Biography & Academic Perspective */}
              <div className="lg:col-span-7 space-y-6">
                
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-teal-400 uppercase tracking-widest">
                    Professional Profile
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
                    Dedicated to Clinical Excellence and Patient Recovery
                  </h2>
                </div>

                <p className="text-slate-300 text-base leading-relaxed">
                  Dr. Shahab Muhammad Khan serves as a Consultant Psychiatrist in the Department of Psychiatry at PNS Shifa Hospital, Karachi. His clinical work focuses on comprehensive psychiatric evaluations, evidence-informed medication strategies, and structured patient rehabilitation.
                </p>

                <p className="text-slate-300 text-base leading-relaxed">
                  In addition to clinical management, Dr. Shahab Muhammad Khan has contributed to academic psychiatric research published in national journals, exploring innovative recovery environments that foster holistic mental health restoration.
                </p>

                {/* Clinical & Academic Perspective Callout Box */}
                <div className="p-6 rounded-xl bg-slate-950/80 border border-teal-500/20 space-y-2">
                  <h4 className="font-serif text-lg font-semibold text-teal-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    Clinical & Academic Perspective
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    “Psychiatric care reaches its full potential when diagnostic precision is coupled with therapeutic outdoor environments and ongoing empathetic support. Every patient deserves an individualized, dignified treatment path.”
                  </p>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 3. SERVICES SECTION */}
        {/* ========================================== */}
        <section id="services" className="py-20 lg:py-28 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-widest">
                Clinical Practice Scope
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
                Comprehensive Psychiatric Services
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">
                Focused on evidence-informed psychiatric assessment, individualized medication management, and structured follow-up care.
              </p>
            </div>

            {/* 6 Minimalist Service Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              
              {/* Card 1 */}
              <div className="group p-7 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-850 transition-all duration-300 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-colors">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-white group-hover:text-teal-300 transition-colors">
                    Psychiatric Assessment
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Detailed clinical history taking, symptom review, and diagnostic evaluation for emotional, mood, and cognitive health concerns.
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-800/80 mt-6 text-xs text-slate-400 font-medium">
                  Structured & Thorough Intake
                </div>
              </div>

              {/* Card 2 */}
              <div className="group p-7 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-850 transition-all duration-300 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-colors">
                    <Pill className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-white group-hover:text-teal-300 transition-colors">
                    Medication Management
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Evidence-informed psychopharmacological titration, safety monitoring, side-effect review, and regular therapeutic optimization.
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-800/80 mt-6 text-xs text-slate-400 font-medium">
                  Safe & Monitored Prescribing
                </div>
              </div>

              {/* Card 3 */}
              <div className="group p-7 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-850 transition-all duration-300 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-colors">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-white group-hover:text-teal-300 transition-colors">
                    Follow-up & Continuing Care
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Sustained post-consultation reviews to track recovery progress, prevent relapse, and adjust treatment strategy over time.
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-800/80 mt-6 text-xs text-slate-400 font-medium">
                  Long-term Recovery Tracking
                </div>
              </div>

              {/* Card 4 */}
              <div className="group p-7 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-850 transition-all duration-300 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-colors">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-white group-hover:text-teal-300 transition-colors">
                    Mental Health Consultation
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Professional second opinions and consultations for complex psychiatric symptoms, workplace stress, and emotional wellness.
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-800/80 mt-6 text-xs text-slate-400 font-medium">
                  Specialist Consultation
                </div>
              </div>

              {/* Card 5 */}
              <div className="group p-7 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-850 transition-all duration-300 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-colors">
                    <Leaf className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-white group-hover:text-teal-300 transition-colors">
                    Rehabilitation & Recovery
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Incorporating holistic wellness and restorative outdoor therapeutic spaces to nurture long-term psychiatric rehabilitation.
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-800/80 mt-6 text-xs text-slate-400 font-medium">
                  Holistic Environment Integration
                </div>
              </div>

              {/* Card 6 */}
              <div className="group p-7 rounded-2xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-850 transition-all duration-300 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-colors">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-white group-hover:text-teal-300 transition-colors">
                    Online Consultation
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Secure digital psychiatric follow-ups and tele-consultations for established patients requiring remote access.
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-800/80 mt-6 text-xs text-slate-400 font-medium">
                  Digital Practice Access
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ========================================== */}
        {/* 4. CLINICAL APPROACH SECTION */}
        {/* ========================================== */}
        <section id="approach" className="py-20 lg:py-28 bg-slate-900/40 border-y border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="max-w-3xl mb-16 space-y-4">
              <span className="text-xs font-semibold text-teal-400 uppercase tracking-widest">
                Patient Experience Flow
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
                Our Clinical Care Process
              </h2>
              <p className="text-slate-400 text-base leading-relaxed">
                Psychiatric treatment is an ongoing clinical partnership. We guide every patient through four structured phases of care.
              </p>
            </div>

            {/* Step Flow 01 - 04 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              
              {/* Step 01 */}
              <div className="relative p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="font-serif text-4xl font-bold text-teal-500/40">01</div>
                <h3 className="font-serif text-xl font-bold text-white">Understand</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Attentive listening to your medical history, current life stressors, and personal concerns in a compassionate environment.
                </p>
              </div>

              {/* Step 02 */}
              <div className="relative p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="font-serif text-4xl font-bold text-teal-500/40">02</div>
                <h3 className="font-serif text-xl font-bold text-white">Assess</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Rigorous psychiatric evaluation and mental status examination to determine diagnostic clarity.
                </p>
              </div>

              {/* Step 03 */}
              <div className="relative p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="font-serif text-4xl font-bold text-teal-500/40">03</div>
                <h3 className="font-serif text-xl font-bold text-white">Plan</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Formulating an individualized evidence-based care strategy combining pharmacological and therapeutic recommendations.
                </p>
              </div>

              {/* Step 04 */}
              <div className="relative p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="font-serif text-4xl font-bold text-teal-500/40">04</div>
                <h3 className="font-serif text-xl font-bold text-white">Support</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Regular progress reviews, dosage refinement, and long-term rehabilitation support to maintain health stability.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* ========================================== */}
        {/* 5. RESEARCH & ACADEMIC SECTION */}
        {/* ========================================== */}
        <section id="research" className="py-20 lg:py-28 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              
              {/* Left Column: Text Content */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-teal-400 uppercase tracking-widest flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Verified Academic Publication
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
                    “SOUL CARE TERRACE – NURTURING THE SOULS”
                  </h2>
                  <p className="text-teal-400 text-sm font-medium">
                    Journal of Pakistan Psychiatric Society
                  </p>
                </div>

                <p className="text-slate-300 text-base leading-relaxed">
                  Dr. Shahab Muhammad Khan’s academic work published in the <em>Journal of Pakistan Psychiatric Society</em> documents the creation and impact of the <strong>Soul Care Terrace</strong> — a dedicated green outdoor space initiative associated with the Department of Psychiatry at PNS Shifa Hospital, Karachi.
                </p>

                <p className="text-slate-300 text-base leading-relaxed">
                  The research describes how integrating natural outdoor elements into hospital psychiatric environments supports recovery, reduces anxiety, and enhances human-centered rehabilitation for individuals managing psychiatric illnesses.
                </p>

                <div className="pt-2">
                  <button
                    onClick={() => setIsResearchModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-850 text-teal-300 hover:text-teal-200 border border-teal-500/30 font-medium text-sm transition-all focus:outline-none"
                  >
                    <span>Read Academic Overview</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>

              {/* Right Column: Soul Care Terrace Garden Image */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 group">
                  <div className="relative aspect-[16/10] w-full">
                    <Image
                      src="/images/soul-care-terrace.jpg"
                      alt="Soul Care Terrace Green Outdoor Space"
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 1024px) 100vw, 45vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                  </div>
                  <div className="p-5 bg-slate-900/90 backdrop-blur-md border-t border-slate-800">
                    <p className="font-serif text-sm font-semibold text-white">Soul Care Terrace Initiative</p>
                    <p className="text-xs text-slate-400">Department of Psychiatry • PNS Shifa Hospital</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 6. TRUST & CONFIDENTIALITY SECTION */}
        {/* ========================================== */}
        <section className="py-16 bg-slate-900/40 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
              
              <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-teal-400 font-serif font-bold text-lg">
                  <Lock className="w-5 h-5 shrink-0" />
                  <span>Confidential Care</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Patient privacy and clinical record discretion are maintained throughout every step of consultation.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-teal-400 font-serif font-bold text-lg">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span>Professional Evaluation</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Grounded in evidence-informed psychiatric literature and structured clinical assessment methodologies.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-teal-400 font-serif font-bold text-lg">
                  <HeartHandshake className="w-5 h-5 shrink-0" />
                  <span>Patient-Centered</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every treatment plan is tailored to respect the individual patient’s unique story and life goals.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* 7. APPOINTMENT CTA BANNER */}
        {/* ========================================== */}
        <section id="contact" className="py-20 lg:py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
            
            <div className="space-y-4 max-w-2xl mx-auto">
              <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white">
                Begin Your Care Journey
              </h2>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                Reach out for professional, compassionate, and confidential psychiatric consultation with Dr. Shahab Muhammad Khan.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setIsBookingModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-base shadow-xl shadow-teal-950/60 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400"
              >
                <Calendar className="w-5 h-5" />
                <span>Book an Appointment</span>
              </button>

              <button
                onClick={() => setIsBookingModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-white font-medium text-base border border-slate-800 transition-all focus:outline-none"
              >
                <span>Contact the Practice</span>
              </button>
            </div>

            <div className="pt-8 text-xs text-slate-400 max-w-md mx-auto flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Department of Psychiatry • PNS Shifa Hospital, Karachi</span>
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <PublicFooter />

      {/* Interactive Appointment Modal */}
      <PublicAppointmentModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
      />

      {/* Research Detail Modal */}
      {isResearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 text-slate-100">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-teal-400 uppercase tracking-widest">Research Overview</span>
                <h3 className="font-serif text-2xl font-bold text-white">SOUL CARE TERRACE – NURTURING THE SOULS</h3>
                <p className="text-xs text-slate-400">Journal of Pakistan Psychiatric Society</p>
              </div>
              <button
                onClick={() => setIsResearchModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-300 leading-relaxed border-t border-b border-slate-800 py-4">
              <p>
                <strong>Abstract Summary:</strong> The publication outlines the design and implementation of the "Soul Care Terrace", a specialized green outdoor therapeutic space established within the Department of Psychiatry at PNS Shifa Hospital, Karachi.
              </p>
              <p>
                <strong>Clinical Significance:</strong> Outdoor nature spaces in psychiatric hospital settings provide sensory relaxation, alleviate stress, and offer a calm, dignified environment for patients undergoing psychiatric rehabilitation.
              </p>
              <p>
                <strong>Authorship & Affiliation:</strong> Dr. Shahab Muhammad Khan, Department of Psychiatry, PNS Shifa Hospital.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsResearchModalOpen(false)}
                className="px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm"
              >
                Close Overview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
