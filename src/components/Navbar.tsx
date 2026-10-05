'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Globe, Menu, X, Wifi, WifiOff, LogIn, LogOut, LayoutDashboard, Shield, Settings, ChevronDown, Check, BarChart3, Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '@/lib/store';
import { LANGUAGES, useT, type TKey } from '@/lib/i18n';
import { api } from '@/lib/api';
import { mobileNavGroups } from './Sidebar';

const navLinks: { key: TKey; href: string }[] = [
  { key: 'nav.home', href: '/' },
  { key: 'nav.explore', href: '/explore' },
  { key: 'nav.repository', href: '/repository' },
  { key: 'nav.media', href: '/media' },
  { key: 'nav.education', href: '/education' },
  { key: 'nav.about', href: '/about' },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="PolarSync home">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg shadow-[0_0_18px_rgba(0,180,216,0.35)]" style={{ background: 'linear-gradient(135deg,#00B4D8,#0077B6)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.9" />
          <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
          <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      {!compact && <span className="font-space text-lg font-bold text-gradient">PolarSync</span>}
    </Link>
  );
}

function useClickAway(ref: React.RefObject<HTMLElement | null>, onAway: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onAway(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, onAway]);
}

export function LanguageMenu({ align = 'right' }: { align?: 'right' | 'left' }) {
  const lang = useAppStore((s) => s.lang);
  const setLang = useAppStore((s) => s.setLang);
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickAway(ref, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} aria-label={t('nav.language')}
        className="btn-ghost flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold">
        <Globe size={15} aria-hidden /> {lang.toUpperCase()} <ChevronDown size={12} aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="menu" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className={`glass-panel-strong absolute top-full z-50 mt-2 w-44 rounded-xl p-1.5 ${align === 'right' ? 'right-0' : 'left-0'}`}>
            {LANGUAGES.map((l) => (
              <button key={l.code} role="menuitemradio" aria-checked={lang === l.code}
                onClick={() => { setLang(l.code); setOpen(false); }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-ice-200 hover:bg-cyan-400/10">
                <span>{l.native} <span className="text-[11px] text-ice-500">{l.code !== 'en' ? `· ${l.label}` : ''}</span></span>
                {lang === l.code && <Check size={14} className="text-cyan-300" aria-hidden />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LowBandwidthToggle({ withLabel = false }: { withLabel?: boolean }) {
  const low = useAppStore((s) => s.lowBandwidth);
  const setLow = useAppStore((s) => s.setLowBandwidth);
  const t = useT();
  return (
    <button
      onClick={() => {
        setLow(!low);
        toast(!low ? `${t('common.lowBandwidth')} — ${t('common.lowBandwidthDesc')}` : `${t('common.lowBandwidth')}: off`, { icon: !low ? '📶' : '✨' });
      }}
      aria-pressed={low} title={t('common.lowBandwidth')} aria-label={t('common.lowBandwidth')}
      className={`btn-ghost px-2 py-1.5 ${low ? 'bg-amber-400/10 text-amber-200' : ''}`}>
      {low ? <WifiOff size={16} aria-hidden /> : <Wifi size={16} aria-hidden />}
      {withLabel && <span className="text-sm">{t('common.lowBandwidth')}</span>}
    </button>
  );
}

function UserMenu() {
  const user = useAppStore((s) => s.user);
  const hydrated = useAppStore((s) => s.hydrated);
  const logout = useAppStore((s) => s.logout);
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickAway(ref, () => setOpen(false));
  if (!hydrated) return <div className="h-8 w-20" aria-hidden />;
  if (!user) {
    return <Link href="/login" className="btn-secondary px-3 py-1.5 text-xs"><LogIn size={14} aria-hidden /> {t('nav.signin')}</Link>;
  }
  const initials = user.name.replace('Dr. ', '').split(' ').map((p) => p[0]).slice(0, 2).join('');
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open}
        className="flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1.5 transition-colors hover:border-cyan-400/40">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#00B4D8] to-[#0077B6] text-[10px] font-bold text-white">{initials}</span>
        <span className="hidden max-w-[110px] truncate text-xs font-medium text-ice-200 lg:inline">{user.name.split(' ').slice(0, 2).join(' ')}</span>
        <ChevronDown size={12} className="text-ice-400" aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div role="menu" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="glass-panel-strong absolute right-0 top-full z-50 mt-2 w-60 rounded-xl p-1.5">
            <div className="border-b border-white/5 px-3 py-2.5">
              <p className="text-sm font-semibold text-ice-50">{user.name}</p>
              <p className="text-[11px] capitalize text-cyan-300">{user.role} · {user.organization}</p>
            </div>
            {[
              { href: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
              { href: '/contribute', icon: Upload, label: t('nav.upload') },
              ...(user.role === 'admin' ? [{ href: '/admin', icon: Shield, label: t('admin.title') }, { href: '/analytics', icon: BarChart3, label: t('nav.analytics') }] : []),
              { href: '/settings', icon: Settings, label: t('nav.settings') },
            ].map((i) => (
              <Link key={i.href} href={i.href} role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ice-200 hover:bg-cyan-400/10">
                <i.icon size={15} className="text-ice-400" aria-hidden />{i.label}
              </Link>
            ))}
            <button role="menuitem" onClick={async () => { await api('/api/auth/logout', { method: 'POST' }).catch(() => {}); logout(); setOpen(false); toast.success('Signed out'); router.push('/'); }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-rose-200 hover:bg-rose-400/10">
              <LogOut size={15} aria-hidden />{t('nav.signout')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar({ transparent = false }: { transparent?: boolean }) {
  const pathname = usePathname();
  const t = useT();
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen);
  const user = useAppStore((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setMobileOpen(false), [pathname]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const solid = !transparent || scrolled || mobileOpen;

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${solid ? 'border-b border-cyan-400/10 bg-[rgba(4,14,28,0.9)] backdrop-blur-xl' : 'border-b border-transparent bg-transparent'}`}>
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* Mobile: ☰  PolarSync  Search */}
          <button className="btn-ghost p-2 md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label={t('nav.menu')} aria-expanded={mobileOpen}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Logo />
          <button className="btn-ghost p-2 md:hidden" onClick={() => setPaletteOpen(true)} aria-label={t('nav.search')}><Search size={20} /></button>

          <nav aria-label="Primary" className="hidden items-center gap-0.5 md:flex">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} aria-current={isActive(l.href) ? 'page' : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${isActive(l.href) ? 'bg-cyan-400/15 text-cyan-200' : 'text-ice-300 hover:bg-cyan-400/[0.07] hover:text-ice-50'}`}>
                {t(l.key)}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-1.5 md:flex">
            <button onClick={() => setPaletteOpen(true)} aria-label={`${t('nav.search')} (Ctrl+K)`}
              className="group flex items-center gap-2 rounded-xl border border-cyan-400/15 bg-[rgba(6,22,40,0.6)] px-3 py-1.5 text-xs text-ice-400 transition-colors hover:border-cyan-400/35 hover:text-ice-100">
              <Search size={14} aria-hidden /><span className="hidden lg:inline">{t('nav.search')}…</span>
              <kbd className="hidden rounded border border-white/10 bg-white/5 px-1 text-[10px] lg:inline">Ctrl K</kbd>
            </button>
            <LanguageMenu />
            <LowBandwidthToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/50 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} aria-hidden />
            <motion.nav aria-label="Mobile" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="glass-panel-strong fixed inset-y-0 left-0 z-40 flex w-[82%] max-w-xs flex-col overflow-y-auto px-4 pb-6 pt-20 md:hidden">
              {mobileNavGroups(user?.role).map((group, gi) => (
                <div key={gi} className={gi ? 'mt-3 border-t border-white/5 pt-3' : ''}>
                  {group.map((i) => (
                    <Link key={i.href} href={i.href} aria-current={isActive(i.href) ? 'page' : undefined}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${isActive(i.href) ? 'bg-cyan-400/15 text-cyan-200' : 'text-ice-200 hover:bg-cyan-400/[0.07]'}`}>
                      <i.icon size={17} aria-hidden />{t(i.key)}
                    </Link>
                  ))}
                </div>
              ))}
              <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-4">
                <LanguageMenu align="left" />
                <LowBandwidthToggle withLabel />
              </div>
              <div className="mt-3"><UserMenu /></div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
