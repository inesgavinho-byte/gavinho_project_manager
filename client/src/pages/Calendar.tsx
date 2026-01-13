import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { CalendarDashboard } from '@/components/CalendarDashboard';

export function Calendar() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <CalendarDashboard />
      </div>
    </DashboardLayout>
  );
}
