'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Upload, FileText, Database, BarChart3, Image as ImageIcon, Video, Newspaper, CheckCircle2, Sparkles, Loader2, ArrowRight, Wand2,
  FileUp, X, Info, Bot, UserCheck, Globe2, Save, ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '@/components/AppShell';
import AuthGate from '@/components/AuthGate';
import AIAnalysisPanel, { type AIEditorState } from '@/components/AIAnalysisPanel';
import { api, uploadFile, type AIAnalysis, type Location, type UploadInfo } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { REGIONS, RESEARCH_AREAS, cn } from '@/lib/format';
import { PageHeader } from '@/components/ui';

const TYPES = [
  { value: 'paper', label: 'Research Paper', icon: FileText },
  { value: 'dataset', label: 'Dataset', icon: Database },
  { value: 'report', label: 'Report', icon: BarChart3 },
  { value: 'photo', label: 'Image', icon: ImageIcon },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'press_release', label: 'Press Release', icon: Newspaper },
];
const LICENSES = ['CC BY 4.0', 'CC BY-SA 4.0', 'CC BY-NC 4.0', 'Open Government Licence', 'Restricted – contact author'];
const ACCESS = ['Public', 'Registered users', 'Institutional', 'Restricted'];

const SAMPLES = [
  {
    label: 'Sample paper: Antarctic krill',
    content_type: 'paper',
    title: 'Krill Swarm Distribution near the Antarctic Sea-Ice Edge',
    description: 'Ship-based echosounder survey of krill swarms near the seasonal sea-ice edge off Dronning Maud Land during the Indian Antarctic expedition.',
    abstract: 'Antarctic krill are a keystone species of the Southern Ocean food web, supporting penguins, seals and whales. This study uses ship-based echosounder surveys carried out during the Indian Antarctic expedition to map krill swarms near the seasonal sea-ice edge off Dronning Maud Land. Acoustic backscatter was calibrated with net sampling to estimate swarm density and depth. Swarm distribution is examined in relation to sea-ice retreat, chlorophyll concentration and water temperature measured by CTD casts. We discuss how changes in sea ice under a warming climate may alter krill habitat and the predators that depend on it near Maitri and Bharati stations.',
    keywords: 'krill, echosounder, sea ice edge',
  },
  {
    label: 'Sample dataset: Himalayan lakes',
    content_type: 'dataset',
    title: 'Glacial Lake Inventory of the Chandra Basin (2016–2025)',
    description: 'Annual satellite-mapped outlines of glacial lakes in the Chandra basin with area change and potential outburst-hazard attributes.',
    abstract: 'This dataset provides annual outlines of glacial lakes in the Chandra basin of the western Himalaya mapped from Sentinel-2 and Landsat imagery between 2016 and 2025. Each lake record includes area, elevation, dam type and distance to the parent glacier. Lake growth is summarised as a time series to support assessment of glacial lake outburst flood hazard downstream of Himansh station. Files are provided as GeoJSON and CSV.',
    keywords: 'glacial lakes, GLOF, Sentinel-2',
  },
];

type Meta = {
  title: string; description: string; abstract: string; content_type: string; region: string; research_area: string;
  author: string; organization: string; year: string; keywords: string; license: string; access_level: string;
};

const STEPS = ['DRAFT', 'AI ANALYSIS', 'UNDER REVIEW', 'APPROVED', 'PUBLISHED'];

