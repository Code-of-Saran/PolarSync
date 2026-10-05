'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ClipboardCheck, Clock, CheckCircle2, XCircle, AlertTriangle, User, Calendar, MapPin, FileDown, Loader2, Sparkles, Search,
  ArrowRight, RefreshCw, Bot, UserCheck, ShieldCheck, ChevronRight, Building2, MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import AIAnalysisPanel, { type AIEditorState } from '@/components/AIAnalysisPanel';
import { api, type AIAnalysis, type Location } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useT, type TKey } from '@/lib/i18n';
import { REGIONS, RESEARCH_AREAS, cn, formatDate, timeAgo } from '@/lib/format';
import { EmptyState, ErrorState, PageHeader, Segmented, Skeleton, SmartImage, StatusBadge, TypeBadge } from '@/components/ui';

interface QueueItem {
  submission_id: string; submission_status: string; submitted_at: string; notes?: string; ai_analysis: AIAnalysis | null;
  submitter_name: string; submitter_org?: string; id: string; title: string; description?: string; abstract?: string; content_type: string;
  region?: string; research_area?: string; author?: string; organization?: string; year?: number; tags: string[]; thumbnail?: string;
  file_url?: string; file_name?: string; file_size?: string; license?: string; access_level?: string; location_ids: string[];
  ai_summary?: string; status: string; last_review?: { decision: string; comments?: string; created_at: string; reviewer: string } | null;
}
interface Queue { items: QueueItem[]; counts: Record<string, number> }

type Tab = 'pending' | 'approved' | 'changes_requested' | 'rejected';

