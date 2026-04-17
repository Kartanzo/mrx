import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';
import DashboardContent from '@/components/DashboardContent';

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
      <DashboardContent>{children}</DashboardContent>
    </div>
  );
}
