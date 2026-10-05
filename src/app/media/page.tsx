'use client';
import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Camera, Video, Newspaper, Ship, Search, X, MapPin, ArrowRight, ChevronLeft, ChevronRight, Calendar, Users } from 'lucide-react';
import AppShell from '@/components/AppShell';
import Lightbox from '@/components/Lightbox';
import { qs, type ContentCard } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useAppStore } from '@/lib/store';
import { useRegionLabel, useT } from '@/lib/i18n';
import { imgUrl } from '@/lib/format';
import { EmptyState, ErrorState, MediaCard, ParallaxSection, RevealOnScroll, Segmented, SectionHeader, Skeleton, SmartImage } from '@/components/ui';

type Tab = 'all' | 'photo' | 'video' | 'expedition' | 'press_release';
interface MediaResp { total: number; items: ContentCard[]; counts: Record<string, number> }

export default function MediaHubPage() {
  const t = useT();
  const region = useRegionLabel();
  const low = useAppStore((s) => s.lowBandwidth);
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const strip = useRef<HTMLDivElement>(null);

  const media = useApi<MediaResp>(`/api/media${qs({ media_type: tab === 'all' || tab === 'expedition' ? '' : tab, q: debounced })}`);
  const exps = useApi<ContentCard[]>('/api/expeditions');
  const featured = exps.data?.[0];
  const items = useMemo(() => media.data?.items || [], [media.data]);
  const viewable = useMemo(() => items.filter((i) => i.content_type !== 'press_release'), [items]);

  const onSearch = (v: string) => {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(v), 300);
  };
  const scrollStrip = (dir: number) => strip.current?.scrollBy({ left: dir * 380, behavior: 'smooth' });
  const counts = media.data?.counts || {};

  return (
    <AppShell fullBleed>
      {/* Cinematic featured expedition */}
      {featured ? (
        <ParallaxSection image={imgUrl(featured.thumbnail, 2000, low)} height="min-h-[440px] sm:min-h-[520px]" speed={0.3}>
          <div className="mx-auto flex min-h-[440px] max-w-screen-2xl items-end px-4 pb-10 sm:min-h-[520px] sm:px-8">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
              className="glass-panel max-w-xl rounded-3xl p-6 sm:p-8">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-300">{t('media.featured')}</p>
              <h1 className="font-space text-3xl font-bold uppercase leading-tight text-white sm:text-4xl">{featured.title}</h1>
              <p className="mt-3 text-sm leading-relaxed text-ice-200">{featured.description}</p>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ice-300">
                <span className="flex items-center gap-1.5"><MapPin size={12} aria-hidden />Maitri Station · {region(featured.region)}</span>
                {featured.extra?.duration_days && <span className="flex items-center gap-1.5"><Calendar size={12} aria-hidden />{featured.extra.duration_days} days</span>}
                {featured.extra?.members && <span className="flex items-center gap-1.5"><Users size={12} aria-hidden />{featured.extra.members} members</span>}
              </p>
              <Link href={`/media/expeditions/${featured.id}`} className="btn-primary mt-5">{t('media.exploreExpedition')} <ArrowRight size={15} aria-hidden /></Link>
            </motion.div>
          </div>
        </ParallaxSection>
      ) : <Skeleton className="h-[440px] rounded-none" />}

      <div className="mx-auto max-w-screen-2xl space-y-8 px-4 py-8 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80"><ImageIcon size={13} aria-hidden /> {t('nav.media')}</p>
            <h2 className="font-space text-3xl font-bold text-gradient-white">{t('media.title')}</h2>
            <p className="mt-1 text-sm text-ice-400">{t('media.subtitle')}</p>
          </div>
          <div className="polar-input flex w-full items-center gap-2 py-2.5 sm:w-72">
            <Search size={15} className="shrink-0 text-cyan-300" aria-hidden />
            <label htmlFor="media-q" className="sr-only">Search media</label>
            <input id="media-q" value={q} onChange={(e) => onSearch(e.target.value)} placeholder="Search media…" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ice-500" />
            {q && <button onClick={() => onSearch('')} aria-label="Clear"><X size={14} className="text-ice-500" /></button>}
          </div>
        </div>

        <Segmented label="Media type" value={tab} onChange={setTab}
          options={[
            { value: 'all', label: t('media.tabs.all') },
            { value: 'photo', label: t('media.tabs.photos'), icon: Camera, count: counts.photo },
            { value: 'video', label: t('media.tabs.videos'), icon: Video, count: counts.video },
            { value: 'expedition', label: t('media.tabs.expeditions'), icon: Ship, count: exps.data?.length },
            { value: 'press_release', label: t('media.tabs.press'), icon: Newspaper, count: counts.press_release },
          ]} />

        {/* Horizontal expedition strip */}
        {(tab === 'all' || tab === 'expedition') && exps.data && exps.data.length > 0 && (
          <section aria-labelledby="exp-strip">
            <SectionHeader id="exp-strip" icon={Ship} title={t('media.tabs.expeditions')} subtitle="Journey timelines linking media to the science it produced"
              action={<div className="hidden gap-1.5 sm:flex"><button onClick={() => scrollStrip(-1)} className="rounded-lg border border-white/10 p-1.5 text-ice-300 hover:bg-white/5" aria-label="Scroll left"><ChevronLeft size={16} /></button><button onClick={() => scrollStrip(1)} className="rounded-lg border border-white/10 p-1.5 text-ice-300 hover:bg-white/5" aria-label="Scroll right"><ChevronRight size={16} /></button></div>} />
            <div ref={strip} className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8">
              {exps.data.flatMap((e) => [e, ...((e.extra?.stages as { key: string; title: string; image: string; description: string }[]) || []).map((s) => ({ ...e, id: `${e.id}#${s.key}`, title: s.title, thumbnail: s.image, description: s.description, stage: true }))])
                .map((e, i) => (
                  <motion.div key={e.id} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: Math.min(i, 6) * 0.05 }}
                    className="w-[78vw] shrink-0 snap-start sm:w-[340px]">
                    <Link href={`/media/expeditions/${e.id.split('#')[0]}${e.id.includes('#') ? `#${e.id.split('#')[1]}` : ''}`} className="glass-panel glass-panel-hover group relative block h-60 overflow-hidden rounded-2xl">
                      <SmartImage src={e.thumbnail} alt="" width={700} className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(2,11,24,0.95)] via-[rgba(2,11,24,0.2)] to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-lime-300">{'stage' in e ? 'Expedition stage' : 'Expedition'}</p>
                        <h3 className="font-space text-lg font-semibold text-white">{e.title}</h3>
                        <p className="line-clamp-2 text-xs text-ice-300">{e.description}</p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
            </div>
          </section>
        )}

        {tab !== 'expedition' && (
          <section aria-label="Media gallery">
            {media.error ? <ErrorState message={media.error.message} onRetry={media.reload} /> :
              media.loading && !media.data ? <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} className={`mb-4 rounded-2xl ${i % 3 ? 'h-56' : 'h-80'}`} />)}</div> :
                items.length === 0 ? <EmptyState icon={ImageIcon} title={t('common.noResults')} hint="Try another search term." /> : (
                  <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
                    {items.map((m, i) => (
                      <MediaCard key={m.id} item={m} index={i} tall={i % 5 === 0 && m.content_type === 'photo'}
                        onOpen={m.content_type === 'press_release' ? undefined : (c) => setOpen(viewable.findIndex((v) => v.id === c.id))} />
                    ))}
                  </div>
                )}
          </section>
        )}

        <RevealOnScroll className="text-center text-[11px] text-ice-500">{t('common.sampleNotice')} Photographs: Unsplash (illustrative).</RevealOnScroll>
      </div>
      <Lightbox items={viewable} index={open} onClose={() => setOpen(null)} onIndex={setOpen} />
    </AppShell>
  );
}
