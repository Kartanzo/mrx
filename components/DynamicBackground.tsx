'use client';

import { useEffect, useState } from 'react';

export interface Scene {
  id: string;
  label: string;
  bgClass: string;
  accentColor: string;
  textColor: string;
  cardBg: string;
  inputBg: string;
  buttonBg: string;
  buttonText: string;
  isDark: boolean;
}

// Posições fixas para as estrelas — evita hydration mismatch com Math.random()
const STARS = Array.from({ length: 60 }, (_, i) => ({
  w: ((i * 137 + 31) % 20) / 10 + 1,
  h: ((i * 97 + 17) % 16) / 10 + 1,
  left: (i * 163 + 11) % 100,
  top: (i * 79 + 23) % 60,
  delay: ((i * 53 + 7) % 30) / 10,
  opacity: ((i * 41 + 13) % 80) / 100 + 0.2,
}));

export const SCENES: Scene[] = [
  {
    id: 'night_city',
    label: 'Cidade à Noite',
    bgClass: 'bg-night-city',
    accentColor: '#1E7BC4',
    textColor: '#ffffff',
    cardBg: 'rgba(10, 15, 30, 0.75)',
    inputBg: 'rgba(255,255,255,0.08)',
    buttonBg: '#1E7BC4',
    buttonText: '#ffffff',
    isDark: true,
  },
  {
    id: 'dawn_highway',
    label: 'Amanhecer na Estrada',
    bgClass: 'bg-dawn-highway',
    accentColor: '#f97316',
    textColor: '#ffffff',
    cardBg: 'rgba(30, 10, 5, 0.72)',
    inputBg: 'rgba(255,255,255,0.1)',
    buttonBg: '#f97316',
    buttonText: '#ffffff',
    isDark: true,
  },
  {
    id: 'midday',
    label: 'Estrada Ensolarada',
    bgClass: 'bg-midday',
    accentColor: '#0369a1',
    textColor: '#0f172a',
    cardBg: 'rgba(255,255,255,0.78)',
    inputBg: 'rgba(15,23,42,0.06)',
    buttonBg: '#0369a1',
    buttonText: '#ffffff',
    isDark: false,
  },
  {
    id: 'sunset',
    label: 'Pôr do Sol',
    bgClass: 'bg-sunset',
    accentColor: '#dc2626',
    textColor: '#ffffff',
    cardBg: 'rgba(25, 5, 5, 0.72)',
    inputBg: 'rgba(255,255,255,0.09)',
    buttonBg: '#dc2626',
    buttonText: '#ffffff',
    isDark: true,
  },
  {
    id: 'mountain',
    label: 'Serra',
    bgClass: 'bg-mountain',
    accentColor: '#0d9488',
    textColor: '#ffffff',
    cardBg: 'rgba(5, 20, 18, 0.74)',
    inputBg: 'rgba(255,255,255,0.09)',
    buttonBg: '#0d9488',
    buttonText: '#ffffff',
    isDark: true,
  },
];

// Retorna o índice da cena com base no horário de Brasília (UTC-3)
function getSceneIndexByBrazilTime(): number {
  const now = new Date();
  const brazil = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const hour = brazil.getHours();

  if (hour >= 5 && hour < 8)  return 1; // dawn_highway  — amanhecer
  if (hour >= 8 && hour < 17) return 2; // midday        — dia
  if (hour >= 17 && hour < 21) return 3; // sunset       — pôr do sol / entardecer
  return 0;                              // night_city    — noite (21h-04h)
}

interface Props {
  onSceneChange: (scene: Scene) => void;
}

