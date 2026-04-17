'use client';

export default function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="md:pl-60">
      {/* Espaço para o header fixo mobile */}
      <div className="md:hidden h-14" />
      <main className="p-4 md:p-6 min-h-screen max-w-5xl mx-auto md:max-w-none md:mx-0">
        {children}
      </main>
    </div>
  );
}
