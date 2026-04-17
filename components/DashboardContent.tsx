'use client';

import { useContext } from 'react';
import { SidebarContext } from './Sidebar';

export default function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useContext(SidebarContext);

  return (
    <div className={`transition-all duration-300 ${collapsed ? 'md:pl-0' : 'md:pl-60'}`}>
      <div className="md:hidden h-14" />
      <main className={`p-4 md:p-6 min-h-screen ${collapsed ? 'max-w-6xl mx-auto' : ''}`}>
        {children}
      </main>
    </div>
  );
}
