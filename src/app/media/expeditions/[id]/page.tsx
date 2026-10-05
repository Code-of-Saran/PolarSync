'use client';
import { use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Users, Ship, Clock, FlaskConical, ArrowDown } from 'lucide-react';
import AppShell from '@/components/AppShell';
import type { ContentCard, Location } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useT } from '@/lib/i18n';
import { formatDate, imgUrl } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { ErrorState, MediaCard, MiniContentRow, ParallaxSection, RevealOnScroll, SectionHeader, Skeleton, SmartImage } from '@/components/ui';

interface Stage { key: string; title: string; location_id: string; date: string; image: string; description: string; activity: string; location?: Location; related: ContentCard[] }
interface Expedition extends ContentCard { abstract: string; extra: { stages: Stage[]; duration_days: number; members: number; vessel: string }; related: ContentCard[]; media: ContentCard[]; locations: Location[] }

export default function ExpeditionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const low = useAppStore((s) => s.lowBandwidth);
  const { data, error, loading, reload } = useApi<Expedition>(`/api/expeditions/${id}`);

  if (error) return <AppShell><ErrorState message={error.message} onRetry={reload} /></AppShell>;
  if (loading || !data) return <AppShell><Skeleton className="h-[60vh] rounded-3xl" /></AppShell>;
  const stages = data.extra.stages || [];

  return (
    <AppShell fullBleed>
      <ParallaxSection image={imgUrl(data.thumbnail, 2000, low)} height="min-h-[78vh]" speed={0.35}>
        <div className="mx-auto flex min-h-[78vh] max-w-5xl flex-col items-center justify-center px-4 text-center">
          <Link href="/media" className="mb-8 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs text-ice-100 backdrop-blur hover:bg-black/60"><ArrowLeft size={13} aria-hidden /> {t('media.title')}</Link>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">{t('type.expedition')}</motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-space text-4xl font-bold uppercase leading-tight text-white sm:text-6xl">{data.title}</motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-5 max-w-2xl text-base leading-relaxed text-ice-200">{data.abstract}</motion.p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs">
            {[{ i: Clock, v: `${data.extra.duration_days} days` }, { i: Users, v: `${data.extra.members} members` }, { i: Ship, v: data.extra.vessel }, { i: MapPin, v: `${stages.length} stages` }].map((m) => (
              <span key={m.v} className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-ice-100"><m.i size={12} aria-hidden />{m.v}</span>
            ))}
          </div>
          <a href="#timeline" className="mt-10 flex flex-col items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-ice-300">{t('media.timeline')}<ArrowDown size={16} className="animate-bounce" aria-hidden /></a>
        </div>
      </ParallaxSection>

      <div id="timeline" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-14 sm:px-8">
        <ol className="relative">
          <div aria-hidden className="absolute bottom-0 left-4 top-0 w-px bg-gradient-to-b from-cyan-400/60 via-cyan-400/25 to-transparent sm:left-1/2" />
          {stages.map((s, i) => (
            <li key={s.key} id={s.key} className="relative mb-14 scroll-mt-24 last:mb-0">
              <motion.span initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} aria-hidden
                className="absolute left-4 top-6 z-10 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-cyan-300/60 bg-[#061628] font-space text-sm font-bold text-cyan-200 shadow-[0_0_24px_rgba(0,180,216,0.4)] sm:left-1/2">{i + 1}</motion.span>
              <div className={`grid gap-6 pl-12 sm:grid-cols-2 sm:pl-0 ${i % 2 ? '' : ''}`}>
                <RevealOnScroll className={i % 2 ? 'sm:order-2 sm:pl-10' : 'sm:pr-10 sm:text-right'}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">{formatDate(s.date, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <h2 className="mt-1 font-space text-2xl font-bold text-ice-50">{s.title}</h2>
                  {s.location && (
                    <Link href={`/explore/location/${s.location.id}`} className={`mt-1 flex items-center gap-1.5 text-xs text-ice-300 hover:text-cyan-200 ${i % 2 ? '' : 'sm:justify-end'}`}><MapPin size={12} aria-hidden />{s.location.name}</Link>
                  )}
                  <p className="mt-3 text-sm leading-relaxed text-ice-300">{s.description}</p>
                  <p className={`mt-3 flex items-center gap-1.5 text-xs text-emerald-200 ${i % 2 ? '' : 'sm:justify-end'}`}><FlaskConical size={12} aria-hidden />{s.activity}</p>
                </RevealOnScroll>
                <RevealOnScroll delay={0.1} className={i % 2 ? 'sm:order-1 sm:pr-10' : 'sm:pl-10'}>
                  <div className="glass-panel overflow-hidden rounded-2xl">
                    <SmartImage src={s.image} alt={`${s.title} — ${s.location?.name ?? ''}`} width={900} className="aspect-[16/10] w-full object-cover" />
                    {s.related.length > 0 && <div className="p-2">{s.related.slice(0, 3).map((r) => <MiniContentRow key={r.id} item={r} />)}</div>}
                  </div>
                </RevealOnScroll>
              </div>
            </li>
          ))}
        </ol>

        {data.media.length > 0 && (
          <section className="mt-16">
            <SectionHeader icon={Ship} title="Media from this expedition" />
            <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">{data.media.map((m, i) => <MediaCard key={m.id} item={m} index={i} />)}</div>
          </section>
        )}
        {data.related.length > 0 && (
          <section className="glass-panel mt-10 rounded-2xl p-5">
            <h2 className="mb-2 font-space font-semibold text-ice-50">Science outputs</h2>
            <div className="grid gap-1 sm:grid-cols-2">{data.related.map((r) => <MiniContentRow key={r.id} item={r} />)}</div>
          </section>
        )}
        <p className="mt-8 text-center text-[11px] text-ice-500">{t('common.sampleNotice')} <Calendar size={10} className="inline" aria-hidden /></p>
      </div>
    </AppShell>
  );
}
