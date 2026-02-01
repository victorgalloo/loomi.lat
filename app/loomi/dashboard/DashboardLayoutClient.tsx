'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/dashboard/ThemeProvider';
import DashboardShell from '@/components/dashboard/DashboardShell';

interface DashboardLayoutClientProps {
  children: ReactNode;
  userName?: string;
  isConnected?: boolean;
}

export default function DashboardLayoutClient({
  children,
  userName,
  isConnected,
}: DashboardLayoutClientProps) {
  return (
    <ThemeProvider>
      <DashboardShell userName={userName} isConnected={isConnected}>
        {children}
      </DashboardShell>
    </ThemeProvider>
  );
}
