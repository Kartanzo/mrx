'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, X, Save, User, Shield, Car, MessageCircle, Hash, Pencil, Trash2, Phone, Mail, MapPin, CreditCard, CalendarDays, FileText, DollarSign, Clock, KeyRound } from 'lucide-react';

interface Acesso {
  id_cliente: string;
  nome_cadastrado: string;
  nome_telegram: string | null;
  id: string;
  tipo: string | null;
  administrador: string | null;
  placa: string | null;
  data_criacao: string | null;
  data_atualizacao: string | null;
}

interface Cliente {
  id_cliente: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  endereco: string | null;
  data_nascimento: string | null;
  data_registro: string | null;
  forma_pagamento: string | null;
  tipo_pagamento: string | null;
  regime_de_pagamento: string | null;
  dia_da_semana_vencimento: string | null;
  dia_de_vencimento: number | null;
  valor_negociado: number | null;
  data_proximo_pagamento: string | null;
  data_inicio_locacao: string | null;
  data_inicio_contrato: string | null;
  data_fim_contrato: string | null;
  data_inicio_cobranca: string | null;
  status_pagamento: number | null;
  em_dia_pagamento: number | null;
  checa_ciclo_pagamento: string | null;
  perfil: string | null;
  administrador_mrx: string | null;
  nome_segundo_contato: string | null;
  segundo_contato_telefonico: string | null;
  grau_de_parentesco: string | null;
  id_veiculos: string | null;
  contrato: string | null;
}

interface Aluguel {
  id_aluguel: string;
  id_cliente: string;
  id_veiculo: string | null;
  status: string | null;
  valor: string | null;
  data_inicio: string | null;
  data_termino: string | null;
  data_real_entrega: string | null;
  carro_escolhido: string | null;
  cliente_escolhido: string | null;
  email_cliente: string | null;
  tabela_de_preco: string | null;
  log: string | null;
  perfil: string | null;
  adm: string | null;
}

const EMPTY_FORM: Omit<Acesso, 'data_criacao' | 'data_atualizacao'> = {
  id_cliente: '', nome_cadastrado: '', nome_telegram: '', id: '', tipo: 'CLIENTE', administrador: '', placa: '',
};

