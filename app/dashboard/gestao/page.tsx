'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Check, Clock, Paperclip, RefreshCw, ArrowUpDown } from 'lucide-react';
import { Transacao, brl } from '@/components/transacoes/types';
import DetalheModal from '@/components/transacoes/DetalheModal';

interface Envolvido {
  envolvido: string;
  total_transacoes: number;
  total_receita: number;
  total_despesa: number;
  aprovadas: number;
  pendentes: number;
  ultima_data: string;
  total_anexos: number;
}

interface TxRow extends Transacao {
  tem_anexo?: boolean;
}

interface GrupoAno {
  ano: number;
  meses: GrupoMes[];
}
interface GrupoMes {
  mes: number;
  label: string;
  dias: GrupoDia[];
}
interface GrupoDia {
  dia: string;
  label: string;
  txs: TxRow[];
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function agruparTx(txs: TxRow[]): GrupoAno[] {
  const map = new Map<number, Map<number, Map<string, TxRow[]>>>();
  for (const tx of txs) {
    const d = new Date(tx.data);
    const ano = d.getFullYear();
    const mes = d.getMonth();
    const dia = d.toISOString().slice(0, 10);
    if (!map.has(ano)) map.set(ano, new Map());
    if (!map.get(ano)!.has(mes)) map.get(ano)!.set(mes, new Map());
    if (!map.get(ano)!.get(mes)!.has(dia)) map.get(ano)!.get(mes)!.set(dia, []);
    map.get(ano)!.get(mes)!.get(dia)!.push(tx);
  }
  const result: GrupoAno[] = [];
  for (const [ano, mMap] of [...map.entries()].sort((a, b) => b[0] - a[0])) {
    const meses: GrupoMes[] = [];
    for (const [mes, dMap] of [...mMap.entries()].sort((a, b) => b[0] - a[0])) {
      const dias: GrupoDia[] = [];
      for (const [dia, ts] of [...dMap.entries()].sort((a, b) => b[0].localeCompare(a[0]))) {
        const [, , dd] = dia.split('-');
        dias.push({ dia, label: `${dd}/${String(mes + 1).padStart(2, '0')}`, txs: ts });
      }
      meses.push({ mes, label: MESES[mes], dias });
    }
    result.push({ ano, meses });
  }
  return result;
}

type SortKey = 'nome' | 'valor' | 'data' | 'pendentes';

export default function GestaoPage() {
  const [envolvidos, setEnvolvidos] = useState<Envolvido[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('data');
  const [sortAsc, setSortAsc] = useState(false);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [txMap, setTxMap] = useState<Record<string, TxRow[]>>({});
  const [txLoading, setTxLoading] = useState<string | null>(null);
  const [anosAbertos, setAnosAbertos] = useState<Record<string, Set<number>>>({});
  const [mesesAbertos, setMesesAbertos] = useState<Record<string, Set<string>>>({});

  const [modalId, setModalId] = useState<string | null>(null);

  const fetchEnvolvidos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (statusFilter) params.set('status', statusFilter);
    if (tipoFilter) params.set('tipo', tipoFilter);
    const res = await fetch(`/api/transacoes/envolvidos?${params}`);
    if (res.ok) {
      const json = await res.json();
      setEnvolvidos(json.data ?? []);
    }
    setLoading(false);
  }, [query, statusFilter, tipoFilter]);

  useEffect(() => {
    const t = setTimeout(fetchEnvolvidos, 300);
    return () => clearTimeout(t);
  }, [fetchEnvolvidos]);

