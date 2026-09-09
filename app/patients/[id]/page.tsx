'use client';

import React, { use } from 'react';
import { PatientProfileScreen } from '@/components/screens/PatientProfileScreen';

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <PatientProfileScreen />;
}