export default function DynamicBackground({ onSceneChange }: Props) {
  const [currentIndex, setCurrentIndex] = useState(() => getSceneIndexByBrazilTime());
  const [nextIndex, setNextIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  // Atualiza o tema quando o horário muda (verifica a cada minuto)
  useEffect(() => {
    const applyTime = () => {
      const idx = getSceneIndexByBrazilTime();
      if (idx !== currentIndex) {
        setNextIndex(idx);
        setTransitioning(true);
        setTimeout(() => {
          setCurrentIndex(idx);
          setTransitioning(false);
          onSceneChange(SCENES[idx]);
        }, 1500);
      } else {
        onSceneChange(SCENES[idx]);
      }
    };

    applyTime();
    const interval = setInterval(applyTime, 60_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Cena atual */}
      <div
        className={`absolute inset-0 transition-opacity duration-[1500ms] ${transitioning ? 'opacity-0' : 'opacity-100'}`}
        style={{ background: getSceneGradient(SCENES[currentIndex].id) }}
      >
        <SceneElements id={SCENES[currentIndex].id} />
      </div>

      {/* Próxima cena (fade in) */}
      <div
        className={`absolute inset-0 transition-opacity duration-[1500ms] ${transitioning ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: getSceneGradient(SCENES[nextIndex].id) }}
      >
        <SceneElements id={SCENES[nextIndex].id} />
      </div>

    </div>
  );
}

function getSceneGradient(id: string): string {
  const gradients: Record<string, string> = {
    night_city:
      'linear-gradient(135deg, #020510 0%, #061530 30%, #0a1f4a 60%, #0d0d1a 100%)',
    dawn_highway:
      'linear-gradient(160deg, #1a0a2e 0%, #4a1942 25%, #c2410c 60%, #fb923c 100%)',
    midday:
      'linear-gradient(160deg, #bae6fd 0%, #38bdf8 40%, #0284c7 75%, #0c4a6e 100%)',
    sunset:
      'linear-gradient(160deg, #0f0505 0%, #7f1d1d 30%, #dc2626 60%, #f97316 100%)',
    mountain:
      'linear-gradient(160deg, #022c22 0%, #064e3b 40%, #0d9488 70%, #134e4a 100%)',
  };
  return gradients[id] ?? gradients.night_city;
}

function SceneElements({ id }: { id: string }) {
  if (id === 'night_city') {
    return (
      <div className="absolute inset-0 overflow-hidden">
        {/* Estrelas — posições determinísticas para evitar hydration mismatch */}
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: s.w + 'px',
              height: s.h + 'px',
              left: s.left + '%',
              top: s.top + '%',
              animationDelay: s.delay + 's',
              opacity: s.opacity,
            }}
          />
        ))}
        {/* Estrada com luzes */}
        <div className="absolute bottom-0 left-0 right-0 h-48"
          style={{ background: 'linear-gradient(to top, #010810, transparent)' }} />
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-2 h-32"
          style={{ background: 'linear-gradient(to bottom, #1E7BC4, transparent)', filter: 'blur(4px)' }} />
      </div>
    );
  }

  if (id === 'dawn_highway') {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-56"
          style={{ background: 'linear-gradient(to top, rgba(194,65,12,0.5), transparent)' }} />
        {/* Sol nascente */}
        <div className="absolute"
          style={{ bottom: '25%', left: '50%', transform: 'translateX(-50%)', width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, #fbbf24 0%, #f97316 50%, transparent 70%)', filter: 'blur(8px)', opacity: 0.8 }} />
      </div>
    );
  }

  if (id === 'midday') {
    return (
      <div className="absolute inset-0 overflow-hidden">
        {/* Nuvens */}
        {[10, 35, 60, 80].map((left, i) => (
          <div key={i} className="absolute"
            style={{ top: (i % 2 === 0 ? 10 : 20) + '%', left: left + '%', width: 180 + i * 30 + 'px', height: 40 + 'px', borderRadius: '50%', background: 'rgba(255,255,255,0.35)', filter: 'blur(12px)' }} />
        ))}
        <div className="absolute bottom-0 left-0 right-0 h-32"
          style={{ background: 'linear-gradient(to top, rgba(12,74,110,0.6), transparent)' }} />
      </div>
    );
  }

  if (id === 'sunset') {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute"
          style={{ top: '20%', left: '50%', transform: 'translateX(-50%)', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, #fca5a5 0%, #ef4444 40%, transparent 70%)', filter: 'blur(10px)', opacity: 0.7 }} />
        <div className="absolute bottom-0 left-0 right-0 h-40"
          style={{ background: 'linear-gradient(to top, rgba(127,29,29,0.8), transparent)' }} />
      </div>
    );
  }

  if (id === 'mountain') {
    return (
      <div className="absolute inset-0 overflow-hidden">
        {/* Montanhas */}
        <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path d="M0,320 L0,200 L200,80 L400,160 L600,40 L800,140 L1000,60 L1200,160 L1440,100 L1440,320 Z"
            fill="rgba(6,78,59,0.5)" />
          <path d="M0,320 L0,260 L300,160 L600,220 L900,140 L1200,200 L1440,160 L1440,320 Z"
            fill="rgba(2,44,34,0.6)" />
        </svg>
      </div>
    );
  }

  return null;
}