function ReviewPanel({ item, locations, onDecided }: { item: QueueItem; locations: Location[]; onDecided: (r: { status: string; content_id: string; indexed: boolean; index_size: number }) => void }) {
  const t = useT();
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(item.ai_analysis);
  const [editor, setEditor] = useState<AIEditorState>({
    tags: item.tags.length ? item.tags : (item.ai_analysis?.tags || []).filter((x) => x.confidence >= 0.55).map((x) => x.tag),
    summary: item.ai_summary || item.ai_analysis?.summary || '',
  });
  const [title, setTitle] = useState(item.title);
  const [ctype, setCtype] = useState(item.content_type);
  const [region, setRegion] = useState(item.region || item.ai_analysis?.classification.region.label || '');
  const [area, setArea] = useState(item.research_area || item.ai_analysis?.classification.research_area.label || '');
  const [locs, setLocs] = useState<string[]>(item.location_ids?.length ? item.location_ids : item.ai_analysis?.suggested_location_ids || []);
  const [comments, setComments] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const pending = item.submission_status === 'pending';

  const reanalyze = async () => {
    setBusy('ai');
    try {
      const a = await api<AIAnalysis>(`/api/reviews/${item.submission_id}/reanalyze`, { method: 'POST' });
      setAnalysis(a); toast.success('AI analysis refreshed');
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  };

  const decide = async (decision: 'approved' | 'rejected' | 'changes_requested') => {
    if (decision !== 'approved' && !comments.trim()) { toast.error('Please add a comment for the contributor'); return; }
    setBusy(decision);
    try {
      const res = await api<{ status: string; content_id: string; indexed: boolean; index_size: number }>(`/api/reviews/${item.submission_id}`, {
        method: 'POST',
        json: { decision, comments: comments || (decision === 'approved' ? 'Approved after AI-assisted review.' : null),
          edits: { title, tags: editor.tags, ai_summary: editor.summary, region: region || null, research_area: area || null, content_type: ctype, location_ids: locs } },
      });
      onDecided(res);
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-4">
      {/* Content preview */}
      <section className="glass-panel overflow-hidden rounded-2xl" aria-label="Content preview">
        <div className="relative h-40">
          <SmartImage src={item.thumbnail} alt="" width={900} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(2,11,24,0.95)] to-transparent" />
          <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center gap-2"><TypeBadge type={item.content_type} /><StatusBadge status={item.submission_status} /></div>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label htmlFor="rv-title" className="field-label">Title</label>
            <input id="rv-title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!pending} className="polar-input font-space text-base font-semibold" />
          </div>
          <div className="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
            {[
              { i: User, l: 'Contributor', v: item.submitter_name },
              { i: Building2, l: 'Organization', v: item.organization || item.submitter_org },
              { i: Calendar, l: 'Submitted', v: `${formatDate(item.submitted_at)} · ${timeAgo(item.submitted_at)}` },
              { i: FileDown, l: 'File', v: item.file_name ? `${item.file_name} (${item.file_size || '—'})` : 'Metadata only' },
            ].map((m) => (
              <div key={m.l} className="flex min-w-0 items-center gap-2"><m.i size={12} className="shrink-0 text-cyan-300" aria-hidden /><span className="text-ice-500">{m.l}:</span><span className="truncate text-ice-200">{m.v}</span></div>
            ))}
          </div>
          {item.file_url && <a href={item.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-100"><FileDown size={13} aria-hidden /> Open uploaded file</a>}
          <div>
            <p className="field-label">Description</p>
            <p className="text-sm leading-relaxed text-ice-300">{item.description}</p>
          </div>
          {item.abstract && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-semibold text-cyan-300">Full abstract</summary>
              <p className="mt-2 text-sm leading-relaxed text-ice-400">{item.abstract}</p>
            </details>
          )}
          {item.notes && <p className="flex items-start gap-2 rounded-lg bg-white/[0.03] p-2.5 text-xs text-ice-400"><MessageSquare size={12} className="mt-0.5 shrink-0" aria-hidden /> “{item.notes}”</p>}
          {pending && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div><label htmlFor="rv-type" className="field-label">{t('common.contentType')}</label>
                <select id="rv-type" value={ctype} onChange={(e) => setCtype(e.target.value)} className="polar-input py-2 text-xs">
                  {['paper', 'dataset', 'report', 'photo', 'video', 'press_release'].map((v) => <option key={v} value={v}>{t(`type.${v}` as TKey)}</option>)}
                </select></div>
              <div><label htmlFor="rv-region" className="field-label">{t('common.region')}</label>
                <select id="rv-region" value={region} onChange={(e) => setRegion(e.target.value)} className="polar-input py-2 text-xs"><option value="">—</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></div>
              <div><label htmlFor="rv-area" className="field-label">{t('common.researchArea')}</label>
                <select id="rv-area" value={area} onChange={(e) => setArea(e.target.value)} className="polar-input py-2 text-xs"><option value="">—</option>{RESEARCH_AREAS.map((r) => <option key={r}>{r}</option>)}</select></div>
            </div>
          )}
        </div>
      </section>

      {analysis ? (
        <>
          {pending && (
            <div className="flex justify-end">
              <button onClick={reanalyze} disabled={!!busy} className="flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300 hover:text-cyan-100">
                {busy === 'ai' ? <Loader2 size={12} className="animate-spin" aria-hidden /> : <RefreshCw size={12} aria-hidden />} Re-run AI analysis
              </button>
            </div>
          )}
          <AIAnalysisPanel analysis={analysis} state={editor} onChange={setEditor} locations={locations} selectedLocations={locs} compact
            onToggleLocation={pending ? (id) => setLocs((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id])) : undefined}
            onApplyClassification={pending ? (f, v) => { if (f === 'content_type') setCtype(v); if (f === 'region') setRegion(v); if (f === 'research_area') setArea(v); toast.success(`Applied ${v}`); } : undefined} />
        </>
      ) : (
        <div className="glass-panel rounded-2xl p-5 text-sm text-ice-400">No AI analysis stored for this historical submission.</div>
      )}

      {item.last_review && (
        <div className="glass-panel rounded-2xl p-4 text-xs text-ice-300">
          <p className="mb-1 font-semibold text-ice-100">Last decision: <StatusBadge status={item.last_review.decision} /></p>
          <p>“{item.last_review.comments}” — {item.last_review.reviewer}, {formatDate(item.last_review.created_at)}</p>
        </div>
      )}

      {pending && (
        <section className="glass-panel space-y-3 rounded-2xl p-5" aria-label="Review decision">
          <h2 className="flex items-center gap-2 font-space font-semibold text-ice-50"><UserCheck size={16} className="text-cyan-300" aria-hidden /> Human review decision</h2>
          <label htmlFor="rv-comments" className="sr-only">Comments to contributor</label>
          <textarea id="rv-comments" rows={2} value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Comments to the contributor (required for changes / rejection)" className="polar-input resize-y text-sm" />
          <div className="grid gap-2 sm:grid-cols-3">
            <button onClick={() => decide('approved')} disabled={!!busy} className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-500/15 py-3 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/25 disabled:opacity-60">
              {busy === 'approved' ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <CheckCircle2 size={16} aria-hidden />} {t('admin.approve')}
            </button>
            <button onClick={() => decide('changes_requested')} disabled={!!busy} className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 py-3 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-500/20 disabled:opacity-60">
              {busy === 'changes_requested' ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <AlertTriangle size={16} aria-hidden />} {t('admin.requestChanges')}
            </button>
            <button onClick={() => decide('rejected')} disabled={!!busy} className="flex items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 py-3 text-sm font-semibold text-rose-100 transition-colors hover:bg-rose-500/20 disabled:opacity-60">
              {busy === 'rejected' ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <XCircle size={16} aria-hidden />} {t('admin.reject')}
            </button>
          </div>
          <p className="text-[11px] text-ice-500">Approving publishes the record with your edited metadata and re-indexes semantic search immediately.</p>
        </section>
      )}
    </div>
  );
}

