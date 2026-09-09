'use client';

import React from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { AppShell } from '@/components/layout/AppShell';

function InnerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, activeScreen } = useApp();

  // AppShell wraps sidebar, header, role switcher, modals, and toasts.
  return <AppShell />;
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <InnerLayout>{children}</InnerLayout>
    </AppProvider>
  );
}
