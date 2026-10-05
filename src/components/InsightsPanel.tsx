'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Search, Globe2, Download, ClipboardCheck } from 'lucide-react';
import { useApi } from '@/lib/useApi';
import { useT } from '@/lib/i18n';
import { Skeleton } from '@/components/ui';

interface Insights { insights: { icon: string; text: string; href: string }[]; method: string }

const INSIGHT_ICON: Record<string, typeof TrendingUp> = { trend: TrendingUp, search: Search, globe: Globe2, download: Download, review: ClipboardCheck };

export default function InsightsPanel({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const { data, loading } = useApi<Insights>('/api/analytics/insights');
  return (
    <section className="ai-panel rounded-2xl p-5" aria-labelledby="insights-h">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="insights-h" className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200"><Sparkles size={15} aria-hidden /> {t('admin.insights')}</h2>
        {!compact && <Link href="/analytics" className="text-[11px] font-semibold text-cyan-300 hover:text-cyan-100">Explore insights →</Link>}
      </div>
      {loading && !data ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-4 w-full" />)}</div> : (
        <ul className="space-y-2.5">
          {data?.insights.map((ins, i) => {
            const Icon = INSIGHT_ICON[ins.icon] || Sparkles;
            return (
              <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                <Link href={ins.href} className="group flex items-start gap-2.5 rounded-lg p-1.5 text-sm leading-snug text-ice-200 hover:bg-white/[0.03]">
                  <Icon size={15} className="mt-0.5 shrink-0 text-cyan-300" aria-hidden />
                  <span className="group-hover:text-white">{ins.text}</span>
                </Link>
              </motion.li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-[10px] text-ice-500">{data?.method}</p>
    </section>
  );
}

