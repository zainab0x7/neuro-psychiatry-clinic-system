'use client';

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { RoleSwitcher } from '../common/RoleSwitcher';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { ToastContainer } from '../common/ToastContainer';

// Screen components
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { PatientListScreen } from '../screens/PatientListScreen';
import { AddPatientScreen } from '../screens/AddPatientScreen';
import { PatientProfileScreen } from '../screens/PatientProfileScreen';
import { NewConsultationScreen } from '../screens/NewConsultationScreen';
import { AppointmentListScreen } from '../screens/AppointmentListScreen';
import { BookAppointmentScreen } from '../screens/BookAppointmentScreen';
import { AppointmentCalendarScreen } from '../screens/AppointmentCalendarScreen';
import { PrescriptionScreen } from '../screens/PrescriptionScreen';
import { FollowUpScreen } from '../screens/FollowUpScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { UserManagementScreen } from '../screens/UserManagementScreen';

export const AppShell: React.FC = () => {
  const { isAuthenticated, activeScreen } = useApp();

  // If not logged in or activeScreen is 'login', show Screen 01 Login
  if (!isAuthenticated || activeScreen === 'login') {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <LoginScreen />
        <ToastContainer />
      </main>
    );
  }

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'patients':
        return <PatientListScreen />;
      case 'add-patient':
        return <AddPatientScreen />;
      case 'patient-profile':
        return <PatientProfileScreen />;
      case 'new-consultation':
      case 'consultations':
        return <NewConsultationScreen />;
      case 'appointments':
        return <AppointmentListScreen />;
      case 'book-appointment':
        return <BookAppointmentScreen />;
      case 'appointment-calendar':
        return <AppointmentCalendarScreen />;
      case 'prescriptions':
        return <PrescriptionScreen />;
      case 'follow-ups':
        return <FollowUpScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'user-management':
        return <UserManagementScreen />;
      default:
        return <DashboardScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Demo Bar for easy Role Switching */}
      <RoleSwitcher />

      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Header />

          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {renderActiveScreen()}
          </main>
        </div>
      </div>

      {/* Global Modals & Notifications */}
      <GlobalSearchModal />
      <ToastContainer />
    </div>
  );
};