function Workflow({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-1.5" aria-label="Publication workflow">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-1.5">
          <span aria-current={i === current ? 'step' : undefined}
            className={cn('rounded-lg border px-2.5 py-1 text-[10px] font-bold tracking-wider',
              i < current ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' : i === current ? 'border-amber-300/50 bg-amber-400/15 text-amber-100 shadow-[0_0_18px_rgba(251,191,36,0.15)]' : 'border-white/10 text-ice-500')}>
            {i < current && '✓ '}{s}
          </span>
          {i < STEPS.length - 1 && <ChevronRight size={12} className="text-ice-500" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

function ContributeForm() {
  const t = useT();
  const user = useAppStore((s) => s.user);
  const [meta, setMeta] = useState<Meta>({
    title: '', description: '', abstract: '', content_type: 'paper', region: '', research_area: '', author: user?.name || '',
    organization: user?.organization || '', year: '2026', keywords: '', license: 'CC BY 4.0', access_level: 'Public',
  });
  const [file, setFile] = useState<File | null>(null);
  const [upload, setUpload] = useState<UploadInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [editor, setEditor] = useState<AIEditorState>({ tags: [], summary: '' });
  const [locs, setLocs] = useState<string[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ content_id: string; status: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const aiRef = useRef<HTMLDivElement>(null);

  useEffect(() => { api<Location[]>('/api/locations').then(setLocations).catch(() => {}); }, []);
  const set = (k: keyof Meta, v: string) => setMeta((m) => ({ ...m, [k]: v }));

  const pickFile = async (f: File) => {
    setFile(f); setUpload(null); setProgress(0); setUploading(true);
    try {
      const info = await uploadFile(f, setProgress);
      setUpload(info);
      if (!meta.title) set('title', f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
      toast.success(`Uploaded ${info.file_name} (${info.size_label})`);
    } catch (e) {
      toast.error((e as Error).message); setFile(null);
    } finally { setUploading(false); }
  };

  const metaPayload = () => ({
    title: meta.title, description: meta.description, abstract: meta.abstract || null, content_type: meta.content_type,
    region: meta.region || null, research_area: meta.research_area || null, author: meta.author, organization: meta.organization,
    year: meta.year ? Number(meta.year) : null, keywords: meta.keywords.split(',').map((k) => k.trim()).filter(Boolean),
    license: meta.license, access_level: meta.access_level, location_ids: locs,
  });

  const runAI = async () => {
    if (!meta.title.trim() && !upload) { toast.error('Add a title or upload a file first'); return; }
    setAnalyzing(true);
    try {
      const res = await api<AIAnalysis>('/api/ai/analyze', { method: 'POST', json: { meta: metaPayload(), upload_id: upload?.upload_id } });
      setAnalysis(res);
      setEditor({ tags: res.tags.filter((x) => x.confidence >= 0.55).map((x) => x.tag), summary: res.summary });
      setLocs((l) => Array.from(new Set([...l, ...res.suggested_location_ids])));
      toast.success(`AI analysis complete in ${res.processing_ms} ms`);
      setTimeout(() => aiRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) { toast.error((e as Error).message); } finally { setAnalyzing(false); }
  };

  const applyAll = () => {
    if (!analysis) return;
    const c = analysis.classification;
    setMeta((m) => ({
      ...m, content_type: c.content_type.label, region: REGIONS.includes(c.region.label) ? c.region.label : m.region,
      research_area: c.research_area.label, keywords: m.keywords || analysis.key_topics.slice(0, 5).join(', '),
    }));
    toast.success('AI suggestions applied — review before submitting');
  };

  const submit = async (asDraft: boolean) => {
    if (!meta.title.trim()) { toast.error('Title is required'); return; }
    setSubmitting(true);
    try {
      const res = await api<{ content_id: string; status: string }>('/api/submissions', {
        method: 'POST',
        json: { meta: metaPayload(), upload_id: upload?.upload_id, tags: editor.tags, ai_summary: editor.summary || null, ai_analysis: analysis, as_draft: asDraft },
      });
      setDone(res);
      toast.success(asDraft ? 'Draft saved' : t('contrib.success'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { toast.error((e as Error).message); } finally { setSubmitting(false); }
  };

  const fillSample = (s: typeof SAMPLES[number]) => {
    setMeta((m) => ({ ...m, content_type: s.content_type, title: s.title, description: s.description, abstract: s.abstract, keywords: s.keywords, region: '', research_area: '' }));
    setAnalysis(null);
  };

  const step = done ? (done.status === 'draft' ? 0 : 2) : analysis ? 1 : 0;

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-2xl">
        <div className="glass-panel rounded-3xl p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/15">
            <CheckCircle2 size={32} className="text-emerald-300" aria-hidden />
          </div>
          <h1 className="font-space text-2xl font-bold text-ice-50">{done.status === 'draft' ? 'Draft saved' : t('contrib.success')}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-ice-400">
            {done.status === 'draft' ? 'Your draft is stored privately in your dashboard.' : 'A curator will review the AI-suggested metadata and your content. Nothing is published until a human approves it.'}
          </p>
          <div className="my-7 flex justify-center"><Workflow current={step} /></div>
          <div className="mb-6 grid gap-2 text-left sm:grid-cols-3">
            {[{ i: Bot, h: 'AI analysed', d: 'Summary, tags & classification suggested' }, { i: UserCheck, h: 'Human review', d: 'Curator approves, edits or rejects' }, { i: Globe2, h: 'Published', d: 'Indexed for semantic search & map' }].map((x, k) => (
              <div key={x.h} className={cn('rounded-xl border p-3', k <= 1 ? 'border-cyan-400/20 bg-cyan-400/[0.05]' : 'border-white/5')}>
                <x.i size={16} className="mb-1 text-cyan-300" aria-hidden /><p className="text-xs font-semibold text-ice-100">{x.h}</p><p className="text-[11px] text-ice-500">{x.d}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className="btn-primary">{t('nav.dashboard')} <ArrowRight size={15} aria-hidden /></Link>
            {user?.role === 'admin' && done.status !== 'draft' && <Link href="/admin/review" className="btn-secondary">{t('admin.review')}</Link>}
            <button onClick={() => { setDone(null); setAnalysis(null); setFile(null); setUpload(null); setMeta((m) => ({ ...m, title: '', description: '', abstract: '', keywords: '' })); }} className="btn-secondary">Submit another</button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <PageHeader eyebrow={t('nav.upload')} icon={Upload} title={t('contrib.title')} subtitle={t('contrib.subtitle')}
        actions={<div className="flex flex-wrap gap-2">{SAMPLES.map((s) => <button key={s.label} onClick={() => fillSample(s)} className="btn-ghost border border-dashed border-cyan-400/25 px-3 py-1.5 text-xs"><Wand2 size={12} aria-hidden />{s.label}</button>)}</div>} />
      <div className="mb-6 overflow-x-auto scrollbar-none"><Workflow current={step} /></div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-5">
          {/* Type */}
          <fieldset className="glass-panel rounded-2xl p-5">
            <legend className="sr-only">{t('common.contentType')}</legend>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ice-300">1 · {t('common.contentType')}</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {TYPES.map((ct) => (
                <button key={ct.value} type="button" onClick={() => set('content_type', ct.value)} aria-pressed={meta.content_type === ct.value}
                  className={cn('flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all',
                    meta.content_type === ct.value ? 'border-cyan-300/50 bg-cyan-400/12 text-cyan-100' : 'border-white/8 text-ice-400 hover:border-cyan-400/25 hover:text-ice-100')}>
                  <ct.icon size={18} aria-hidden /><span className="text-[11px] font-semibold leading-tight">{ct.label}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* Upload */}
          <div className="glass-panel rounded-2xl p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ice-300">2 · File upload <span className="font-normal normal-case tracking-normal text-ice-500">(PDF / TXT / CSV are text-analysed)</span></p>
            <div role="button" tabIndex={0} aria-label="Upload a file: drop here or press Enter to browse"
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) pickFile(f); }}
              onClick={() => inputRef.current?.click()}
              className={cn('cursor-pointer rounded-xl border-2 border-dashed p-7 text-center transition-all', drag ? 'border-cyan-300 bg-cyan-400/10' : 'border-cyan-400/20 hover:border-cyan-400/40')}>
              {file ? (
                <div className="mx-auto max-w-md">
                  <div className="flex items-center gap-3 text-left">
                    <FileUp size={26} className={upload ? 'text-emerald-300' : 'text-cyan-300'} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ice-100">{file.name}</p>
                      <p className="text-[11px] text-ice-500">{upload ? `${upload.size_label} · ${upload.extraction} · ${upload.extracted_characters.toLocaleString()} chars extracted` : `${(file.size / 1048576).toFixed(2)} MB`}</p>
                    </div>
                    {!uploading && <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setUpload(null); }} aria-label="Remove file" className="text-ice-500 hover:text-ice-100"><X size={16} /></button>}
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
                    <motion.div className={cn('h-full rounded-full', upload ? 'bg-emerald-400' : 'bg-gradient-to-r from-sky-500 to-cyan-300')} animate={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-1.5 text-[11px] text-ice-400">{uploading ? `Uploading… ${progress}%` : upload ? 'Upload complete' : ''}</p>
                </div>
              ) : (
                <>
                  <Upload size={28} className="mx-auto mb-2 text-cyan-400/60" aria-hidden />
                  <p className="text-sm font-medium text-ice-200">Drag &amp; drop your file here</p>
                  <p className="mt-1 text-xs text-ice-500">or click to browse · PDF, CSV, NetCDF, ZIP, JPG, MP4 · up to 200 MB</p>
                </>
              )}
              <input ref={inputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ''; }} />
            </div>
          </div>

          {/* Metadata */}
          <div className="glass-panel space-y-4 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-ice-300">3 · Metadata</p>
            <div>
              <label htmlFor="m-title" className="field-label">Title *</label>
              <input id="m-title" value={meta.title} onChange={(e) => set('title', e.target.value)} placeholder="Descriptive title" className="polar-input" required />
            </div>
            <div>
              <label htmlFor="m-desc" className="field-label">Description</label>
              <textarea id="m-desc" rows={2} value={meta.description} onChange={(e) => set('description', e.target.value)} placeholder="One or two sentences describing the content" className="polar-input resize-y" />
            </div>
            <div>
              <label htmlFor="m-abs" className="field-label">Abstract / full text excerpt <span className="normal-case tracking-normal text-ice-500">(optional — improves AI analysis)</span></label>
              <textarea id="m-abs" rows={4} value={meta.abstract} onChange={(e) => set('abstract', e.target.value)} className="polar-input resize-y" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label htmlFor="m-region" className="field-label">{t('common.region')}</label>
                <select id="m-region" value={meta.region} onChange={(e) => set('region', e.target.value)} className="polar-input"><option value="">Let AI suggest</option>{REGIONS.map((r) => <option key={r}>{r}</option>)}</select></div>
              <div><label htmlFor="m-area" className="field-label">{t('common.researchArea')}</label>
                <select id="m-area" value={meta.research_area} onChange={(e) => set('research_area', e.target.value)} className="polar-input"><option value="">Let AI suggest</option>{RESEARCH_AREAS.map((r) => <option key={r}>{r}</option>)}</select></div>
              <div><label htmlFor="m-author" className="field-label">{t('common.author')}(s)</label><input id="m-author" value={meta.author} onChange={(e) => set('author', e.target.value)} className="polar-input" /></div>
              <div><label htmlFor="m-org" className="field-label">Organization</label><input id="m-org" value={meta.organization} onChange={(e) => set('organization', e.target.value)} className="polar-input" /></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div><label htmlFor="m-year" className="field-label">{t('common.year')}</label><input id="m-year" type="number" min={1980} max={2030} value={meta.year} onChange={(e) => set('year', e.target.value)} className="polar-input" /></div>
              <div><label htmlFor="m-lic" className="field-label">License</label><select id="m-lic" value={meta.license} onChange={(e) => set('license', e.target.value)} className="polar-input">{LICENSES.map((l) => <option key={l}>{l}</option>)}</select></div>
              <div><label htmlFor="m-acc" className="field-label">Access level</label><select id="m-acc" value={meta.access_level} onChange={(e) => set('access_level', e.target.value)} className="polar-input">{ACCESS.map((l) => <option key={l}>{l}</option>)}</select></div>
            </div>
            <div><label htmlFor="m-kw" className="field-label">{t('common.keywords')}</label><input id="m-kw" value={meta.keywords} onChange={(e) => set('keywords', e.target.value)} placeholder="Comma-separated" className="polar-input" /></div>
          </div>

          {/* AI */}
          <div ref={aiRef} className="scroll-mt-24 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={runAI} disabled={analyzing || uploading} className="btn-primary disabled:opacity-60">
                {analyzing ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Sparkles size={16} aria-hidden />}
                {analyzing ? 'Analysing…' : analysis ? 'Re-run AI analysis' : t('contrib.runAi')}
              </button>
              {analysis && <button type="button" onClick={applyAll} className="btn-secondary"><Wand2 size={15} aria-hidden /> {t('contrib.applySuggestions')}</button>}
              <span className="text-xs text-ice-500">AI suggests summary, tags, region and research area. You decide what to keep.</span>
            </div>
            <AnimatePresence>
              {analysis && (
                <AIAnalysisPanel analysis={analysis} state={editor} onChange={setEditor} locations={locations}
                  selectedLocations={locs} onToggleLocation={(id) => setLocs((l) => l.includes(id) ? l.filter((x) => x !== id) : [...l, id])}
                  onApplyClassification={(f, v) => { set(f, v); toast.success(`Applied ${v}`); }} />
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button onClick={() => submit(false)} disabled={submitting || uploading} className="btn-primary flex-1 justify-center rounded-2xl py-3.5 text-base disabled:opacity-60">
              {submitting ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Upload size={18} aria-hidden />} {t('contrib.submit')}
            </button>
            <button onClick={() => submit(true)} disabled={submitting} className="btn-secondary justify-center rounded-2xl py-3.5"><Save size={16} aria-hidden /> {t('contrib.saveDraft')}</button>
          </div>
        </div>

        {/* Side */}
        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <div className="glass-panel rounded-2xl p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ice-300">Trusted publication</h2>
            <ol className="space-y-3">
              {[{ i: Upload, h: 'Contribute', d: 'Upload file & metadata' }, { i: Bot, h: 'AI analysis', d: 'Summary, tags, classification, duplicate check' }, { i: UserCheck, h: 'Human review', d: 'Curator verifies every field' }, { i: Globe2, h: 'Publish & discover', d: 'Semantic search, map, related content' }].map((s, i) => (
                <li key={s.h} className="flex gap-3">
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs', i <= step ? 'border-cyan-300/50 bg-cyan-400/15 text-cyan-200' : 'border-white/10 text-ice-500')}><s.i size={14} aria-hidden /></span>
                  <span><span className="block text-sm font-medium text-ice-100">{s.h}</span><span className="text-[11px] text-ice-500">{s.d}</span></span>
                </li>
              ))}
            </ol>
          </div>
          <div className="glass-panel rounded-2xl p-5">
            <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ice-300"><Info size={12} aria-hidden /> Guidelines</h2>
            <ul className="space-y-1.5 text-xs leading-relaxed text-ice-400">
              <li>• Data should come from Indian or collaborative polar programmes</li>
              <li>• Datasets should include a README / data dictionary</li>
              <li>• Images: minimum 1920 px wide, with captions</li>
              <li>• AI suggestions are never published without review</li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}

export default function ContributePage() {
  return (
    <AppShell>
      <AuthGate role="contributor" title="Sign in to contribute" reason="Contributions are linked to your account so curators can review them.">
        <ContributeForm />
      </AuthGate>
    </AppShell>
  );
}
