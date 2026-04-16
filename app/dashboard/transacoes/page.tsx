'use client';

import { useState, useEffect, useCallback } from 'react';
import { Transacao, StatusPagamento } from '@/types';
import PaymentStatusModal from '@/components/PaymentStatusModal';
import AnexosModal from '@/components/AnexosModal';

const PAGE_SIZE = 50;

interface Filters {
  search: string;
  status: string;
  tipo: string;
  placa: string;
  dataInicio: string;
  dataFim: string;
}

const EMPTY_FILTERS: Filters = {
  search: '', status: '', tipo: '', placa: '', dataInicio: '', dataFim: '',
};

function fmtVal(v: string | number) {
  return parseFloat(String(v)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function groupLabel(dateStr: string): string {
  const dt = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const txDay = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const diff = (today.getTime() - txDay.getTime()) / 86400000;
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function groupKey(dateStr: string): string {
  return new Date(dateStr).toISOString().split('T')[0];
}

const STATUS_CONFIG: Record<StatusPagamento, { label: string; dot: string; text: string }> = {
  em_aberto:            { label: 'Em Aberto',       dot: 'bg-amber-400',  text: 'text-amber-400' },
  aprovacao_automatica: { label: 'Aprov. Auto',      dot: 'bg-blue-400',   text: 'text-blue-400' },
  aprovado_usuario:     { label: 'Aprovado',          dot: 'bg-emerald-400', text: 'text-emerald-400' },
};

function StatusDot({ status }: { status: StatusPagamento }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.em_aberto;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function TransacoesPage() {
  const [rows, setRows] = useState<Transacao[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Transacao | null>(null);
  const [anexosTarget, setAnexosTarget] = useState<Transacao | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    if (filters.tipo) params.set('tipo', filters.tipo);
    if (filters.placa) params.set('placa', filters.placa);
    if (filters.dataInicio) params.set('data_inicio', filters.dataInicio);
    if (filters.dataFim) params.set('data_fim', filters.dataFim);
    const res = await fetch(`/api/transacoes?${params}`);
    if (res.ok) {
      const data = await res.json();
      setRows(data.rows);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [filters]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  function setFilter(key: keyof Filters, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  // Agrupa por data
  const groups: { key: string; label: string; items: Transacao[] }[] = [];
  const seen = new Map<string, number>();
  for (const row of rows) {
    const k = groupKey(row.data);
    if (!seen.has(k)) {
      seen.set(k, groups.length);
      groups.push({ key: k, label: groupLabel(row.data), items: [] });
    }
    groups[seen.get(k)!].items.push(row);
  }

  const somaReceita = rows.reduce((a, r) => r.tipo_de_movimento === 'Receita' ? a + parseFloat(r.valor) : a, 0);
  const somaDespesa = rows.reduce((a, r) => r.tipo_de_movimento === 'Despesa' ? a + parseFloat(r.valor) : a, 0);
  const qtdAberto = rows.filter(r => !r.status_pagamento || r.status_pagamento === 'em_aberto').length;

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Transações</h1>
          <p className="text-white/30 text-xs mt-0.5">{total.toLocaleString('pt-BR')} registros</p>
        </div>
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${showFilters || hasActiveFilters ? 'bg-[#1E7BC4] text-white border-[#1E7BC4]' : 'bg-[#16181f] text-white/50 border-white/10 hover:text-white'}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filtros
          {hasActiveFilters && (
            <span className="bg-white text-[#1E7BC4] rounded-full w-4 h-4 text-xs flex items-center justify-center font-bold">
              {Object.values(filters).filter(v => v !== '').length}
            </span>
          )}
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={filters.search}
          onChange={e => setFilter('search', e.target.value)}
          placeholder="Buscar por nome, descrição..."
          className="w-full bg-[#16181f] border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-white/25 outline-none focus:border-[#1E7BC4]/60 transition-all"
        />
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <div className="bg-[#16181f] border border-white/8 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="text-white/30 text-[10px] mb-1 block uppercase tracking-wide">Status</label>
            <select value={filters.status} onChange={e => setFilter('status', e.target.value)}
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#1E7BC4]">
              <option value="">Todos</option>
              <option value="em_aberto">Em Aberto</option>
              <option value="aprovacao_automatica">Aprov. Automática</option>
              <option value="aprovado_usuario">Aprovado</option>
            </select>
          </div>
          <div>
            <label className="text-white/30 text-[10px] mb-1 block uppercase tracking-wide">Tipo</label>
            <select value={filters.tipo} onChange={e => setFilter('tipo', e.target.value)}
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#1E7BC4]">
              <option value="">Todos</option>
              <option value="Receita">Receita</option>
              <option value="Despesa">Despesa</option>
            </select>
          </div>
          <div>
            <label className="text-white/30 text-[10px] mb-1 block uppercase tracking-wide">Placa</label>
            <input type="text" value={filters.placa} onChange={e => setFilter('placa', e.target.value.toUpperCase())}
              placeholder="ABC1234"
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#1E7BC4] placeholder:text-white/20 uppercase" />
          </div>
          <div>
            <label className="text-white/30 text-[10px] mb-1 block uppercase tracking-wide">De</label>
            <input type="date" value={filters.dataInicio} onChange={e => setFilter('dataInicio', e.target.value)}
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#1E7BC4]" />
          </div>
          <div>
            <label className="text-white/30 text-[10px] mb-1 block uppercase tracking-wide">Até</label>
            <input type="date" value={filters.dataFim} onChange={e => setFilter('dataFim', e.target.value)}
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#1E7BC4]" />
          </div>
          <div className="flex items-end">
            <button onClick={() => setFilters(EMPTY_FILTERS)} disabled={!hasActiveFilters}
              className="w-full py-2 rounded-lg text-xs font-medium bg-white/5 text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-30 transition-all">
              Limpar
            </button>
          </div>
        </div>
      )}

      {/* Resumo */}
      {!loading && rows.length > 0 && (
        <div className="flex gap-3 text-xs">
          <span className="text-emerald-400 font-semibold">{fmtVal(somaReceita)}</span>
          <span className="text-white/20">·</span>
          <span className="text-red-400 font-semibold">{fmtVal(somaDespesa)}</span>
          {qtdAberto > 0 && <>
            <span className="text-white/20">·</span>
            <span className="text-amber-400">{qtdAberto} em aberto</span>
          </>}
          <span className="text-white/20">nesta página</span>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-[#1E7BC4] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-20 text-white/20">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Nenhuma transação encontrada
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(group => (
            <div key={group.key}>
              {/* Data header */}
              <div className="flex items-center gap-3 mb-1">
                <p className="text-white/30 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">{group.label}</p>
                <div className="flex-1 h-px bg-white/5" />
                <p className="text-white/20 text-xs">{group.items.length}</p>
              </div>

              {/* Rows */}
              <div className="bg-[#16181f] rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/[0.04]">
                {group.items.map(row => {
                  const isReceita = row.tipo_de_movimento === 'Receita';
                  const status = (row.status_pagamento ?? 'em_aberto') as StatusPagamento;
                  const emAberto = status === 'em_aberto';

                  return (
                    <div key={row.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors group">
                      {/* Ícone */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isReceita ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                        <svg className={`w-3.5 h-3.5 ${isReceita ? 'text-emerald-400' : 'text-red-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {isReceita
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                          }
                        </svg>
                      </div>

                      {/* Nome + descrição */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm font-medium truncate">{row.envolvido}</p>
                          {row.chave_matching && (
                            <span className="font-mono text-[10px] font-bold text-[#1E7BC4] bg-[#1E7BC4]/10 px-1.5 py-0.5 rounded shrink-0 hidden sm:inline">
                              {row.chave_matching}
                            </span>
                          )}
                        </div>
                        <p className="text-white/30 text-xs truncate mt-0.5">
                          {row.descricao ?? '—'}
                          {row.data_processamento && <span className="ml-2 text-white/20">Proc. {fmtDate(row.data_processamento)}</span>}
                        </p>
                      </div>

                      {/* Status — hidden on mobile, visible sm+ */}
                      <div className="hidden sm:flex items-center w-28 shrink-0">
                        <StatusDot status={status} />
                      </div>

                      {/* Valor */}
                      <p className={`text-sm font-bold shrink-0 tabular-nums ${isReceita ? 'text-emerald-400' : 'text-red-400'}`}>
                        {fmtVal(row.valor)}
                      </p>

                      {/* Ações */}
                      <div className="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setAnexosTarget(row)}
                          className="p-1.5 rounded-lg text-white/25 hover:text-purple-400 hover:bg-purple-400/10 transition-all"
                          title="Comprovante"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setSelected(row)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            emAberto
                              ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25'
                              : 'text-white/25 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {emAberto ? 'Aprovar' : 'Editar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-white/25 text-xs">
                Pág. {page}/{totalPages} · {total.toLocaleString('pt-BR')} registros
              </p>
              <div className="flex gap-1.5">
                {[
                  { label: '«', action: () => setPage(1), disabled: page === 1 },
                  { label: '‹', action: () => setPage(p => p - 1), disabled: page === 1 },
                  { label: '›', action: () => setPage(p => p + 1), disabled: page === totalPages },
                  { label: '»', action: () => setPage(totalPages), disabled: page === totalPages },
                ].map(btn => (
                  <button key={btn.label} onClick={btn.action} disabled={btn.disabled}
                    className="w-8 h-8 rounded-lg bg-[#16181f] border border-white/8 text-white/50 text-sm disabled:opacity-25 hover:text-white transition-all">
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selected && (
        <PaymentStatusModal transacao={selected} onClose={() => setSelected(null)} onSaved={fetchData} />
      )}
      {anexosTarget && (
        <AnexosModal transacao={anexosTarget} onClose={() => setAnexosTarget(null)} />
      )}
    </div>
  );
}
