'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Package, CheckCircle2, Clock, Users, Snowflake } from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '@/components/AppShell';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/format';
import { KITS, SEAICE_ACTIVITY, type Kit } from '@/lib/education';
import { PageHeader, RevealOnScroll, SmartImage } from '@/components/ui';
import { SERIES } from '@/components/charts';

function downloadKit(k: Kit) {
  const text = [
    `POLARSYNC EDUCATOR KIT — ${k.title}`, `Level: ${k.level} · Duration: ${k.duration}`, '', k.summary, '', 'CONTENTS', ...k.contents.map((c) => `  • ${c}`), '',
    'Online resources', '  • Virtual tour: /education/tour/tour-maitri', '  • Quiz: /education/quiz/quiz-polar', '  • Polar map: /explore/map', '',
    'PolarSync SIH 2026 prototype — sample educational material. Licence: CC BY 4.0.',
  ].join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: `${k.id}-lesson-plan.txt` });
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Lesson plan downloaded');
}

function SeaIceActivity() {
  const [pick, setPick] = useState<{ max?: string; min?: string }>({});
  const [mode, setMode] = useState<'max' | 'min'>('max');
  const maxV = Math.max(...SEAICE_ACTIVITY.map((d) => d.v));
  const maxM = SEAICE_ACTIVITY.find((d) => d.v === maxV)!.m;
  const minM = SEAICE_ACTIVITY.reduce((a, b) => (b.v < a.v ? b : a)).m;
  const done = pick.max && pick.min;
  return (
    <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-4">
      <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-ice-100"><Snowflake size={14} className="text-cyan-300" aria-hidden /> Try it: when is Antarctic sea ice largest and smallest?</p>
      <p className="mb-3 text-[11px] text-ice-500">Illustrative seasonal values (million km²) for classroom use — not measurements. Select the {mode === 'max' ? 'maximum' : 'minimum'} month.</p>
      <div className="flex h-40 items-end gap-1.5" role="group" aria-label="Monthly sea ice bars">
        {SEAICE_ACTIVITY.map((d) => {
          const chosen = pick.max === d.m || pick.min === d.m;
          const correct = done && (d.m === maxM || d.m === minM);
          return (
            <button key={d.m} onClick={() => setPick((p) => { const n = { ...p, [mode]: d.m }; if (mode === 'max') setMode('min'); return n; })}
              aria-label={`${d.m}: ${d.v} million square kilometres`} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
              <motion.span initial={{ height: 0 }} whileInView={{ height: `${(d.v / maxV) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.6 }}
                className={cn('w-full rounded-t-[4px] transition-opacity', chosen ? 'opacity-100' : 'opacity-70 group-hover:opacity-100')}
                style={{ background: correct ? SERIES[2] : chosen ? SERIES[3] : SERIES[0] }} />
              <span className="text-[9px] text-ice-400">{d.m}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        <span className="text-ice-300">Max: <strong className="text-ice-50">{pick.max || '—'}</strong></span>
        <span className="text-ice-300">Min: <strong className="text-ice-50">{pick.min || '—'}</strong></span>
        {done && (
          <span className={cn('rounded-full px-2.5 py-0.5 font-semibold', pick.max === maxM && pick.min === minM ? 'bg-emerald-500/20 text-emerald-100' : 'bg-amber-500/20 text-amber-100')} role="status">
            {pick.max === maxM && pick.min === minM ? 'Correct! Sea ice peaks in late winter (Sep) and is smallest in late summer (Feb).' : `Not quite — peak is ${maxM}, minimum is ${minM}. Southern Hemisphere seasons are reversed.`}
          </span>
        )}
        {done && <button onClick={() => { setPick({}); setMode('max'); }} className="text-cyan-300 hover:underline">Reset</button>}
      </div>
    </div>
  );
}

export default function KitsPage() {
  const t = useT();
  return (
    <AppShell>
      <Link href="/education" className="mb-4 inline-flex items-center gap-1.5 text-xs text-ice-400 hover:text-ice-100"><ArrowLeft size={13} aria-hidden /> {t('nav.education')}</Link>
      <PageHeader eyebrow={t('type.kit')} icon={Package} title={t('edu.kits')} subtitle="Free, ready-to-teach resources connected to real PolarSync research, tours and quizzes." />
      <div className="space-y-6">
        {KITS.map((k, i) => (
          <RevealOnScroll key={k.id} delay={i * 0.05}>
            <article id={k.id} className="glass-panel scroll-mt-24 overflow-hidden rounded-3xl md:grid md:grid-cols-[320px_1fr]">
              <SmartImage src={k.image} alt="" width={700} className="h-48 w-full object-cover md:h-full" />
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-3 text-xs text-ice-400">
                  <span className="flex items-center gap-1"><Users size={12} aria-hidden />{k.level}</span>
                  <span className="flex items-center gap-1"><Clock size={12} aria-hidden />{k.duration}</span>
                </div>
                <h2 className="mt-2 font-space text-2xl font-bold text-ice-50">{k.title}</h2>
                <p className="mt-2 text-sm text-ice-300">{k.summary}</p>
                <ul className="mt-4 space-y-1.5">
                  {k.contents.map((c) => <li key={c} className="flex gap-2 text-sm text-ice-200"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-300" aria-hidden />{c}</li>)}
                </ul>
                {k.activity === 'seaice' && <SeaIceActivity />}
                <button onClick={() => downloadKit(k)} className="btn-primary mt-5"><Download size={15} aria-hidden /> Download lesson plan</button>
              </div>
            </article>
          </RevealOnScroll>
        ))}
      </div>
    </AppShell>
  );
}
