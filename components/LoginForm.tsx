'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Scene } from './DynamicBackground';

interface Props {
  scene: Scene;
}

export default function LoginForm({ scene }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? 'Erro ao entrar');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setLoading(false);
      setError('Não foi possível conectar ao servidor. Tente novamente.');
    }
  }

  async function handleForgot(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    setForgotSent(true);
  }

  const textMuted = scene.isDark ? 'rgba(255,255,255,0.55)' : 'rgba(15,23,42,0.55)';
  const borderColor = scene.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.12)';

  return (
    <div
      className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: scene.cardBg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${borderColor}`,
        transition: 'background 1.5s ease, border-color 1.5s ease',
      }}
    >
      {/* Topo colorido */}
      <div
        className="h-1 w-full"
        style={{ background: scene.buttonBg, transition: 'background 1.5s ease' }}
      />

      <div className="p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white rounded-xl px-5 py-3 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpeg"
              alt="MRX Locações"
              style={{ height: 48, width: 'auto', display: 'block' }}
            />
          </div>
        </div>

        {forgotMode ? (
          forgotSent ? (
            <div className="text-center py-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: scene.buttonBg + '22' }}
              >
                <svg className="w-7 h-7" style={{ color: scene.buttonBg }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-lg mb-1" style={{ color: scene.textColor }}>Email enviado!</p>
              <p className="text-sm mb-6" style={{ color: textMuted }}>
                Se o email existir, você receberá as instruções.
              </p>
              <button
                onClick={() => { setForgotMode(false); setForgotSent(false); }}
                className="text-sm font-medium underline"
                style={{ color: scene.buttonBg }}
              >
                Voltar ao login
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="mb-2">
                <h2 className="text-xl font-bold" style={{ color: scene.textColor }}>Recuperar senha</h2>
                <p className="text-sm mt-1" style={{ color: textMuted }}>Digite seu email para receber o link.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: textMuted }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm transition-all"
                  style={{ background: scene.inputBg, color: scene.textColor, border: `1px solid ${borderColor}` }}
                  placeholder="seu@email.com"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-60"
                style={{ background: scene.buttonBg, color: scene.buttonText, transition: 'background 1.5s ease' }}
              >
                {loading ? 'Enviando...' : 'Enviar link'}
              </button>

              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="w-full text-sm text-center"
                style={{ color: textMuted }}
              >
                ← Voltar
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: scene.textColor }}>
                Bem-vindo de volta
              </h2>
              <p className="text-sm mt-1" style={{ color: textMuted }}>
                Entre com suas credenciais para continuar
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: textMuted }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm transition-all"
                  style={{ background: scene.inputBg, color: scene.textColor, border: `1px solid ${borderColor}` }}
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: textMuted }}>
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 rounded-xl outline-none text-sm pr-11 transition-all"
                    style={{ background: scene.inputBg, color: scene.textColor, border: `1px solid ${borderColor}` }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                    style={{ color: textMuted }}
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 shadow-lg"
              style={{
                background: scene.buttonBg,
                color: scene.buttonText,
                transition: 'background 1.5s ease',
                boxShadow: `0 8px 24px ${scene.buttonBg}55`,
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando...
                </span>
              ) : 'Entrar'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setForgotMode(true)}
                className="text-xs font-medium hover:underline"
                style={{ color: textMuted }}
              >
                Esqueci minha senha
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
