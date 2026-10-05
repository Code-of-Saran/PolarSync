'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search, X, Sparkles, Cpu, Filter, ChevronDown, MapPin, ArrowRight, Quote, Clock, TrendingUp, Layers, Brain, Zap, SlidersHorizontal,
  FileText, Database, BarChart3, Image as ImageIcon, BookOpen, Ship, Lightbulb, Info,
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import { api, qs, type SearchResponse, type SearchResult } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useRegionLabel, useT, type TKey } from '@/lib/i18n';
import { contentHref, REGIONS, RESEARCH_AREAS, cn } from '@/lib/format';
import { ErrorState, EmptyState, FilterSelect, RelevanceRing, Segmented, Skeleton, SmartImage, TypeBadge } from '@/components/ui';

const EXAMPLES = [
  'How is climate change affecting Antarctic ice?',
  'What is happening to Himalayan glaciers?',
  'Ocean warming data from the Arctic',
  'Penguin colonies near Indian stations',
  'Ozone hole measurements',
];

const GROUPS: { key: string; icon: typeof FileText }[] = [
  { key: 'research', icon: FileText }, { key: 'datasets', icon: Database }, { key: 'reports', icon: BarChart3 },
  { key: 'media', icon: ImageIcon }, { key: 'learn', icon: BookOpen }, { key: 'expeditions', icon: Ship },
];

const PIPE_ICONS = [Layers, Brain, Zap, Filter, TrendingUp];

function highlight(text: string, terms: string[]) {
  if (!terms.length || !text) return text;
  const re = new RegExp(`\\b(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\w*`, 'gi');
  const parts = text.split(re);
  return parts.map((p, i) => (i % 2 === 1 ? <mark key={i} className="rounded bg-cyan-400/20 px-0.5 text-cyan-100">{p}</mark> : p));
}

