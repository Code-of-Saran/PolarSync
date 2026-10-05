'use client';
import { useEffect, useRef, useState, type ReactNode, type ElementType } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, SearchX, X, ChevronRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store';
import { cn, imgUrl, TYPE_META } from '@/lib/format';
import { useT, type TKey } from '@/lib/i18n';
import type { ContentType } from '@/lib/api';

export function GlassCard({ children, className = '', as: As = 'div', hover = false, ...rest }: {
  children: ReactNode; className?: string; as?: ElementType; hover?: boolean; [k: string]: unknown;
}) {
  return <As className={cn('glass-panel rounded-2xl', hover && 'glass-panel-hover', className)} {...rest}>{children}</As>;
}

export function Badge({ children, className = '', icon: Icon }: { children: ReactNode; className?: string; icon?: LucideIcon }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-5', className)}>
      {Icon && <Icon size={11} aria-hidden />}{children}
    </span>
  );
}

export function TypeBadge({ type, className = '', size = 'sm' }: { type: ContentType | string; className?: string; size?: 'sm' | 'xs' }) {
  const t = useT();
  const meta = TYPE_META[type as ContentType];
  if (!meta) return <Badge className="border-white/15 text-white/70">{type}</Badge>;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-lg border font-semibold backdrop-blur-md', meta.chip,
      size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]', className)}>
      <meta.icon size={size === 'xs' ? 10 : 12} aria-hidden /> {t(`type.${type}` as TKey)}
    </span>
  );
}

const STATUS_STYLE: Record<string, string> = {
  published: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
  approved: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
  under_review: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
  pending: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
  draft: 'bg-slate-500/20 text-slate-200 border-slate-400/30',
  rejected: 'bg-rose-500/15 text-rose-200 border-rose-400/30',
  changes_requested: 'bg-orange-500/15 text-orange-200 border-orange-400/30',
};

export function StatusBadge({ status }: { status: string }) {
  const t = useT();
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', STATUS_STYLE[status] || STATUS_STYLE.draft)}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {t(`status.${status}` as TKey)}
    </span>
  );
}

export function PageHeader({ eyebrow, icon: Icon, title, subtitle, actions, crumbs }: {
  eyebrow?: string; icon?: LucideIcon; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode;
  crumbs?: { label: string; href?: string }[];
}) {
  return (
    <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
      {crumbs && (
        <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-ice-500">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {c.href ? <Link href={c.href} className="hover:text-ice-100 transition-colors">{c.label}</Link> : <span className="text-ice-300 line-clamp-1">{c.label}</span>}
              {i < crumbs.length - 1 && <ChevronRight size={11} aria-hidden />}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
              {Icon && <Icon size={13} aria-hidden />}{eyebrow}
            </p>
          )}
          <h1 className="font-space text-3xl font-bold leading-tight text-gradient-white sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ice-400 sm:text-base">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </motion.header>
  );
}

export function SectionHeader({ icon: Icon, title, subtitle, action, id }: { icon?: LucideIcon; title: ReactNode; subtitle?: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
            <Icon size={17} className="text-cyan-300" aria-hidden />
          </div>
        )}
        <div className="min-w-0">
          <h2 id={id} className="font-space text-lg font-semibold text-ice-50 sm:text-xl">{title}</h2>
          {subtitle && <p className="text-xs text-ice-500 sm:text-sm">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton rounded-xl', className)} />;
}

export function CardGridSkeleton({ count = 8, className = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' }: { count?: number; className?: string }) {
  const t = useT();
  return (
    <div className={className} role="status" aria-label={t('common.loading')}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-panel overflow-hidden rounded-2xl">
          <Skeleton className="h-40 rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-4/5" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon = SearchX, title, hint, action }: { icon?: LucideIcon; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-400/15 px-6 py-16 text-center">
      <Icon size={40} className="mb-3 text-cyan-400/30" aria-hidden />
      <p className="font-medium text-ice-200">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs text-ice-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  const t = useT();
  return (
    <div role="alert" className="flex flex-col items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-500/5 px-6 py-12 text-center">
      <AlertTriangle size={36} className="mb-3 text-rose-300/80" aria-hidden />
      <p className="font-medium text-ice-100">{message || t('common.apiDown')}</p>
      <p className="mt-1 text-xs text-ice-500">{t('common.apiDown') !== message ? 'Backend: cd backend && .venv/Scripts/python main.py' : ''}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-4"><RefreshCw size={14} aria-hidden /> {t('common.retry')}</button>
      )}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, tone = 'cyan', hint, delay = 0 }: {
  label: string; value: ReactNode; icon: LucideIcon; tone?: 'cyan' | 'amber' | 'emerald' | 'violet' | 'slate' | 'rose'; hint?: ReactNode; delay?: number;
}) {
  const tones: Record<string, string> = {
    cyan: 'text-cyan-300 bg-cyan-400/10 border-cyan-400/20', amber: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
    emerald: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20', violet: 'text-violet-300 bg-violet-400/10 border-violet-400/20',
    slate: 'text-slate-300 bg-slate-400/10 border-slate-400/20', rose: 'text-rose-300 bg-rose-400/10 border-rose-400/20',
  };
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className={cn('mb-3 flex h-10 w-10 items-center justify-center rounded-xl border', tones[tone])}>
        <Icon size={19} aria-hidden />
      </div>
      <div className="font-space text-2xl font-bold text-ice-50 sm:text-3xl">{value}</div>
      <div className="mt-0.5 text-xs text-ice-400">{label}</div>
      {hint && <div className="mt-2 text-[11px] text-ice-500">{hint}</div>}
    </motion.div>
  );
}

