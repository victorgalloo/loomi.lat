'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from '@/components/dashboard/ThemeProvider';
import DashboardShell from '@/components/dashboard/DashboardShell';

interface DashboardLayoutClientProps {
  children: ReactNode;
  userName?: string;
  tenantName?: string;
  isConnected?: boolean;
}

export default function DashboardLayoutClient({
  children,
  userName,
  tenantName,
  isConnected,
}: DashboardLayoutClientProps) {
  return (
    <ThemeProvider>
      <DashboardShell userName={userName} tenantName={tenantName} isConnected={isConnected}>
        {children}
      </DashboardShell>
    </ThemeProvider>
  );
}
