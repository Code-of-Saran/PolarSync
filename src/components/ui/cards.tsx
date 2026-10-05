'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Eye, MapPin, Play, Images, ChevronRight, User } from 'lucide-react';
import type { ContentCard as Card } from '@/lib/api';
import { contentHref, formatDate } from '@/lib/format';
import { useRegionLabel, useT } from '@/lib/i18n';
import { SmartImage, TypeBadge } from './primitives';
import { TiltCard, useCalm } from './motion';

export function ContentCard({ item, index = 0, compact = false }: { item: Card; index?: number; compact?: boolean }) {
  const t = useT();
  const region = useRegionLabel();
  const calm = useCalm();
  const href = contentHref(item);
  return (
    <motion.article
      initial={calm ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.04, duration: 0.45 }}
      className="h-full"
    >
      <TiltCard className="h-full rounded-2xl" max={5}>
        <Link href={href} className="glass-panel glass-panel-hover group flex h-full flex-col overflow-hidden rounded-2xl focus-visible:outline-none">
          <div className={`relative overflow-hidden ${compact ? 'h-32' : 'h-40'}`}>
            <SmartImage src={item.thumbnail} alt="" width={600} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" placeholderLabel={item.region} />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(2,11,24,0.92)] via-[rgba(2,11,24,0.25)] to-transparent" />
            <div className="absolute left-3 top-3"><TypeBadge type={item.content_type} /></div>
            {item.relevance !== undefined && (
              <span className="absolute right-3 top-3 rounded-md border border-cyan-300/30 bg-[rgba(2,11,24,0.7)] px-1.5 py-0.5 text-[10px] font-bold text-cyan-200">
                {item.relevance}% {t('common.relevant')}
              </span>
            )}
            {item.file_format && item.relevance === undefined && (
              <span className="absolute right-3 top-3 rounded-md border border-white/10 bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-ice-200">{item.file_format}</span>
            )}
          </div>
          <div className="flex flex-1 flex-col p-4">
            <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug text-ice-50 group-hover:text-white">{item.title}</h3>
            {!compact && <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-ice-400">{item.description}</p>}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {item.region && <span className="tag tag-region">{region(item.region)}</span>}
              {item.tags.slice(0, compact ? 1 : 2).map((tg) => <span key={tg} className="tag">{tg}</span>)}
            </div>
            <div className="mt-auto flex items-center justify-between gap-2 text-[11px] text-ice-500">
              <span className="flex min-w-0 items-center gap-2">
                {item.author && <span className="flex min-w-0 items-center gap-1 truncate"><User size={10} aria-hidden />{item.author.split(' ').slice(-1)[0]}</span>}
                {item.year && <span className="flex items-center gap-1"><Calendar size={10} aria-hidden />{item.year}</span>}
                {!!item.views && <span className="hidden items-center gap-1 sm:flex"><Eye size={10} aria-hidden />{item.views.toLocaleString('en-IN')}</span>}
              </span>
              <span className="flex shrink-0 items-center gap-0.5 font-semibold text-cyan-300 group-hover:text-cyan-200">{t('common.view')} <ChevronRight size={12} aria-hidden /></span>
            </div>
          </div>
        </Link>
      </TiltCard>
    </motion.article>
  );
}

export function MediaCard({ item, index = 0, tall = false, onOpen }: { item: Card; index?: number; tall?: boolean; onOpen?: (c: Card) => void }) {
  const t = useT();
  const calm = useCalm();
  const isVideo = item.content_type === 'video';
  const isPress = item.content_type === 'press_release';
  const inner = (
    <>
      <div className={`relative overflow-hidden ${tall ? 'aspect-[3/4]' : isPress ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}>
        <SmartImage src={item.thumbnail} alt={item.title} width={700} className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-110" placeholderLabel={item.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(2,11,24,0.95)] via-[rgba(2,11,24,0.15)] to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
        <div className="absolute left-3 top-3"><TypeBadge type={item.content_type} size="xs" /></div>
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-[rgba(0,180,216,0.35)] shadow-[0_0_40px_rgba(0,180,216,0.45)] backdrop-blur-md transition-transform group-hover:scale-110">
              <Play size={22} className="ml-1 text-white" fill="white" aria-hidden />
            </span>
          </div>
        )}
        {item.extra?.duration && <span className="absolute bottom-3 right-3 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white">{item.extra.duration}</span>}
        {item.extra?.image_count && <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white"><Images size={10} aria-hidden />{item.extra.image_count} {t('media.photos')}</span>}
        <div className="absolute inset-x-0 bottom-0 p-4 pr-20">
          <h3 className="line-clamp-2 font-space text-sm font-semibold leading-snug text-white sm:text-base">{item.title}</h3>
          <p className="mt-1 flex items-center gap-2 text-[11px] text-ice-300">
            <span className="flex min-w-0 items-center gap-1 truncate"><MapPin size={10} aria-hidden />{item.location_name || item.region}</span>
            {item.created_at && <span className="shrink-0">· {formatDate(item.created_at, { month: 'short', year: 'numeric' })}</span>}
          </p>
        </div>
      </div>
      {isPress && <p className="line-clamp-2 p-4 pt-3 text-xs leading-relaxed text-ice-400">{item.description}</p>}
    </>
  );
  return (
    <motion.article
      initial={calm ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: Math.min(index % 6, 5) * 0.05, duration: 0.5 }}
      className="mb-4 break-inside-avoid"
    >
      {onOpen ? (
        <button onClick={() => onOpen(item)} className="glass-panel glass-panel-hover group block w-full overflow-hidden rounded-2xl text-left" aria-label={`Open ${item.title}`}>{inner}</button>
      ) : (
        <Link href={contentHref(item)} className="glass-panel glass-panel-hover group block overflow-hidden rounded-2xl">{inner}</Link>
      )}
    </motion.article>
  );
}

export function MiniContentRow({ item, right }: { item: Card; right?: React.ReactNode }) {
  return (
    <Link href={contentHref(item)} className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-cyan-400/[0.06]">
      <SmartImage src={item.thumbnail} alt="" width={160} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-medium text-ice-100 group-hover:text-white">{item.title}</p>
        <div className="mt-0.5 flex items-center gap-2"><TypeBadge type={item.content_type} size="xs" /><span className="truncate text-[11px] text-ice-500">{item.region}{item.year ? ` · ${item.year}` : ''}</span></div>
      </div>
      {right ?? <ChevronRight size={14} className="shrink-0 text-cyan-400/40 group-hover:text-cyan-300" aria-hidden />}
    </Link>
  );
}
