'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { MapPin, Search, Globe2, X, ArrowRight, FileText, Database, BarChart3, Image as ImageIcon, BookOpen, Ship, List, Loader2 } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { api, type ContentCard, type Location } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useAppStore } from '@/lib/store';
import { useRegionLabel, useT, type TKey } from '@/lib/i18n';
import { CATEGORY_HEX, cn } from '@/lib/format';
import { ErrorState, MiniContentRow, SmartImage } from '@/components/ui';

const PolarMapInner = dynamic(() => import('@/components/PolarMapInner'), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-cyan-300" aria-label="Loading map" /></div>,
});

const CATS = ['all', 'station', 'expedition', 'dataset', 'media', 'event'] as const;
const GROUP_META: { key: string; icon: typeof FileText }[] = [
  { key: 'research', icon: FileText }, { key: 'datasets', icon: Database }, { key: 'reports', icon: BarChart3 },
  { key: 'media', icon: ImageIcon }, { key: 'learn', icon: BookOpen }, { key: 'expeditions', icon: Ship },
];

interface LocationDetail extends Location { content: Record<string, ContentCard[]>; counts: Record<string, number>; total_linked: number; top_topics: string[] }

function InfoPanel({ loc, onClose }: { loc: Location; onClose: () => void }) {
  const t = useT();
  const region = useRegionLabel();
  const [detail, setDetail] = useState<LocationDetail | null>(null);
  useEffect(() => { setDetail(null); api<LocationDetail>(`/api/locations/${loc.id}`).then(setDetail).catch(() => {}); }, [loc.id]);
  const top = detail ? GROUP_META.flatMap((g) => detail.content[g.key] || []).slice(0, 3) : [];
  return (
    <motion.aside key={loc.id} initial={{ opacity: 0, x: 30, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 30 }}
      transition={{ type: 'spring', damping: 26, stiffness: 260 }} aria-label={loc.name}
      className="glass-panel-strong absolute inset-x-3 bottom-3 z-[500] max-h-[70%] overflow-y-auto rounded-2xl sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:max-h-[calc(100%-2rem)] sm:w-[360px]">
      <div className="relative h-36">
        <SmartImage src={loc.image} alt="" width={720} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,16,30,1)] via-[rgba(4,16,30,0.3)] to-transparent" />
        <button onClick={onClose} aria-label={t('common.close')} className="absolute right-2.5 top-2.5 rounded-full bg-black/50 p-1.5 text-ice-100 hover:bg-black/70"><X size={14} /></button>
        <span className="absolute bottom-3 left-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: CATEGORY_HEX[loc.category] }}>
          <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_HEX[loc.category] }} />{t(`map.cat.${loc.category}` as TKey)}
        </span>
      </div>
      <div className="space-y-4 p-4 pt-1">
        <div>
          <h2 className="font-space text-xl font-bold text-ice-50">{loc.name}</h2>
          <p className="flex items-center gap-1.5 text-xs text-cyan-300"><MapPin size={11} aria-hidden />{region(loc.region)}{loc.established && <span className="text-ice-500">· Est. {loc.established}</span>}</p>
        </div>
        <p className="text-xs leading-relaxed text-ice-300">{loc.description}</p>
        {loc.research_areas && loc.research_areas.length > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ice-500">{t('map.research')}</p>
            <div className="flex flex-wrap gap-1.5">{loc.research_areas.map((a) => <span key={a} className="tag text-[10px]">{a}</span>)}</div>
          </div>
        )}
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ice-500">{t('map.related')}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {GROUP_META.filter((g) => (loc.counts?.[g.key] || 0) > 0).map((g) => (
              <div key={g.key} className="rounded-lg border border-white/5 bg-black/20 px-2 py-1.5 text-center">
                <g.icon size={13} className="mx-auto mb-0.5 text-cyan-300" aria-hidden />
                <p className="font-space text-base font-bold leading-none text-ice-50">{loc.counts?.[g.key]}</p>
                <p className="mt-0.5 truncate text-[9.5px] text-ice-500">{t(`group.${g.key}` as TKey)}</p>
              </div>
            ))}
            {!loc.total_linked && <p className="col-span-3 text-[11px] text-ice-500">No linked records yet.</p>}
          </div>
        </div>
        {top.length > 0 && <div className="-mx-2">{top.map((c) => <MiniContentRow key={c.id} item={c} />)}</div>}
        <Link href={`/explore/location/${loc.id}`} className="btn-primary w-full justify-center">{t('map.exploreStation')} <ArrowRight size={15} aria-hidden /></Link>
        <p className="text-center text-[10px] text-ice-500">{loc.lat.toFixed(3)}°, {loc.lng.toFixed(3)}°</p>
      </div>
    </motion.aside>
  );
}

