'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Calendar, AlertTriangle, Clock, CheckCircle, DollarSign, ChevronRight, User, Car } from 'lucide-react';

interface Mensalidade {
  id: string;
  id_cliente: string;
  cliente: string;
  data_vencimento: string;
  valor: string;
  tipo: string;
  regime: string;
  status: string;
  data_pagamento: string | null;
  observacao: string | null;
  placa: string | null;
  urgencia: 'atrasado' | 'hoje' | 'futuro';
}

interface Stats {
  semana: number;
  hoje: number;
  atrasados: number;
  pendentes: number;
  pagos: number;
  valor_semana: number;
  valor_atrasado: number;
}

type Periodo = 'semana' | 'hoje' | 'atrasados' | 'todos';

const PERIODOS: { key: Periodo; label: string; icon: React.ReactNode }[] = [
  { key: 'semana', label: 'Esta Semana', icon: <Calendar size={14} /> },
  { key: 'hoje', label: 'Hoje', icon: <Clock size={14} /> },
  { key: 'atrasados', label: 'Atrasados', icon: <AlertTriangle size={14} /> },
  { key: 'todos', label: 'Todos', icon: <ChevronRight size={14} /> },
];

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d: string) {
  const dt = new Date(d);
  return dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

function fmtDateFull(d: string) {
  return new Date(d).toLocaleDateString('pt-BR');
}

function diasAte(d: string): number {
  const dt = new Date(d);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  dt.setHours(0, 0, 0, 0);
  return Math.round((dt.getTime() - hoje.getTime()) / 86400000);
}

function diasLabel(d: string): string {
  const n = diasAte(d);
  if (n < 0) return `${Math.abs(n)}d atrasado`;
  if (n === 0) return 'Hoje';
  if (n === 1) return 'Amanhã';
  return `em ${n}d`;
}

// Agrupa por data de vencimento
function agrupar(items: Mensalidade[]) {
  const map = new Map<string, Mensalidade[]>();
  for (const m of items) {
    const key = new Date(m.data_vencimento).toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return [...map.entries()].map(([date, items]) => ({
    date,
    label: fmtDate(items[0].data_vencimento),
    diasLabel: diasLabel(items[0].data_vencimento),
    dias: diasAte(items[0].data_vencimento),
    items,
    total: items.reduce((s, m) => s + parseFloat(m.valor), 0),
  }));
}

export default function VencimentosPage() {
  const [data, setData] = useState<Mensalidade[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ periodo });
    if (query) params.set('q', query);
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/vencimentos?${params}`);
    if (res.ok) {
      const json = await res.json();
      setData(json.data ?? []);
      setStats(json.stats ?? null);
    }
    setLoading(false);
  }, [periodo, query, statusFilter]);

  useEffect(() => {
    const t = setTimeout(fetchData, 200);
    return () => clearTimeout(t);
  }, [fetchData]);

  const grupos = agrupar(data);

  return (
    <div className="space-y-5">
      <h1 className="text-white text-2xl font-bold">Vencimentos</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#0f1629] border border-red-500/20 rounded-xl p-3">
            <div className="flex items-center gap-2 text-red-400/60 text-xs mb-1"><AlertTriangle size={12} /> Atrasados</div>
            <p className="text-red-400 text-xl font-bold">{stats.atrasados}</p>
            <p className="text-red-400/40 text-xs mt-0.5">{brl(Number(stats.valor_atrasado))}</p>
          </div>
          <div className="bg-[#0f1629] border border-amber-500/20 rounded-xl p-3">
            <div className="flex items-center gap-2 text-amber-400/60 text-xs mb-1"><Clock size={12} /> Hoje</div>
            <p className="text-amber-400 text-xl font-bold">{stats.hoje}</p>
          </div>
          <div className="bg-[#0f1629] border border-blue-500/20 rounded-xl p-3">
            <div className="flex items-center gap-2 text-blue-400/60 text-xs mb-1"><Calendar size={12} /> Esta Semana</div>
            <p className="text-blue-400 text-xl font-bold">{stats.semana}</p>
            <p className="text-blue-400/40 text-xs mt-0.5">{brl(Number(stats.valor_semana))}</p>
          </div>
          <div className="bg-[#0f1629] border border-emerald-500/20 rounded-xl p-3">
            <div className="flex items-center gap-2 text-emerald-400/60 text-xs mb-1"><CheckCircle size={12} /> Pagos</div>
            <p className="text-emerald-400 text-xl font-bold">{stats.pagos}</p>
          </div>
        </div>
      )}

      {/* Abas de período */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {PERIODOS.map(p => (
          <button key={p.key} onClick={() => setPeriodo(p.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${periodo === p.key ? 'bg-[#1E7BC4] text-white shadow-lg shadow-[#1E7BC4]/20' : 'bg-[#0f1629] border border-white/10 text-white/50 hover:text-white'}`}>
            {p.icon}{p.label}
            {p.key === 'atrasados' && stats && stats.atrasados > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">{stats.atrasados}</span>
            )}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar cliente ou placa..."
            className="w-full bg-[#0f1629] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-all" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-[#0f1629] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500/50">
          <option value="">Todos status</option>
          <option value="pendente">Pendente</option>
          <option value="pago">Pago</option>
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-16 text-white/25 text-sm">
          <Calendar size={32} className="mx-auto mb-3 opacity-30" />
          Nenhum vencimento encontrado
        </div>
      ) : (
        <div className="space-y-4">
          {grupos.map(grupo => {
            const isAtrasado = grupo.dias < 0;
            const isHoje = grupo.dias === 0;
            return (
              <div key={grupo.date}>
                {/* Header do dia */}
                <div className="flex items-center gap-3 mb-2">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    isAtrasado ? 'bg-red-500/15 text-red-400' :
                    isHoje ? 'bg-amber-500/15 text-amber-400' :
                    'bg-white/5 text-white/40'
                  }`}>
                    {isAtrasado ? <AlertTriangle size={11} /> : isHoje ? <Clock size={11} /> : <Calendar size={11} />}
                    {grupo.diasLabel}
                  </div>
                  <span className="text-white/30 text-xs">{grupo.label}</span>
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-white/30 text-xs">{grupo.items.length} · {brl(grupo.total)}</span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {grupo.items.map(m => {
                    const pago = m.status === 'pago';
                    return (
                      <div key={m.id} className={`bg-[#0f1629] border rounded-xl p-4 transition-all ${
                        isAtrasado && !pago ? 'border-red-500/20' :
                        isHoje && !pago ? 'border-amber-500/20' :
                        pago ? 'border-emerald-500/20 opacity-70' :
                        'border-white/10'
                      }`}>
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                            pago ? 'bg-emerald-600/20 text-emerald-400' :
                            isAtrasado ? 'bg-red-600/20 text-red-400' :
                            'bg-blue-600/20 text-blue-400'
                          }`}>
                            {m.cliente.charAt(0)}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-white text-sm font-medium truncate">{m.cliente}</p>
                              {pago && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                                  <CheckCircle size={9} /> Pago
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-white/30 flex-wrap">
                              {m.placa && m.placa !== 'null' && (
                                <span className="flex items-center gap-1"><Car size={10} /> {m.placa}</span>
                              )}
                              <span className="flex items-center gap-1"><Calendar size={10} /> {fmtDateFull(m.data_vencimento)}</span>
                              <span className="capitalize">{m.regime?.toLowerCase()}</span>
                            </div>
                            {m.observacao && (
                              <p className="text-white/20 text-xs mt-1 truncate">{m.observacao}</p>
                            )}
                          </div>

                          {/* Valor */}
                          <div className="text-right shrink-0">
                            <p className={`text-base font-bold ${
                              pago ? 'text-emerald-400/60' :
                              isAtrasado ? 'text-red-400' :
                              'text-white'
                            }`}>
                              {brl(parseFloat(m.valor))}
                            </p>
                            {m.data_pagamento && (
                              <p className="text-emerald-400/40 text-[10px] mt-0.5">
                                Pago {fmtDateFull(m.data_pagamento)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
