'use client';
import { useEffect, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from '@/lib/store';
import CommandPalette from './CommandPalette';

export default function Providers({ children }: { children: ReactNode }) {
  const lang = useAppStore((s) => s.lang);
  const low = useAppStore((s) => s.lowBandwidth);
  const reduce = useAppStore((s) => s.reduceMotion);
  const large = useAppStore((s) => s.largeText);
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen);

  // Restore persisted settings after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    Promise.resolve(useAppStore.persist.rehydrate()).finally(() => useAppStore.setState({ hydrated: true }));
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang === 'ta' ? 'ta' : lang === 'hi' ? 'hi' : 'en';
    el.dataset.lowbw = String(low);
    el.dataset.reduceMotion = String(reduce);
    el.dataset.largeText = String(large);
  }, [lang, low, reduce, large]);

  // Global Ctrl/⌘ + K command palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(!useAppStore.getState().paletteOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setPaletteOpen]);

  return (
    <MotionConfig reducedMotion={low || reduce ? 'always' : 'user'}>
      {children}
      <CommandPalette />
      <Toaster
        position="bottom-center"
        containerStyle={{ bottom: 88 }}
        toastOptions={{
          style: {
            background: 'rgba(6,22,40,0.96)', border: '1px solid rgba(72,202,228,0.28)', color: '#D3F1F8',
            borderRadius: '12px', fontSize: '13px',
          },
          success: { iconTheme: { primary: '#34D399', secondary: '#061628' } },
          error: { iconTheme: { primary: '#FB7185', secondary: '#061628' } },
        }}
      />
    </MotionConfig>
  );
}
