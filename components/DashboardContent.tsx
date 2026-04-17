'use client';

export default function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:pl-60">
      <div className="md:hidden h-14" />
      <main className="p-4 md:p-6 min-h-screen">
        {children}
      </main>
    </div>
  );
}
