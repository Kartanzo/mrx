'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, Users, Receipt, CheckCircle, Clock } from 'lucide-react';
import { Transacao, GrupoAnual, agrupar, brl } from '@/components/transacoes/types';
import DetalheModal from '@/components/transacoes/DetalheModal';

interface Stats {
  total: number;
  total_envolvidos: number;
  total_receita: number;
  total_despesa: number;
  aprovadas: number;
  pendentes: number;
}

export default function TransacoesPage() {
  const [query, setQuery]         = useState('');
  const [sugestoes, setSugestoes] = useState<string[]>([]);
  const [envolvido, setEnvolvido] = useState('');
  const [grupos, setGrupos]       = useState<GrupoAnual[]>([]);
  const [loading, setLoading]     = useState(false);
  const [anosAbertos, setAnosAbertos]   = useState<Set<number>>(new Set());
  const [mesesAbertos, setMesesAbertos] = useState<Set<string>>(new Set());
  const [modalId, setModalId]     = useState<string | null>(null);
  const [stats, setStats]         = useState<Stats | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  /* ── Modo 2 – busca exata ── */
  const [modo2, setModo2] = useState(false);
  const [bData, setBData] = useState('');
  const [bValor, setBValor] = useState('');
  const [sem2, setSem2]   = useState(false);

  /* stats iniciais */
  useEffect(() => {
    fetch('/api/transacoes/stats').then(r => r.json()).then(j => { if (j.data) setStats(j.data); });
  }, []);

  /* autocomplete */
  useEffect(() => {
    if (query.length < 2) { setSugestoes([]); return; }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      const res  = await fetch(`/api/transacoes/buscar?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      setSugestoes(json.data ?? []);
    }, 300);
  }, [query]);

  /* fechar sugestões ao clicar fora */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.closest('.search-wrapper')?.contains(e.target as Node)) {
        setSugestoes([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const trocarModo = (m: boolean) => {
    setModo2(m);
    setSugestoes([]);   // fecha dropdown ao trocar aba
    setSem2(false);
  };

  const selecionarEnvolvido = useCallback(async (nome: string) => {
    setEnvolvido(nome);
    setQuery(nome);
    setSugestoes([]);
    setLoading(true);
    const res  = await fetch('/api/transacoes/buscar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ envolvido: nome }),
    });
    const json = await res.json();
    const rows: Transacao[] = json.data ?? [];
    const g = agrupar(rows);
    setGrupos(g);
    if (g.length) setAnosAbertos(new Set([g[0].ano]));
    setLoading(false);
  }, []);

  const buscarExata = async () => {
    if (!envolvido || !bData || !bValor) return;
    setSem2(false);
    const res  = await fetch('/api/transacoes/buscar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ envolvido, data: bData, valor: bValor }),
    });
    const json = await res.json();
    if (json.data) setModalId(json.data.id);
    else setSem2(true);
  };

  const toggleAno = (ano: number) =>
    setAnosAbertos(s => { const n = new Set(s); n.has(ano) ? n.delete(ano) : n.add(ano); return n; });
  const toggleMes = (k: string) =>
    setMesesAbertos(s => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const onSaved = (t: Transacao) => {
    setGrupos(prev =>
      prev.map(a => ({
        ...a,
        meses: a.meses.map(m => ({
          ...m,
          dias: m.dias.map(d => ({
            ...d,
            transacoes: d.transacoes.map(tx => (tx.id === t.id ? t : tx)),
          })),
        })),
      }))
    );
    setModalId(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-white text-2xl font-bold">Transações</h1>

      {/* painel de visão geral */}
      {!envolvido && (
        <div className="space-y-4">
          {/* cards de stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/40 text-xs mb-2"><Receipt size={13} /> Total</div>
              <div className="text-white text-2xl font-bold">{stats?.total.toLocaleString('pt-BR') ?? '—'}</div>
              <div className="text-white/30 text-xs mt-1">transações registradas</div>
            </div>
            <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/40 text-xs mb-2"><Users size={13} /> Envolvidos</div>
              <div className="text-white text-2xl font-bold">{stats?.total_envolvidos.toLocaleString('pt-BR') ?? '—'}</div>
              <div className="text-white/30 text-xs mt-1">clientes / empresas</div>
            </div>
            <div className="bg-[#0f1629] border border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/40 text-xs mb-2"><CheckCircle size={13} /> Aprovadas</div>
              <div className="text-emerald-400 text-2xl font-bold">{stats?.aprovadas.toLocaleString('pt-BR') ?? '—'}</div>
              <div className="text-white/30 text-xs mt-1">transações aprovadas</div>
            </div>
            <div className="bg-[#0f1629] border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/40 text-xs mb-2"><Clock size={13} /> Pendentes</div>
              <div className="text-yellow-400 text-2xl font-bold">{stats?.pendentes.toLocaleString('pt-BR') ?? '—'}</div>
              <div className="text-white/30 text-xs mt-1">aguardando aprovação</div>
            </div>
          </div>

          {/* receita / despesa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={18} className="text-emerald-400" />
              </div>
              <div>
                <div className="text-white/40 text-xs mb-0.5">Total de Receitas</div>
                <div className="text-emerald-400 text-xl font-bold">{stats ? brl(Number(stats.total_receita)) : '—'}</div>
              </div>
            </div>
            <div className="bg-[#0f1629] border border-white/10 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <TrendingDown size={18} className="text-red-400" />
              </div>
              <div>
                <div className="text-white/40 text-xs mb-0.5">Total de Despesas</div>
                <div className="text-red-400 text-xl font-bold">{stats ? brl(Number(stats.total_despesa)) : '—'}</div>
              </div>
            </div>
          </div>

          {/* instrução */}
          <div className="bg-[#0f1629] border border-white/10 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Search size={18} className="text-blue-400" />
            </div>
            <div>
              <div className="text-white text-sm font-medium mb-1">Como usar</div>
              <div className="text-white/40 text-xs leading-relaxed">
                Use a <span className="text-white/70">Busca por Pagador</span> para encontrar todas as transações de um cliente pelo nome.
                Use a <span className="text-white/70">Busca Exata</span> para localizar uma transação específica por data e valor.
                Dê um clique em qualquer linha para abrir os detalhes e editar.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* abas */}
      <div className="flex gap-2">
        {['Busca por Pagador', 'Busca Exata'].map((label, i) => (
          <button
            key={label}
            onClick={() => trocarModo(i === 1)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              modo2 === (i === 1)
                ? 'bg-blue-600 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* painel de busca */}
      <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 space-y-4">

        {/* campo de busca com autocomplete */}
        <div className="search-wrapper relative" ref={inputRef}>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar pagador / envolvido…"
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500/50 placeholder-white/25"
          />
          {sugestoes.length > 0 && (
            <ul className="absolute z-30 top-full mt-1 w-full bg-[#0f1629] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
              {sugestoes.map(s => (
                <li
                  key={s}
                  onMouseDown={() => selecionarEnvolvido(s)}   // mousedown evita blur antes do click
                  className="px-4 py-2.5 text-sm text-white/70 hover:bg-white/8 hover:text-white cursor-pointer transition-colors border-b border-white/5 last:border-0"
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* modo 2 – busca exata */}
        {modo2 && (
          <div className="flex flex-wrap gap-3 items-center pt-1">
            <input
              type="date"
              value={bData}
              onChange={e => setBData(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Valor  ex: 100.00"
              value={bValor}
              onChange={e => setBValor(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50 w-44"
            />
            <button
              onClick={buscarExata}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Localizar
            </button>
            {sem2 && <span className="text-red-400 text-sm">Nenhum resultado encontrado</span>}
          </div>
        )}
      </div>

      {/* loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* grupos anuais */}
      {!loading && grupos.length > 0 && (
        <div className="space-y-3">
          {grupos.map(ano => (
            <div key={ano.ano} className="bg-[#0f1629] border border-white/10 rounded-2xl overflow-hidden">

              {/* cabeçalho ano */}
              <button
                onClick={() => toggleAno(ano.ano)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {anosAbertos.has(ano.ano)
                    ? <ChevronDown  size={16} className="text-blue-400" />
                    : <ChevronRight size={16} className="text-white/40" />}
                  <span className="text-white font-bold text-lg">{ano.ano}</span>
                </div>
                <div className="flex gap-3 sm:gap-6 text-xs sm:text-sm">
                  <span className="flex items-center gap-1 text-emerald-400"><TrendingUp   size={13} />{brl(ano.totalReceita)}</span>
                  <span className="flex items-center gap-1 text-red-400">   <TrendingDown size={13} />{brl(ano.totalDespesa)}</span>
                  <span className="hidden sm:flex items-center gap-1 text-white/50"><Minus size={13} />{brl(ano.totalReceita - ano.totalDespesa)}</span>
                </div>
              </button>

              {anosAbertos.has(ano.ano) && (
                <div className="px-4 pb-4 space-y-2">
                  {ano.meses.map(mes => {
                    const mk = `${ano.ano}-${mes.mes}`;
                    return (
                      <div key={mk} className="bg-white/3 border border-white/8 rounded-xl overflow-hidden">

                        {/* cabeçalho mês */}
                        <button
                          onClick={() => toggleMes(mk)}
                          className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {mesesAbertos.has(mk)
                              ? <ChevronDown  size={14} className="text-blue-400" />
                              : <ChevronRight size={14} className="text-white/30" />}
                            <span className="text-white/80 font-medium">{mes.mesLabel}</span>
                          </div>
                          <div className="flex gap-4 text-xs">
                            <span className="text-emerald-400">{brl(mes.totalReceita)}</span>
                            <span className="text-red-400">{brl(mes.totalDespesa)}</span>
                          </div>
                        </button>

                        {mesesAbertos.has(mk) && (
                          <div className="px-2 pb-3">
                            <table className="w-full text-xs">
                              <tbody>
                                {/* Achata todos os dias/transações em linhas simples */}
                                {mes.dias.flatMap(dia =>
                                  dia.transacoes.map(t => (
                                    <tr
                                      key={t.id}
                                      onDoubleClick={() => setModalId(t.id)}
                                      onClick={() => setModalId(t.id)}
                                      className="group border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
                                      title="Clique para editar"
                                    >
                                      <td className="py-2 px-2 sm:px-3 text-white/50 whitespace-nowrap text-xs w-20 sm:w-28">
                                        {dia.diaLabel}
                                      </td>
                                      <td className="py-2 px-2 sm:px-3 text-white/70 truncate max-w-[120px] sm:max-w-xs text-xs sm:text-sm">
                                        {t.descricao}
                                      </td>
                                      <td className={`py-2 px-2 sm:px-3 font-semibold text-right whitespace-nowrap text-xs sm:text-sm w-24 sm:w-32 ${
                                        t.tipo_de_movimento === 'Receita' ? 'text-emerald-400' : 'text-red-400'
                                      }`}>
                                        {t.tipo_de_movimento === 'Despesa' ? '− ' : '+ '}{brl(Number(t.valor))}
                                      </td>
                                      <td className="hidden sm:table-cell py-2 px-3 w-24">
                                        {t.aprovado
                                          ? <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-xs">Aprovado</span>
                                          : <span className="bg-yellow-500/10 text-yellow-500/60 px-2 py-0.5 rounded-full text-xs">Pendente</span>}
                                      </td>
                                      <td className="hidden md:table-cell py-2 px-3 w-20 font-mono text-white/30 text-xs">
                                        {t.placa ?? ''}
                                      </td>
                                      <td className="py-2 px-2 w-6 opacity-0 group-hover:opacity-60 transition-opacity text-blue-400 text-xs">
                                        ✎
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && envolvido && grupos.length === 0 && (
        <div className="text-center py-16 text-white/30 text-sm">
          Nenhuma transação encontrada para este envolvido.
        </div>
      )}

      <DetalheModal transacaoId={modalId} onClose={() => setModalId(null)} onSaved={onSaved} />
    </div>
  );
}
