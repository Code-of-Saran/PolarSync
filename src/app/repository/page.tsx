'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Search, X, Filter, Upload, Sparkles } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { qs, type ContentCard as Card } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { useRegionLabel, useT } from '@/lib/i18n';
import { cn } from '@/lib/format';
import { CardGridSkeleton, ContentCard, EmptyState, ErrorState, FilterSelect, PageHeader, Segmented } from '@/components/ui';

interface RepoResponse { total: number; items: Card[]; facets: Record<string, Record<string, number>> }

function RepositoryContent() {
  const t = useT();
  const region = useRegionLabel();
  const params = useSearchParams();
  const router = useRouter();
  const get = (k: string) => params.get(k) || '';
  const [qInput, setQInput] = useState(get('q'));
  const [showFilters, setShowFilters] = useState(!!(get('region') || get('research_area') || get('year') || get('topic')));

  const setParams = (patch: Record<string, string>) => {
    const p = new URLSearchParams(params.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    router.replace(`/repository${p.toString() ? `?${p}` : ''}`, { scroll: false });
  };
  useEffect(() => {
    const id = setTimeout(() => { if (qInput !== get('q')) setParams({ q: qInput }); }, 350);
    return () => clearTimeout(id);
  }, [qInput]); // eslint-disable-line react-hooks/exhaustive-deps

  const path = `/api/repository${qs({ content_type: get('content_type'), region: get('region'), research_area: get('research_area'), year: get('year'), topic: get('topic'), q: get('q'), sort: get('sort') || 'recent' })}`;
  const { data, error, loading, reload } = useApi<RepoResponse>(path);
  const f = data?.facets;
  const activeFilters = ['region', 'research_area', 'year', 'topic'].filter((k) => get(k)).length;

  return (
    <AppShell>
      <PageHeader eyebrow={t('repo.title')} icon={BookOpen} title={t('repo.title')} subtitle={t('repo.subtitle')}
        actions={<Link href="/contribute" className="btn-primary"><Upload size={15} aria-hidden /> {t('nav.upload')}</Link>} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="polar-input flex flex-1 items-center gap-2 py-2.5">
          <Search size={16} className="shrink-0 text-cyan-300" aria-hidden />
          <label htmlFor="repo-q" className="sr-only">{t('repo.search')}</label>
          <input id="repo-q" value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder={t('repo.search')} className="min-w-0 flex-1 bg-transparent text-sm text-ice-50 outline-none placeholder:text-ice-500" />
          {qInput && <span className="hidden items-center gap-1 text-[10px] text-violet-200 sm:flex"><Sparkles size={10} aria-hidden /> matches by meaning</span>}
          {qInput && <button onClick={() => setQInput('')} aria-label="Clear"><X size={14} className="text-ice-500 hover:text-ice-100" /></button>}
        </div>
        <button onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters} className={cn('btn-secondary shrink-0 justify-center', showFilters && 'border-cyan-300/40 bg-cyan-400/15')}>
          <Filter size={15} aria-hidden /> {t('common.filters')}{activeFilters > 0 && ` (${activeFilters})`}
        </button>
        <label htmlFor="repo-sort" className="sr-only">{t('common.sort')}</label>
        <select id="repo-sort" value={get('sort') || 'recent'} onChange={(e) => setParams({ sort: e.target.value === 'recent' ? '' : e.target.value })} className="polar-input w-auto shrink-0 py-2.5 text-xs" disabled={!!get('q')}>
          <option value="recent">{t('common.recent')}</option><option value="popular">{t('common.popular')}</option><option value="title">{t('common.titleSort')}</option>
        </select>
      </div>

      {showFilters && (
        <div className="glass-panel mb-4 grid grid-cols-2 gap-3 rounded-2xl p-4 md:grid-cols-5">
          <FilterSelect label={t('common.region')} value={get('region')} onChange={(v) => setParams({ region: v })} options={Object.entries(f?.region || {}).map(([v, c]) => ({ value: v, label: region(v), count: c }))} />
          <FilterSelect label={t('common.researchArea')} value={get('research_area')} onChange={(v) => setParams({ research_area: v })} options={Object.entries(f?.research_area || {}).map(([v, c]) => ({ value: v, label: v, count: c }))} />
          <FilterSelect label={t('common.topic')} value={get('topic')} onChange={(v) => setParams({ topic: v })} options={Object.entries(f?.topic || {}).map(([v, c]) => ({ value: v, label: v, count: c }))} />
          <FilterSelect label={t('common.year')} value={get('year')} onChange={(v) => setParams({ year: v })} options={Object.entries(f?.year || {}).sort((a, b) => b[0].localeCompare(a[0])).map(([v, c]) => ({ value: v, label: v, count: c }))} />
          <div className="flex items-end"><button onClick={() => setParams({ region: '', research_area: '', topic: '', year: '' })} className="text-xs text-cyan-300 hover:text-cyan-100">{t('common.clearFilters')}</button></div>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Content type" value={get('content_type') || 'all'} onChange={(v) => setParams({ content_type: v === 'all' ? '' : v })}
          options={[
            { value: 'all', label: t('repo.tabs.all'), count: Object.values(f?.content_type || {}).reduce((a, b) => a + b, 0) || undefined },
            { value: 'paper', label: t('repo.tabs.papers'), count: f?.content_type?.paper },
            { value: 'dataset', label: t('repo.tabs.datasets'), count: f?.content_type?.dataset },
            { value: 'report', label: t('repo.tabs.reports'), count: f?.content_type?.report },
          ]} />
        {data && <p className="text-xs text-ice-400" aria-live="polite">{data.total} {t('repo.items')}{get('q') && <> · “{get('q')}”</>}</p>}
      </div>

      {error ? <ErrorState message={error.message} onRetry={reload} />
        : loading && !data ? <CardGridSkeleton />
          : data && data.items.length === 0 ? <EmptyState title={t('common.noResults')} hint="Try adjusting your search or filters." action={<button onClick={() => { setQInput(''); router.replace('/repository'); }} className="btn-secondary text-xs">{t('common.clearFilters')}</button>} />
            : (
              <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 transition-opacity', loading && 'opacity-60')}>
                {data?.items.map((item, i) => <ContentCard key={item.id} item={item} index={i} />)}
              </div>
            )}
    </AppShell>
  );
}

export default function RepositoryPage() {
  return <Suspense fallback={<div className="min-h-screen bg-polar-gradient" />}><RepositoryContent /></Suspense>;
}
