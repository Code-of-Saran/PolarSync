'use client';
import { use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPin, Calendar, ArrowLeft, Map, FileText, Database, BarChart3, Image as ImageIcon, BookOpen, Ship, Layers, Search } from 'lucide-react';
import AppShell from '@/components/AppShell';
import type { ContentCard as Card, Location } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useRegionLabel, useT, type TKey } from '@/lib/i18n';
import { CATEGORY_HEX, imgUrl } from '@/lib/format';
import { useAppStore } from '@/lib/store';
import { ContentCard, ErrorState, MediaCard, ParallaxSection, RevealOnScroll, SectionHeader, Skeleton, SmartImage } from '@/components/ui';

interface LocationDetail extends Location { content: Record<string, Card[]>; counts: Record<string, number>; total_linked: number; top_topics: string[]; nearby: Location[] }

const GROUPS: { key: string; icon: typeof FileText }[] = [
  { key: 'research', icon: FileText }, { key: 'datasets', icon: Database }, { key: 'reports', icon: BarChart3 },
  { key: 'media', icon: ImageIcon }, { key: 'learn', icon: BookOpen }, { key: 'expeditions', icon: Ship },
];

export default function LocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const region = useRegionLabel();
  const low = useAppStore((s) => s.lowBandwidth);
  const { data, error, loading, reload } = useApi<LocationDetail>(`/api/locations/${id}`);

  if (error) return <AppShell><ErrorState message={error.message} onRetry={reload} /></AppShell>;
  if (loading || !data) return <AppShell><Skeleton className="mb-6 h-72 rounded-3xl" /><Skeleton className="h-64 rounded-2xl" /></AppShell>;

  const present = GROUPS.filter((g) => data.content[g.key]?.length);
  return (
    <AppShell fullBleed>
      <ParallaxSection image={imgUrl(data.image, 1800, low)} height="min-h-[420px] sm:min-h-[480px]">
        <div className="mx-auto flex h-full min-h-[420px] max-w-screen-2xl flex-col justify-end px-4 pb-10 sm:min-h-[480px] sm:px-8">
          <Link href="/explore/map" className="mb-auto mt-6 flex w-fit items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs text-ice-100 backdrop-blur hover:bg-black/60"><ArrowLeft size={13} aria-hidden /> {t('nav.map')}</Link>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: CATEGORY_HEX[data.category], borderColor: `${CATEGORY_HEX[data.category]}66` }}>
              <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_HEX[data.category] }} />{t(`map.cat.${data.category}` as TKey)}
            </span>
            <h1 className="font-space text-4xl font-bold text-white sm:text-5xl">{data.name}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ice-200">
              <span className="flex items-center gap-1.5"><MapPin size={14} aria-hidden />{region(data.region)} · {data.lat.toFixed(3)}°, {data.lng.toFixed(3)}°</span>
              {data.established && <span className="flex items-center gap-1.5"><Calendar size={14} aria-hidden />Est. {data.established}</span>}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ice-200 sm:text-base">{data.description}</p>
          </motion.div>
        </div>
      </ParallaxSection>

      <div className="mx-auto max-w-screen-2xl space-y-10 px-4 py-8 sm:px-8">
        {/* Knowledge tree */}
        <RevealOnScroll className="glass-panel rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="lg:w-64">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">Connected knowledge</p>
              <p className="font-space text-4xl font-bold text-ice-50">{data.total_linked}</p>
              <p className="text-sm text-ice-400">records anchored to {data.name}</p>
              <Link href={`/search?q=${encodeURIComponent(data.name)}`} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-100"><Search size={12} aria-hidden /> Search everything about it</Link>
            </div>
            <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {GROUPS.map((g, i) => (
                <motion.a key={g.key} href={data.counts[g.key] ? `#g-${g.key}` : undefined} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                  className={`rounded-xl border p-3 text-center ${data.counts[g.key] ? 'border-cyan-400/20 bg-cyan-400/[0.05] hover:border-cyan-300/45' : 'border-white/5 opacity-50'}`}>
                  <g.icon size={18} className="mx-auto mb-1 text-cyan-300" aria-hidden />
                  <p className="font-space text-2xl font-bold text-ice-50">{data.counts[g.key] || 0}</p>
                  <p className="text-[11px] text-ice-400">{t(`group.${g.key}` as TKey)}</p>
                </motion.a>
              ))}
            </div>
          </div>
          {data.top_topics.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
              <Layers size={13} className="text-ice-500" aria-hidden />
              {data.top_topics.map((tp) => <Link key={tp} href={`/search?q=${encodeURIComponent(`${tp} ${data.name}`)}`} className="tag hover:border-cyan-300/50">{tp}</Link>)}
            </div>
          )}
          {data.research_areas && <p className="mt-3 text-xs text-ice-400">{t('map.research')}: {data.research_areas.join(' · ')}</p>}
        </RevealOnScroll>

        {present.map((g) => (
          <section key={g.key} id={`g-${g.key}`} className="scroll-mt-24">
            <SectionHeader icon={g.icon} title={t(`group.${g.key}` as TKey)} subtitle={`${data.counts[g.key]} linked to ${data.name}`} />
            {g.key === 'media' ? (
              <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
                {data.content[g.key].map((c, i) => <MediaCard key={c.id} item={{ ...c, location_name: data.name }} index={i} />)}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.content[g.key].map((c, i) => <ContentCard key={c.id} item={c} index={i} />)}
              </div>
            )}
          </section>
        ))}
        {present.length === 0 && <p className="text-sm text-ice-400">No published records are linked to this location yet.</p>}

        {data.nearby.length > 0 && (
          <section>
            <SectionHeader icon={Map} title={`More in ${region(data.region)}`} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.nearby.map((l) => (
                <Link key={l.id} href={`/explore/location/${l.id}`} className="glass-panel glass-panel-hover group flex items-center gap-3 rounded-xl p-2.5">
                  <SmartImage src={l.image} alt="" width={160} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                  <span className="min-w-0"><span className="block truncate text-sm font-medium text-ice-100 group-hover:text-white">{l.name}</span><span className="text-[11px] text-ice-500">{t(`map.cat.${l.category}` as TKey)}</span></span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
