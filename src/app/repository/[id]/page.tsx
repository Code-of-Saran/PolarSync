'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Download, Share2, Eye, Calendar, User, MapPin, Tag, BookOpen, Quote, Building2, Sparkles, ShieldCheck, Bot, UserCheck, Upload,
  Globe2, Map, Copy, ExternalLink, Clock, Database, Layers, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '@/components/AppShell';
import { api, type ContentDetail } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useRegionLabel, useT, type TKey } from '@/lib/i18n';
import { formatDate } from '@/lib/format';
import { ErrorState, MiniContentRow, RevealOnScroll, Skeleton, SmartImage, StatusBadge, TypeBadge } from '@/components/ui';

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const region = useRegionLabel();
  const { data: item, error, loading, reload } = useApi<ContentDetail>(`/api/content/${id}?track=1`, { auth: true });
  const [citing, setCiting] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: item?.title, url }); return; } catch { /* cancelled */ } }
    await navigator.clipboard.writeText(url);
    toast.success(t('repo.copyLink'));
  };
  const cite = async () => {
    setCiting(true);
    try { const c = await api<{ text: string }>(`/api/content/${id}/citation`); await navigator.clipboard.writeText(c.text); toast.success('Citation copied'); }
    catch (e) { toast.error((e as Error).message); } finally { setCiting(false); }
  };

  if (error) return <AppShell><ErrorState message={error.status === 404 ? 'This record does not exist or is not published yet.' : error.message} onRetry={reload} /></AppShell>;
  if (loading || !item) {
    return <AppShell><Skeleton className="mb-4 h-4 w-48" /><div className="grid gap-6 lg:grid-cols-[1fr_320px]"><Skeleton className="h-[420px] rounded-2xl" /><Skeleton className="h-[320px] rounded-2xl" /></div></AppShell>;
  }

  const ex = item.extra || {};
  const isDataset = item.content_type === 'dataset';
  const prov = item.provenance;
  const meta: [string, string | undefined | null][] = [
    [t('common.contentType'), t(`type.${item.content_type}` as TKey)], [t('common.region'), region(item.region)], [t('common.researchArea'), item.research_area],
    [t('common.year'), item.year ? String(item.year) : null], ['Format', item.file_format], ['File size', item.file_size], ['License', item.license],
    ['Access', item.access_level], ['Coverage', ex.coverage], ['Temporal resolution', ex.temporal_resolution], ['Spatial resolution', ex.spatial_resolution],
    ['DOI (sample)', ex.doi], ['Record ID', item.id],
  ];

  return (
    <AppShell>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-ice-500">
        <Link href="/repository" className="hover:text-ice-100">{t('repo.title')}</Link><ChevronRight size={11} aria-hidden />
        <span className="line-clamp-1 text-ice-300">{item.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
        <div className="min-w-0 space-y-5">
          <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel overflow-hidden rounded-2xl">
            <div className="relative h-56 overflow-hidden sm:h-72">
              <SmartImage src={item.thumbnail} alt="" width={1400} priority className="kenburns h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(2,11,24,0.97)] via-[rgba(2,11,24,0.45)] to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                <div className="mb-3 flex flex-wrap items-center gap-2"><TypeBadge type={item.content_type} />{item.status !== 'published' && <StatusBadge status={item.status} />}</div>
                <h1 className="font-space text-2xl font-bold leading-tight text-white sm:text-3xl">{item.title}</h1>
              </div>
            </div>
            <div className="p-5 sm:p-7">
              <dl className="mb-6 grid grid-cols-2 gap-4 border-b border-white/5 pb-6 sm:grid-cols-3 xl:grid-cols-6">
                {[
                  { i: User, l: t('common.author'), v: item.author }, { i: Building2, l: 'Organization', v: item.organization },
                  { i: Calendar, l: t('common.year'), v: item.year }, { i: MapPin, l: t('common.region'), v: region(item.region) },
                  { i: Eye, l: 'Views', v: item.views?.toLocaleString('en-IN') }, { i: Download, l: 'Downloads', v: item.downloads?.toLocaleString('en-IN') },
                ].map((m) => (
                  <div key={m.l} className="min-w-0">
                    <dt className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ice-500"><m.i size={11} aria-hidden />{m.l}</dt>
                    <dd className="truncate text-sm text-ice-100" title={String(m.v ?? '')}>{m.v ?? '—'}</dd>
                  </div>
                ))}
              </dl>

              {item.ai_summary && (
                <section className="ai-panel mb-6 rounded-xl p-4" aria-label={t('repo.aiSummary')}>
                  <h2 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-200"><Sparkles size={13} aria-hidden /> {t('repo.aiSummary')}</h2>
                  <p className="text-sm leading-relaxed text-ice-100">{item.ai_summary}</p>
                </section>
              )}

              <section className="mb-6">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">{t('repo.abstract')}</h2>
                <p className="text-[15px] leading-relaxed text-ice-200">{item.abstract || item.description}</p>
                {item.abstract && item.description && item.abstract !== item.description && <p className="mt-3 text-sm italic text-ice-400">{item.description}</p>}
              </section>

              {isDataset && ex.variables && (
                <section className="mb-6">
                  <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-300"><Database size={12} aria-hidden /> Variables</h2>
                  <div className="flex flex-wrap gap-1.5">{(ex.variables as string[]).map((v) => <code key={v} className="rounded-md border border-white/10 bg-black/25 px-2 py-0.5 text-xs text-emerald-200">{v}</code>)}</div>
                </section>
              )}

              {item.keywords && item.keywords.length > 0 && (
                <section className="mb-5">
                  <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-300"><Tag size={12} aria-hidden /> {t('common.keywords')}</h2>
                  <div className="flex flex-wrap gap-2">{item.keywords.map((k) => <Link key={k} href={`/search?q=${encodeURIComponent(k)}`} className="tag hover:border-cyan-300/50">{k}</Link>)}</div>
                </section>
              )}
              <section>
                <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-300"><Layers size={12} aria-hidden /> {t('common.topics')}</h2>
                <div className="flex flex-wrap gap-2">{item.tags.map((k) => <Link key={k} href={`/search?q=${encodeURIComponent(k)}`} className="tag hover:border-cyan-300/50">{k}</Link>)}</div>
              </section>
            </div>
          </motion.article>

          {item.locations.length > 0 && (
            <RevealOnScroll className="glass-panel rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-space text-base font-semibold text-ice-50"><MapPin size={16} className="text-cyan-300" aria-hidden /> {t('repo.locations')}</h2>
                <Link href={`/explore/map?focus=${item.locations[0].id}`} className="flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-cyan-100"><Map size={12} aria-hidden /> View on map</Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {item.locations.map((l) => (
                  <Link key={l.id} href={`/explore/location/${l.id}`} className="group flex items-center gap-3 rounded-xl border border-white/5 p-2.5 hover:border-cyan-400/25">
                    <SmartImage src={l.image} alt="" width={160} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                    <span className="min-w-0"><span className="block truncate text-sm font-medium text-ice-100 group-hover:text-white">{l.name}</span>
                      <span className="text-[11px] text-ice-500">{region(l.region)} · {l.lat.toFixed(2)}°, {l.lng.toFixed(2)}°</span></span>
                  </Link>
                ))}
              </div>
            </RevealOnScroll>
          )}

          {item.related.length > 0 && (
            <RevealOnScroll className="glass-panel rounded-2xl p-5">
              <h2 className="mb-1 font-space text-base font-semibold text-ice-50">{t('common.related')}</h2>
              <p className="mb-3 text-[11px] text-ice-500">Found by embedding similarity, curated links and shared locations</p>
              <div className="grid gap-1 sm:grid-cols-2">
                {item.related.map((r) => (
                  <MiniContentRow key={r.id} item={r} right={<span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-ice-400">{r.reason}</span>} />
                ))}
              </div>
            </RevealOnScroll>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <section className="glass-panel rounded-2xl p-5" aria-label={t('repo.access')}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ice-300">{t('repo.access')}</h2>
            <div className="flex flex-col gap-2.5">
              <a href={`/api/content/${item.id}/download`} onClick={() => toast.success(item.file_url ? 'Download started' : 'Sample record — downloading catalogue metadata (JSON)')} className="btn-primary w-full justify-center">
                <Download size={16} aria-hidden /> {t('common.download')} {item.file_format || ''}
              </a>
              {item.file_url ? (
                <a href={item.file_url} target="_blank" rel="noreferrer" className="btn-secondary w-full justify-center"><ExternalLink size={15} aria-hidden /> {t('common.view')} file</a>
              ) : (
                <button onClick={() => document.querySelector('h2')?.scrollIntoView({ behavior: 'smooth' })} className="btn-secondary w-full justify-center"><BookOpen size={15} aria-hidden /> {t('common.view')} record</button>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={share} className="btn-ghost justify-center border border-white/8"><Share2 size={15} aria-hidden /> {t('common.share')}</button>
                <button onClick={cite} disabled={citing} className="btn-ghost justify-center border border-white/8"><Quote size={15} aria-hidden /> {t('common.cite')}</button>
              </div>
            </div>
          </section>

          <section className="glass-panel rounded-2xl p-5" aria-label={t('repo.provenance')}>
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ice-300"><ShieldCheck size={13} className="text-emerald-300" aria-hidden /> {t('repo.provenance')}</h2>
            <ol className="relative space-y-3 border-l border-cyan-400/15 pl-4">
              {[
                { i: Upload, h: 'Submitted', d: prov ? `${prov.submitted_by} · ${formatDate(prov.submitted_at)}` : `${item.organization}` },
                { i: Bot, h: prov?.ai_assisted ? 'AI-assisted metadata' : 'Curated metadata', d: prov?.ai_assisted ? 'Summary, tags & classification suggested by AI' : 'Catalogued by repository curators' },
                { i: UserCheck, h: 'Human reviewed', d: prov?.reviewed_by ? `${prov.reviewed_by} · ${formatDate(prov.reviewed_at)}` : 'Editorial board (sample record)' },
                { i: Globe2, h: item.status === 'published' ? 'Published' : t(`status.${item.status}` as TKey), d: item.published_at ? formatDate(item.published_at) : formatDate(item.created_at) },
              ].map((s) => (
                <li key={s.h} className="relative">
                  <span className="absolute -left-[25px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-cyan-400/40 bg-[#061628]"><s.i size={9} className="text-cyan-300" aria-hidden /></span>
                  <p className="text-xs font-semibold text-ice-100">{s.h}</p>
                  <p className="text-[11px] text-ice-500">{s.d}</p>
                </li>
              ))}
            </ol>
            {prov?.review_comment && <p className="mt-3 rounded-lg bg-white/[0.03] p-2 text-[11px] italic text-ice-400">“{prov.review_comment}”</p>}
          </section>

          <section className="glass-panel rounded-2xl p-5" aria-label={t('common.metadata')}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ice-300">{t('common.metadata')}</h2>
            <dl className="space-y-2.5">
              {meta.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex items-start justify-between gap-3">
                  <dt className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-ice-500">{k}</dt>
                  <dd className="break-all text-right text-xs text-ice-200">{v}</dd>
                </div>
              ))}
              <div className="flex items-start justify-between gap-3">
                <dt className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-ice-500">Updated</dt>
                <dd className="flex items-center gap-1 text-xs text-ice-200"><Clock size={10} aria-hidden />{formatDate(item.updated_at)}</dd>
              </div>
            </dl>
            <button onClick={() => { navigator.clipboard.writeText(JSON.stringify({ id: item.id, title: item.title, tags: item.tags, region: item.region }, null, 2)); toast.success('Metadata copied'); }}
              className="mt-3 flex items-center gap-1 text-[11px] text-cyan-300 hover:text-cyan-100"><Copy size={11} aria-hidden /> Copy as JSON</button>
          </section>
          <p className="px-1 text-[10px] leading-relaxed text-ice-500">{t('common.sampleNotice')}</p>
        </aside>
      </div>
    </AppShell>
  );
}
