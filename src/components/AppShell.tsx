'use client';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen, Home, Search, Map, Database, Image as ImageIcon, WifiOff } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAppStore } from '@/lib/store';
import { useT, type TKey } from '@/lib/i18n';

const bottomItems: { icon: typeof Home; key: TKey; href: string }[] = [
  { icon: Home, key: 'nav.home', href: '/' },
  { icon: Search, key: 'nav.search', href: '/search' },
  { icon: Map, key: 'nav.map', href: '/explore/map' },
  { icon: Database, key: 'nav.repository', href: '/repository' },
  { icon: ImageIcon, key: 'nav.media', href: '/media' },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();
  return (
    <nav aria-label="Bottom navigation" className="glass fixed inset-x-0 bottom-0 z-40 border-t border-cyan-400/10 pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid grid-cols-5">
        {bottomItems.map((i) => {
          const active = i.href === '/' ? pathname === '/' : pathname.startsWith(i.href);
          return (
            <li key={i.href}>
              <Link href={i.href} aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium ${active ? 'text-cyan-300' : 'text-ice-400'}`}>
                <i.icon size={19} aria-hidden />
                <span className="max-w-full truncate">{t(i.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function LowBandwidthBanner() {
  const low = useAppStore((s) => s.lowBandwidth);
  const setLow = useAppStore((s) => s.setLowBandwidth);
  const t = useT();
  if (!low) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-2 border-b border-amber-400/20 bg-amber-400/10 px-4 py-1.5 text-[11px] text-amber-100">
      <WifiOff size={12} aria-hidden />
      <strong className="font-semibold uppercase tracking-wider">{t('common.lowBandwidth')}</strong>
      <span className="hidden sm:inline">· {t('common.lowBandwidthDesc')}</span>
      <button onClick={() => setLow(false)} className="ml-2 underline underline-offset-2 hover:text-white">Turn off</button>
    </div>
  );
}

export default function AppShell({ children, fullBleed = false }: { children: ReactNode; fullBleed?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="min-h-screen bg-polar-gradient">
      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar />
      <div className="flex pt-16">
        <aside className={`glass fixed bottom-0 left-0 top-16 z-30 hidden flex-col border-r border-cyan-400/10 transition-[width] duration-300 md:flex ${collapsed ? 'w-[64px]' : 'w-[220px]'}`}>
          <button onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex items-center justify-end px-4 pb-1 pt-3 text-ice-500 transition-colors hover:text-cyan-300">
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
          <Sidebar collapsed={collapsed} />
        </aside>
        <main id="main" className={`min-w-0 flex-1 pb-20 transition-[margin] duration-300 md:pb-0 ${collapsed ? 'md:ml-[64px]' : 'md:ml-[220px]'}`}>
          <LowBandwidthBanner />
          {fullBleed ? children : <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
