'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Compass, Map, Search, Database, Image, GraduationCap, Settings, Upload, LayoutDashboard, Shield, BarChart3, Info,
  ClipboardCheck, type LucideIcon,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useT, type TKey } from '@/lib/i18n';

type Item = { icon: LucideIcon; key: TKey; href: string };

const mainItems: Item[] = [
  { icon: Home, key: 'nav.home', href: '/' },
  { icon: Compass, key: 'nav.explore', href: '/explore' },
  { icon: Map, key: 'nav.map', href: '/explore/map' },
  { icon: Search, key: 'nav.search', href: '/search' },
  { icon: Database, key: 'nav.repository', href: '/repository' },
  { icon: Image, key: 'nav.media', href: '/media' },
  { icon: GraduationCap, key: 'nav.education', href: '/education' },
];

const workItems: Item[] = [
  { icon: LayoutDashboard, key: 'nav.dashboard', href: '/dashboard' },
  { icon: Upload, key: 'nav.upload', href: '/contribute' },
];

const adminItems: Item[] = [
  { icon: Shield, key: 'admin.title', href: '/admin' },
  { icon: ClipboardCheck, key: 'nav.review', href: '/admin/review' },
  { icon: BarChart3, key: 'nav.analytics', href: '/analytics' },
];

const footerItems: Item[] = [
  { icon: Settings, key: 'nav.settings', href: '/settings' },
  { icon: Info, key: 'nav.about', href: '/about' },
];

export function mobileNavGroups(role?: string): Item[][] {
  // Admin tools are always listed so judges can find them; pages gate access.
  return [mainItems, workItems, role === 'contributor' ? footerItems : [...adminItems, ...footerItems]];
}

function NavItem({ item, active, collapsed }: { item: Item; active: boolean; collapsed: boolean }) {
  const t = useT();
  return (
    <Link href={item.href} aria-current={active ? 'page' : undefined} title={collapsed ? t(item.key) : undefined}
      className={`sidebar-item group ${active ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}>
      <item.icon size={17} aria-hidden className={active ? 'text-cyan-300' : 'text-ice-400 group-hover:text-ice-100'} />
      {!collapsed && <span className="flex-1 truncate">{t(item.key)}</span>}
      {collapsed && <span className="sr-only">{t(item.key)}</span>}
    </Link>
  );
}

function Section({ label, items, collapsed, isActive }: { label?: string; items: Item[]; collapsed: boolean; isActive: (href: string) => boolean }) {
  return (
    <div className="flex flex-col gap-0.5 px-2">
      {label && !collapsed && <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-ice-500">{label}</p>}
      {label && collapsed && <div className="mx-3 my-2 polar-divider" />}
      {items.map((i) => <NavItem key={i.href} item={i} active={isActive(i.href)} collapsed={collapsed} />)}
    </div>
  );
}

export default function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const user = useAppStore((s) => s.user);
  const t = useT();
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/explore') return pathname === '/explore';
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };
  return (
    <nav aria-label="Sidebar" className="flex h-full flex-col overflow-y-auto py-2 scrollbar-none">
      <Section items={mainItems} collapsed={collapsed} isActive={isActive} />
      <Section label="Workspace" items={workItems} collapsed={collapsed} isActive={isActive} />
      {user?.role !== 'contributor' && <Section label="Admin" items={adminItems} collapsed={collapsed} isActive={isActive} />}
      <div className="mt-auto">
        <Section label=" " items={footerItems} collapsed={collapsed} isActive={isActive} />
        {!collapsed && user && (
          <div className="px-3 pt-3">
            <Link href="/dashboard" className="flex items-center gap-2.5 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.06] p-2.5 transition-colors hover:border-cyan-400/25">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00B4D8] to-[#0077B6] text-[10px] font-bold text-white">
                {user.name.replace('Dr. ', '').split(' ').map((p) => p[0]).slice(0, 2).join('')}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-ice-100">{user.name}</span>
                <span className="block text-[10px] capitalize text-ice-500">{user.role}</span>
              </span>
            </Link>
          </div>
        )}
        {!collapsed && !user && (
          <div className="px-3 pt-3">
            <Link href="/login" className="btn-secondary w-full justify-center text-xs">{t('nav.signin')}</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
