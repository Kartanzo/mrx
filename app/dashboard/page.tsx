'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const RevenueChart = dynamic(() => import('@/components/charts/RevenueChart'), { ssr: false });
const StatusChart = dynamic(() => import('@/components/charts/StatusChart'), { ssr: false });

interface Stats {
  mensal: { mes_label: string; receita: number; despesa: number; total: number }[];
  status: { status: string; total: number }[];
  topEnvolvidos: { envolvido: string; total: number; qtd: number; tipo_de_movimento: string }[];
}

interface SummaryCards {
  totalTransacoes: number;
  somaReceita: number;
  somaDespesa: number;
  emAberto: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [summary, setSummary] = useState<SummaryCards | null>(null);
  const [meses, setMeses] = useState(6);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [statsRes, summaryRes] = await Promise.all([
        fetch(`/api/dashboard?meses=${meses}`),
        fetch('/api/transacoes?limit=1&page=1'),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());

      // Busca totais via dashboard stats (mensal já tem receita/despesa)
      setLoading(false);
    }
    load();
  }, [meses]);

  useEffect(() => {
    fetch('/api/dashboard/summary').then(async r => {
      if (r.ok) setSummary(await r.json());
    }).catch(() => {});
  }, []);

  const totalReceita = stats?.mensal.reduce((a, b) => a + Number(b.receita), 0) ?? 0;
  const totalDespesa = stats?.mensal.reduce((a, b) => a + Number(b.despesa), 0) ?? 0;
  const emAberto = stats?.status.find(s => s.status === 'em_aberto')?.total ?? 0;
  const totalStatus = stats?.status.reduce((a, b) => a + Number(b.total), 0) ?? 0;

  const cards = [
    {
      label: 'Receita Total',
      value: totalReceita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      accent: '#10b981',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>,
    },
    {
      label: 'Despesa Total',
      value: totalDespesa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      accent: '#ef4444',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>,
    },
    {
      label: 'Saldo',
      value: (totalReceita - totalDespesa).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      accent: totalReceita - totalDespesa >= 0 ? '#1E7BC4' : '#f97316',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
    },
    {
      label: 'Em Aberto',
      value: Number(emAberto).toLocaleString('pt-BR'),
      accent: '#f59e0b',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      href: '/dashboard/transacoes?status=em_aberto',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-white/40 text-sm mt-0.5">Visão geral financeira</p>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-[#16181f] rounded-2xl p-4 border border-white/5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/40 text-xs font-medium">{card.label}</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: card.accent + '20', color: card.accent }}>
                {card.icon}
              </div>
            </div>
            <p className="text-white font-bold text-lg leading-tight" style={{ color: card.accent }}>
              {loading ? <span className="animate-pulse text-white/20">—</span> : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Receita vs Despesa */}
        <div className="lg:col-span-2 bg-[#16181f] rounded-2xl p-5 border border-white/5">
          <h2 className="text-white font-semibold text-sm mb-4">Receita vs Despesa</h2>
          {loading ? (
            <div className="h-52 flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-[#1E7BC4] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <RevenueChart data={stats?.mensal ?? []} />
          )}
        </div>

        {/* Status de pagamento */}
        <div className="bg-[#16181f] rounded-2xl p-5 border border-white/5">
          <h2 className="text-white font-semibold text-sm mb-4">Status de Pagamento</h2>
          {loading ? (
            <div className="h-52 flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-[#1E7BC4] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stats?.status.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-white/30 text-sm">Sem dados</div>
          ) : (
            <StatusChart data={stats?.status ?? []} />
          )}
        </div>
      </div>

      {/* Top envolvidos */}
      {!loading && stats?.topEnvolvidos && stats.topEnvolvidos.length > 0 && (
        <div className="bg-[#16181f] rounded-2xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Top Envolvidos por Valor</h2>
            <Link href="/dashboard/transacoes" className="text-[#1E7BC4] text-xs hover:underline">Ver todos →</Link>
          </div>
          <div className="space-y-2">
            {stats.topEnvolvidos.slice(0, 5).map((e, i) => {
              const max = parseFloat(String(stats.topEnvolvidos[0]?.total ?? 1));
              const pct = (parseFloat(String(e.total)) / max) * 100;
              const isReceita = e.tipo_de_movimento === 'Receita';
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="text-white/30 text-xs w-4 text-right shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white text-xs truncate max-w-[60%]">{e.envolvido}</p>
                      <p className={`text-xs font-semibold shrink-0 ${isReceita ? 'text-emerald-400' : 'text-red-400'}`}>
                        {parseFloat(String(e.total)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: pct + '%', background: isReceita ? '#10b981' : '#ef4444' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
