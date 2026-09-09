'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  SystemUser, 
  UserRole, 
  Patient, 
  Appointment, 
  Consultation, 
  Prescription, 
  FollowUp, 
  ClinicSettings, 
  ScreenId, 
  ToastMessage 
} from '../types';

interface AppContextType {
  // Navigation & Authentication state
  isAuthenticated: boolean;
  currentUser: SystemUser;
  activeRole: UserRole;
  activeScreen: ScreenId;
  selectedPatientId: string | null;
  activePatientProfileTab: 'overview' | 'consultations' | 'appointments' | 'prescriptions' | 'followups';
  isLoading: boolean;
  error: string | null;
  
  // UI Controls
  isGlobalSearchOpen: boolean;
  setIsGlobalSearchOpen: (open: boolean) => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  toasts: ToastMessage[];
  showToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  removeToast: (id: string) => void;
  
  // Navigation Helpers
  login: (email?: string, role?: UserRole, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setActiveScreen: (screen: ScreenId) => void;
  switchRole: (role: UserRole) => void;
  navigateToPatientProfile: (patientId: string, tab?: 'overview' | 'consultations' | 'appointments' | 'prescriptions' | 'followups') => void;
  navigateToNewConsultation: (patientId?: string) => void;
  navigateToBookAppointment: (patientId?: string) => void;
  navigateToPrescriptions: (patientId?: string) => void;

  // Data Collections
  users: SystemUser[];
  patients: Patient[];
  appointments: Appointment[];
  consultations: Consultation[];
  prescriptions: Prescription[];
  followUps: FollowUp[];
  clinicSettings: ClinicSettings;

  // CRUD & Search Functions
  addPatient: (patient: Omit<Patient, 'id' | 'registeredDate'>) => Patient;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<boolean>;
  bookAppointment: (appointment: Omit<Appointment, 'id'>) => Appointment;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>;
  addConsultation: (consultation: Omit<Consultation, 'id'>) => Consultation;
  addPrescription: (prescription: Omit<Prescription, 'id'>) => Prescription;
  addFollowUp: (followUp: Omit<FollowUp, 'id'>) => FollowUp;
  updateFollowUpStatus: (id: string, status: FollowUp['status']) => Promise<void>;
  updateClinicSettings: (settings: Partial<ClinicSettings>) => Promise<void>;
  addUser: (user: Omit<SystemUser, 'id' | 'lastActive'>) => SystemUser;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  searchPatients: (term: string) => Promise<Patient[]>;
  refetchData: () => Promise<void>;
}

const DEFAULT_USER: SystemUser = {
  id: 'USR-001',
  name: 'DR SHAHAB MUHAMMAD',
  email: 'dr.vance@vancepsychiatry.com',
  role: 'DOCTOR',
  avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
  title: 'HOD & Consultant Psychiatrist',
  designation: 'HOD & Consultant Psychiatrist',
  education: 'MBBS, MCPS, FCPS, CHPE',
  department: 'Psychiatry',
  status: 'ACTIVE',
  lastActive: 'Just now',
  permissions: {
    canWriteClinicalNotes: true,
    canPrescribe: true,
    canManagePatients: true,
    canManageAppointments: true,
    canManageUsers: true,
    canViewReports: true,
  },
};

const DEFAULT_SETTINGS: ClinicSettings = {
  clinicName: 'Neuro Psychiatry Clinic',
  department: 'Psychiatry',
  doctorDesignation: 'HOD & Consultant Psychiatrist',
  education: 'MBBS, MCPS, FCPS, CHPE',
  practiceName: 'Neuro Psychiatry Clinic',
  tagline: 'Psychiatry Department • HOD & Consultant Psychiatrist',
  doctorName: 'DR SHAHAB MUHAMMAD',
  licenseNumber: 'NY-MED-849201',
  phone: '+1 (555) 800-VANCE',
  email: 'appointments@vancepsychiatry.com',
  address: '680 Fifth Avenue, Suite 1800, New York, NY 10019',
  workingDays: ['Monday', 'Wednesday', 'Friday'],
  clinicStart: '18:00',
  clinicEnd: '20:00',
  slotDurationMinutes: 45,
  breakStart: '',
  breakEnd: '',
  notifyEmail: true,
  notifySMS: true,
  autoRemind24h: true,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<SystemUser>(DEFAULT_USER);
  const [activeRole, setActiveRole] = useState<UserRole>('DOCTOR');
  const [activeScreen, setActiveScreenState] = useState<ScreenId>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>('PX-9402');
  const [activePatientProfileTab, setActivePatientProfileTab] = useState<'overview' | 'consultations' | 'appointments' | 'prescriptions' | 'followups'>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Collections
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>(DEFAULT_SETTINGS);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    setToasts(prev => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Helper to fetch data from API
  const refetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch Patients
      const patientsRes = await fetch('/api/patients');
      const patientsJson = await patientsRes.json();

      if (patientsJson.success) {
        // If DB is empty, trigger seed!
        if (!patientsJson.data || patientsJson.data.length === 0) {
          const seedRes = await fetch('/api/seed', { method: 'POST' });
          const seedJson = await seedRes.json();
          if (seedJson.success) {
            // Re-fetch after seeding
            const refetched = await fetch('/api/patients');
            const refetchedJson = await refetched.json();
            setPatients(refetchedJson.data || []);
          }
        } else {
          setPatients(patientsJson.data || []);
        }
      }

      // 2. Fetch Appointments
      const apptsRes = await fetch('/api/appointments');
      const apptsJson = await apptsRes.json();
      if (apptsJson.success) setAppointments(apptsJson.data || []);

      // 3. Fetch Consultations
      const consultsRes = await fetch('/api/consultations');
      const consultsJson = await consultsRes.json();
      if (consultsJson.success) setConsultations(consultsJson.data || []);

      // 4. Fetch Prescriptions
      const rxRes = await fetch('/api/prescriptions');
      const rxJson = await rxRes.json();
      if (rxJson.success) setPrescriptions(rxJson.data || []);

      // 5. Fetch Follow-ups
      const flpRes = await fetch('/api/follow-ups');
      const flpJson = await flpRes.json();
      if (flpJson.success) setFollowUps(flpJson.data || []);

      // 6. Fetch Users
      const usersRes = await fetch('/api/users');
      const usersJson = await usersRes.json();
      if (usersJson.success && usersJson.data && usersJson.data.length > 0) {
        setUsers(usersJson.data);
      }

      // 7. Fetch Settings
      const settingsRes = await fetch('/api/settings');
      const settingsJson = await settingsRes.json();
      if (settingsJson.success && settingsJson.data) {
        setClinicSettings(settingsJson.data);
      }
    } catch (err: any) {
      console.error('Error loading database data:', err);
      setError('Could not connect to database backend.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check auth session on load & load collections
  useEffect(() => {
    async function checkAuthAndLoad() {
      try {
        const meRes = await fetch('/api/auth/me');
        const meJson = await meRes.json();
        if (meJson.success && meJson.data) {
          setCurrentUser(meJson.data);
          setActiveRole(meJson.data.role);
          setIsAuthenticated(true);
        }
      } catch {
        // Not authenticated
      }
      await refetchData();
    }
    checkAuthAndLoad();
  }, [refetchData]);

  // Keyboard shortcut listener for Global Search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const setActiveScreen = (screen: ScreenId) => {
    setActiveScreenState(screen);
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const login = async (email?: string, role?: UserRole, password?: string): Promise<boolean> => {
    try {
      const targetEmail = email || (role === 'RECEPTIONIST' ? 's.jenkins@vancepsychiatry.com' : role === 'ADMIN' ? 'm.sterling@vancepsychiatry.com' : 'dr.vance@vancepsychiatry.com');
      const targetPassword = password || 'Vance2026!';

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, password: targetPassword }),
      });

      const json = await res.json();

      if (!json.success) {
        showToast('error', 'Authentication Failed', json.error || 'Invalid credentials');
        return false;
      }

      setCurrentUser(json.data);
      setActiveRole(json.data.role);
      setIsAuthenticated(true);
      setActiveScreenState('dashboard');
      showToast('success', 'Authenticated Successfully', json.message || `Welcome back, ${json.data.name}`);
      await refetchData();
      return true;
    } catch (err: any) {
      showToast('error', 'Login Error', 'Network failure communicating with auth backend.');
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setIsAuthenticated(false);
    setActiveScreenState('login');
    showToast('info', 'Signed Out', 'You have been securely signed out.');
  };

