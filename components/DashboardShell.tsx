'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';

interface Props {
  userName: string;
  userEmail: string;
  userPerfil: string;
  children: React.ReactNode;
}

export default function DashboardShell({ userName, userEmail, userPerfil, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        userPerfil={userPerfil}
        collapsed={collapsed}
        onCollapse={setCollapsed}
      />
      <div className={`transition-all duration-300 ${collapsed ? 'md:pl-0' : 'md:pl-60'}`}>
        <div className="md:hidden h-14" />
        <main className="p-4 md:p-6 min-h-screen">
          {children}
        </main>
      </div>
    </>
  );
}
