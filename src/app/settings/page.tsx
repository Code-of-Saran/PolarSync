'use client';
import { Settings, Globe, WifiOff, Accessibility, Type, MonitorPlay, Check, Keyboard, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '@/components/AppShell';
import { useAppStore } from '@/lib/store';
import { LANGUAGES, useT } from '@/lib/i18n';
import { cn } from '@/lib/format';
import { PageHeader } from '@/components/ui';

function Toggle({ checked, onChange, label, desc, icon: Icon }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc: string; icon: typeof WifiOff }) {
  const id = `t-${label.replace(/\s+/g, '-')}`;
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="flex items-start gap-3">
        <Icon size={18} className="mt-0.5 shrink-0 text-cyan-300" aria-hidden />
        <div><label htmlFor={id} className="text-sm font-medium text-ice-100">{label}</label><p className="text-xs text-ice-500">{desc}</p></div>
      </div>
      <button id={id} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-11 shrink-0 rounded-full border transition-colors', checked ? 'border-cyan-300/60 bg-cyan-500/60' : 'border-white/15 bg-white/10')}>
        <span className={cn('absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} style={{ width: 18, height: 18 }} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const t = useT();
  const s = useAppStore();
  return (
    <AppShell>
      <PageHeader eyebrow={t('nav.settings')} icon={Settings} title={t('settings.title')} subtitle="Language, bandwidth and accessibility preferences are saved on this device." />
      <div className="grid max-w-4xl gap-5">
        <section className="glass-panel rounded-2xl p-5" aria-labelledby="lang-h">
          <h2 id="lang-h" className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ice-300"><Globe size={13} aria-hidden /> {t('nav.language')}</h2>
          <div role="radiogroup" aria-labelledby="lang-h" className="grid gap-2 sm:grid-cols-3">
            {LANGUAGES.map((l) => (
              <button key={l.code} role="radio" aria-checked={s.lang === l.code} onClick={() => s.setLang(l.code)}
                className={cn('flex items-center justify-between rounded-xl border p-3 text-left', s.lang === l.code ? 'border-cyan-300/50 bg-cyan-400/12' : 'border-white/10 hover:border-cyan-400/30')}>
                <span><span className="block text-base font-semibold text-ice-50">{l.native}</span><span className="text-[11px] text-ice-500">{l.label}{l.code === 'hi' ? ' · partial' : ''}</span></span>
                {s.lang === l.code && <Check size={16} className="text-cyan-300" aria-hidden />}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-ice-500">Navigation, buttons, main pages and core educational content are translated. Research records stay in their original language.</p>
        </section>

        <section className="glass-panel divide-y divide-white/5 rounded-2xl px-5 py-2" aria-label={t('settings.appearance')}>
          <Toggle icon={WifiOff} checked={s.lowBandwidth} onChange={(v) => { s.setLowBandwidth(v); toast(v ? t('common.lowBandwidthDesc') : 'Full experience restored'); }}
            label={t('common.lowBandwidth')} desc="Smaller images, no blur effects, no animations, no autoplay — optimized for slower connections." />
          <Toggle icon={MonitorPlay} checked={s.reduceMotion} onChange={s.setReduceMotion} label={t('settings.reduceMotion')} desc="Disable parallax, tilt and transitions (also follows your OS setting)." />
          <Toggle icon={Type} checked={s.largeText} onChange={s.setLargeText} label={t('settings.largeText')} desc="Increase the base font size by 12.5%." />
        </section>

        <section className="glass-panel rounded-2xl p-5" aria-labelledby="a11y-h">
          <h2 id="a11y-h" className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ice-300"><Accessibility size={13} aria-hidden /> {t('settings.accessibility')}</h2>
          <ul className="space-y-1.5 text-sm text-ice-300">
            <li className="flex gap-2"><Keyboard size={15} className="mt-0.5 shrink-0 text-cyan-300" aria-hidden /> Press <kbd className="rounded border border-white/15 bg-white/5 px-1 text-xs">Ctrl K</kbd> anywhere to search; <kbd className="rounded border border-white/15 bg-white/5 px-1 text-xs">Tab</kbd> shows visible focus rings; a “Skip to content” link is the first focusable element.</li>
            <li>• Charts include a table view; images carry alt text; forms have labels; toggles expose ARIA state.</li>
            <li>• Text colours meet WCAG AA contrast on the dark background (prototype-level accessibility, not a certification).</li>
          </ul>
          <button onClick={() => { s.clearRecentSearches(); toast.success('Recent searches cleared'); }} className="mt-4 flex items-center gap-1.5 text-xs text-ice-400 hover:text-ice-100"><Trash2 size={12} aria-hidden /> Clear recent searches</button>
        </section>
      </div>
    </AppShell>
  );
}
