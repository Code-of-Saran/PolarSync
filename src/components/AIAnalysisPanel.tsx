'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Plus, X, Check, AlertTriangle, Cpu, MapPin, Wand2, Copy, Tags, FileText, Gauge, Layers } from 'lucide-react';
import type { AIAnalysis, Location } from '@/lib/api';
import { contentHref } from '@/lib/format';
import { useT, type TKey } from '@/lib/i18n';
import { ConfidenceBar } from '@/components/ui';

export interface AIEditorState {
  tags: string[];
  summary: string;
}

export default function AIAnalysisPanel({
  analysis, state, onChange, onApplyClassification, locations, selectedLocations, onToggleLocation, compact = false,
}: {
  analysis: AIAnalysis;
  state: AIEditorState;
  onChange: (s: AIEditorState) => void;
  onApplyClassification?: (field: 'content_type' | 'region' | 'research_area', value: string) => void;
  locations?: Location[];
  selectedLocations?: string[];
  onToggleLocation?: (id: string) => void;
  compact?: boolean;
}) {
  const t = useT();
  const [newTag, setNewTag] = useState('');
  const accepted = new Set(state.tags.map((x) => x.toLowerCase()));
  const toggle = (tag: string) =>
    onChange({ ...state, tags: accepted.has(tag.toLowerCase()) ? state.tags.filter((x) => x.toLowerCase() !== tag.toLowerCase()) : [...state.tags, tag] });
  const addTag = () => {
    const v = newTag.trim();
    if (v && !accepted.has(v.toLowerCase())) onChange({ ...state, tags: [...state.tags, v] });
    setNewTag('');
  };
  const humanTags = state.tags.filter((x) => !analysis.tags.some((a) => a.tag.toLowerCase() === x.toLowerCase()));
  const cls = analysis.classification;
  const locById = Object.fromEntries((locations || []).map((l) => [l.id, l]));

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="ai-panel space-y-5 rounded-2xl p-5" aria-label={t('admin.aiAnalysis')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200"><Sparkles size={15} aria-hidden /> {t('admin.aiAnalysis')}</h2>
        <span className="flex items-center gap-1.5 rounded-full border border-amber-300/25 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-100">
          <AlertTriangle size={10} aria-hidden /> Suggestions — human review required
        </span>
      </div>

      {analysis.possible_duplicate && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-100">
          <Copy size={14} className="mt-0.5 shrink-0" aria-hidden />
          <span>Possible duplicate of <Link className="font-semibold underline" href={`/repository/${analysis.possible_duplicate.id}`}>{analysis.possible_duplicate.title}</Link> ({Math.round(analysis.possible_duplicate.similarity * 100)}% similar)</span>
        </div>
      )}

      {/* Summary */}
      <div>
        <label htmlFor="ai-summary" className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ice-300"><FileText size={12} aria-hidden /> {t('common.summary')} <span className="font-normal normal-case tracking-normal text-ice-500">(editable)</span></label>
        <textarea id="ai-summary" rows={compact ? 4 : 5} value={state.summary} onChange={(e) => onChange({ ...state, summary: e.target.value })}
          className="polar-input resize-y text-sm leading-relaxed" />
      </div>

      {/* Key topics */}
      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ice-300"><Layers size={12} aria-hidden /> Key topics</p>
        <div className="flex flex-wrap gap-1.5">{analysis.key_topics.map((k) => <span key={k} className="tag">{k}</span>)}</div>
      </div>

      {/* Tags */}
      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ice-300"><Tags size={12} aria-hidden /> {t('contrib.aiTags')} <span className="font-normal normal-case tracking-normal text-ice-500">— click to accept / remove</span></p>
        <div className="flex flex-wrap gap-1.5">
          {analysis.tags.map((tg) => {
            const on = accepted.has(tg.tag.toLowerCase());
            return (
              <button key={tg.tag} type="button" onClick={() => toggle(tg.tag)} aria-pressed={on}
                title={`${tg.source === 'vocabulary' ? 'Controlled vocabulary' : 'Statistical keyphrase'} · confidence ${Math.round(tg.confidence * 100)}%`}
                className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${on ? 'border-cyan-300/50 bg-cyan-400/15 text-cyan-100' : 'border-white/10 bg-white/[0.02] text-ice-500 line-through decoration-ice-500/60'}`}>
                {on ? <Check size={11} aria-hidden /> : <Plus size={11} aria-hidden />}
                {tg.tag}
                <span className={`text-[9px] tabular-nums ${on ? 'text-cyan-300/80' : 'text-ice-500'}`}>{Math.round(tg.confidence * 100)}</span>
              </button>
            );
          })}
          {humanTags.map((h) => (
            <span key={h} className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
              {h} <button type="button" onClick={() => toggle(h)} aria-label={`Remove ${h}`}><X size={11} /></button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <label htmlFor="add-tag" className="sr-only">{t('contrib.addTag')}</label>
          <input id="add-tag" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            placeholder={t('contrib.addTag')} className="polar-input max-w-xs py-1.5 text-xs" />
          <button type="button" onClick={addTag} className="btn-secondary px-3 py-1.5 text-xs"><Plus size={12} aria-hidden /> Add</button>
        </div>
      </div>

      {/* Classification */}
      <div className="grid gap-3 sm:grid-cols-3">
        {([['content_type', t('common.contentType')], ['region', t('common.region')], ['research_area', t('common.researchArea')]] as const).map(([field, label]) => {
          const c = cls[field];
          const display = field === 'content_type' ? t(`type.${c.label}` as TKey) : c.label;
          return (
            <div key={field} className="rounded-xl border border-white/5 bg-black/15 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ice-500">{label}</p>
              <p className="mt-0.5 font-space text-sm font-semibold text-ice-50">{display}</p>
              <div className="mt-2"><ConfidenceBar value={c.confidence * 100} label="Confidence" tone="cyan" /></div>
              {c.alternatives.length > 0 && <p className="mt-1.5 truncate text-[10px] text-ice-500">Alt: {c.alternatives.map((a) => `${field === 'content_type' ? t(`type.${a.label}` as TKey) : a.label} ${Math.round(a.confidence * 100)}%`).join(', ')}</p>}
              {onApplyClassification && (
                <button type="button" onClick={() => onApplyClassification(field, c.label)} className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:text-cyan-100">
                  <Wand2 size={11} aria-hidden /> Apply
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Locations */}
      {analysis.suggested_location_ids.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ice-300"><MapPin size={12} aria-hidden /> Linked map locations</p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.suggested_location_ids.map((id) => {
              const on = selectedLocations?.includes(id);
              return onToggleLocation ? (
                <button key={id} type="button" onClick={() => onToggleLocation(id)} aria-pressed={on}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${on ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100' : 'border-white/10 text-ice-500'}`}>
                  {on ? <Check size={11} aria-hidden /> : <Plus size={11} aria-hidden />} {locById[id]?.name || id}
                </button>
              ) : <span key={id} className="tag">{locById[id]?.name || id}</span>;
            })}
          </div>
        </div>
      )}

      {/* Quality + similar */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ice-300"><Gauge size={12} aria-hidden /> Quality checks <span className="ml-auto font-space text-sm normal-case tracking-normal text-ice-50">{analysis.overall_quality}%</span></p>
          {analysis.quality_checks.map((q) => <ConfidenceBar key={q.key} value={q.score} label={q.label} detail={q.detail} />)}
        </div>
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ice-300">Most similar existing records</p>
          <ul className="space-y-1.5">
            {analysis.similar_content.map((s) => (
              <li key={s.id}>
                <Link href={contentHref(s)} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs text-ice-300 hover:bg-white/[0.03] hover:text-ice-100">
                  <span className="truncate">{s.title}</span><span className="shrink-0 tabular-nums text-ice-500">{Math.round(s.similarity * 100)}%</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/5 pt-3 text-[10px] text-ice-500">
        <span className="flex items-center gap-1"><Cpu size={10} aria-hidden /> {analysis.model.embeddings}</span>
        <span>· {analysis.model.summarizer}</span>
        <span>· {analysis.analysed_characters.toLocaleString()} chars in {analysis.processing_ms} ms</span>
        {analysis.extraction && <span>· {analysis.extraction}</span>}
      </p>
    </motion.section>
  );
}