export default function AcessoPage() {
  const [registros, setRegistros] = useState<Acesso[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Acesso | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Ficha do cliente
  const [fichaId, setFichaId] = useState<string | null>(null);
  const [fichaData, setFichaData] = useState<Cliente | null>(null);
  const [fichaLoading, setFichaLoading] = useState(false);
  const [fichaAcesso, setFichaAcesso] = useState<Acesso | null>(null);

  // Aluguel
  const [aluguelId, setAluguelId] = useState<string | null>(null);
  const [aluguelData, setAluguelData] = useState<Aluguel | null>(null);
  const [aluguelLoading, setAluguelLoading] = useState(false);
  const [aluguelAcesso, setAluguelAcesso] = useState<Acesso | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (tipoFilter) params.set('tipo', tipoFilter);
    const res = await fetch(`/api/acesso?${params}`);
    if (res.ok) {
      const json = await res.json();
      setRegistros(json.data ?? []);
    }
    setLoading(false);
  }, [query, tipoFilter]);

  useEffect(() => {
    const t = setTimeout(fetch_, 300);
    return () => clearTimeout(t);
  }, [fetch_]);

  const openFicha = async (r: Acesso) => {
    setFichaId(r.id_cliente);
    setFichaAcesso(r);
    setFichaData(null);
    setFichaLoading(true);
    const res = await fetch(`/api/clientes/${encodeURIComponent(r.id_cliente)}`);
    if (res.ok) {
      const json = await res.json();
      setFichaData(json.data ?? null);
    }
    setFichaLoading(false);
  };

  const openAluguel = async (r: Acesso) => {
    setAluguelId(r.id_cliente);
    setAluguelAcesso(r);
    setAluguelData(null);
    setAluguelLoading(true);
    const res = await fetch(`/api/clientes/${encodeURIComponent(r.id_cliente)}/aluguel`);
    if (res.ok) {
      const json = await res.json();
      setAluguelData(json.data ?? null);
    }
    setAluguelLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setModal(true);
  };

  const openEdit = (r: Acesso) => {
    setEditing(r);
    setForm({
      id_cliente: r.id_cliente,
      nome_cadastrado: r.nome_cadastrado,
      nome_telegram: r.nome_telegram ?? '',
      id: r.id,
      tipo: r.tipo ?? 'CLIENTE',
      administrador: r.administrador ?? '',
      placa: r.placa ?? '',
    });
    setError('');
    setModal(true);
  };

  const handleSave = async () => {
    setError('');
    if (!form.id_cliente.trim() || !form.nome_cadastrado.trim() || !form.id.trim()) {
      setError('ID Cliente, Nome e ID Telegram são obrigatórios');
      return;
    }
    setSaving(true);
    const url = editing ? `/api/acesso/${encodeURIComponent(editing.id_cliente)}` : '/api/acesso';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error ?? 'Erro ao salvar'); return; }
    setModal(false);
    fetch_();
  };

  const handleDelete = async (id_cliente: string) => {
    await fetch(`/api/acesso/${encodeURIComponent(id_cliente)}`, { method: 'DELETE' });
    setConfirmDelete(null);
    fetch_();
  };

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const clientes = registros.filter(r => r.tipo !== 'Administrador');
  const admins = registros.filter(r => r.tipo === 'Administrador');

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR') : '—';
  const fmtMoney = (v: number | null) => v != null ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white text-2xl font-bold">Controle de Acesso</h1>
          <p className="text-white/30 text-xs mt-0.5">{registros.length} cadastros</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
          <Plus size={16} />
          <span className="hidden sm:inline">Novo Cadastro</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nome, ID, placa..."
            className="w-full bg-[#0f1629] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-all" />
        </div>
        <select value={tipoFilter} onChange={e => setTipoFilter(e.target.value)}
          className="bg-[#0f1629] border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500/50">
          <option value="">Todos</option>
          <option value="CLIENTE">Clientes</option>
          <option value="Administrador">Administradores</option>
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : registros.length === 0 ? (
        <div className="text-center py-16 text-white/25 text-sm">Nenhum cadastro encontrado</div>
      ) : (
        <div className="space-y-6">
          {admins.length > 0 && !tipoFilter && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={14} className="text-blue-400" />
                <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">Administradores</span>
                <span className="text-white/20 text-xs">{admins.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {admins.map(r => (
                  <CardAcesso key={r.id_cliente} r={r} onEdit={openEdit} onDelete={setConfirmDelete} onClickFicha={openFicha} onClickAluguel={openAluguel} fmtDate={fmtDate} />
                ))}
              </div>
            </div>
          )}

          {clientes.length > 0 && (
            <div>
              {!tipoFilter && (
                <div className="flex items-center gap-2 mb-3">
                  <User size={14} className="text-emerald-400" />
                  <span className="text-white/40 text-xs font-semibold uppercase tracking-wider">Clientes</span>
                  <span className="text-white/20 text-xs">{clientes.length}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(tipoFilter ? registros : clientes).map(r => (
                  <CardAcesso key={r.id_cliente} r={r} onEdit={openEdit} onDelete={setConfirmDelete} onClickFicha={openFicha} onClickAluguel={openAluguel} fmtDate={fmtDate} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmar exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <p className="text-white font-semibold text-sm mb-2">Confirmar exclusão?</p>
            <p className="text-white/40 text-xs mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-all">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-all">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro / Edição */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onMouseDown={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="bg-[#0f1629] border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
              <h2 className="text-white font-semibold text-base">{editing ? 'Editar Cadastro' : 'Novo Cadastro'}</h2>
              <button onClick={() => setModal(false)} className="text-white/40 hover:text-white p-1"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field icon={<Hash size={13} />} label="ID Cliente *" value={form.id_cliente}
                  onChange={v => set('id_cliente', v)} placeholder="abc12345" disabled={!!editing} />
                <Field icon={<User size={13} />} label="Nome *" value={form.nome_cadastrado}
                  onChange={v => set('nome_cadastrado', v)} placeholder="Nome completo" />
                <Field icon={<MessageCircle size={13} />} label="ID Telegram *" value={form.id}
                  onChange={v => set('id', v)} placeholder="123456789" />
                <Field icon={<MessageCircle size={13} />} label="Nome Telegram" value={form.nome_telegram ?? ''}
                  onChange={v => set('nome_telegram', v)} placeholder="@username" />
                <div>
                  <label className="flex items-center gap-1.5 text-white/50 text-xs mb-1.5"><Shield size={13} /> Tipo</label>
                  <select value={form.tipo ?? 'CLIENTE'} onChange={e => set('tipo', e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500/50">
                    <option value="CLIENTE">Cliente</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
                <Field icon={<Car size={13} />} label="Placa" value={form.placa ?? ''}
                  onChange={v => set('placa', v.toUpperCase())} placeholder="ABC1234" maxLength={8} />
              </div>
              <Field icon={<User size={13} />} label="Administrador responsável" value={form.administrador ?? ''}
                onChange={v => set('administrador', v)} placeholder="Nome do administrador" />
              {error && <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">{error}</div>}
            </div>
            <div className="flex justify-end gap-3 px-5 py-4 border-t border-white/5 shrink-0">
              <button onClick={() => setModal(false)} className="px-4 py-2.5 text-sm text-white/40 hover:text-white">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all">
                <Save size={14} />{saving ? 'Salvando...' : editing ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ficha do Cliente */}
      {fichaId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onMouseDown={e => { if (e.target === e.currentTarget) { setFichaId(null); setFichaData(null); } }}>
          <div className="bg-[#0f1629] border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl shadow-2xl max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
              <div>
                <h2 className="text-white font-semibold text-base">Ficha do Cliente</h2>
                <p className="text-white/40 text-xs mt-0.5">{fichaAcesso?.nome_cadastrado} · {fichaId}</p>
              </div>
              <button onClick={() => { setFichaId(null); setFichaData(null); }} className="text-white/40 hover:text-white p-1"><X size={18} /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              {fichaLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !fichaData ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                    <User size={20} className="text-amber-400" />
                  </div>
                  <p className="text-white/40 text-sm">Cliente não encontrado na tabela de clientes</p>
                  <p className="text-white/20 text-xs mt-1">ID: {fichaId}</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Dados Pessoais */}
                  <Section title="Dados Pessoais" icon={<User size={13} />}>
                    <InfoGrid>
                      <Info label="Nome" value={fichaData.nome} />
                      <Info label="CPF" value={fichaData.cpf} />
                      <Info label="Telefone" value={fichaData.telefone} icon={<Phone size={10} />} />
                      <Info label="WhatsApp" value={fichaData.whatsapp} icon={<MessageCircle size={10} />} />
                      <Info label="Email" value={fichaData.email} icon={<Mail size={10} />} full />
                      <Info label="Endereço" value={fichaData.endereco} icon={<MapPin size={10} />} full />
                      <Info label="Nascimento" value={fmtDate(fichaData.data_nascimento)} icon={<CalendarDays size={10} />} />
                      <Info label="Perfil" value={fichaData.perfil} icon={<Shield size={10} />} />
                    </InfoGrid>
                  </Section>

                  {/* Contrato */}
                  <Section title="Contrato" icon={<FileText size={13} />}>
                    <InfoGrid>
                      <Info label="Início Contrato" value={fmtDate(fichaData.data_inicio_contrato)} />
                      <Info label="Fim Contrato" value={fmtDate(fichaData.data_fim_contrato)} />
                      <Info label="Início Locação" value={fmtDate(fichaData.data_inicio_locacao)} />
                      <Info label="Veículo" value={fichaData.id_veiculos} icon={<Car size={10} />} />
                      <Info label="Administrador" value={fichaData.administrador_mrx} />
                    </InfoGrid>
                  </Section>

                  {/* Pagamento */}
                  <Section title="Pagamento" icon={<DollarSign size={13} />}>
                    <InfoGrid>
                      <Info label="Forma" value={fichaData.forma_pagamento} icon={<CreditCard size={10} />} />
                      <Info label="Regime" value={fichaData.regime_de_pagamento} />
                      <Info label="Valor" value={fmtMoney(fichaData.valor_negociado)} highlight />
                      <Info label="Dia Vencimento" value={fichaData.dia_de_vencimento?.toString() ?? fichaData.dia_da_semana_vencimento} />
                      <Info label="Início Cobrança" value={fmtDate(fichaData.data_inicio_cobranca)} />
                      <Info label="Próximo Pgto" value={fmtDate(fichaData.data_proximo_pagamento)} />
                      <Info label="Ciclo" value={fichaData.checa_ciclo_pagamento} icon={<Clock size={10} />} />
                      <Info label="Status" value={fichaData.em_dia_pagamento != null ? (fichaData.em_dia_pagamento > 0 ? 'Em dia' : 'Atrasado') : '—'}
                        highlight color={fichaData.em_dia_pagamento != null ? (fichaData.em_dia_pagamento > 0 ? 'text-emerald-400' : 'text-red-400') : undefined} />
                    </InfoGrid>
                  </Section>

                  {/* Contato de Emergência */}
                  {fichaData.nome_segundo_contato && (
                    <Section title="Contato de Emergência" icon={<Phone size={13} />}>
                      <InfoGrid>
                        <Info label="Nome" value={fichaData.nome_segundo_contato} />
                        <Info label="Telefone" value={fichaData.segundo_contato_telefonico} />
                        <Info label="Parentesco" value={fichaData.grau_de_parentesco} />
                      </InfoGrid>
                    </Section>
                  )}

                  {/* Acesso Telegram */}
                  {fichaAcesso && (
                    <Section title="Acesso Telegram" icon={<MessageCircle size={13} />}>
                      <InfoGrid>
                        <Info label="ID Telegram" value={fichaAcesso.id} />
                        <Info label="Nome Telegram" value={fichaAcesso.nome_telegram} />
                        <Info label="Placa" value={fichaAcesso.placa} icon={<Car size={10} />} />
                        <Info label="Cadastro" value={fmtDate(fichaAcesso.data_criacao)} />
                      </InfoGrid>
                    </Section>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal Último Aluguel */}
      {aluguelId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onMouseDown={e => { if (e.target === e.currentTarget) { setAluguelId(null); setAluguelData(null); } }}>
          <div className="bg-[#0f1629] border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
              <div>
                <h2 className="text-white font-semibold text-base">Último Aluguel</h2>
                <p className="text-white/40 text-xs mt-0.5">{aluguelAcesso?.nome_cadastrado}</p>
              </div>
              <button onClick={() => { setAluguelId(null); setAluguelData(null); }} className="text-white/40 hover:text-white p-1"><X size={18} /></button>
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              {aluguelLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !aluguelData ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                    <Car size={20} className="text-amber-400" />
                  </div>
                  <p className="text-white/40 text-sm">Nenhum aluguel encontrado</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Status Badge */}
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                      aluguelData.status === 'ALUGADO' ? 'bg-emerald-500/15 text-emerald-400' :
                      aluguelData.status === 'DISPONIVEL' ? 'bg-blue-500/15 text-blue-400' :
                      'bg-white/5 text-white/50'
                    }`}>
                      {aluguelData.status ?? '—'}
                    </span>
                    {aluguelData.valor && (
                      <span className="text-emerald-400 font-bold text-lg">{fmtMoney(parseFloat(aluguelData.valor))}</span>
                    )}
                  </div>

                  <Section title="Veículo" icon={<Car size={13} />}>
                    <InfoGrid>
                      <Info label="Placa" value={aluguelData.id_veiculo} highlight />
                      <Info label="Veículo" value={aluguelData.carro_escolhido?.split('|').slice(1).join(' ') ?? '—'} />
                      <Info label="Tabela de Preço" value={aluguelData.tabela_de_preco ? fmtMoney(parseFloat(aluguelData.tabela_de_preco)) : null} />
                    </InfoGrid>
                  </Section>

                  <Section title="Período" icon={<CalendarDays size={13} />}>
                    <InfoGrid>
                      <Info label="Início" value={fmtDate(aluguelData.data_inicio)} />
                      <Info label="Término" value={fmtDate(aluguelData.data_termino)} />
                      <Info label="Entrega Real" value={fmtDate(aluguelData.data_real_entrega)} />
                    </InfoGrid>
                  </Section>

                  <Section title="Cliente" icon={<User size={13} />}>
                    <InfoGrid>
                      <Info label="Nome" value={aluguelData.cliente_escolhido} />
                      <Info label="Email" value={aluguelData.email_cliente} icon={<Mail size={10} />} full />
                      <Info label="Perfil" value={aluguelData.perfil} />
                      <Info label="Administrador" value={aluguelData.adm} />
                    </InfoGrid>
                  </Section>

                  <Section title="Registro" icon={<FileText size={13} />}>
                    <InfoGrid>
                      <Info label="ID Aluguel" value={aluguelData.id_aluguel} />
                      <Info label="Log" value={aluguelData.log} full />
                    </InfoGrid>
                  </Section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Componentes auxiliares ─── */

function Field({ icon, label, value, onChange, placeholder, disabled, maxLength }: {
  icon: React.ReactNode; label: string; value: string;
  onChange: (v: string) => void; placeholder?: string; disabled?: boolean; maxLength?: number;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-white/50 text-xs mb-1.5">{icon} {label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled} maxLength={maxLength}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all placeholder:text-white/20" />
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
        <span className="text-blue-400">{icon}</span>
        <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3">{children}</div>;
}

function Info({ label, value, icon, full, highlight, color }: {
  label: string; value: string | null | undefined; icon?: React.ReactNode; full?: boolean; highlight?: boolean; color?: string;
}) {
  return (
    <div className={full ? 'col-span-2 sm:col-span-3' : ''}>
      <p className="text-white/25 text-[10px] uppercase tracking-wide mb-0.5 flex items-center gap-1">
        {icon}{label}
      </p>
      <p className={`text-sm ${highlight ? (color ?? 'text-white font-semibold') : 'text-white/70'} ${!value || value === '—' ? 'text-white/20' : ''}`}>
        {value || '—'}
      </p>
    </div>
  );
}

function CardAcesso({ r, onEdit, onDelete, onClickFicha, onClickAluguel, fmtDate }: {
  r: Acesso; onEdit: (r: Acesso) => void; onDelete: (id: string) => void;
  onClickFicha: (r: Acesso) => void; onClickAluguel: (r: Acesso) => void; fmtDate: (d: string | null) => string;
}) {
  const isAdmin = r.tipo === 'Administrador';
  return (
    <div className="bg-[#0f1629] border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all group">
      <div className={`h-0.5 ${isAdmin ? 'bg-blue-500/50' : 'bg-emerald-500/30'}`} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isAdmin ? 'bg-blue-600/20' : 'bg-emerald-600/20'}`}>
            {isAdmin ? <Shield size={16} className="text-blue-400" /> : <span className="text-emerald-400 font-bold text-sm">{r.nome_cadastrado.charAt(0)}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{r.nome_cadastrado}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isAdmin ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                {r.tipo ?? 'CLIENTE'}
              </span>
              {r.placa && <span className="font-mono text-[10px] font-bold text-blue-400/70 bg-blue-500/10 px-1.5 py-0.5 rounded">{r.placa}</span>}
            </div>
          </div>
          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(r)} className="p-1.5 rounded-lg text-white/30 hover:text-blue-400 hover:bg-blue-400/10 transition-all" title="Editar acesso">
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(r.id_cliente)} className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all" title="Excluir">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <div>
            <span className="text-white/25">Telegram</span>
            <p className="text-white/60 truncate">{r.nome_telegram ?? '—'} <span className="text-white/20">({r.id})</span></p>
          </div>
          <div>
            <span className="text-white/25">ID Cliente</span>
            <p className="text-white/60 font-mono text-[11px]">{r.id_cliente}</p>
          </div>
          {r.administrador && (
            <div className="col-span-2">
              <span className="text-white/25">Admin</span>
              <p className="text-white/60">{r.administrador}</p>
            </div>
          )}
        </div>

        {/* Botões Ficha + Aluguel */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
          <button onClick={() => onClickFicha(r)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-600/20 transition-all">
            <User size={12} />
            Ficha Cadastral
          </button>
          <button onClick={() => onClickAluguel(r)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-600/20 transition-all">
            <KeyRound size={12} />
            Último Aluguel
          </button>
        </div>
      </div>
    </div>
  );
}
