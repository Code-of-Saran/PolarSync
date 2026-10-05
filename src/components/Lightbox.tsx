'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MapPin, Calendar, Camera, ArrowRight, Play, Maximize2 } from 'lucide-react';
import { trackEvent, type ContentCard } from '@/lib/api';
import { contentHref, formatDate, imgUrl } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { TypeBadge } from '@/components/ui';

export function mediaFrames(item: ContentCard): string[] {
  const g = (item.extra?.gallery as string[] | undefined) || [];
  return g.length ? g : item.thumbnail ? [item.thumbnail] : [];
}

/** Video player: real file when available, otherwise a clearly-labelled cinematic preview. */
export function VideoStage({ item, frames }: { item: ContentCard; frames: string[] }) {
  const low = useAppStore((s) => s.lowBandwidth);
  const [playing, setPlaying] = useState(false);
  const src = item.extra?.video_url as string | undefined;
  useEffect(() => { if (playing) trackEvent('media_play', item.id); }, [playing, item.id]);
  if (src) {
    return <video src={src} controls autoPlay={!low} poster={imgUrl(item.thumbnail, 1600, low)} className="max-h-full max-w-full rounded-xl" aria-label={item.title} />;
  }
  return (
    <div className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-xl bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imgUrl(frames[0] || item.thumbnail, 1600, low)} alt={item.title} className={`h-full w-full object-cover ${playing ? 'kenburns' : ''}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
      {!playing ? (
        <button onClick={() => setPlaying(true)} className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white" aria-label={`Play preview of ${item.title}`}>
          <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-[rgba(0,180,216,0.45)] shadow-[0_0_60px_rgba(0,180,216,0.5)] backdrop-blur-md transition-transform hover:scale-105">
            <Play size={32} className="ml-1.5" fill="white" aria-hidden />
          </span>
          <span className="rounded-full bg-black/50 px-3 py-1 text-xs">Play preview · {item.extra?.duration}</span>
        </button>
      ) : (
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="mb-2 h-1 overflow-hidden rounded-full bg-white/20"><motion.div className="h-full bg-cyan-300" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 16, ease: 'linear' }} /></div>
          <p className="text-[11px] text-white/80">Cinematic preview — the full video file is not included in the prototype sample data. Uploaded videos play natively.</p>
        </div>
      )}
    </div>
  );
}

export default function Lightbox({ items, index, onClose, onIndex }: { items: ContentCard[]; index: number | null; onClose: () => void; onIndex: (i: number) => void }) {
  const low = useAppStore((s) => s.lowBandwidth);
  const item = index !== null ? items[index] : null;
  const [frame, setFrame] = useState(0);
  const frames = item ? mediaFrames(item) : [];

  useEffect(() => { setFrame(0); }, [index]);
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') { if (frame < frames.length - 1) setFrame(frame + 1); else if (index < items.length - 1) onIndex(index + 1); }
      if (e.key === 'ArrowLeft') { if (frame > 0) setFrame(frame - 1); else if (index > 0) onIndex(index - 1); }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [index, frame, frames.length, items.length, onClose, onIndex]);

  return (
    <AnimatePresence>
      {item && index !== null && (
        <motion.div role="dialog" aria-modal="true" aria-label={item.title} className="fixed inset-0 z-[95] flex flex-col bg-[rgba(1,6,14,0.96)]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2"><TypeBadge type={item.content_type} size="xs" /><span className="truncate text-sm text-ice-200">{item.title}</span></div>
            <div className="flex items-center gap-1">
              <span className="mr-2 text-xs tabular-nums text-ice-500">{index + 1} / {items.length}</span>
              <Link href={contentHref(item)} className="rounded-lg p-2 text-ice-300 hover:bg-white/10" aria-label="Open detail page"><Maximize2 size={17} /></Link>
              <button onClick={onClose} className="rounded-lg p-2 text-ice-300 hover:bg-white/10" aria-label="Close" autoFocus><X size={20} /></button>
            </div>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
            <button onClick={() => (frame > 0 ? setFrame(frame - 1) : index > 0 && onIndex(index - 1))} disabled={index === 0 && frame === 0}
              className="absolute left-2 z-10 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 disabled:opacity-20 sm:left-4" aria-label="Previous"><ChevronLeft size={22} /></button>
            <AnimatePresence mode="wait">
              <motion.div key={`${item.id}-${frame}`} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }}
                className="flex h-full w-full items-center justify-center">
                {item.content_type === 'video' ? <VideoStage item={item} frames={frames} /> : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgUrl(frames[frame], 1800, low)} alt={`${item.title}${frames.length > 1 ? ` — image ${frame + 1} of ${frames.length}` : ''}`} className="max-h-full max-w-full rounded-xl object-contain shadow-2xl" />
                )}
              </motion.div>
            </AnimatePresence>
            <button onClick={() => (frame < frames.length - 1 ? setFrame(frame + 1) : index < items.length - 1 && onIndex(index + 1))} disabled={index === items.length - 1 && frame === frames.length - 1}
              className="absolute right-2 z-10 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 disabled:opacity-20 sm:right-4" aria-label="Next"><ChevronRight size={22} /></button>
          </div>

          <div className="mx-auto w-full max-w-5xl px-4 pb-5 pt-3">
            {frames.length > 1 && item.content_type !== 'video' && (
              <div className="mb-3 flex justify-center gap-2">
                {frames.map((f, i) => (
                  <button key={f + i} onClick={() => setFrame(i)} aria-label={`Image ${i + 1}`} aria-current={i === frame}
                    className={`h-12 w-16 overflow-hidden rounded-md border-2 ${i === frame ? 'border-cyan-300' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl(f, 160, low)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm leading-relaxed text-ice-200">{item.extra?.caption || item.description}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ice-500">
                  <span className="flex items-center gap-1"><MapPin size={11} aria-hidden />{item.location_name || item.region}</span>
                  {item.created_at && <span className="flex items-center gap-1"><Calendar size={11} aria-hidden />{formatDate(item.created_at)}</span>}
                  {item.extra?.photographer && <span className="flex items-center gap-1"><Camera size={11} aria-hidden />{item.extra.photographer}</span>}
                </p>
              </div>
              <Link href={contentHref(item)} className="btn-secondary shrink-0 px-3 py-1.5 text-xs">Details <ArrowRight size={12} aria-hidden /></Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
