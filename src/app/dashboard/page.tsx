'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, FileText, Clock, CheckCircle2, PencilLine, Eye, Download, MessageSquare, ArrowRight, AlertTriangle } from 'lucide-react';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import { useApi } from '@/lib/useApi';
import { useT } from '@/lib/i18n';
import { formatDate, timeAgo } from '@/lib/format';
import { EmptyState, ErrorState, Segmented, Skeleton, SmartImage, StatCard, StatusBadge, TypeBadge } from '@/components/ui';

interface Dash {
  user: { name: string; organization: string; title?: string; role: string };
  stats: { total: number; under_review: number; published: number; drafts: number; rejected: number; changes_requested: number; total_views: number; total_downloads: number };
  items: { id: string; title: string; content_type: string; region: string; status: string; views: number; downloads: number; updated_at: string; thumbnail: string }[];
  recent_reviews: { decision: string; comments: string; created_at: string; title: string; content_id: string }[];
}

function Dashboard() {
  const t = useT();
  const { data, error, loading, reload } = useApi<Dash>('/api/dashboard', { auth: true });
  const [tab, setTab] = useState('all');
  if (error) return <ErrorState message={error.message} onRetry={reload} />;
  if (loading || !data) return <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>;
  const s = data.stats;
  const items = data.items.filter((i) => tab === 'all' || i.status === tab || (tab === 'under_review' && i.status === 'changes_requested'));
  const first = data.user.name.replace('Dr. ', '').split(' ')[0];

  return (
    <>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-ice-400">{t('dash.welcome')},</p>
          <h1 className="font-space text-3xl font-bold text-gradient-white sm:text-4xl">{first}</h1>
          <p className="mt-1 text-sm text-ice-400">{data.user.title} · {data.user.organization}</p>
        </div>
        <Link href="/contribute" className="btn-primary self-start"><Plus size={16} aria-hidden /> {t('dash.uploadNew')}</Link>
      </motion.div>

      <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t('dash.total')} value={s.total} icon={FileText} tone="cyan" />
        <StatCard label={t('dash.review')} value={s.under_review} icon={Clock} tone="amber" delay={0.05} hint={s.changes_requested ? `${s.changes_requested} need changes` : undefined} />
        <StatCard label={t('dash.published')} value={s.published} icon={CheckCircle2} tone="emerald" delay={0.1} hint={`${s.total_views.toLocaleString('en-IN')} views · ${s.total_downloads.toLocaleString('en-IN')} downloads`} />
        <StatCard label={t('dash.drafts')} value={s.drafts} icon={PencilLine} tone="slate" delay={0.15} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <section className="glass-panel rounded-2xl p-4 sm:p-5" aria-labelledby="contrib-h">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 id="contrib-h" className="font-space text-base font-semibold text-ice-50">{t('dash.recent')}</h2>
            <Segmented label="Filter contributions" size="sm" value={tab} onChange={setTab}
              options={[{ value: 'all', label: t('common.all') }, { value: 'published', label: t('status.published') }, { value: 'under_review', label: t('status.under_review') }, { value: 'draft', label: t('status.draft') }]} />
          </div>
          {items.length === 0 ? <EmptyState title="Nothing here yet" action={<Link href="/contribute" className="btn-secondary text-xs">{t('dash.uploadNew')}</Link>} /> : (
            <ul className="divide-y divide-white/5">
              {items.map((it, i) => (
                <motion.li key={it.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <Link href={`/repository/${it.id}`} className="flex items-center gap-3 rounded-xl px-1 py-3 hover:bg-white/[0.02]">
                    <SmartImage src={it.thumbnail} alt="" width={140} className="hidden h-12 w-12 shrink-0 rounded-lg object-cover sm:block" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ice-100">{it.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ice-500"><TypeBadge type={it.content_type} size="xs" />{it.region} · {timeAgo(it.updated_at)}</p>
                    </div>
                    {it.status === 'published' && <span className="hidden items-center gap-3 text-[11px] tabular-nums text-ice-400 md:flex"><span className="flex items-center gap-1"><Eye size={11} aria-hidden />{it.views}</span><span className="flex items-center gap-1"><Download size={11} aria-hidden />{it.downloads}</span></span>}
                    <StatusBadge status={it.status} />
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <section className="glass-panel rounded-2xl p-5" aria-labelledby="fb-h">
            <h2 id="fb-h" className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ice-300"><MessageSquare size={13} aria-hidden /> Curator feedback</h2>
            {data.recent_reviews.length === 0 ? <p className="text-xs text-ice-500">No reviews yet.</p> : (
              <ul className="space-y-3">
                {data.recent_reviews.map((r, i) => (
                  <li key={i} className="rounded-xl border border-white/5 bg-black/15 p-3">
                    <div className="mb-1 flex items-center justify-between gap-2"><StatusBadge status={r.decision} /><span className="text-[10px] text-ice-500">{formatDate(r.created_at)}</span></div>
                    <p className="truncate text-xs font-medium text-ice-100">{r.title}</p>
                    {r.comments && <p className="mt-1 text-[11px] italic text-ice-400">“{r.comments}”</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
          {s.changes_requested > 0 && (
            <div className="flex items-start gap-2 rounded-2xl border border-orange-400/25 bg-orange-500/10 p-4 text-xs text-orange-100">
              <AlertTriangle size={15} className="shrink-0" aria-hidden /> {s.changes_requested} submission needs changes before it can be published.
            </div>
          )}
          <Link href="/search" className="glass-panel glass-panel-hover flex items-center justify-between rounded-2xl p-4 text-sm text-ice-200">
            See how your published work is discovered <ArrowRight size={14} className="text-cyan-300" aria-hidden />
          </Link>
        </aside>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <AppShell>
      <AuthGate role="contributor" title="Sign in to your dashboard" reason="Track your submissions, reviews and published impact.">
        <Dashboard />
      </AuthGate>
    </AppShell>
  );
}