export function Modal({ open, onClose, children, label, className = '', wide = false }: {
  open: boolean; onClose: () => void; children: ReactNode; label: string; className?: string; wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => ref.current?.querySelector<HTMLElement>('input,button,[tabindex]')?.focus(), 30);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus?.(); };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-3 pt-[8vh] sm:p-6 sm:pt-[10vh]"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="fixed inset-0 bg-[rgba(2,8,18,0.78)] backdrop-blur-sm" onClick={onClose} aria-hidden />
          <motion.div ref={ref} role="dialog" aria-modal="true" aria-label={label}
            initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className={cn('glass-panel-strong relative w-full rounded-2xl', wide ? 'max-w-5xl' : 'max-w-2xl', className)}>
            <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-ice-400 hover:bg-white/5 hover:text-ice-50">
              <X size={18} />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Segmented<T extends string>({ options, value, onChange, label, size = 'md' }: {
  options: { value: T; label: ReactNode; count?: number; icon?: LucideIcon }[]; value: T; onChange: (v: T) => void; label: string; size?: 'sm' | 'md';
}) {
  return (
    <div role="tablist" aria-label={label} className="scrollbar-none flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border border-cyan-400/10 bg-[rgba(6,22,40,0.55)] p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} role="tab" aria-selected={active} onClick={() => onChange(o.value)}
            className={cn('relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-colors',
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-1.5 text-sm',
              active ? 'text-cyan-200' : 'text-ice-400 hover:text-ice-100')}>
            {active && <motion.span layoutId={`seg-${label}`} className="absolute inset-0 rounded-lg border border-cyan-400/30 bg-cyan-400/15" transition={{ type: 'spring', damping: 30, stiffness: 400 }} />}
            <span className="relative flex items-center gap-1.5">
              {o.icon && <o.icon size={13} aria-hidden />}{o.label}
              {o.count !== undefined && <span className="text-[10px] opacity-60">{o.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options, allLabel }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string; count?: number }[]; allLabel?: string;
}) {
  const t = useT();
  const id = `f-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-ice-500">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="polar-input py-2 text-xs">
        <option value="">{allLabel || t('common.all')}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}{o.count !== undefined ? ` (${o.count})` : ''}</option>)}
      </select>
    </div>
  );
}

/** Image that respects low-bandwidth mode: smaller files, or a tinted placeholder. */
export function SmartImage({ src, alt, width = 800, className = '', priority = false, placeholderLabel }: {
  src?: string | null; alt: string; width?: number; className?: string; priority?: boolean; placeholderLabel?: string;
}) {
  const low = useAppStore((s) => s.lowBandwidth);
  const [failed, setFailed] = useState(false);
  if (!src || failed || (low && width > 1200)) {
    return (
      <div role="img" aria-label={alt} className={cn('flex items-center justify-center bg-gradient-to-br from-[#0b2a46] via-[#0a2036] to-[#061628]', className)}>
        {placeholderLabel && <span className="px-3 text-center text-[11px] font-medium text-ice-500">{placeholderLabel}</span>}
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={imgUrl(src, width, low)} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} className={className} />;
}

export function ConfidenceBar({ value, label, detail, tone }: { value: number; label: string; detail?: string; tone?: 'auto' | 'cyan' }) {
  const pct = Math.round(value);
  const color = tone === 'cyan' ? 'from-sky-500 to-cyan-300' : pct >= 85 ? 'from-emerald-500 to-emerald-300' : pct >= 65 ? 'from-amber-500 to-amber-300' : 'from-rose-500 to-rose-300';
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="text-ice-300">{label}</span>
        <span className="font-semibold tabular-nums text-ice-100">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: 'easeOut' }} className={cn('h-full rounded-full bg-gradient-to-r', color)} />
      </div>
      {detail && <p className="mt-1 text-[10px] text-ice-500">{detail}</p>}
    </div>
  );
}

export function RelevanceRing({ value, size = 44 }: { value: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`${value}% relevant`} role="img">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(72,202,228,0.12)" strokeWidth={4} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke="url(#relGrad)" strokeWidth={4} fill="none" strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value / 100) }} transition={{ duration: 0.9, ease: 'easeOut' }} />
        <defs><linearGradient id="relGrad" x1="0" x2="1"><stop offset="0%" stopColor="#0EA5E9" /><stop offset="100%" stopColor="#67E8F9" /></linearGradient></defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold tabular-nums text-cyan-100">{value}</span>
    </div>
  );
}
