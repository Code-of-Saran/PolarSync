'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, Clock, MapPin, Sparkles, CornerDownLeft, ArrowRight, Map, Upload, GraduationCap, Image as ImageIcon, Database, X, Loader2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { contentHref, TYPE_META } from '@/lib/format';
import { useT, type TKey } from '@/lib/i18n';
import type { ContentType } from '@/lib/api';

interface SuggestItem { id: string; title: string; content_type: ContentType; region?: string; year?: number; relevance: number; extra?: Record<string, any> }
interface Suggest { groups: Record<string, SuggestItem[]>; locations: { id: string; name: string; region: string; category: string }[]; took_ms?: number }

const GROUP_ORDER = ['research', 'datasets', 'reports', 'media', 'learn', 'expeditions'];

interface Row { key: string; label: string; sub?: string; href: string; icon: React.ElementType; group: string; badge?: string }

export default function CommandPalette() {
  const open = useAppStore((s) => s.paletteOpen);
  const setOpen = useAppStore((s) => s.setPaletteOpen);
  const recent = useAppStore((s) => s.recentSearches);
  const addRecent = useAppStore((s) => s.addRecentSearch);
  const t = useT();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [data, setData] = useState<Suggest | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 20); document.body.style.overflow = 'hidden'; }
    else { setQ(''); setData(null); document.body.style.overflow = ''; }
  }, [open]);

  useEffect(() => {
    if (q.trim().length < 2) { setData(null); setLoading(false); return; }
    setLoading(true);
    const id = setTimeout(async () => {
      try { setData(await api<Suggest>(`/api/search/suggest?q=${encodeURIComponent(q.trim())}`)); }
      catch { setData({ groups: {}, locations: [] }); }
      finally { setLoading(false); }
    }, 180);
    return () => clearTimeout(id);
  }, [q]);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    const query = q.trim();
    if (query) {
      out.push({ key: 'all', label: `${t('common.search')} “${query}”`, sub: 'Hybrid AI search across everything', href: `/search?q=${encodeURIComponent(query)}`, icon: Sparkles, group: '' });
      GROUP_ORDER.forEach((g) => (data?.groups[g] || []).forEach((it) => out.push({
        key: it.id, label: it.title, sub: [it.region, it.year].filter(Boolean).join(' · '), href: contentHref(it),
        icon: TYPE_META[it.content_type]?.icon || Database, group: t(`group.${g}` as TKey), badge: `${it.relevance}%`,
      })));
      (data?.locations || []).forEach((l) => out.push({ key: l.id, label: l.name, sub: l.region, href: `/explore/location/${l.id}`, icon: MapPin, group: t('group.locations') }));
    } else {
      recent.forEach((r) => out.push({ key: `r-${r}`, label: r, href: `/search?q=${encodeURIComponent(r)}`, icon: Clock, group: t('search.recent') }));
      const nav: [string, string, React.ElementType][] = [
        [t('nav.map'), '/explore/map', Map], [t('nav.repository'), '/repository', Database], [t('nav.media'), '/media', ImageIcon],
        [t('nav.education'), '/education', GraduationCap], [t('nav.upload'), '/contribute', Upload],
      ];
      nav.forEach(([label, href, icon]) => out.push({ key: href, label, href, icon, group: 'Go to' }));
    }
    return out;
  }, [q, data, recent, t]);

  useEffect(() => { setActive(0); }, [rows.length, q]);

  const go = (row: Row) => {
    if (row.key === 'all' || row.key.startsWith('r-')) addRecent(row.key === 'all' ? q.trim() : row.label);
    setOpen(false);
    router.push(row.href);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(rows.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter' && rows[active]) { e.preventDefault(); go(rows[active]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  let lastGroup = '__';
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-start justify-center p-3 pt-[9vh] sm:pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="fixed inset-0 bg-[rgba(2,8,18,0.75)] backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden />
          <motion.div role="dialog" aria-modal="true" aria-label="Search PolarSync"
            initial={{ opacity: 0, y: -12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            className="glass-panel-strong relative w-full max-w-2xl overflow-hidden rounded-2xl">
            <div className="flex items-center gap-3 border-b border-cyan-400/15 px-4 py-3.5">
              {loading ? <Loader2 size={18} className="shrink-0 animate-spin text-cyan-300" aria-hidden /> : <Search size={18} className="shrink-0 text-cyan-300" aria-hidden />}
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
                placeholder="Search PolarSync…" aria-label="Search PolarSync" role="combobox" aria-expanded="true" aria-controls="palette-list"
                aria-activedescendant={rows[active] ? `pal-${active}` : undefined}
                className="min-w-0 flex-1 bg-transparent text-base text-ice-50 outline-none placeholder:text-ice-500" />
              <kbd className="hidden rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-ice-400 sm:block">ESC</kbd>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-ice-400 hover:text-ice-50 sm:hidden" aria-label="Close"><X size={18} /></button>
            </div>
            <div ref={listRef} id="palette-list" role="listbox" className="max-h-[60vh] overflow-y-auto p-2">
              {!q && <p className="px-3 pb-1 pt-2 text-xs text-ice-500">Search papers, datasets, media, stories and locations — results are ranked by meaning.</p>}
              {q.trim().length >= 2 && !loading && data && rows.length <= 1 && (
                <p className="px-3 py-6 text-center text-sm text-ice-400">{t('common.noResults')}</p>
              )}
              {rows.map((row, i) => {
                const header = row.group !== lastGroup && row.group ? row.group : null;
                lastGroup = row.group;
                return (
                  <div key={row.key + i}>
                    {header && <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-ice-500">{header}</p>}
                    <button id={`pal-${i}`} data-idx={i} role="option" aria-selected={i === active}
                      onMouseEnter={() => setActive(i)} onClick={() => go(row)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${i === active ? 'bg-cyan-400/12 ring-1 ring-cyan-400/25' : 'hover:bg-white/[0.03]'}`}>
                      <row.icon size={16} className={i === active ? 'shrink-0 text-cyan-300' : 'shrink-0 text-ice-400'} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ice-100">{row.label}</span>
                        {row.sub && <span className="block truncate text-[11px] text-ice-500">{row.sub}</span>}
                      </span>
                      {row.badge && <span className="shrink-0 rounded-md bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-200">{row.badge}</span>}
                      {i === active && (row.key === 'all' ? <CornerDownLeft size={14} className="shrink-0 text-cyan-300" aria-hidden /> : <ArrowRight size={14} className="shrink-0 text-cyan-300" aria-hidden />)}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between border-t border-cyan-400/10 px-4 py-2 text-[10px] text-ice-500">
              <span className="hidden sm:inline">↑↓ navigate · ↵ open · Ctrl K toggle</span>
              <span className="flex items-center gap-1"><Sparkles size={10} aria-hidden /> Semantic search{data?.took_ms ? ` · ${data.took_ms} ms` : ''}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
