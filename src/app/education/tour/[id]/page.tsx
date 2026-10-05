'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Globe2, X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useAppStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { imgUrl, cn } from '@/lib/format';
import { TOURS, tr } from '@/lib/education';

export default function TourPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const low = useAppStore((s) => s.lowBandwidth);
  const tour = TOURS.find((x) => x.id === id);
  const [active, setActive] = useState<number | null>(null);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  if (!tour) return notFound();
  const hs = active !== null ? tour.hotspots[active] : null;
  const open = (i: number) => { setActive(i); setVisited((v) => new Set(v).add(tour.hotspots[i].id)); };

  return (
    <AppShell>
      <Link href="/education" className="mb-4 inline-flex items-center gap-1.5 text-xs text-ice-400 hover:text-ice-100"><ArrowLeft size={13} aria-hidden /> {t('nav.education')}</Link>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-teal-300"><Globe2 size={13} aria-hidden /> {t('type.tour')}</p>
          <h1 className="font-space text-3xl font-bold uppercase text-gradient-white sm:text-4xl">{tr(tour.title, lang)}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ice-400">{tr(tour.intro, lang)}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-ice-300">
          <span className="font-space text-lg font-bold text-cyan-200">{visited.size}/{tour.hotspots.length}</span> explored
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10"><motion.div className="h-full bg-teal-300" animate={{ width: `${(visited.size / tour.hotspots.length) * 100}%` }} /></div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="relative overflow-hidden rounded-3xl border border-cyan-400/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl(tour.image, 1800, low)} alt={tr(tour.title, lang)} className="aspect-[4/3] w-full object-cover sm:aspect-[16/10]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(2,11,24,0.55)] via-transparent to-transparent" />
          {tour.hotspots.map((h, i) => (
            <button key={h.id} onClick={() => open(i)} aria-label={tr(h.title, lang)} aria-pressed={active === i}
              className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${h.x}%`, top: `${h.y}%` }}>
              <span className={cn('hotspot-ping absolute inset-0 rounded-full', visited.has(h.id) ? 'bg-teal-300/40' : 'bg-cyan-300/50')} aria-hidden />
              <span className={cn('relative flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold shadow-[0_0_20px_rgba(0,180,216,0.6)] transition-transform group-hover:scale-110',
                active === i ? 'border-white bg-cyan-400 text-navy-950' : visited.has(h.id) ? 'border-teal-200 bg-teal-500/80 text-white' : 'border-white/90 bg-sky-500/80 text-white')}>{i + 1}</span>
              <span className="pointer-events-none absolute left-1/2 top-full mt-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/75 px-2 py-0.5 text-[11px] text-white group-hover:block sm:block">{tr(h.title, lang)}</span>
            </button>
          ))}
          <AnimatePresence>
            {hs && active !== null && (
              <motion.div key={hs.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="glass-panel-strong absolute inset-x-3 bottom-3 rounded-2xl p-4 xl:hidden" role="dialog" aria-label={tr(hs.title, lang)}>
                <button onClick={() => setActive(null)} className="absolute right-2 top-2 p-1 text-ice-400" aria-label="Close"><X size={16} /></button>
                <h2 className="font-space text-lg font-semibold text-ice-50">{tr(hs.title, lang)}</h2>
                <p className="mt-1 text-sm text-ice-300">{tr(hs.body, lang)}</p>
                {hs.related && <Link href={hs.related.href} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan-300">{hs.related.label} <ArrowRight size={12} aria-hidden /></Link>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="hidden space-y-3 xl:block">
          <AnimatePresence mode="wait">
            {hs && active !== null ? (
              <motion.div key={hs.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="glass-panel rounded-2xl p-5" aria-live="polite">
                <p className="text-[11px] font-bold uppercase tracking-wider text-teal-300">Hotspot {active + 1} of {tour.hotspots.length}</p>
                <h2 className="mt-1 font-space text-2xl font-bold text-ice-50">{tr(hs.title, lang)}</h2>
                <p className="mt-3 text-sm leading-relaxed text-ice-300">{tr(hs.body, lang)}</p>
                {hs.related && <Link href={hs.related.href} className="btn-secondary mt-4 text-xs">{hs.related.label} <ArrowRight size={12} aria-hidden /></Link>}
                <div className="mt-5 flex justify-between">
                  <button onClick={() => open((active - 1 + tour.hotspots.length) % tour.hotspots.length)} className="btn-ghost px-2 text-xs"><ChevronLeft size={14} aria-hidden /> {t('common.previous')}</button>
                  <button onClick={() => open((active + 1) % tour.hotspots.length)} className="btn-ghost px-2 text-xs">{t('common.next')} <ChevronRight size={14} aria-hidden /></button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel rounded-2xl p-5 text-sm text-ice-300">{t('tour.hint')}</motion.div>
            )}
          </AnimatePresence>
        </aside>
      </div>

      <ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5" aria-label="Hotspots">
        {tour.hotspots.map((h, i) => (
          <li key={h.id}>
            <button onClick={() => open(i)} aria-current={active === i}
              className={cn('glass-panel flex w-full items-center gap-2.5 rounded-xl p-3 text-left text-sm transition-colors', active === i ? 'border-cyan-300/50' : 'hover:border-cyan-400/30')}>
              <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold', visited.has(h.id) ? 'bg-teal-500/70 text-white' : 'bg-sky-500/30 text-cyan-100')}>{i + 1}</span>
              <span className="truncate text-ice-100">{tr(h.title, lang)}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/explore/location/${tour.id === 'tour-maitri' ? 'loc-maitri' : 'loc-himadri'}`} className="btn-primary"><MapPin size={15} aria-hidden /> {t('map.exploreStation')}</Link>
        <Link href="/education/quiz/quiz-polar" className="btn-secondary">{t('edu.startQuiz')}</Link>
      </div>
    </AppShell>
  );
}
