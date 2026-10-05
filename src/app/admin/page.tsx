'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield, Clock, Upload, Globe2, Users, Sparkles, TrendingUp, Search, Download, ClipboardCheck, Image as ImageIcon, BookOpen,
  ArrowRight, Cpu, Database, RotateCcw, Loader2, BarChart3,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import { AreaChart, BarList, ChartCard, SERIES } from '@/components/charts';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useT } from '@/lib/i18n';
import { timeAgo } from '@/lib/format';
import InsightsPanel from '@/components/InsightsPanel';
import { ErrorState, PageHeader, Skeleton, StatCard, StatusBadge, TypeBadge } from '@/components/ui';

interface AdminDash {
  cards: { pending_reviews: number; new_contributions: number; published_content: number; total_users: number };
  recent_contributions: { id: string; status: string; submitted_at: string; content_id: string; title: string; content_type: string; region: string; submitter: string }[];
  search_activity: { date: string; count: number; live: number }[];
  content_activity: { date: string; count: number; live: number }[];
  popular_topics: { topic: string; searches: number }[];
  index: { documents: number; model: string; dimensions: number; build_ms: number; vocabulary_concepts: number; built_at: string };
}
function CommandCenter() {
  const t = useT();
  const { data, error, loading, reload } = useApi<AdminDash>('/api/dashboard/admin', { auth: true });
  const [resetting, setResetting] = useState(false);

  const reset = async () => {
    if (!confirm('Restore the original demo data? Submissions made during this session will be removed.')) return;
    setResetting(true);
    try { await api('/api/admin/reset-demo', { method: 'POST' }); toast.success('Demo data restored'); reload(); }
    catch (e) { toast.error((e as Error).message); } finally { setResetting(false); }
  };

  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  const c = data?.cards;
  return (
    <>
      <PageHeader eyebrow="Admin" icon={Shield} title={t('admin.title')} subtitle="Content operations, discovery activity and the review pipeline at a glance."
        actions={<>
          <Link href="/admin/review" className="btn-primary"><ClipboardCheck size={15} aria-hidden /> {t('admin.review')}{c ? ` (${c.pending_reviews})` : ''}</Link>
          <Link href="/analytics" className="btn-secondary"><BarChart3 size={15} aria-hidden /> {t('nav.analytics')}</Link>
        </>} />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading && !data ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />) : c && <>
          <StatCard label={t('admin.pending')} value={c.pending_reviews} icon={Clock} tone="amber" hint={<Link href="/admin/review" className="text-cyan-300 hover:underline">Review now →</Link>} />
          <StatCard label={t('admin.newContrib')} value={c.new_contributions} icon={Upload} tone="cyan" hint="last 30 days" delay={0.05} />
          <StatCard label={t('admin.published')} value={c.published_content} icon={Globe2} tone="emerald" hint="live in repository" delay={0.1} />
          <StatCard label={t('admin.users')} value={c.total_users} icon={Users} tone="violet" hint="contributors & curators" delay={0.15} />
        </>}
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <InsightsPanel />
        <section className="glass-panel rounded-2xl p-5" aria-label={t('admin.quickActions')}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ice-300">{t('admin.quickActions')}</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { href: '/contribute', icon: Upload, label: '+ Upload Content' },
              { href: '/admin/review', icon: ClipboardCheck, label: '+ Review Submission' },
              { href: '/contribute', icon: ImageIcon, label: '+ Add Media' },
              { href: '/education', icon: BookOpen, label: '+ Create Story' },
            ].map((a) => (
              <Link key={a.label} href={a.href} className="group flex items-center gap-2.5 rounded-xl border border-cyan-400/12 bg-white/[0.02] p-3 text-sm font-medium text-ice-200 transition-colors hover:border-cyan-400/35 hover:bg-cyan-400/[0.06]">
                <a.icon size={16} className="shrink-0 text-cyan-300" aria-hidden /><span className="truncate">{a.label}</span>
              </Link>
            ))}
          </div>
          {data?.index && (
            <div className="mt-4 rounded-xl border border-white/5 bg-black/15 p-3 text-[11px] text-ice-400">
              <p className="mb-1 flex items-center gap-1.5 font-semibold text-ice-200"><Cpu size={12} className="text-cyan-300" aria-hidden /> Semantic index</p>
              <p className="flex items-center gap-1.5"><Database size={11} aria-hidden /> {data.index.documents} records · {data.index.dimensions}-d · rebuilt in {data.index.build_ms} ms</p>
              <p className="truncate">{data.index.model}</p>
            </div>
          )}
          <button onClick={reset} disabled={resetting} className="mt-3 flex items-center gap-1.5 text-[11px] text-ice-500 hover:text-ice-200">
            {resetting ? <Loader2 size={11} className="animate-spin" aria-hidden /> : <RotateCcw size={11} aria-hidden />} Reset demo data
          </button>
        </section>
      </div>

      <div className="mb-6 grid gap-5 lg:grid-cols-2">
        <ChartCard title="Content activity" subtitle="Record views per day · last 14 days (includes simulated baseline)"
          table={data ? { headers: ['Date', 'Views', 'Live'], rows: data.content_activity.map((d) => [d.date, d.count, d.live]) } : undefined}>
          {data ? <AreaChart data={data.content_activity} label="Views" color={SERIES[0]} /> : <Skeleton className="h-36" />}
        </ChartCard>
        <ChartCard title="Search activity" subtitle="Searches per day · last 14 days (includes simulated baseline)"
          table={data ? { headers: ['Date', 'Searches', 'Live'], rows: data.search_activity.map((d) => [d.date, d.count, d.live]) } : undefined}>
          {data ? <AreaChart data={data.search_activity} label="Searches" color={SERIES[2]} /> : <Skeleton className="h-36" />}
        </ChartCard>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <ChartCard title="Popular topics" subtitle="Search volume mapped to vocabulary concepts · 30 days"
          table={data ? { headers: ['Topic', 'Searches'], rows: data.popular_topics.map((p) => [p.topic, p.searches]) } : undefined}>
          {data ? <BarList data={data.popular_topics.map((p) => ({ label: p.topic, value: p.searches }))} /> : <Skeleton className="h-48" />}
        </ChartCard>
        <section className="glass-panel rounded-2xl p-5" aria-label="Recent contributions">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-space text-sm font-semibold text-ice-50">Recent contributions</h2>
            <Link href="/admin/review" className="flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:text-cyan-100">{t('admin.review')} <ArrowRight size={11} aria-hidden /></Link>
          </div>
          <ul className="divide-y divide-white/5">
            {(data?.recent_contributions || []).map((r) => (
              <li key={r.id} className="flex flex-col gap-1.5 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ice-100">{r.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-ice-500"><TypeBadge type={r.content_type} size="xs" /> {r.submitter} · {timeAgo(r.submitted_at)}</p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

export default function AdminPage() {
  return (
    <AppShell>
      <AuthGate role="admin" title="Curator access required" reason="The command center is available to repository curators.">
        <CommandCenter />
      </AuthGate>
    </AppShell>
  );
}
