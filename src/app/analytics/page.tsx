'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, Database, FileText, Image as ImageIcon, Eye, Search, Download, PlayCircle, Info, Layers, MapPin } from 'lucide-react';
import AppShell from '@/components/AppShell';
import InsightsPanel from '@/components/InsightsPanel';
import { AreaChart, BarList, ChartCard, SERIES, StackedColumns } from '@/components/charts';
import { useApi } from '@/lib/useApi';
import { useT, type TKey } from '@/lib/i18n';
import { ErrorState, PageHeader, Skeleton, SmartImage, StatCard, TypeBadge } from '@/components/ui';

interface Analytics {
  totals: Record<string, number>;
  by_group: Record<string, number>; by_region: Record<string, number>; by_research_area: Record<string, number>;
  popular_topics: { topic: string; count: number }[]; search_topics: { topic: string; searches: number }[];
  top_queries: { query: string; n: number }[];
  most_viewed: { id: string; title: string; content_type: string; region: string; views: number; downloads: number; thumbnail: string }[];
  engagement: Record<string, { total: number; live: number }>;
  series: Record<string, { date: string; count: number; live: number }[]>;
  monthly_publications: Record<string, number | string>[];
  simulated_share: number; note: string;
}

const GROUP_KEYS = ['research', 'datasets', 'reports', 'media', 'learn', 'expeditions'];

