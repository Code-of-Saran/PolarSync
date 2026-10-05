'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, Camera, Clock, Images, Ship, Download, Share2, Eye, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '@/components/AppShell';
import Lightbox, { mediaFrames, VideoStage } from '@/components/Lightbox';
import type { ContentDetail } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useRegionLabel, useT } from '@/lib/i18n';
import { formatDate, imgUrl } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { ErrorState, MiniContentRow, Skeleton, TypeBadge } from '@/components/ui';

export default function MediaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const region = useRegionLabel();
  const low = useAppStore((s) => s.lowBandwidth);
  const { data: item, error, loading, reload } = useApi<ContentDetail>(`/api/content/${id}?track=1`, { auth: true });
  const [open, setOpen] = useState<number | null>(null);

  if (error) return <AppShell><ErrorState message={error.message} onRetry={reload} /></AppShell>;
  if (loading || !item) return <AppShell><Skeleton className="mb-4 h-[60vh] rounded-3xl" /></AppShell>;

  const frames = mediaFrames(item);
  const ex = item.extra || {};
  const loc = item.locations[0];
  const card = { ...item, location_name: loc?.name };

  return (
    <AppShell>
      <Link href="/media" className="mb-4 inline-flex items-center gap-1.5 text-xs text-ice-400 hover:text-ice-100"><ArrowLeft size={13} aria-hidden /> {t('media.title')}</Link>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel flex items-center justify-center overflow-hidden rounded-3xl bg-black/40 p-2">
            {item.content_type === 'video' ? <VideoStage item={item} frames={frames} /> : item.content_type === 'press_release' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgUrl(item.thumbnail, 1600, low)} alt={item.title} className="max-h-[60vh] w-full rounded-2xl object-cover" />
            ) : (
              <button onClick={() => setOpen(0)} className="block w-full" aria-label="Open fullscreen viewer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgUrl(frames[0], 1600, low)} alt={item.title} className="max-h-[65vh] w-full rounded-2xl object-cover" />
              </button>
            )}
          </motion.div>
          {frames.length > 1 && item.content_type === 'photo' && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {frames.map((f, i) => (
                <button key={f + i} onClick={() => setOpen(0)} className="overflow-hidden rounded-xl border border-white/5 hover:border-cyan-400/40" aria-label={`View image ${i + 1}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgUrl(f, 400, low)} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform hover:scale-105" />
                </button>
              ))}
            </div>
          )}
          <article className="glass-panel rounded-2xl p-5 sm:p-6">
            <TypeBadge type={item.content_type} />
            <h1 className="mt-3 font-space text-2xl font-bold text-ice-50 sm:text-3xl">{item.title}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ice-200">{item.abstract || item.description}</p>
            {ex.caption && <p className="mt-3 border-l-2 border-cyan-400/40 pl-3 text-sm italic text-ice-400">{ex.caption}</p>}
            <div className="mt-4 flex flex-wrap gap-2">{item.tags.map((tg) => <Link key={tg} href={`/search?q=${encodeURIComponent(tg)}`} className="tag hover:border-cyan-300/50"><Tag size={10} className="mr-1" aria-hidden />{tg}</Link>)}</div>
          </article>
        </div>
        <aside className="space-y-4">
          <section className="glass-panel rounded-2xl p-5">
            <dl className="space-y-3 text-sm">
              {[
                { i: MapPin, l: t('common.location'), v: loc ? <Link href={`/explore/location/${loc.id}`} className="text-cyan-300 hover:underline">{loc.name}</Link> : region(item.region) },
                { i: Calendar, l: t('common.date'), v: formatDate(item.created_at) },
                ex.photographer && { i: Camera, l: 'Photographer', v: ex.photographer },
                ex.duration && { i: Clock, l: 'Duration', v: ex.duration },
                ex.image_count && { i: Images, l: 'Collection', v: `${ex.image_count} ${t('media.photos')}` },
                { i: Eye, l: 'Views', v: item.views.toLocaleString('en-IN') },
              ].filter(Boolean).map((m) => {
                const r = m as { i: typeof MapPin; l: string; v: React.ReactNode };
                return <div key={r.l} className="flex items-center justify-between gap-3"><dt className="flex items-center gap-1.5 text-ice-500"><r.i size={13} aria-hidden />{r.l}</dt><dd className="text-right text-ice-100">{r.v}</dd></div>;
              })}
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a href={`/api/content/${item.id}/download`} className="btn-secondary justify-center text-xs"><Download size={13} aria-hidden /> {t('common.download')}</a>
              <button onClick={async () => { await navigator.clipboard.writeText(window.location.href); toast.success(t('repo.copyLink')); }} className="btn-secondary justify-center text-xs"><Share2 size={13} aria-hidden /> {t('common.share')}</button>
            </div>
          </section>
          {ex.expedition_id && (
            <Link href={`/media/expeditions/${ex.expedition_id}`} className="glass-panel glass-panel-hover flex items-center gap-3 rounded-2xl p-4">
              <Ship size={20} className="text-lime-300" aria-hidden />
              <span><span className="block text-sm font-semibold text-ice-100">Part of an expedition story</span><span className="text-xs text-ice-400">Follow the journey timeline →</span></span>
            </Link>
          )}
          {item.related.length > 0 && (
            <section className="glass-panel rounded-2xl p-4">
              <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-ice-300">{t('common.related')}</h2>
              {item.related.slice(0, 5).map((r) => <MiniContentRow key={r.id} item={r} />)}
            </section>
          )}
        </aside>
      </div>
      <Lightbox items={[card]} index={open} onClose={() => setOpen(null)} onIndex={() => {}} />
    </AppShell>
  );
}