  const switchRole = (role: UserRole) => {
    const matchingUser = users.find(u => u.role === role) || {
      ...currentUser,
      role,
      name: role === 'DOCTOR' ? 'DR SHAHAB MUHAMMAD' : role === 'RECEPTIONIST' ? 'Sarah Jenkins' : 'Marcus Sterling',
      title: role === 'DOCTOR' ? 'Consultant Neuropsychiatrist' : role === 'RECEPTIONIST' ? 'Clinical Coordinator' : 'Practice Director',
    };
    setCurrentUser(matchingUser);
    setActiveRole(role);
    showToast('info', 'Role Switched', `Active session view switched to ${role} (${matchingUser.name}).`);
  };

  const navigateToPatientProfile = (
    patientId: string, 
    tab: 'overview' | 'consultations' | 'appointments' | 'prescriptions' | 'followups' = 'overview'
  ) => {
    setSelectedPatientId(patientId);
    setActivePatientProfileTab(tab);
    setActiveScreenState('patient-profile');
  };

  const navigateToNewConsultation = (patientId?: string) => {
    if (patientId) setSelectedPatientId(patientId);
    setActiveScreenState('new-consultation');
  };

  const navigateToBookAppointment = (patientId?: string) => {
    if (patientId) setSelectedPatientId(patientId);
    setActiveScreenState('book-appointment');
  };