export default function AnalyticsPage() {
  const t = useT();
  const router = useRouter();
  const { data, error, loading, reload } = useApi<Analytics>('/api/analytics');
  const groupLabels = Object.fromEntries(GROUP_KEYS.map((k) => [k, t(`group.${k}` as TKey)]));

  const ENG = [
    { key: 'view', label: 'Views', icon: Eye, color: SERIES[0] },
    { key: 'search', label: 'Searches', icon: Search, color: SERIES[2] },
    { key: 'download', label: 'Downloads', icon: Download, color: SERIES[3] },
    { key: 'media_play', label: 'Media plays', icon: PlayCircle, color: SERIES[4] },
  ];

  return (
    <AppShell>
      <PageHeader eyebrow="Insights" icon={BarChart3} title={t('nav.analytics')} subtitle="What is in the repository, how people discover it, and what they engage with." />
      {error ? <ErrorState message={error.message} onRetry={reload} /> : loading && !data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      ) : data && (
        <div className="space-y-6">
          <div role="note" className="flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-400/[0.06] px-4 py-2.5 text-xs text-amber-100">
            <Info size={14} className="mt-0.5 shrink-0" aria-hidden />
            <span><strong>Prototype analytics.</strong> {data.note} ({Math.round(data.simulated_share * 100)}% of 30-day events are simulated.)</span>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total published content" value={data.totals.content} icon={Layers} tone="cyan" hint={`${data.totals.locations} linked map locations`} />
            <StatCard label="Research papers" value={data.totals.papers} icon={FileText} tone="cyan" delay={0.05} hint={`+ ${data.totals.reports} reports`} />
            <StatCard label="Datasets" value={data.totals.datasets} icon={Database} tone="emerald" delay={0.1} />
            <StatCard label="Media items" value={data.totals.media} icon={ImageIcon} tone="violet" delay={0.15} hint={`${data.totals.learning} learning resources`} />
          </div>

          <section aria-labelledby="eng-h">
            <h2 id="eng-h" className="mb-3 font-space text-base font-semibold text-ice-50">User engagement · last 30 days</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {ENG.map((e) => (
                <ChartCard key={e.key} title={e.label} subtitle={`${data.engagement[e.key]?.total.toLocaleString('en-IN')} total · ${data.engagement[e.key]?.live} live this demo`}
                  table={{ headers: ['Date', e.label], rows: data.series[e.key].map((d) => [d.date, d.count]) }}
                  action={<e.icon size={15} className="text-ice-400" aria-hidden />}>
                  <AreaChart data={data.series[e.key]} label={e.label} color={e.color} height={120} />
                </ChartCard>
              ))}
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-3">
            <ChartCard title="Content distribution" subtitle="Published records by content group"
              table={{ headers: ['Group', 'Records'], rows: GROUP_KEYS.map((k) => [groupLabels[k], data.by_group[k] || 0]) }}>
              <BarList data={GROUP_KEYS.map((k) => ({ label: groupLabels[k], value: data.by_group[k] || 0 }))} />
            </ChartCard>
            <ChartCard title="By region" subtitle="All published records · click to filter search"
              table={{ headers: ['Region', 'Records'], rows: Object.entries(data.by_region) }}>
              <BarList data={Object.entries(data.by_region).map(([k, v]) => ({ label: k, value: v }))} onSelect={(r) => router.push(`/search?q=${encodeURIComponent(r)}&region=${encodeURIComponent(r)}`)} />
            </ChartCard>
            <ChartCard title="By research area" subtitle="Papers, datasets & reports"
              table={{ headers: ['Area', 'Records'], rows: Object.entries(data.by_research_area) }}>
              <BarList data={Object.entries(data.by_research_area).map(([k, v]) => ({ label: k, value: v }))} />
            </ChartCard>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <ChartCard title="Publications per month" subtitle="Last 12 months, by content group"
              table={{ headers: ['Month', ...GROUP_KEYS.map((k) => groupLabels[k])], rows: data.monthly_publications.map((m) => [String(m.month), ...GROUP_KEYS.map((k) => Number(m[k] || 0))]) }}>
              <StackedColumns data={data.monthly_publications} keys={GROUP_KEYS} labels={groupLabels} />
            </ChartCard>
            <InsightsPanel compact />
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <ChartCard title="Popular topics" subtitle="Tag frequency across published content"
              table={{ headers: ['Topic', 'Records'], rows: data.popular_topics.map((p) => [p.topic, p.count]) }}>
              <BarList data={data.popular_topics.slice(0, 8).map((p) => ({ label: p.topic, value: p.count }))} onSelect={(tp) => router.push(`/search?q=${encodeURIComponent(tp)}`)} />
            </ChartCard>
            <ChartCard title="Most searched topics" subtitle="Queries mapped to vocabulary concepts"
              table={{ headers: ['Topic', 'Searches'], rows: data.search_topics.map((p) => [p.topic, p.searches]) }}>
              <BarList color={SERIES[2]} data={data.search_topics.slice(0, 8).map((p) => ({ label: p.topic, value: p.searches }))} />
            </ChartCard>
            <section className="glass-panel rounded-2xl p-5" aria-label="Top queries">
              <h2 className="mb-3 font-space text-sm font-semibold text-ice-50">Top search queries</h2>
              <ol className="space-y-1.5">
                {data.top_queries.map((q, i) => (
                  <li key={q.query}>
                    <Link href={`/search?q=${encodeURIComponent(q.query)}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-ice-200 hover:bg-white/[0.03]">
                      <span className="w-4 text-right text-[11px] tabular-nums text-ice-500">{i + 1}</span>
                      <span className="flex-1 truncate">{q.query}</span>
                      <span className="text-[11px] tabular-nums text-ice-400">{q.n}</span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <section className="glass-panel rounded-2xl p-5" aria-labelledby="mv-h">
            <h2 id="mv-h" className="mb-3 font-space text-sm font-semibold text-ice-50">Most viewed content</h2>
            <ol className="grid gap-x-6 sm:grid-cols-2">
              {data.most_viewed.map((m, i) => (
                <li key={m.id}>
                  <Link href={m.content_type === 'photo' || m.content_type === 'video' ? `/media/${m.id}` : `/repository/${m.id}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/[0.03]">
                    <span className="w-5 text-right font-space text-sm font-bold tabular-nums text-ice-500">{i + 1}</span>
                    <SmartImage src={m.thumbnail} alt="" width={120} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ice-100">{m.title}</span>
                      <span className="flex items-center gap-2 text-[11px] text-ice-500"><TypeBadge type={m.content_type} size="xs" /><MapPin size={10} aria-hidden />{m.region}</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs tabular-nums text-ice-300"><Eye size={11} aria-hidden />{m.views.toLocaleString('en-IN')}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </AppShell>
  );
}
