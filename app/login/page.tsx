'use client';

import { useState } from 'react';
import DynamicBackground, { Scene, SCENES } from '@/components/DynamicBackground';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  const [scene, setScene] = useState<Scene>(SCENES[0]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 relative">
      <DynamicBackground onSceneChange={setScene} />

      {/* Sobreposição sutil */}
      <div className="absolute inset-0 -z-10" style={{ background: 'rgba(0,0,0,0.15)' }} />

      {/* Watermark discreta */}
      <div
        className="absolute bottom-16 right-6 text-xs font-light tracking-widest uppercase select-none pointer-events-none"
        style={{ color: scene.isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)', transition: 'color 1.5s ease' }}
      >
        {scene.label}
      </div>

      <div className="w-full max-w-sm relative z-10">
        <LoginForm scene={scene} />
      </div>
    </main>
  );
}
