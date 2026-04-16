'use client';

import { useState, useEffect } from 'react';
import { Transacao } from '@/types';

interface Anexo {
  id_anexo: string;
  id_cliente: string;
  data_hora: string;
  valor: string;
}

interface Props {
  transacao: Transacao;
  onClose: () => void;
}

function formatValorKey(valor: string): string {
  return parseFloat(valor).toFixed(2).replace('.', '_');
}

function formatDateKey(d: string | null): string {
  if (!d) return '';
  const dt = new Date(d);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}${day}${m}`;
}

function isImage(fileId: string): boolean {
  // Telegram photo file_ids start with specific prefixes
  return fileId.startsWith('AgAC') || fileId.startsWith('BAAC') || fileId.startsWith('BQAc');
}

export default function AnexosModal({ transacao, onClose }: Props) {
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Anexo | null>(null);
  const [fileError, setFileError] = useState(false);

  const dateKey = formatDateKey(transacao.data_processamento);
  const valorKey = formatValorKey(transacao.valor);

  const compositeKey = transacao.id_cliente && transacao.chave_matching
    ? `${transacao.id_cliente}_${transacao.chave_matching}_${dateKey}_${valorKey}`
    : null;

  const sufixoKey = dateKey ? `_${dateKey}_${valorKey}` : null;

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (compositeKey) {
        params.set('chave', compositeKey);
      } else if (sufixoKey) {
        params.set('sufixo', sufixoKey);
      } else {
        setAnexos([]);
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/anexos?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAnexos(data.rows);
        if (data.rows.length === 1) setSelected(data.rows[0]);
      }
      setLoading(false);
    }
    load();
  }, [compositeKey, sufixoKey]);

  const noToken = typeof window !== 'undefined'; // verificado no servidor
  const fileUrl = (id: string) => `/api/file?file_id=${encodeURIComponent(id)}`;
  const valorFmt = parseFloat(transacao.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0f1117] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1E7BC4]/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-[#1E7BC4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-none">{transacao.envolvido}</p>
              <p className="text-white/40 text-xs mt-0.5">{valorFmt} · {new Date(transacao.data).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center flex-1 py-16">
              <div className="w-7 h-7 border-2 border-[#1E7BC4] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : anexos.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 py-16 text-white/30">
              <svg className="w-10 h-10 mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Nenhum comprovante encontrado</p>
              <p className="text-xs mt-1 text-white/20">
                {!process.env.NEXT_PUBLIC_HAS_TELEGRAM ? 'Configure TELEGRAM_BOT_TOKEN no .env.local' : ''}
              </p>
            </div>
          ) : (
            <>
              {/* Lista de anexos (quando há mais de 1) */}
              {anexos.length > 1 && (
                <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto shrink-0">
                  {anexos.map((a, i) => (
                    <button
                      key={i}
                      onClick={() => { setSelected(a); setFileError(false); }}
                      className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selected?.id_anexo === a.id_anexo ? 'bg-[#1E7BC4] text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}
                    >
                      Comprovante {i + 1} · {a.data_hora.split(',')[0]}
                    </button>
                  ))}
                </div>
              )}

              {/* Visualizador */}
              {selected && (
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                  {fileError ? (
                    <div className="flex flex-col items-center justify-center flex-1 py-10 px-5 text-center">
                      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <p className="text-white/60 text-sm">Não foi possível carregar o arquivo</p>
                      <p className="text-white/30 text-xs mt-1">Verifique se TELEGRAM_BOT_TOKEN está configurado no .env.local</p>
                      <a
                        href={`https://drive.google.com/drive/search?q=${encodeURIComponent(selected.id_anexo)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 px-4 py-2 rounded-xl bg-white/5 text-white/60 text-xs hover:bg-white/10 hover:text-white transition-all"
                      >
                        Buscar no Google Drive
                      </a>
                    </div>
                  ) : isImage(selected.id_anexo) ? (
                    /* Imagem */
                    <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={fileUrl(selected.id_anexo)}
                        alt="Comprovante"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onError={() => setFileError(true)}
                      />
                    </div>
                  ) : (
                    /* PDF ou outro */
                    <iframe
                      src={fileUrl(selected.id_anexo)}
                      className="flex-1 w-full min-h-[420px]"
                      title="Comprovante de Pagamento"
                      onError={() => setFileError(true)}
                    />
                  )}

                  {/* Rodapé com info + download */}
                  <div className="px-4 py-2.5 border-t border-white/5 flex items-center justify-between shrink-0">
                    <p className="text-white/30 text-xs">{selected.data_hora} · {selected.valor}</p>
                    <a
                      href={fileUrl(selected.id_anexo)}
                      download
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E7BC4]/10 text-[#1E7BC4] text-xs font-medium hover:bg-[#1E7BC4]/20 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Baixar
                    </a>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
