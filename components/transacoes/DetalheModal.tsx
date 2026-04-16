'use client';

import { useState, useEffect } from 'react';
import { X, Save, Check, Clock, Car, FileText, Paperclip, Upload, Trash2, Download, ZoomIn, History } from 'lucide-react';
import { Transacao, Anexo, brl } from './types';

interface Props {
  transacaoId: string | null;
  onClose: () => void;
  onSaved: (t: Transacao) => void;
}

export default function DetalheModal({ transacaoId, onClose, onSaved }: Props) {
  const [data, setData]     = useState<Transacao | null>(null);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [form, setForm]     = useState({ descricao_extra: '', placa: '', aprovado: false, comprovante: null as string | null });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);
  const [placasHist, setPlacasHist] = useState<string[]>([]);
  const [loadingPlacas, setLoadingPlacas] = useState(false);
  const [showPlacas, setShowPlacas] = useState(false);

  useEffect(() => {
    if (!transacaoId) { setData(null); setAnexos([]); return; }
    setLoading(true);
    fetch(`/api/transacoes/${encodeURIComponent(transacaoId)}`)
      .then(r => r.json())
      .then(res => {
        if (res.data) {
          setData(res.data);
          setForm({
            descricao_extra: res.data.descricao_extra ?? '',
            placa:           res.data.placa           ?? '',
            aprovado:        res.data.aprovado         ?? false,
            comprovante:     res.data.comprovante      ?? null,
          });
          setAnexos(res.anexos ?? []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [transacaoId]);

  const buscarPlacas = async () => {
    if (!transacaoId) return;
    if (placasHist.length > 0) { setShowPlacas(p => !p); return; }
    setLoadingPlacas(true);
    const res = await fetch(`/api/transacoes/${encodeURIComponent(transacaoId)}/placas`);
    const json = await res.json();
    setPlacasHist(json.data ?? []);
    setShowPlacas(true);
    setLoadingPlacas(false);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(f => ({ ...f, comprovante: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!transacaoId) return;
    setSaving(true);
    try {
      const res  = await fetch(`/api/transacoes/${encodeURIComponent(transacaoId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.data) onSaved(json.data);
    } finally {
      setSaving(false);
    }
  };

  if (!transacaoId) return null;

  return (
    <>
    {/* lightbox zoom */}
    {zoom && (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
        onClick={() => setZoom(null)}
      >
        <img src={zoom} alt="zoom" className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl" />
        <button onClick={() => setZoom(null)} className="absolute top-4 right-4 text-white/60 hover:text-white">
          <X size={24} />
        </button>
      </div>
    )}
    /* backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#0f1629] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">

        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-semibold text-base">Detalhes da Transação</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data ? (
          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

            {/* resumo */}
            <div className="grid grid-cols-2 gap-2 text-sm" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-white/40 text-xs mb-1">Data</div>
                <div className="text-white">{new Date(data.data).toLocaleDateString('pt-BR')}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-white/40 text-xs mb-1">Valor</div>
                <div className={`font-semibold ${data.tipo_de_movimento === 'Receita' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {data.tipo_de_movimento === 'Despesa' ? '− ' : '+ '}{brl(Number(data.valor))}
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 col-span-2">
                <div className="text-white/40 text-xs mb-1">Envolvido</div>
                <div className="text-white/80 text-xs break-all">{data.envolvido}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-3 col-span-2">
                <div className="text-white/40 text-xs mb-1">Descrição</div>
                <div className="text-white/70 text-xs">{data.descricao}</div>
              </div>
              {form.placa && (
                <div className="bg-white/5 rounded-lg p-3 col-span-2">
                  <div className="text-white/40 text-xs mb-1">Placa</div>
                  <div className="text-white font-mono tracking-widest text-sm">{form.placa}</div>
                </div>
              )}
            </div>

            {/* campos editáveis */}
            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-1.5 text-white/50 text-xs mb-1.5">
                  <FileText size={11} /> Observação
                </label>
                <textarea
                  rows={2}
                  value={form.descricao_extra}
                  onChange={e => setForm(f => ({ ...f, descricao_extra: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-blue-500/50"
                  placeholder="Adicionar observação…"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-white/50 text-xs">
                    <Car size={11} /> Placa do Veículo
                  </label>
                  <button
                    onClick={buscarPlacas}
                    className="flex items-center gap-1 text-white/30 hover:text-blue-400 text-xs transition-colors"
                    title="Ver histórico de placas"
                  >
                    <History size={11} />
                    {loadingPlacas ? 'Buscando…' : 'Histórico'}
                  </button>
                </div>
                <input
                  type="text"
                  value={form.placa}
                  onChange={e => setForm(f => ({ ...f, placa: e.target.value.toUpperCase() }))}
                  maxLength={8}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm uppercase tracking-widest focus:outline-none focus:border-blue-500/50"
                  placeholder="ABC-1D23"
                />
                {showPlacas && (
                  <div className="mt-1 bg-[#0a0f1e] border border-white/10 rounded-lg overflow-hidden shadow-xl">
                    {placasHist.length === 0 ? (
                      <div className="px-3 py-3 text-white/30 text-xs">Nenhuma placa encontrada no histórico.</div>
                    ) : (
                      <>
                        <div className="px-3 py-1.5 border-b border-white/5 text-white/30 text-xs">{placasHist.length} placa{placasHist.length > 1 ? 's' : ''} no histórico</div>
                        <div className="max-h-40 overflow-y-auto">
                          {placasHist.map(p => (
                            <button
                              key={p}
                              onClick={() => { setForm(f => ({ ...f, placa: p })); setShowPlacas(false); }}
                              className={`w-full text-left px-3 py-2 text-xs font-mono tracking-widest border-b border-white/5 last:border-0 transition-colors ${
                                form.placa === p
                                  ? 'bg-blue-600/20 text-blue-300'
                                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              {p}
                              {form.placa === p && <span className="ml-2 text-blue-400/60">✓</span>}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForm(f => ({ ...f, aprovado: !f.aprovado }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                    form.aprovado
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                  }`}
                >
                  {form.aprovado ? <Check size={13} /> : <Clock size={13} />}
                  {form.aprovado ? 'Aprovado' : 'Pendente'}
                </button>
                {data.aprovado_em && (
                  <span className="text-white/30 text-xs">
                    em {new Date(data.aprovado_em).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>

            {/* comprovante upload */}
            <div>
              <div className="flex items-center gap-1.5 text-white/50 text-xs mb-2">
                <Paperclip size={11} /> Comprovante
              </div>

              {form.comprovante ? (
                <div className="relative group">
                  {form.comprovante.startsWith('data:image') ? (
                    <img
                      src={form.comprovante}
                      alt="comprovante"
                      onClick={() => setZoom(form.comprovante)}
                      className="w-full rounded-lg border border-white/10 max-h-64 object-contain bg-black/30 cursor-zoom-in"
                    />
                  ) : (
                    <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-xs text-white/60 flex items-center gap-2">
                      <Paperclip size={12} /> Arquivo anexado (PDF)
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={form.comprovante}
                      download="comprovante"
                      className="bg-blue-500/80 hover:bg-blue-500 text-white rounded-full p-1"
                      title="Baixar"
                    >
                      <Download size={11} />
                    </a>
                    <button
                      onClick={() => setForm(f => ({ ...f, comprovante: null }))}
                      className="bg-red-500/80 hover:bg-red-500 text-white rounded-full p-1"
                      title="Remover"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 w-full border border-dashed border-white/20 rounded-lg py-6 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-white/30 hover:text-white/60 text-xs">
                  <Upload size={14} />
                  Clique para enviar imagem ou PDF
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
                </label>
              )}
            </div>

            {/* anexos do telegram */}
            {anexos.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-white/50 text-xs mb-2">
                  <Paperclip size={11} />
                  Registros Telegram <span className="bg-blue-600/30 text-blue-400 px-1.5 py-0.5 rounded-full">{anexos.length}</span>
                </div>
                <div className="space-y-2">
                  {anexos.map(a => {
                    const src = `/api/telegram/file/${encodeURIComponent(a.id_anexo)}`;
                    return (
                      <div key={a.id_anexo} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden text-xs">
                        <div className="relative group">
                          <img
                            src={src}
                            alt="comprovante Telegram"
                            onClick={() => setZoom(src)}
                            className="w-full max-h-64 object-contain bg-black/30 cursor-zoom-in"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setZoom(src)}
                              className="bg-black/60 hover:bg-black/80 text-white rounded-full p-1"
                              title="Zoom"
                            >
                              <ZoomIn size={11} />
                            </button>
                            <a
                              href={src}
                              download={`comprovante_${a.data_hora}`}
                              className="bg-blue-500/80 hover:bg-blue-500 text-white rounded-full p-1"
                              title="Baixar"
                            >
                              <Download size={11} />
                            </a>
                          </div>
                        </div>
                        <div className="px-4 py-2">
                          <div className="flex justify-between text-white/30">
                            <span>{a.data_hora}</span>
                            <span className="text-white/60 font-semibold">R$ {a.valor}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-10 text-center text-white/30 text-sm">Transação não encontrada.</div>
        )}

        {/* footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/10">
          <button onClick={onClose} className="px-4 py-2 text-sm text-white/40 hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving || !data}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Save size={13} />
            {saving ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
