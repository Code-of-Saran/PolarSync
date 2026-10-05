'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from './api';

export type Lang = 'en' | 'ta' | 'hi';

interface AppState {
  hydrated: boolean;
  token: string | null;
  user: User | null;
  lang: Lang;
  lowBandwidth: boolean;
  reduceMotion: boolean;
  largeText: boolean;
  recentSearches: string[];
  paletteOpen: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setLang: (l: Lang) => void;
  setLowBandwidth: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setLargeText: (v: boolean) => void;
  addRecentSearch: (q: string) => void;
  clearRecentSearches: () => void;
  setPaletteOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hydrated: false,
      token: null,
      user: null,
      lang: 'en',
      lowBandwidth: false,
      reduceMotion: false,
      largeText: false,
      recentSearches: ['Antarctic ice changes', 'Maitri Station', 'Climate change'],
      paletteOpen: false,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      setLang: (lang) => set({ lang }),
      setLowBandwidth: (lowBandwidth) => set({ lowBandwidth }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setLargeText: (largeText) => set({ largeText }),
      addRecentSearch: (q) =>
        set((s) => ({ recentSearches: [q, ...s.recentSearches.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6) })),
      clearRecentSearches: () => set({ recentSearches: [] }),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
    }),
    {
      name: 'polarsync-settings',
      skipHydration: true,
      partialize: (s) => ({
        token: s.token, user: s.user, lang: s.lang, lowBandwidth: s.lowBandwidth,
        reduceMotion: s.reduceMotion, largeText: s.largeText, recentSearches: s.recentSearches,
      }),
    }
  )
);
