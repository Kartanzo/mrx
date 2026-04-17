import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import DashboardShell from '@/components/DashboardShell';

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
      <DashboardShell
        userName={payload.nome}
        userEmail={payload.email}
        userPerfil={payload.perfil}
      >
        {children}
      </DashboardShell>
    </div>
  );
}
