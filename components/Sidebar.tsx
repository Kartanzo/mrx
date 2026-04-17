'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface NavItem { href: string; label: string; icon: React.ReactNode; }

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { href: '/dashboard/transacoes', label: 'Transações', icon: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
  { href: '/dashboard/gestao', label: 'Gestão', icon: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
  { href: '/dashboard/acesso', label: 'Acesso Bot', icon: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
  { href: '/dashboard/usuarios', label: 'Usuários', icon: <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
];

interface Props {
  userName: string;
  userEmail: string;
  userPerfil: string;
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
}

export default function Sidebar({ userName, userPerfil, collapsed, onCollapse }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <>
      {/* ═══ DESKTOP ═══ */}
      <aside className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 z-30 bg-[#0a0c14] border-r border-white/5 transition-all duration-300 ease-out ${collapsed ? 'md:w-16' : 'md:w-60'}`}>
        {/* Toggle recolher/expandir — sempre no topo */}
        <div className={`border-b border-white/5 flex items-center ${collapsed ? 'justify-center py-3' : 'justify-between px-3 py-3 gap-2'}`}>
          {!collapsed && (
            <div className="bg-white rounded-lg px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpeg" alt="MRX" style={{ height: 32, width: 'auto', display: 'block' }} />
            </div>
          )}
          <button onClick={() => onCollapse(!collapsed)} title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className={`p-2 rounded-xl transition-all ${collapsed ? 'bg-[#1E7BC4]/15 text-[#1E7BC4] hover:bg-[#1E7BC4]/25' : 'bg-[#1E7BC4]/15 border border-[#1E7BC4]/30 text-[#1E7BC4] hover:bg-[#1E7BC4]/25'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={collapsed ? "M13 5l7 7-7 7" : "M11 19l-7-7 7-7"} />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'}`}>
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} title={collapsed ? item.label : undefined}
                className={`flex items-center rounded-xl text-sm font-medium transition-all ${collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} ${active ? 'bg-[#1E7BC4] text-white shadow-lg shadow-[#1E7BC4]/30' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Perfil */}
        <div className={`border-t border-white/5 ${collapsed ? 'p-2' : 'p-3'}`}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1E7BC4] flex items-center justify-center text-white font-bold text-sm">{userName.charAt(0).toUpperCase()}</div>
              <button onClick={handleLogout} disabled={loggingOut} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all" title="Sair">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-all">
              <div className="w-8 h-8 rounded-full bg-[#1E7BC4] flex items-center justify-center text-white font-bold text-sm shrink-0">{userName.charAt(0).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{userName}</p>
                <p className="text-white/40 text-xs truncate capitalize">{userPerfil}</p>
              </div>
              <button onClick={handleLogout} disabled={loggingOut} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all" title="Sair">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ═══ MOBILE ═══ */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0c14] border-b border-white/5 px-4 py-2.5 flex items-center justify-between">
        <div className="bg-white rounded-lg px-2 py-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpeg" alt="MRX" style={{ height: 28, width: 'auto', display: 'block' }} />
        </div>
        <button onClick={() => setMobileOpen(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E7BC4] text-white text-sm font-semibold shadow-lg shadow-[#1E7BC4]/30 active:scale-95 transition-transform">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
          Menu
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`md:hidden fixed top-0 left-0 bottom-0 z-[60] w-72 max-w-[85vw] bg-[#0a0c14] border-r border-white/5 shadow-2xl transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="px-4 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="bg-white rounded-lg px-3 py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.jpeg" alt="MRX" style={{ height: 32, width: 'auto', display: 'block' }} />
            </div>
            <button onClick={() => setMobileOpen(false)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 text-white text-sm font-medium active:scale-95 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              Fechar
            </button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {navItems.map(item => {
              const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all ${active ? 'bg-[#1E7BC4] text-white shadow-lg shadow-[#1E7BC4]/30' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
                  {item.icon}{item.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-white/5">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all">
              <div className="w-10 h-10 rounded-full bg-[#1E7BC4] flex items-center justify-center text-white font-bold text-base shrink-0">{userName.charAt(0).toUpperCase()}</div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-base font-medium truncate">{userName}</p>
                <p className="text-white/40 text-sm truncate capitalize">{userPerfil}</p>
              </div>
              <button onClick={handleLogout} disabled={loggingOut} className="p-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all" title="Sair">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