function ResultCard({ r, index }: { r: SearchResult; index: number }) {
  const t = useT();
  const region = useRegionLabel();
  const [why, setWhy] = useState(false);
  return (
    <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.4 }}
      className="glass-panel glass-panel-hover overflow-hidden rounded-2xl">
      <div className="flex gap-4 p-4">
        <Link href={contentHref(r)} className="hidden shrink-0 sm:block" tabIndex={-1} aria-hidden>
          <SmartImage src={r.thumbnail} alt="" width={240} className="h-24 w-28 rounded-xl object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <TypeBadge type={r.content_type} size="xs" />
            {r.semantic_match && (
              <span className="inline-flex items-center gap-1 rounded-md border border-violet-400/30 bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-violet-200">
                <Brain size={10} aria-hidden /> {t('search.matchedMeaning')}
              </span>
            )}
          </div>
          <h3 className="line-clamp-2 font-space text-base font-semibold leading-snug text-ice-50">
            <Link href={contentHref(r)} className="hover:text-white">{r.title}</Link>
          </h3>
          <p className="mt-0.5 text-xs text-cyan-300/90">{[region(r.region), r.research_area, r.year].filter(Boolean).join(' • ')}</p>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ice-400">{highlight(r.description || '', r.matched_terms)}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link href={contentHref(r)} className="btn-secondary px-3 py-1.5 text-xs">{t('search.viewResearch')} <ArrowRight size={12} aria-hidden /></Link>
            <button onClick={() => setWhy(!why)} aria-expanded={why} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-ice-400 hover:text-ice-100">
              <Info size={12} aria-hidden /> {t('search.why')} <ChevronDown size={12} className={why ? 'rotate-180 transition-transform' : 'transition-transform'} aria-hidden />
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <RelevanceRing value={r.relevance} size={50} />
          <span className="text-[9px] uppercase tracking-wider text-ice-500">{t('common.relevant')}</span>
        </div>
      </div>
      <AnimatePresence>
        {why && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/5">
            <div className="grid gap-3 bg-black/10 p-4 sm:grid-cols-3">
              {[
                { k: 'Semantic similarity', v: r.breakdown.semantic, w: '× 0.4', note: `cosine ${r.breakdown.cosine.toFixed(2)}`, c: 'from-violet-500 to-fuchsia-300' },
                { k: 'Keyword relevance (BM25)', v: r.breakdown.keyword, w: '× 0.4', note: r.matched_terms.length ? `matched: ${r.matched_terms.join(', ')}` : 'no exact term match', c: 'from-sky-500 to-cyan-300' },
                { k: 'Metadata relevance', v: r.breakdown.metadata, w: '× 0.2', note: 'region · type · area intent, recency', c: 'from-emerald-500 to-teal-300' },
              ].map((b) => (
                <div key={b.k}>
                  <div className="mb-1 flex justify-between text-[11px]"><span className="text-ice-300">{b.k}</span><span className="tabular-nums text-ice-100">{Math.round(b.v * 100)}% <span className="text-ice-500">{b.w}</span></span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5"><motion.div initial={{ width: 0 }} animate={{ width: `${b.v * 100}%` }} className={`h-full rounded-full bg-gradient-to-r ${b.c}`} /></div>
                  <p className="mt-1 truncate text-[10px] text-ice-500">{b.note}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

function SearchContent() {
  const params = useSearchParams();
  const router = useRouter();
  const t = useT();
  const region = useRegionLabel();
  const addRecent = useAppStore((s) => s.addRecentSearch);
  const recent = useAppStore((s) => s.recentSearches);

  const q = params.get('q') || '';
  const mode = (params.get('mode') || 'hybrid') as 'hybrid' | 'keyword' | 'semantic';
  const filters = {
    content_type: params.get('content_type') || '', region: params.get('region') || '', research_area: params.get('research_area') || '',
    year: params.get('year') || '', author: params.get('author') || '', media_type: params.get('media_type') || '',
  };
  const [input, setInput] = useState(q);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [compare, setCompare] = useState<{ keyword: { total: number }; hybrid: { total: number }; only_in_hybrid: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [popular, setPopular] = useState<string[]>([]);
  const [showPipe, setShowPipe] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [lastLogged, setLastLogged] = useState('');

  useEffect(() => setInput(q), [q]);
  useEffect(() => { api<string[]>('/api/search/popular').then(setPopular).catch(() => {}); }, []);

  const filterKey = JSON.stringify(filters);
  useEffect(() => {
    if (!q) { setData(null); setCompare(null); return; }
    let cancelled = false;
    setLoading(true); setError(null);
    const shouldLog = q !== lastLogged;
    api<SearchResponse>(`/api/search${qs({ q, mode, ...filters, log: shouldLog ? 1 : undefined })}`)
      .then((d) => { if (!cancelled) { setData(d); if (shouldLog) setLastLogged(q); } })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    if (mode === 'hybrid') api(`/api/search/compare?q=${encodeURIComponent(q)}`).then((c) => !cancelled && setCompare(c)).catch(() => {});
    return () => { cancelled = true; };
  }, [q, mode, filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const setParams = (patch: Record<string, string>) => {
    const p = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    router.replace(`/search?${p.toString()}`, { scroll: false });
  };
  const submit = (query: string) => {
    const s = query.trim();
    if (!s) return;
    addRecent(s);
    const p = new URLSearchParams();
    p.set('q', s);
    if (mode !== 'hybrid') p.set('mode', mode);
    router.push(`/search?${p.toString()}`);
  };

  const grouped = useMemo(() => {
    const g: Record<string, SearchResult[]> = {};
    data?.results.forEach((r) => { (g[r.group] ||= []).push(r); });
    return g;
  }, [data]);
  const activeFilters = Object.values(filters).filter(Boolean).length;
  const facet = (k: string) => Object.entries(data?.facets?.[k] || {}).map(([value, count]) => ({ value, label: k === 'region' ? region(value) : k === 'content_type' ? t(`type.${value}` as TKey) : value, count }));

  return (
    <AppShell>
      {/* Search hero */}
      <section className="relative mb-6 overflow-hidden rounded-3xl border border-cyan-400/10 bg-[radial-gradient(ellipse_at_top_left,rgba(0,119,182,0.25),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(123,47,190,0.15),transparent_55%)] p-5 sm:p-8">
        <div aria-hidden className="decorative grid-lines absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="relative">
          <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80"><Sparkles size={13} aria-hidden /> AI Discovery</p>
          <h1 className="font-space text-3xl font-bold text-gradient-white sm:text-4xl">{t('search.title')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-ice-400">{t('search.subtitle')}</p>
          <form onSubmit={(e) => { e.preventDefault(); submit(input); }} role="search" className="mt-5 flex flex-col gap-2 sm:flex-row">
            <label htmlFor="search-q" className="sr-only">{t('common.search')}</label>
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-cyan-400/25 bg-[rgba(4,16,30,0.75)] px-4 py-3.5 shadow-[0_0_40px_rgba(0,180,216,0.08)] focus-within:border-cyan-300/60">
              <Search size={20} className="shrink-0 text-cyan-300" aria-hidden />
              <input id="search-q" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything — e.g. “What is happening to Antarctic ice?”"
                className="min-w-0 flex-1 bg-transparent text-base text-ice-50 outline-none placeholder:text-ice-500" autoFocus={!q} />
              {input && <button type="button" onClick={() => { setInput(''); router.push('/search'); }} aria-label="Clear search" className="text-ice-500 hover:text-ice-100"><X size={16} /></button>}
            </div>
            <button type="submit" className="btn-primary justify-center rounded-2xl px-6 py-3.5"><Sparkles size={16} aria-hidden /> {t('common.search')}</button>
          </form>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Segmented label="Search mode" size="sm" value={mode} onChange={(m) => setParams({ mode: m === 'hybrid' ? '' : m })}
              options={[{ value: 'hybrid', label: t('search.mode.hybrid'), icon: Sparkles }, { value: 'semantic', label: t('search.mode.semantic'), icon: Brain }, { value: 'keyword', label: t('search.mode.keyword'), icon: Search }]} />
            {data?.model && <span className="flex items-center gap-1.5 text-[11px] text-ice-500"><Cpu size={12} aria-hidden /> {data.model}</span>}
          </div>
        </div>
      </section>

      {/* Empty state: examples */}
      {!q && (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="glass-panel rounded-2xl p-5 lg:col-span-2">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ice-100"><Lightbulb size={15} className="text-amber-300" aria-hidden /> Try a natural-language question</h2>
            <div className="flex flex-col gap-2">
              {EXAMPLES.map((ex) => (
                <button key={ex} onClick={() => submit(ex)} className="group flex items-center justify-between gap-3 rounded-xl border border-cyan-400/10 bg-white/[0.02] px-4 py-3 text-left text-sm text-ice-200 transition-colors hover:border-cyan-400/30 hover:bg-cyan-400/[0.06]">
                  <span>“{ex}”</span><ArrowRight size={14} className="shrink-0 text-cyan-400/50 group-hover:text-cyan-300" aria-hidden />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-5">
            {recent.length > 0 && (
              <div className="glass-panel rounded-2xl p-5">
                <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ice-400"><Clock size={13} aria-hidden /> {t('search.recent')}</h2>
                <div className="flex flex-wrap gap-2">{recent.map((r) => <button key={r} onClick={() => submit(r)} className="tag hover:border-cyan-300/50">{r}</button>)}</div>
              </div>
            )}
            <div className="glass-panel rounded-2xl p-5">
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ice-400"><TrendingUp size={13} aria-hidden /> {t('search.popular')}</h2>
              <div className="flex flex-wrap gap-2">{popular.map((r) => <button key={r} onClick={() => submit(r)} className="tag hover:border-cyan-300/50">{r}</button>)}</div>
            </div>
          </div>
        </div>
      )}

      {q && error && <ErrorState message={error} onRetry={() => setParams({})} />}

      {q && !error && (
        <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
          {/* Filters */}
          <aside aria-label={t('common.filters')} className="lg:sticky lg:top-20 lg:self-start">
            <button onClick={() => setShowFilters(!showFilters)} className="btn-secondary mb-3 w-full justify-center lg:hidden" aria-expanded={showFilters}>
              <SlidersHorizontal size={14} aria-hidden /> {t('common.filters')} {activeFilters > 0 && `(${activeFilters})`}
            </button>
            <div className={cn('glass-panel space-y-3 rounded-2xl p-4', !showFilters && 'hidden lg:block')}>
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ice-300"><Filter size={13} aria-hidden /> {t('common.filters')}</h2>
                {activeFilters > 0 && <button onClick={() => setParams({ content_type: '', region: '', research_area: '', year: '', author: '', media_type: '' })} className="text-[11px] text-cyan-300 hover:text-cyan-100">{t('common.clearFilters')}</button>}
              </div>
              <FilterSelect label={t('common.contentType')} value={filters.content_type} onChange={(v) => setParams({ content_type: v })}
                options={['paper', 'dataset', 'report', 'story', 'expedition'].map((v) => ({ value: v, label: t(`type.${v}` as TKey), count: data?.facets?.content_type?.[v] }))} />
              <FilterSelect label={t('common.mediaType')} value={filters.media_type} onChange={(v) => setParams({ media_type: v })}
                options={['photo', 'video', 'press_release'].map((v) => ({ value: v, label: t(`type.${v}` as TKey), count: data?.facets?.content_type?.[v] }))} />
              <FilterSelect label={t('common.region')} value={filters.region} onChange={(v) => setParams({ region: v })}
                options={REGIONS.map((v) => ({ value: v, label: region(v), count: data?.facets?.region?.[v] }))} />
              <FilterSelect label={t('common.researchArea')} value={filters.research_area} onChange={(v) => setParams({ research_area: v })}
                options={RESEARCH_AREAS.map((v) => ({ value: v, label: v, count: data?.facets?.research_area?.[v] }))} />
              <FilterSelect label={t('common.year')} value={filters.year} onChange={(v) => setParams({ year: v })}
                options={['2026', '2025', '2024'].map((v) => ({ value: v, label: v, count: data?.facets?.year?.[v] }))} />
              <div>
                <label htmlFor="f-author" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-ice-500">{t('common.author')}</label>
                <input id="f-author" defaultValue={filters.author} placeholder="e.g. Sharma" className="polar-input py-2 text-xs"
                  onKeyDown={(e) => { if (e.key === 'Enter') setParams({ author: (e.target as HTMLInputElement).value }); }}
                  onBlur={(e) => e.target.value !== filters.author && setParams({ author: e.target.value })} />
              </div>
              {facet('author').length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {facet('author').slice(0, 4).map((a) => <button key={a.value} onClick={() => setParams({ author: a.value })} className="tag text-[10px]">{a.label}</button>)}
                </div>
              )}
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
            {/* Query + pipeline */}
            <div className="glass-panel rounded-2xl p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ice-500">{t('common.search')}</p>
                  <p className="truncate font-space text-lg font-semibold text-ice-50">“{q}”</p>
                </div>
                {data && !loading && (
                  <p className="text-xs text-ice-400"><strong className="text-ice-100">{data.total}</strong> {t('common.results')} · {data.took_ms} ms</p>
                )}
              </div>
              {data && data.pipeline.length > 0 && (
                <>
                  <button onClick={() => setShowPipe(!showPipe)} aria-expanded={showPipe} className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-cyan-300 hover:text-cyan-100">
                    <Cpu size={12} aria-hidden /> {t('search.pipeline')} <ChevronDown size={12} className={showPipe ? 'rotate-180' : ''} aria-hidden />
                  </button>
                  <AnimatePresence initial={false}>
                    {showPipe && (
                      <motion.ol initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="mt-3 grid gap-2 overflow-hidden sm:grid-cols-2 xl:grid-cols-5">
                        {data.pipeline.filter((p) => p.step !== 'Similarity search' || mode !== 'keyword').map((p, i) => {
                          const Icon = PIPE_ICONS[i % PIPE_ICONS.length];
                          return (
                            <motion.li key={p.step} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                              className="relative rounded-xl border border-cyan-400/12 bg-[rgba(4,16,30,0.55)] p-3">
                              <div className="mb-1 flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ice-100"><Icon size={12} className="text-cyan-300" aria-hidden />{i + 1}. {p.step}</span>
                                <span className="text-[10px] tabular-nums text-ice-500">{p.ms} ms</span>
                              </div>
                              <p className="line-clamp-3 text-[10.5px] leading-snug text-ice-400">{p.detail}</p>
                            </motion.li>
                          );
                        })}
                      </motion.ol>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            {loading && (
              <div className="space-y-3" role="status" aria-label={t('search.searching')}>
                <div className="ai-panel rounded-2xl p-5"><p className="mb-3 flex items-center gap-2 text-sm text-cyan-200"><Sparkles size={14} className="animate-pulse" aria-hidden /> {t('search.searching')}</p><Skeleton className="mb-2 h-3 w-full" /><Skeleton className="mb-2 h-3 w-11/12" /><Skeleton className="h-3 w-2/3" /></div>
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
              </div>
            )}

            {!loading && data && (
              <>
                {/* AI insight */}
                {data.insight && (
                  <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="ai-panel rounded-2xl p-5 sm:p-6" aria-labelledby="ai-insight">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h2 id="ai-insight" className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200"><Sparkles size={15} aria-hidden /> {t('search.insight')}</h2>
                      <span className="text-[10px] text-ice-500">{data.insight.method}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-ice-100 sm:text-[15px]">{data.insight.summary}</p>
                    {data.insight.themes.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">{data.insight.themes.map((th) => <button key={th} onClick={() => submit(th)} className="tag hover:border-cyan-300/50">{th}</button>)}</div>
                    )}
                    {data.insight.evidence.length > 0 && (
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {data.insight.evidence.map((ev, ei) => {
                          const src = data.results.find((r) => r.id === ev.content_id);
                          return (
                            <Link key={ev.content_id} href={src ? contentHref(src) : '#'} className="group rounded-xl border border-white/5 bg-black/15 p-3 hover:border-cyan-400/25">
                              {ei > 0 ? <p className="flex gap-2 text-xs italic leading-relaxed text-ice-300"><Quote size={12} className="mt-0.5 shrink-0 text-cyan-400/60" aria-hidden />{ev.sentence}</p>
                                : <p className="text-[10px] font-semibold uppercase tracking-wider text-ice-500">Quoted in summary</p>}
                              {src && <p className="mt-1.5 truncate text-[10px] text-cyan-300 group-hover:text-cyan-100">{t('search.evidence')}: {src.title}</p>}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </motion.section>
                )}

                {compare && mode === 'hybrid' && compare.hybrid.total > compare.keyword.total && (
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/[0.07] px-4 py-2.5 text-xs text-violet-100">
                    <Brain size={14} aria-hidden /> Hybrid AI found <strong>{compare.hybrid.total}</strong> relevant records; keyword-only search finds <strong>{compare.keyword.total}</strong>.
                    <button onClick={() => setParams({ mode: 'keyword' })} className="underline underline-offset-2 hover:text-white">Compare</button>
                  </div>
                )}

                {data.results.length === 0 ? (
                  <EmptyState title={t('common.noResults')} hint="Try different words, remove filters, or ask a broader question."
                    action={<Link href="/repository" className="btn-secondary text-xs">{t('landing.browse')}</Link>} />
                ) : (
                  GROUPS.filter((g) => grouped[g.key]?.length).map((g) => (
                    <section key={g.key} aria-labelledby={`grp-${g.key}`}>
                      <h2 id={`grp-${g.key}`} className="mb-3 flex items-center gap-2 font-space text-base font-semibold text-ice-50">
                        <g.icon size={16} className="text-cyan-300" aria-hidden /> {t(`group.${g.key}` as TKey)}
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-ice-400">{grouped[g.key].length}</span>
                      </h2>
                      <div className="space-y-3">{grouped[g.key].slice(0, 6).map((r, i) => <ResultCard key={r.id} r={r} index={i} />)}</div>
                    </section>
                  ))
                )}

                {data.locations.length > 0 && (
                  <section aria-labelledby="grp-loc">
                    <h2 id="grp-loc" className="mb-3 flex items-center gap-2 font-space text-base font-semibold text-ice-50"><MapPin size={16} className="text-cyan-300" aria-hidden /> {t('search.onMap')}</h2>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {data.locations.map((l) => (
                        <Link key={l.id} href={`/explore/location/${l.id}`} className="glass-panel glass-panel-hover group flex items-center gap-3 rounded-xl p-2.5">
                          <SmartImage src={l.image} alt="" width={160} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                          <span className="min-w-0"><span className="block truncate text-sm font-medium text-ice-100">{l.name}</span><span className="text-[11px] text-ice-500">{region(l.region)}</span></span>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {data.related_topics.length > 0 && (
                  <section aria-labelledby="rel-topics" className="glass-panel rounded-2xl p-5">
                    <h2 id="rel-topics" className="mb-3 text-xs font-semibold uppercase tracking-wider text-ice-300">{t('search.relatedTopics')}</h2>
                    <div className="flex flex-wrap gap-2">{data.related_topics.map((tp) => <button key={tp} onClick={() => submit(tp)} className="tag hover:border-cyan-300/50">{tp}</button>)}</div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-polar-gradient" />}>
      <SearchContent />
    </Suspense>
  );
}