function ReviewQueue() {
  const t = useT();
  const [tab, setTab] = useState<Tab>('pending');
  const { data, error, loading, reload } = useApi<Queue>(`/api/reviews/queue?status=${tab}`, { auth: true });
  const { data: locations } = useApi<Location[]>('/api/locations');
  const [selected, setSelected] = useState<string | null>(null);
  const [published, setPublished] = useState<{ title: string; content_id: string; index_size: number; status: string } | null>(null);

  const items = data?.items || [];
  const current = useMemo(() => items.find((i) => i.submission_id === selected) || null, [items, selected]);
  useEffect(() => { if (!loading && items.length && !items.some((i) => i.submission_id === selected)) setSelected(items[0].submission_id); }, [items, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = data?.counts || {};
  return (
    <>
      <PageHeader eyebrow="Admin" icon={ClipboardCheck} title={t('admin.review')}
        subtitle="AI drafts the metadata. You verify it. Only human-approved content reaches the public repository."
        crumbs={[{ label: t('admin.title'), href: '/admin' }, { label: t('admin.review') }]}
        actions={
          <div className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-[11px] text-ice-300">
            <Bot size={13} className="text-violet-300" aria-hidden /> AI <ChevronRight size={11} aria-hidden /> <UserCheck size={13} className="text-amber-300" aria-hidden /> Human review <ChevronRight size={11} aria-hidden /> <ShieldCheck size={13} className="text-emerald-300" aria-hidden /> Trusted knowledge
          </div>
        } />

      <AnimatePresence>
        {published && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={cn('mb-5 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center', published.status === 'published' ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-amber-400/30 bg-amber-500/10')} role="status">
            {published.status === 'published' ? <CheckCircle2 className="shrink-0 text-emerald-300" aria-hidden /> : <AlertTriangle className="shrink-0 text-amber-300" aria-hidden />}
            <div className="min-w-0 flex-1 text-sm text-ice-100">
              {published.status === 'published'
                ? <>“{published.title}” is <strong>published</strong> and indexed for semantic search ({published.index_size} records).</>
                : <>“{published.title}” marked as <strong>{t(`status.${published.status}` as TKey)}</strong>. The contributor will see your comment.</>}
            </div>
            {published.status === 'published' && (
              <div className="flex flex-wrap gap-2">
                <Link href={`/repository/${published.content_id}`} className="btn-secondary px-3 py-1.5 text-xs">View record <ArrowRight size={12} aria-hidden /></Link>
                <Link href={`/search?q=${encodeURIComponent(published.title)}`} className="btn-primary px-3 py-1.5 text-xs"><Search size={12} aria-hidden /> Find in search</Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-4">
        <Segmented label="Review status" value={tab} onChange={(v) => { setTab(v); setSelected(null); }}
          options={[
            { value: 'pending', label: t('admin.pending'), count: counts.pending || 0, icon: Clock },
            { value: 'approved', label: t('status.approved'), count: counts.approved || 0, icon: CheckCircle2 },
            { value: 'changes_requested', label: t('status.changes_requested'), count: counts.changes_requested || 0, icon: AlertTriangle },
            { value: 'rejected', label: t('status.rejected'), count: counts.rejected || 0, icon: XCircle },
          ]} />
      </div>

      {error ? <ErrorState message={error.message} onRetry={reload} /> : (
        <div className="grid gap-5 xl:grid-cols-[minmax(300px,380px)_1fr]">
          <div className="space-y-2.5" role="list" aria-label="Submissions">
            {loading && !data ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />) :
              items.length === 0 ? <EmptyState icon={CheckCircle2} title={tab === 'pending' ? 'All submissions reviewed!' : 'Nothing here yet'} hint="New contributions will appear here." /> :
                items.map((s, i) => (
                  <motion.button key={s.submission_id} role="listitem" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    onClick={() => setSelected(s.submission_id)} aria-current={selected === s.submission_id}
                    className={cn('glass-panel w-full rounded-xl p-3.5 text-left transition-all', selected === s.submission_id ? 'border-cyan-300/45 bg-cyan-400/[0.06]' : 'hover:border-cyan-400/25')}>
                    <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                      <TypeBadge type={s.content_type} size="xs" />
                      {s.ai_analysis && <span className="inline-flex items-center gap-1 rounded-md border border-violet-400/25 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-200"><Sparkles size={9} aria-hidden /> AI {s.ai_analysis.overall_quality}%</span>}
                      {s.ai_analysis?.possible_duplicate && <span className="rounded-md bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-rose-200">Duplicate?</span>}
                    </div>
                    <p className="line-clamp-2 text-sm font-medium text-ice-100">{s.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ice-500">
                      <span className="flex items-center gap-1"><User size={10} aria-hidden />{s.submitter_name}</span>
                      {s.region && <span className="flex items-center gap-1"><MapPin size={10} aria-hidden />{s.region}</span>}
                      <span>{timeAgo(s.submitted_at)}</span>
                    </p>
                  </motion.button>
                ))}
          </div>
          <div className="min-w-0">
            {current ? (
              <ReviewPanel key={current.submission_id} item={current} locations={locations || []}
                onDecided={(r) => { setPublished({ title: current.title, content_id: r.content_id, index_size: r.index_size, status: r.status }); setSelected(null); reload(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            ) : !loading && items.length > 0 ? (
              <div className="glass-panel flex min-h-[300px] items-center justify-center rounded-2xl text-sm text-ice-500">Select a submission to review</div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

export default function ReviewPage() {
  return (
    <AppShell>
      <AuthGate role="admin" title="Curator access required" reason="Only repository curators can review and publish submissions.">
        <ReviewQueue />
      </AuthGate>
    </AppShell>
  );
}