  const sorted = useMemo(() => {
    const list = [...envolvidos];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'nome') cmp = a.envolvido.localeCompare(b.envolvido);
      else if (sortBy === 'valor') cmp = (Number(a.total_receita) - Number(a.total_despesa)) - (Number(b.total_receita) - Number(b.total_despesa));
      else if (sortBy === 'pendentes') cmp = a.pendentes - b.pendentes;
      else cmp = new Date(a.ultima_data).getTime() - new Date(b.ultima_data).getTime();
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [envolvidos, sortBy, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(v => !v);
    else { setSortBy(key); setSortAsc(key === 'nome'); }
  };

  const toggleExpand = async (nome: string) => {
    const next = new Set(expanded);
    if (next.has(nome)) { next.delete(nome); setExpanded(next); return; }
    next.add(nome);
    setExpanded(next);

    if (!txMap[nome]) {
      setTxLoading(nome);
      const res = await fetch('/api/transacoes/buscar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ envolvido: nome }),
      });
      const json = await res.json();
      const rows: TxRow[] = json.data ?? [];
      setTxMap(prev => ({ ...prev, [nome]: rows }));
      // Abre o primeiro ano automaticamente
      const grupos = agruparTx(rows);
      if (grupos.length) {
        setAnosAbertos(prev => ({ ...prev, [nome]: new Set([grupos[0].ano]) }));
        const firstMes = grupos[0].meses[0];
        if (firstMes) setMesesAbertos(prev => ({ ...prev, [nome]: new Set([`${grupos[0].ano}-${firstMes.mes}`]) }));
      }
      setTxLoading(null);
    }
  };

  const toggleAno = (nome: string, ano: number) => {
    setAnosAbertos(prev => {
      const s = new Set(prev[nome] ?? []);
      s.has(ano) ? s.delete(ano) : s.add(ano);
      return { ...prev, [nome]: s };
    });
  };
  const toggleMes = (nome: string, key: string) => {
    setMesesAbertos(prev => {
      const s = new Set(prev[nome] ?? []);
      s.has(key) ? s.delete(key) : s.add(key);
      return { ...prev, [nome]: s };
    });
  };

  const onSaved = (t: Transacao) => {
    setTxMap(prev => {
      const updated: Record<string, TxRow[]> = {};
      for (const [k, rows] of Object.entries(prev)) {
        updated[k] = rows.map(r => (r.id === t.id ? { ...r, ...t } : r));
      }
      return updated;
    });
    setModalId(null);
    fetchEnvolvidos();
  };

  const totalPendentes = envolvidos.reduce((s, e) => s + e.pendentes, 0);
  const totalReceita = envolvidos.reduce((s, e) => s + Number(e.total_receita), 0);
  const totalDespesa = envolvidos.reduce((s, e) => s + Number(e.total_despesa), 0);

  const sortBtn = (key: SortKey, label: string) => (
    <button
      onClick={() => toggleSort(key)}
      className={`px-2.5 py-1 rounded-lg text-xs transition-all ${sortBy === key ? 'bg-blue-600/20 text-blue-400' : 'text-white/30 hover:text-white/60'}`}
    >
      {label} {sortBy === key && (sortAsc ? '↑' : '↓')}
    </button>
  );

