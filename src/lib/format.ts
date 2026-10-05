import {
  FileText, Database, BarChart3, Camera, Video, Newspaper, BookOpen, Globe2, HelpCircle, Package, Ship, type LucideIcon,
} from 'lucide-react';
import type { ContentType } from './api';

/** Unsplash URLs get size/quality params (smaller in low-bandwidth mode); local uploads pass through. */
export function imgUrl(url: string | undefined | null, width = 800, lowBandwidth = false): string {
  if (!url) return '';
  if (url.startsWith('https://images.unsplash.com/')) {
    const base = url.split('?')[0];
    const w = lowBandwidth ? Math.min(320, Math.round(width / 2)) : width;
    const q = lowBandwidth ? 35 : 72;
    return `${base}?w=${w}&q=${q}&auto=format&fit=crop`;
  }
  return url;
}

export const TYPE_META: Record<ContentType, { icon: LucideIcon; color: string; chip: string; hex: string }> = {
  paper: { icon: FileText, color: 'text-sky-300', chip: 'bg-sky-500/15 text-sky-200 border-sky-400/30', hex: '#38BDF8' },
  dataset: { icon: Database, color: 'text-emerald-300', chip: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30', hex: '#34D399' },
  report: { icon: BarChart3, color: 'text-amber-300', chip: 'bg-amber-500/15 text-amber-200 border-amber-400/30', hex: '#FBBF24' },
  photo: { icon: Camera, color: 'text-violet-300', chip: 'bg-violet-500/15 text-violet-200 border-violet-400/30', hex: '#A78BFA' },
  video: { icon: Video, color: 'text-rose-300', chip: 'bg-rose-500/15 text-rose-200 border-rose-400/30', hex: '#FB7185' },
  press_release: { icon: Newspaper, color: 'text-cyan-300', chip: 'bg-cyan-500/15 text-cyan-200 border-cyan-400/30', hex: '#22D3EE' },
  story: { icon: BookOpen, color: 'text-pink-300', chip: 'bg-pink-500/15 text-pink-200 border-pink-400/30', hex: '#F472B6' },
  tour: { icon: Globe2, color: 'text-teal-300', chip: 'bg-teal-500/15 text-teal-200 border-teal-400/30', hex: '#2DD4BF' },
  quiz: { icon: HelpCircle, color: 'text-orange-300', chip: 'bg-orange-500/15 text-orange-200 border-orange-400/30', hex: '#FB923C' },
  kit: { icon: Package, color: 'text-indigo-300', chip: 'bg-indigo-500/15 text-indigo-200 border-indigo-400/30', hex: '#818CF8' },
  expedition: { icon: Ship, color: 'text-lime-300', chip: 'bg-lime-500/15 text-lime-200 border-lime-400/30', hex: '#A3E635' },
};

/** Where a content card should link to, by type. */
export function contentHref(c: { id: string; content_type: string; extra?: Record<string, any> }): string {
  if (c.extra?.href) return c.extra.href;
  switch (c.content_type) {
    case 'photo': case 'video': case 'press_release': return `/media/${c.id}`;
    case 'expedition': return `/media/expeditions/${c.id}`;
    case 'story': return `/education/stories/${c.id}`;
    case 'tour': return `/education/tour/${c.id}`;
    case 'quiz': return `/education/quiz/${c.id}`;
    case 'kit': return `/education/kits`;
    default: return `/repository/${c.id}`;
  }
}

export function formatDate(iso?: string | null, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', opts);
}

export function timeAgo(iso?: string | null) {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  const d = Math.floor(diff / 86400);
  return d < 30 ? `${d} day${d > 1 ? 's' : ''} ago` : formatDate(iso);
}

export const REGIONS = ['Antarctica', 'Arctic', 'Himalaya', 'Southern Ocean'];
export const RESEARCH_AREAS = ['Glaciology', 'Climate Science', 'Atmospheric Science', 'Oceanography', 'Polar Biology', 'Geology', 'Remote Sensing', 'Hydrology'];

export const REGION_HEX: Record<string, string> = {
  Antarctica: '#48CAE4', Arctic: '#818CF8', Himalaya: '#34D399', 'Southern Ocean': '#38BDF8', India: '#FBBF24',
};

export const CATEGORY_HEX: Record<string, string> = {
  station: '#F87171', expedition: '#34D399', dataset: '#60A5FA', media: '#C084FC', event: '#FBBF24',
};

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
