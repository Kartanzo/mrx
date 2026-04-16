'use client';

import { useState, useEffect, useRef } from 'react';
import { Transacao, StatusPagamento } from '@/types';

interface Cliente {
  id_cliente: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  whatsapp: string | null;
}

interface Props {
  transacao: Transacao;
  onClose: () => void;
  onSaved: () => void;
}

export function StatusBadge({ status }: { status: StatusPagamento }) {
  const config = {
    em_aberto: { label: 'Em Aberto', color: '#f59e0b', bg: '#fef3c7' },
    aprovacao_automatica: { label: 'Aprov. Automática', color: '#3b82f6', bg: '#dbeafe' },
    aprovado_usuario: { label: 'Aprovado', color: '#10b981', bg: '#d1fae5' },
  }[status] ?? { label: status, color: '#6b7280', bg: '#f3f4f6' };

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{ color: config.color, background: config.bg }}>
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: config.color }} />
      {config.label}
    </span>
  );
}

export default function PaymentStatusModal({ transacao, onClose, onSaved }: Props) {
  const isAprovado = transacao.status_pagamento === 'aprovado_usuario';
  const isAutomatico = transacao.status_pagamento === 'aprovacao_automatica';

  const [placa, setPlaca] = useState(transacao.chave_matching ?? '');
  const [clienteQuery, setClienteQuery] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    transacao.id_cliente && transacao.nome_cliente
      ? { id_cliente: transacao.id_cliente, nome: transacao.nome_cliente, cpf: null, telefone: null, whatsapp: null }
      : null
  );
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [observacao, setObservacao] = useState(transacao.observacao ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmReabrir, setConfirmReabrir] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const brazilNow = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  useEffect(() => {
    if (clienteQuery.length < 2) { setClientes([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(clienteQuery)}`);
      if (res.ok) { const d = await res.json(); setClientes(d.rows); setShowDropdown(true); }
    }, 300);
    return () => clearTimeout(t);
  }, [clienteQuery]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleAprovar() {
    setError('');
    if (!placa.trim()) { setError('Informe a placa do veículo'); return; }
    if (!clienteSelecionado) { setError('Selecione um cliente'); return; }

    setLoading(true);
    const res = await fetch(`/api/transacoes/${encodeURIComponent(transacao.id)}/pagamento`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        placa,
        id_cliente: clienteSelecionado.id_cliente,
        nome_cliente: clienteSelecionado.nome,
        observacao,
      }),
    });
    setLoading(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erro ao salvar'); return; }
    onSaved();
    onClose();
  }

  async function handleReabrir() {
    setLoading(true);
    await fetch(`/api/transacoes/${encodeURIComponent(transacao.id)}/pagamento`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reabrir: true, observacao }),
    });
    setLoading(false);
    onSaved();
    onClose();
  }

  const valor = parseFloat(transacao.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const data = new Date(transacao.data).toLocaleDateString('pt-BR');
  const isReceita = transacao.tipo_de_movimento === 'Receita';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#0a0c14] px-5 py-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-white font-bold text-base">Confirmar Pagamento</h3>
            <p className="text-white/40 text-xs mt-0.5">{data} · {valor}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-5 space-y-5">

            {/* Info resumida */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs">Envolvido</p>
                  <p className="text-gray-800 font-medium text-sm">{transacao.envolvido}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs">Valor</p>
                  <p className={`font-bold text-lg ${isReceita ? 'text-emerald-600' : 'text-red-600'}`}>{valor}</p>
                </div>
              </div>
              {transacao.descricao && (
                <div>
                  <p className="text-gray-500 text-xs">Descrição</p>
                  <p className="text-gray-700 text-sm">{transacao.descricao}</p>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <StatusBadge status={(transacao.status_pagamento ?? 'em_aberto') as StatusPagamento} />
                {isAutomatico && (
                  <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Processado automaticamente</span>
                )}
              </div>
            </div>

            {/* Se já está aprovado pelo usuário */}
            {isAprovado && !confirmReabrir ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-emerald-800 font-semibold text-sm">Pagamento aprovado</p>
                    <p className="text-emerald-600 text-xs mt-0.5">
                      {transacao.aprovado_por && `Por: ${transacao.aprovado_por}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmReabrir(true)}
                  className="w-full py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-all"
                >
                  Reabrir pagamento
                </button>
              </div>
            ) : confirmReabrir ? (
              <div className="space-y-3">
                <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                  <p className="text-red-700 font-semibold text-sm">Confirmar reabertura?</p>
                  <p className="text-red-500 text-xs mt-1">O status voltará para "Em Aberto".</p>
                </div>
                <textarea
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 resize-none outline-none focus:border-[#1E7BC4]"
                  placeholder="Motivo da reabertura (opcional)"
                />
                <div className="flex gap-3">
                  <button onClick={() => setConfirmReabrir(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">Cancelar</button>
                  <button onClick={handleReabrir} disabled={loading} className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
                    {loading ? 'Salvando...' : 'Reabrir'}
                  </button>
                </div>
              </div>
            ) : (
              /* Formulário de aprovação */
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <svg className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-blue-700 text-xs">Ao confirmar, o pagamento será registrado como <strong>Aprovado pelo Usuário</strong>.</p>
                </div>

                {/* Placa */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Placa do Veículo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={placa}
                    onChange={e => setPlaca(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono font-bold tracking-widest uppercase text-gray-900 outline-none focus:border-[#1E7BC4] focus:ring-1 focus:ring-[#1E7BC4] transition-all"
                    placeholder="ABC1234"
                  />
                </div>

                {/* Data automática */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Data/Hora da Aprovação</label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-600 text-sm">{brazilNow} (Brasília)</span>
                    <span className="ml-auto text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">Automático</span>
                  </div>
                </div>

                {/* Cliente */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Cliente <span className="text-red-500">*</span>
                  </label>

                  {clienteSelecionado ? (
                    <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <span className="text-emerald-700 font-bold text-sm">{clienteSelecionado.nome.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-medium text-sm truncate">{clienteSelecionado.nome}</p>
                        <p className="text-gray-400 text-xs">{clienteSelecionado.id_cliente}</p>
                      </div>
                      <button onClick={() => { setClienteSelecionado(null); setClienteQuery(''); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="relative" ref={dropdownRef}>
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          ref={searchRef}
                          type="text"
                          value={clienteQuery}
                          onChange={e => setClienteQuery(e.target.value)}
                          onFocus={() => clientes.length > 0 && setShowDropdown(true)}
                          className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-[#1E7BC4] focus:ring-1 focus:ring-[#1E7BC4] transition-all"
                          placeholder="Buscar por nome, CPF ou ID..."
                        />
                      </div>

                      {showDropdown && clientes.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                          {clientes.map(c => (
                            <button
                              key={c.id_cliente}
                              onClick={() => { setClienteSelecionado(c); setShowDropdown(false); setClienteQuery(''); }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                            >
                              <div className="w-8 h-8 rounded-full bg-[#1E7BC4]/10 flex items-center justify-center shrink-0">
                                <span className="text-[#1E7BC4] font-bold text-sm">{c.nome.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-gray-800 font-medium text-sm truncate">{c.nome}</p>
                                <p className="text-gray-400 text-xs">{c.cpf ?? c.id_cliente} {c.whatsapp ? `· ${c.whatsapp}` : ''}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {clienteQuery.length >= 2 && clientes.length === 0 && (
                        <p className="text-gray-400 text-xs mt-2 px-1">Nenhum cliente encontrado</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Observação */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Observação (opcional)</label>
                  <textarea
                    value={observacao}
                    onChange={e => setObservacao(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 resize-none outline-none focus:border-[#1E7BC4] focus:ring-1 focus:ring-[#1E7BC4] transition-all"
                    placeholder="Detalhes adicionais..."
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2.5 rounded-xl border border-red-100">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all">
                    Cancelar
                  </button>
                  <button
                    onClick={handleAprovar}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-[#1E7BC4] text-white font-semibold text-sm hover:bg-[#1a6aaa] disabled:opacity-50 transition-all shadow-lg shadow-[#1E7BC4]/20"
                  >
                    {loading ? 'Salvando...' : 'Confirmar Pagamento'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