  return (
    <div className="space-y-5">
      <h1 className="text-white text-2xl font-bold">Gestão de Transações</h1>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0f1629] border border-white/10 rounded-xl p-3">
          <p className="text-white/40 text-[10px] uppercase tracking-wide">Envolvidos</p>
          <p className="text-white text-xl font-bold mt-1">{sorted.length}</p>
        </div>
        <div className="bg-[#0f1629] border border-amber-500/20 rounded-xl p-3">
          <p className="text-amber-400/60 text-[10px] uppercase tracking-wide">Pendentes</p>
          <p className="text-amber-400 text-xl font-bold mt-1">{totalPendentes}</p>
        </div>
        <div className="bg-[#0f1629] border border-emerald-500/20 rounded-xl p-3">
          <p className="text-emerald-400/60 text-[10px] uppercase tracking-wide">Receitas</p>
          <p className="text-emerald-400 text-xl font-bold mt-1">{brl(totalReceita)}</p>
        </div>
        <div className="bg-[#0f1629] border border-red-500/20 rounded-xl p-3">
          <p className="text-red-400/60 text-[10px] uppercase tracking-wide">Despesas</p>
          <p className="text-red-400 text-xl font-bold mt-1">{brl(totalDespesa)}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar envolvido..."
            className="w-full bg-[#0f1629] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-all" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-[#0f1629] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500/50">
          <option value="">Todos os status</option>
          <option value="pendente">Com pendentes</option>
          <option value="aprovado">Tudo aprovado</option>
        </select>
        <select value={tipoFilter} onChange={e => setTipoFilter(e.target.value)}
          className="bg-[#0f1629] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500/50">
          <option value="">Todos os tipos</option>
          <option value="Receita">Receita</option>
          <option value="Despesa">Despesa</option>
        </select>
      </div>

      {/* Ordenação */}
      <div className="flex items-center gap-1.5">
        <ArrowUpDown size={12} className="text-white/20" />
        <span className="text-white/20 text-xs mr-1">Ordenar:</span>
        {sortBtn('data', 'Data')}
        {sortBtn('nome', 'Nome')}
        {sortBtn('valor', 'Valor')}
        {sortBtn('pendentes', 'Pendentes')}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-white/25 text-sm">Nenhum envolvido encontrado</div>
      ) : (
        <div className="space-y-2">
          {sorted.map(env => {
            const isOpen = expanded.has(env.envolvido);
            const txs = txMap[env.envolvido];
            const isLoadingTx = txLoading === env.envolvido;
            const saldo = Number(env.total_receita) - Number(env.total_despesa);
            const grupos = txs ? agruparTx(txs) : [];
            const anosSet = anosAbertos[env.envolvido] ?? new Set();
            const mesesSet = mesesAbertos[env.envolvido] ?? new Set();

            return (
              <div key={env.envolvido} className="bg-[#0f1629] border border-white/10 rounded-xl overflow-hidden">
                {/* Cabeçalho */}
                <button onClick={() => toggleExpand(env.envolvido)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left">
                  <div className="text-white/30 shrink-0">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                    <span className="text-blue-400 font-bold text-xs">{env.envolvido.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{env.envolvido}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-white/30 text-xs">
                      <span>{env.total_transacoes} trans.</span>
                      <span className="text-white/15">·</span>
                      <span>Última: {new Date(env.ultima_data).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {env.total_anexos > 0 && (
                      <span className="flex items-center gap-1 text-purple-400/60 text-xs"><Paperclip size={11} />{env.total_anexos}</span>
                    )}
                    {env.pendentes > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium">
                        <Clock size={10} />{env.pendentes}
                      </span>
                    )}
                    {env.aprovadas > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium">
                        <Check size={10} />{env.aprovadas}
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0 w-24 sm:w-28">
                    <p className={`text-xs sm:text-sm font-bold ${saldo >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{brl(saldo)}</p>
                    <div className="hidden sm:flex items-center justify-end gap-2 mt-0.5">
                      {Number(env.total_receita) > 0 && (
                        <span className="text-emerald-400/50 text-[10px] flex items-center gap-0.5"><TrendingUp size={9} />{brl(Number(env.total_receita))}</span>
                      )}
                      {Number(env.total_despesa) > 0 && (
                        <span className="text-red-400/50 text-[10px] flex items-center gap-0.5"><TrendingDown size={9} />{brl(Number(env.total_despesa))}</span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Expandido: ano → mês → dia → transações */}
                {isOpen && (
                  <div className="border-t border-white/5">
                    {isLoadingTx || !txs ? (
                      <div className="flex items-center justify-center py-6">
                        <RefreshCw size={16} className="text-blue-400 animate-spin" />
                      </div>
                    ) : grupos.length === 0 ? (
                      <div className="py-6 text-center text-white/25 text-xs">Nenhuma transação</div>
                    ) : (
                      <div className="pl-6 pr-4 py-2">
                        {grupos.map(gAno => {
                          const anoOpen = anosSet.has(gAno.ano);
                          const anoRec = gAno.meses.reduce((s, m) => s + m.dias.reduce((s2, d) => s2 + d.txs.filter(t => t.tipo_de_movimento === 'Receita').reduce((s3, t) => s3 + Number(t.valor), 0), 0), 0);
                          const anoDesp = gAno.meses.reduce((s, m) => s + m.dias.reduce((s2, d) => s2 + d.txs.filter(t => t.tipo_de_movimento === 'Despesa').reduce((s3, t) => s3 + Number(t.valor), 0), 0), 0);
                          const anoCount = gAno.meses.reduce((s, m) => s + m.dias.reduce((s2, d) => s2 + d.txs.length, 0), 0);
                          return (
                            <div key={gAno.ano} className="mb-1">
                              <button onClick={() => toggleAno(env.envolvido, gAno.ano)}
                                className="flex items-center gap-2 w-full py-2 text-left hover:bg-white/[0.02] rounded-lg px-2 transition-colors">
                                {anoOpen ? <ChevronDown size={13} className="text-white/30" /> : <ChevronRight size={13} className="text-white/30" />}
                                <span className="text-white font-semibold text-sm">{gAno.ano}</span>
                                <span className="text-white/20 text-xs">{anoCount} trans.</span>
                                <div className="flex-1" />
                                <span className="text-emerald-400/60 text-xs">{brl(anoRec)}</span>
                                {anoDesp > 0 && <span className="text-red-400/60 text-xs">{brl(anoDesp)}</span>}
                              </button>

                              {anoOpen && (
                                <div className="pl-5">
                                  {gAno.meses.map(gMes => {
                                    const mesKey = `${gAno.ano}-${gMes.mes}`;
                                    const mesOpen = mesesSet.has(mesKey);
                                    const mesCount = gMes.dias.reduce((s, d) => s + d.txs.length, 0);
                                    const mesRec = gMes.dias.reduce((s, d) => s + d.txs.filter(t => t.tipo_de_movimento === 'Receita').reduce((s2, t) => s2 + Number(t.valor), 0), 0);
                                    return (
                                      <div key={mesKey} className="mb-0.5">
                                        <button onClick={() => toggleMes(env.envolvido, mesKey)}
                                          className="flex items-center gap-2 w-full py-1.5 text-left hover:bg-white/[0.02] rounded-lg px-2 transition-colors">
                                          {mesOpen ? <ChevronDown size={12} className="text-white/25" /> : <ChevronRight size={12} className="text-white/25" />}
                                          <span className="text-white/70 text-xs font-medium">{gMes.label}</span>
                                          <span className="text-white/20 text-[10px]">{mesCount}</span>
                                          <div className="flex-1" />
                                          <span className="text-emerald-400/40 text-[10px]">{brl(mesRec)}</span>
                                        </button>

                                        {mesOpen && (
                                          <div className="pl-5">
                                            {gMes.dias.map(gDia => (
                                              <div key={gDia.dia}>
                                                <div className="flex items-center gap-2 py-1 px-2">
                                                  <span className="text-white/20 text-[10px] font-mono">{gDia.label}</span>
                                                  <div className="flex-1 h-px bg-white/5" />
                                                </div>
                                                {gDia.txs.map(tx => {
                                                  const isRec = tx.tipo_de_movimento === 'Receita';
                                                  const aprov = !!tx.aprovado_em || tx.descricao_extra === 'Comprovante via Telegram';
                                                  const temAnexo = String((tx as TxRow).tem_anexo) === 'true' || !!tx.comprovante;
                                                  return (
                                                    <div key={tx.id}
                                                      onClick={() => setModalId(tx.id)}
                                                      className="flex items-center gap-2 px-2 py-2 hover:bg-white/[0.03] rounded-lg cursor-pointer transition-colors group ml-1 sm:ml-2">
                                                      {/* Indicador tipo */}
                                                      <div className={`w-1 h-6 rounded-full shrink-0 ${isRec ? 'bg-emerald-500/40' : 'bg-red-500/40'}`} />
                                                      {/* Descrição */}
                                                      <p className="text-white/60 text-xs flex-1 truncate min-w-0">{tx.descricao ?? '—'}</p>
                                                      {/* Placa */}
                                                      {tx.placa && (
                                                        <span className="font-mono text-[9px] font-bold text-blue-400/70 bg-blue-500/10 px-1 py-0.5 rounded shrink-0 hidden sm:inline">
                                                          {tx.placa}
                                                        </span>
                                                      )}
                                                      {/* Anexo */}
                                                      {temAnexo && <Paperclip size={10} className="text-purple-400/50 shrink-0" />}
                                                      {/* Status */}
                                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${aprov ? 'bg-emerald-400' : 'bg-amber-400'}`}
                                                        title={aprov ? 'Aprovado' : 'Pendente'} />
                                                      {/* Valor */}
                                                      <span className={`text-[11px] sm:text-xs font-bold tabular-nums shrink-0 text-right ${isRec ? 'text-emerald-400/80' : 'text-red-400/80'}`}>
                                                        {brl(Number(tx.valor))}
                                                      </span>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DetalheModal transacaoId={modalId} onClose={() => setModalId(null)} onSaved={onSaved} />
    </div>
  );
}