  const navigateToPrescriptions = (patientId?: string) => {
    if (patientId) setSelectedPatientId(patientId);
    setActiveScreenState('prescriptions');
  };

  // Server-side Patient Search helper
  const searchPatients = async (term: string): Promise<Patient[]> => {
    try {
      const res = await fetch(`/api/patients?q=${encodeURIComponent(term)}`);
      const json = await res.json();
      if (json.success) {
        return json.data || [];
      }
    } catch (e) {
      console.error('Search patients failed:', e);
    }
    return patients;
  };

  // CRUD implementations
  const addPatient = (patientData: Omit<Patient, 'id' | 'registeredDate'>): Patient => {
    const tempId = `PX-${Math.floor(9400 + patients.length + 1)}`;
    const tempPatient: Patient = {
      ...patientData,
      id: tempId,
      registeredDate: new Date().toISOString().split('T')[0],
    };

    // Optimistic UI update
    setPatients(prev => [tempPatient, ...prev]);

    // Async DB save
    fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setPatients(prev => prev.map(p => p.id === tempId ? json.data : p));
          showToast('success', 'Patient Registered', json.message);
        } else {
          showToast('error', 'Error Registering Patient', json.error || 'Failed to save patient to database.');
        }
      })
      .catch(err => {
        showToast('error', 'Database Error', 'Failed to register patient in MongoDB.');
      });

    return tempPatient;
  };

  const updatePatient = async (id: string, updates: Partial<Patient>) => {
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Patient Updated', 'Record updated in database successfully.');
      } else {
        showToast('error', 'Update Failed', json.error || 'Failed to update patient in MongoDB.');
      }
    } catch {
      showToast('error', 'Database Error', 'Could not save updates to database.');
    }
  };

  const deletePatient = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setPatients(prev => prev.filter(p => p.id !== id));
        showToast('success', 'Patient Deleted', json.message || 'Patient record removed.');
        return true;
      } else {
        showToast('error', 'Delete Failed', json.error || 'Could not delete patient.');
        return false;
      }
    } catch {
      showToast('error', 'Database Error', 'Could not execute delete command.');
      return false;
    }
  };

  const bookAppointment = (appData: Omit<Appointment, 'id'>): Appointment => {
    const tempId = `APT-${Math.floor(1000 + appointments.length + 1)}`;
    const tempAppt: Appointment = {
      ...appData,
      id: tempId,
    };

    setAppointments(prev => [tempAppt, ...prev]);

    fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appData),
    })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setAppointments(prev => prev.map(a => a.id === tempId ? json.data : a));
          showToast('success', 'Appointment Booked', json.message);
        } else {
          // Revert on error
          setAppointments(prev => prev.filter(a => a.id !== tempId));
          showToast('error', 'Booking Failed', json.error || 'Failed to book appointment.');
        }
      })
      .catch(err => {
        setAppointments(prev => prev.filter(a => a.id !== tempId));
        showToast('error', 'Database Error', 'Could not save appointment to MongoDB.');
      });

    return tempAppt;
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('info', 'Status Updated', `Appointment status updated to ${status}.`);
      } else {
        showToast('error', 'Update Failed', json.error);
      }
    } catch {
      showToast('error', 'Database Error', 'Could not update appointment status.');
    }
  };

  const addConsultation = (consultData: Omit<Consultation, 'id'>): Consultation => {
    const tempId = `CNS-${Math.floor(5000 + consultations.length + 1)}`;
    const tempConsult: Consultation = {
      ...consultData,
      id: tempId,
    };

    setConsultations(prev => [tempConsult, ...prev]);

    fetch('/api/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(consultData),
    })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setConsultations(prev => prev.map(c => c.id === tempId ? json.data : c));
          showToast('success', 'Consultation Saved', json.message || 'Clinical consultation entry saved.');
          // Refetch related collections (prescriptions, follow-ups, patients)
          refetchData();
        } else {
          showToast('error', 'Save Failed', json.error || 'Failed to save consultation.');
        }
      })
      .catch(() => {
        showToast('error', 'Database Error', 'Failed to save consultation to MongoDB.');
      });

    return tempConsult;
  };

  const addPrescription = (rxData: Omit<Prescription, 'id'>): Prescription => {
    const tempId = `RX-${Math.floor(900 + prescriptions.length + 1)}`;
    const tempRx: Prescription = {
      ...rxData,
      id: tempId,
    };

    setPrescriptions(prev => [tempRx, ...prev]);

    fetch('/api/prescriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rxData),
    })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setPrescriptions(prev => prev.map(r => r.id === tempId ? json.data : r));
          showToast('success', 'Prescription Issued', json.message || 'Prescription saved to MongoDB.');
        } else {
          showToast('error', 'Issuance Failed', json.error);
        }
      })
      .catch(() => {
        showToast('error', 'Database Error', 'Failed to save prescription.');
      });

    return tempRx;
  };

  const addFollowUp = (flpData: Omit<FollowUp, 'id'>): FollowUp => {
    const tempId = `FLP-${Math.floor(300 + followUps.length + 1)}`;
    const tempFlp: FollowUp = {
      ...flpData,
      id: tempId,
    };

    setFollowUps(prev => [tempFlp, ...prev]);

    fetch('/api/follow-ups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flpData),
    })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setFollowUps(prev => prev.map(f => f.id === tempId ? json.data : f));
          showToast('success', 'Follow-up Scheduled', json.message);
        } else {
          showToast('error', 'Follow-up Creation Failed', json.error);
        }
      })
      .catch(() => {
        showToast('error', 'Database Error', 'Failed to save follow-up task.');
      });

    return tempFlp;
  };

  const updateFollowUpStatus = async (id: string, status: FollowUp['status']) => {
    setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    try {
      const res = await fetch(`/api/follow-ups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('info', 'Follow-up Updated', `Follow-up status marked as ${status}.`);
      } else {
        showToast('error', 'Update Failed', json.error);
      }
    } catch {
      showToast('error', 'Database Error', 'Could not update follow-up status.');
    }
  };

  const updateClinicSettings = async (settingsData: Partial<ClinicSettings>) => {
    setClinicSettings(prev => ({ ...prev, ...settingsData }));
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsData),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Settings Saved', 'Clinic configuration updated in database.');
      } else {
        showToast('error', 'Save Failed', json.error);
      }
    } catch {
      showToast('error', 'Database Error', 'Could not save clinic settings.');
    }
  };

  const addUser = (userData: Omit<SystemUser, 'id' | 'lastActive'>): SystemUser => {
    const tempId = `USR-00${users.length + 1}`;
    const tempUser: SystemUser = {
      ...userData,
      id: tempId,
      lastActive: 'Never',
    };

    setUsers(prev => [...prev, tempUser]);

    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    })
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data) {
          setUsers(prev => prev.map(u => u.id === tempId ? json.data : u));
          showToast('success', 'Staff User Created', json.message);
        } else {
          showToast('error', 'User Creation Failed', json.error);
        }
      })
      .catch(() => {
        showToast('error', 'Database Error', 'Could not create staff user account.');
      });

    return tempUser;
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('info', 'Permissions Updated', `User role updated to ${role} in database.`);
      } else {
        showToast('error', 'Update Failed', json.error);
      }
    } catch {
      showToast('error', 'Database Error', 'Could not update user role.');
    }
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        activeRole,
        activeScreen,
        selectedPatientId,
        activePatientProfileTab,
        isLoading,
        error,
        isGlobalSearchOpen,
        setIsGlobalSearchOpen,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        toasts,
        showToast,
        removeToast,
        login,
        logout,
        setActiveScreen,
        switchRole,
        navigateToPatientProfile,
        navigateToNewConsultation,
        navigateToBookAppointment,
        navigateToPrescriptions,
        users,
        patients,
        appointments,
        consultations,
        prescriptions,
        followUps,
        clinicSettings,
        addPatient,
        updatePatient,
        deletePatient,
        bookAppointment,
        updateAppointmentStatus,
        addConsultation,
        addPrescription,
        addFollowUp,
        updateFollowUpStatus,
        updateClinicSettings,
        addUser,
        updateUserRole,
        searchPatients,
        refetchData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