function MapContent() {
  const t = useT();
  const region = useRegionLabel();
  const low = useAppStore((s) => s.lowBandwidth);
  const params = useSearchParams();
  const { data, error, reload } = useApi<Location[]>('/api/locations');
  const [cat, setCat] = useState<(typeof CATS)[number]>('all');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(params.get('focus'));
  const [showList, setShowList] = useState(false);

  const filtered = useMemo(() => (data || []).filter((l) =>
    (cat === 'all' || l.category === cat) && (!q || `${l.name} ${l.region} ${l.description}`.toLowerCase().includes(q.toLowerCase()))), [data, cat, q]);
  const selected = (data || []).find((l) => l.id === selectedId) || null;
  const counts = useMemo(() => Object.fromEntries(CATS.map((c) => [c, (data || []).filter((l) => c === 'all' || l.category === c).length])), [data]);

  return (
    <AppShell fullBleed>
      <div className="flex h-[calc(100dvh-64px-64px)] flex-col gap-3 p-3 sm:p-4 md:h-[calc(100dvh-64px)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80"><Globe2 size={12} aria-hidden /> Geo-spatial knowledge</p>
            <h1 className="font-space text-2xl font-bold text-gradient-white">{t('map.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="polar-input flex w-56 items-center gap-2 py-2">
              <Search size={14} className="shrink-0 text-cyan-300" aria-hidden />
              <label htmlFor="map-q" className="sr-only">{t('map.searchLocations')}</label>
              <input id="map-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('map.searchLocations')} className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-ice-500" />
            </div>
            <button onClick={() => setShowList(!showList)} aria-expanded={showList} className="btn-secondary px-3 py-2 text-xs"><List size={14} aria-hidden /> List</button>
          </div>
        </div>

        <div role="group" aria-label="Filter by category" className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-0.5">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} aria-pressed={cat === c}
              className={cn('flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                cat === c ? 'border-cyan-300/45 bg-cyan-400/15 text-cyan-100' : 'border-white/8 bg-[rgba(6,22,40,0.55)] text-ice-400 hover:text-ice-100')}>
              {c !== 'all' && <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_HEX[c] }} aria-hidden />}
              {t(`map.cat.${c}` as TKey)} <span className="text-[10px] opacity-60">{counts[c]}</span>
            </button>
          ))}
          <span className="ml-auto shrink-0 text-xs text-ice-500">{filtered.length} {t('map.locations')}</span>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-cyan-400/15">
          {error ? <div className="p-6"><ErrorState message={error.message} onRetry={reload} /></div> : (
            <PolarMapInner locations={filtered} selectedId={selectedId} onSelect={(l) => setSelectedId(l.id)} lowBandwidth={low} />
          )}
          <AnimatePresence>
            {showList && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="glass-panel-strong absolute bottom-3 left-3 top-3 z-[500] w-64 overflow-y-auto rounded-2xl p-2">
                <ul aria-label="Locations">
                  {filtered.map((l) => (
                    <li key={l.id}>
                      <button onClick={() => { setSelectedId(l.id); setShowList(false); }} aria-current={l.id === selectedId}
                        className={cn('flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-cyan-400/[0.08]', l.id === selectedId && 'bg-cyan-400/12')}>
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: CATEGORY_HEX[l.category] }} aria-hidden />
                        <span className="min-w-0"><span className="block truncate text-sm text-ice-100">{l.name}</span><span className="text-[10px] text-ice-500">{region(l.region)} · {l.total_linked} linked</span></span>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>{selected && <InfoPanel loc={selected} onClose={() => setSelectedId(null)} />}</AnimatePresence>
          {!selected && data && (
            <div className="pointer-events-none absolute right-4 top-4 z-[400] hidden max-w-[240px] rounded-xl border border-white/10 bg-[rgba(4,16,30,0.85)] p-3 text-[11px] text-ice-300 sm:block">
              Click a marker to see the research, datasets and media connected to that place.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function PolarMapPage() {
  return <Suspense fallback={<div className="min-h-screen bg-polar-gradient" />}><MapContent /></Suspense>;
}
