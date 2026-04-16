import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('mrx_token')?.value;
  const payload = token ? verifyToken(token) : null;

  if (!payload) redirect('/login');

  return (
    <div className="min-h-screen bg-[#0f1117]">
      <Sidebar
        userName={payload.nome}
        userEmail={payload.email}
        userPerfil={payload.perfil}
      />

      {/* Conteúdo principal */}
      <div className="md:pl-60">
        {/* Espaço para header mobile */}
        <div className="md:hidden h-14" />
        <main className="p-4 md:p-6 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
