'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, X, Save, Mail, Shield, Eye, EyeOff, UserCheck, UserX, Pencil, Trash2, Key } from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
  criado_em: string;
}

const PERFIS = ['superuser', 'admin', 'operador'] as const;
const PERFIL_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  superuser:  { label: 'Superuser', color: 'text-purple-400', bg: 'bg-purple-500/15' },
  admin:      { label: 'Admin',     color: 'text-blue-400',   bg: 'bg-blue-500/15' },
  operador:   { label: 'Operador',  color: 'text-white/60',   bg: 'bg-white/5' },
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', perfil: 'operador', ativo: true });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/usuarios');
    if (res.ok) setUsuarios(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = query
    ? usuarios.filter(u => u.nome.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()))
    : usuarios;

  const openNew = () => {
    setEditing(null);
    setForm({ nome: '', email: '', senha: '', perfil: 'operador', ativo: true });
    setError('');
    setShowPass(false);
    setModal(true);
  };

  const openEdit = (u: Usuario) => {
    setEditing(u);
    setForm({ nome: u.nome, email: u.email, senha: '', perfil: u.perfil, ativo: u.ativo });
    setError('');
    setShowPass(false);
    setModal(true);
  };

  const handleSave = async () => {
    setError('');
    if (!form.nome.trim() || !form.email.trim()) {
      setError('Nome e email são obrigatórios');
      return;
    }
    if (!editing && !form.senha.trim()) {
      setError('Senha é obrigatória para novos usuários');
      return;
    }
    setSaving(true);

    const url = editing ? `/api/usuarios/${editing.id}` : '/api/usuarios';
    const method = editing ? 'PUT' : 'POST';
    const body: Record<string, unknown> = {
      nome: form.nome,
      email: form.email,
      perfil: form.perfil,
      ativo: form.ativo,
    };
    if (form.senha.trim()) body.senha = form.senha;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) { setError(json.error ?? 'Erro ao salvar'); return; }
    setModal(false);
    fetchUsers();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
    setConfirmDelete(null);
    fetchUsers();
  };

  const toggleAtivo = async (u: Usuario) => {
    await fetch(`/api/usuarios/${u.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !u.ativo }),
    });
    fetchUsers();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-white text-2xl font-bold">Usuários do Sistema</h1>
          <p className="text-white/30 text-xs mt-0.5">{usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
          <Plus size={16} />
          <span className="hidden sm:inline">Novo Usuário</span>
        </button>
      </div>

      {/* Busca */}
      {usuarios.length > 3 && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="w-full bg-[#0f1629] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-all" />
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-white/25 text-sm">Nenhum usuário encontrado</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(u => {
            const p = PERFIL_LABEL[u.perfil] ?? PERFIL_LABEL.operador;
            return (
              <div key={u.id} className={`bg-[#0f1629] border rounded-xl overflow-hidden transition-all group ${u.ativo ? 'border-white/10 hover:border-white/20' : 'border-white/5 opacity-60'}`}>
                <div className="p-4 flex items-center gap-4">
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${u.ativo ? 'bg-blue-600/20' : 'bg-white/5'}`}>
                    <span className={`font-bold text-base ${u.ativo ? 'text-blue-400' : 'text-white/30'}`}>
                      {u.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-medium text-sm">{u.nome}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.bg} ${p.color}`}>
                        {p.label}
                      </span>
                      {!u.ativo && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">Inativo</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                      <span className="flex items-center gap-1 truncate"><Mail size={10} />{u.email}</span>
                      <span className="text-white/20 hidden sm:inline">·</span>
                      <span className="hidden sm:inline">Desde {new Date(u.criado_em).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  {/* Ações — superuser não pode ser editado/excluído */}
                  {u.perfil !== 'superuser' && (
                  <div className="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => toggleAtivo(u)}
                      className={`p-2 rounded-lg transition-all ${u.ativo ? 'text-white/30 hover:text-amber-400 hover:bg-amber-400/10' : 'text-white/30 hover:text-emerald-400 hover:bg-emerald-400/10'}`}
                      title={u.ativo ? 'Desativar' : 'Ativar'}>
                      {u.ativo ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                    <button onClick={() => openEdit(u)}
                      className="p-2 rounded-lg text-white/30 hover:text-blue-400 hover:bg-blue-400/10 transition-all" title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setConfirmDelete(u.id)}
                      className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all" title="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmar exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="bg-[#0f1629] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
            <p className="text-white font-semibold text-sm mb-2">Excluir usuário?</p>
            <p className="text-white/40 text-xs mb-5">O usuário perderá acesso ao sistema permanentemente.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:bg-white/5 transition-all">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-all">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onMouseDown={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="bg-[#0f1629] border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 shrink-0">
              <h2 className="text-white font-semibold text-base">{editing ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button onClick={() => setModal(false)} className="text-white/40 hover:text-white p-1 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Nome */}
              <div>
                <label className="text-white/50 text-xs mb-1.5 block">Nome *</label>
                <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Nome completo"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500/50 placeholder:text-white/20 transition-all" />
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-1.5 text-white/50 text-xs mb-1.5"><Mail size={12} /> Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500/50 placeholder:text-white/20 transition-all" />
              </div>

              {/* Senha */}
              <div>
                <label className="flex items-center gap-1.5 text-white/50 text-xs mb-1.5">
                  <Key size={12} /> Senha {editing ? '(deixe vazio para manter)' : '*'}
                </label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.senha}
                    onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                    placeholder={editing ? '••••••••' : 'Mínimo 6 caracteres'}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 pr-10 text-white text-sm outline-none focus:border-blue-500/50 placeholder:text-white/20 transition-all" />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Perfil */}
              <div>
                <label className="flex items-center gap-1.5 text-white/50 text-xs mb-1.5"><Shield size={12} /> Perfil</label>
                <div className="flex gap-2">
                  {PERFIS.map(p => {
                    const cfg = PERFIL_LABEL[p];
                    const sel = form.perfil === p;
                    return (
                      <button key={p} onClick={() => setForm(f => ({ ...f, perfil: p }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all ${sel ? `${cfg.bg} ${cfg.color} border-current` : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'}`}>
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ativo */}
              {editing && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-white/50 text-xs">Usuário ativo</span>
                  <button onClick={() => setForm(f => ({ ...f, ativo: !f.ativo }))}
                    className={`w-10 h-5 rounded-full transition-all relative ${form.ativo ? 'bg-emerald-500' : 'bg-white/10'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${form.ativo ? 'left-5' : 'left-0.5'}`} />
                  </button>
                </div>
              )}

              {error && (
                <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">{error}</div>
              )}
            </div>

            <div className="flex justify-end gap-3 px-5 py-4 border-t border-white/5 shrink-0">
              <button onClick={() => setModal(false)}
                className="px-4 py-2.5 text-sm text-white/40 hover:text-white transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all">
                <Save size={14} />
                {saving ? 'Salvando...' : editing ? 'Atualizar' : 'Criar Usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
