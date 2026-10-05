'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Search, ArrowRight, Database, Image as ImageIcon, ChevronDown, MapPin, FileText, Globe, Microscope, Layers, Sparkles, Bot,
  UserCheck, ShieldCheck, Map as MapIcon, GraduationCap, Upload, Brain, Network,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { BottomNav, LowBandwidthBanner } from '@/components/AppShell';
import { useAppStore } from '@/lib/store';
import { useApi } from '@/lib/useApi';
import { useT, type TKey } from '@/lib/i18n';
import { imgUrl } from '@/lib/format';
import type { ContentCard as Card } from '@/lib/api';
import { ContentCard, FloatingCard, ParallaxSection, RevealOnScroll, TiltCard, useCalm } from '@/components/ui';

const HERO = 'https://images.unsplash.com/photo-1494564605686-2e931f77a8e2';
const ASKS = ['How is climate change affecting Antarctic ice?', 'What is happening to Himalayan glaciers?', 'Penguin colonies near Indian stations'];

// Deterministic particle field (no Math.random during render → no hydration mismatch)
const PARTICLES = Array.from({ length: 26 }, (_, i) => ({
  left: (i * 37.7) % 100, top: (i * 53.3) % 100, dur: 10 + ((i * 7) % 12), delay: (i * 1.3) % 9, size: i % 5 === 0 ? 3 : 2,
}));

const SECTIONS: { key: string; icon: typeof Database; title: TKey; sub: TKey; href: string; image: string; desc: string }[] = [
  { key: 'research', icon: Microscope, title: 'landing.card.research', sub: 'landing.card.researchSub', href: '/repository', image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa', desc: 'Peer-reviewed papers, long-term datasets and expedition reports — each with AI-assisted, human-verified metadata.' },
  { key: 'media', icon: ImageIcon, title: 'landing.card.media', sub: 'landing.card.mediaSub', href: '/media', image: 'https://images.unsplash.com/photo-1551415923-a2297c7fda79', desc: 'Cinematic photographs, expedition films and press releases from the frontlines of polar science.' },
  { key: 'explore', icon: Globe, title: 'landing.card.explore', sub: 'landing.card.exploreSub', href: '/explore/map', image: 'https://images.unsplash.com/photo-1529963183134-61a90db47eaf', desc: 'An interactive map, scroll-through stories, virtual tours and quizzes for every learner.' },
];

export default function LandingPage() {
  const t = useT();
  const router = useRouter();
  const low = useAppStore((s) => s.lowBandwidth);
  const calm = useCalm();
  const heroRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const midY = useTransform(scrollYProgress, [0, 1], ['0%', '55%']);
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const { data: stats } = useApi<{ totals: Record<string, number> }>('/api/analytics');
  const { data: recent } = useApi<{ items: Card[] }>('/api/repository?sort=recent');

  const go = (query: string) => { if (query.trim()) { useAppStore.getState().addRecentSearch(query.trim()); router.push(`/search?q=${encodeURIComponent(query.trim())}`); } };
  const tot = stats?.totals;

  return (
    <div className="min-h-screen bg-polar-gradient">
      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar transparent />

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden pt-16" aria-label="PolarSync">
        <motion.div style={calm ? undefined : { y: bgY }} className="absolute inset-0 z-0" aria-hidden>
          {low ? <div className="h-full w-full bg-gradient-to-b from-[#0b3352] via-[#08223a] to-[#020B18]" /> : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgUrl(HERO, 2200)} alt="" className="h-full w-full scale-110 object-cover" style={{ filter: 'brightness(0.42) saturate(0.85)' }} />
          )}
        </motion.div>
        <motion.div style={calm ? undefined : { y: midY }} aria-hidden className="decorative absolute inset-x-0 top-0 z-0 h-[70%]">
          <div className="aurora-ribbon animate-aurora absolute left-[10%] top-[-10%] h-[420px] w-[80%] opacity-60" />
        </motion.div>
        <div aria-hidden className="absolute inset-0 z-0 bg-gradient-to-b from-[rgba(2,11,24,0.55)] via-[rgba(2,11,24,0.2)] to-[#020B18]" />
        <div aria-hidden className="decorative pointer-events-none absolute inset-0 z-0 overflow-hidden">
          {PARTICLES.map((p, i) => (
            <span key={i} className="absolute rounded-full bg-cyan-100/70"
              style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size, animation: `particle-drift ${p.dur}s linear ${p.delay}s infinite` }} />
          ))}
        </div>

        <motion.div style={calm ? undefined : { y: heroY, opacity: heroOpacity }} className="relative z-10 mx-auto max-w-5xl px-4 text-center">
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-[rgba(0,180,216,0.1)] px-4 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-cyan-100 backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" aria-hidden />{t('landing.badge')}
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-2 font-space text-5xl font-bold tracking-tight text-white sm:text-7xl md:text-8xl">
            POLAR<span className="text-gradient">SYNC</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="mx-auto mb-4 max-w-3xl font-space text-2xl font-semibold leading-snug text-ice-50 sm:text-3xl">
            {t('landing.title1')} <span className="text-gradient">{t('landing.title2')}</span> {t('landing.title3')}
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="mx-auto mb-8 max-w-2xl text-base text-ice-200 sm:text-lg">
            {t('landing.subtitle')}
          </motion.p>

          <motion.form role="search" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} onSubmit={(e) => { e.preventDefault(); go(q); }}
            className="mx-auto flex max-w-2xl flex-col gap-2 sm:flex-row">
            <label htmlFor="hero-q" className="sr-only">{t('common.searchPlaceholder')}</label>
            <div className="glass flex flex-1 items-center gap-3 rounded-2xl border border-cyan-300/25 px-5 py-4 shadow-2xl focus-within:border-cyan-300/60">
              <Search size={20} className="shrink-0 text-cyan-300" aria-hidden />
              <input id="hero-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('common.searchPlaceholder')}
                className="min-w-0 flex-1 bg-transparent text-sm text-ice-50 outline-none placeholder:text-ice-400 sm:text-base" />
              <kbd className="hidden rounded border border-white/15 bg-white/5 px-1.5 py-0.5 text-[10px] text-ice-400 md:block">Ctrl K</kbd>
            </div>
            <button type="submit" className="btn-primary justify-center rounded-2xl px-6 py-4"><Sparkles size={16} aria-hidden /> {t('common.search')}</button>
          </motion.form>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-ice-400">{t('landing.tryAsking')}:</span>
            {ASKS.map((a) => <button key={a} onClick={() => go(a)} className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-ice-200 backdrop-blur hover:border-cyan-300/45 hover:text-white">{a}</button>)}
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/repository" className="btn-primary">{t('landing.browse')} <ArrowRight size={16} aria-hidden /></Link>
            <Link href="/explore/map" className="btn-secondary backdrop-blur"><MapPin size={16} aria-hidden /> {t('landing.openMap')}</Link>
          </motion.div>
        </motion.div>

        {/* Floating information cards */}
        {SECTIONS.map((c, i) => (
          <FloatingCard key={c.key} delay={0.9 + i * 0.2} amplitude={7 + i}
            className={`absolute z-10 hidden xl:block ${i === 0 ? 'left-[4%] top-[58%]' : i === 1 ? 'right-[4%] top-[34%]' : 'left-[7%] top-[26%]'}`}>
            <TiltCard className="rounded-2xl" max={10}>
              <Link href={c.href} className="glass-panel glass-panel-hover flex w-56 items-center gap-3 rounded-2xl px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-400/10"><c.icon size={18} className="text-cyan-200" aria-hidden /></span>
                <span><span className="block text-sm font-bold uppercase tracking-wider text-ice-50">{t(c.title)}</span><span className="text-[11px] text-ice-300">{t(c.sub)}</span></span>
              </Link>
            </TiltCard>
          </FloatingCard>
        ))}

        <a href="#main" className="absolute bottom-7 left-1/2 z-10 hidden [@media(min-height:760px)]:flex -translate-x-1/2 flex-col items-center gap-1.5 text-ice-300 hover:text-white">
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">{t('landing.scroll')}</span>
          <ChevronDown size={20} className="animate-bounce text-cyan-300" aria-hidden />
        </a>
      </section>

      <main id="main" className="pb-16 md:pb-0">
        <LowBandwidthBanner />
        {/* ── LIVE STATS ── */}
        <section className="border-y border-cyan-400/10 bg-[rgba(2,11,24,0.75)] px-4 py-10" aria-label="Repository statistics">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { l: t('group.research'), v: tot ? tot.papers + tot.reports : '—', i: FileText },
              { l: t('group.datasets'), v: tot?.datasets ?? '—', i: Database },
              { l: t('group.media'), v: tot?.media ?? '—', i: ImageIcon },
              { l: t('group.locations'), v: tot?.locations ?? '—', i: MapPin },
            ].map((s, i) => (
              <RevealOnScroll key={s.l} delay={i * 0.08} className="stat-card text-center">
                <s.i size={20} className="mx-auto mb-2 text-cyan-300" aria-hidden />
                <div className="font-space text-3xl font-bold text-gradient">{s.v}</div>
                <div className="mt-0.5 text-xs text-ice-400">{s.l}</div>
              </RevealOnScroll>
            ))}
          </div>
          <p className="mt-4 text-center text-[11px] text-ice-500">Live counts from the prototype repository · {t('common.sampleNotice')}</p>
        </section>

        {/* ── FOUR PILLARS ── */}
        <section className="px-4 py-20" aria-labelledby="pillars-h">
          <div className="mx-auto max-w-6xl">
            <RevealOnScroll className="mb-12 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">{t('landing.pillars')}</p>
              <h2 id="pillars-h" className="font-space text-3xl font-bold text-gradient-white md:text-5xl">{t('landing.pillarsTitle')}</h2>
            </RevealOnScroll>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { i: Layers, k: 'landing.p1', d: 'landing.p1d', href: '/explore', extra: 'Research · Media · Outreach' },
                { i: Brain, k: 'landing.p2', d: 'landing.p2d', href: '/search?q=How%20is%20climate%20change%20affecting%20Antarctic%20ice%3F', extra: 'Hybrid semantic search' },
                { i: ShieldCheck, k: 'landing.p3', d: 'landing.p3d', href: '/admin/review', extra: 'AI → Human review → Trusted' },
                { i: Network, k: 'landing.p4', d: 'landing.p4d', href: '/explore/map', extra: 'Map ↔ knowledge graph' },
              ].map((p, i) => (
                <RevealOnScroll key={p.k} delay={i * 0.1} className="h-full">
                  <TiltCard className="h-full rounded-2xl">
                    <Link href={p.href} className="glass-panel glass-panel-hover group flex h-full flex-col rounded-2xl p-6">
                      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-300/25 bg-gradient-to-br from-cyan-400/20 to-violet-500/10"><p.i size={22} className="text-cyan-200" aria-hidden /></span>
                      <p className="mb-1 font-space text-xs font-bold text-ice-500">0{i + 1}</p>
                      <h3 className="font-space text-lg font-bold uppercase tracking-wide text-ice-50">{t(p.k as TKey)}</h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-ice-300">{t(p.d as TKey)}</p>
                      <p className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-cyan-300 group-hover:text-cyan-100">{p.extra} <ArrowRight size={11} aria-hidden /></p>
                    </Link>
                  </TiltCard>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        {/* ── KNOWLEDGE / MEDIA / OUTREACH ── */}
        {SECTIONS.map((s, i) => (
          <ParallaxSection key={s.key} image={imgUrl(s.image, 1800, low)} height="min-h-[440px]" speed={0.2}>
            <div className={`mx-auto flex min-h-[440px] max-w-6xl items-center px-4 py-16 ${i % 2 ? 'justify-end' : ''}`}>
              <RevealOnScroll className="glass-panel max-w-lg rounded-3xl p-7">
                <s.icon size={26} className="mb-3 text-cyan-300" aria-hidden />
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">{t(s.sub)}</p>
                <h2 className="mt-1 font-space text-3xl font-bold uppercase text-white">{t(s.title)}</h2>
                <p className="mt-3 text-sm leading-relaxed text-ice-200">{s.desc}</p>
                <Link href={s.href} className="btn-primary mt-5">{t('common.explore')} <ArrowRight size={15} aria-hidden /></Link>
              </RevealOnScroll>
            </div>
          </ParallaxSection>
        ))}

        {/* ── RECENT ── */}
        <section className="px-4 py-16" aria-labelledby="recent-h">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex items-end justify-between">
              <h2 id="recent-h" className="font-space text-2xl font-bold text-ice-50">{t('landing.recent')}</h2>
              <Link href="/repository" className="flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-100">{t('common.viewAll')} <ArrowRight size={14} aria-hidden /></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(recent?.items || []).slice(0, 4).map((c, i) => <ContentCard key={c.id} item={c} index={i} compact />)}
            </div>
          </div>
        </section>

        {/* ── TRUSTED WORKFLOW ── */}
        <section className="border-t border-cyan-400/10 bg-[rgba(2,11,24,0.6)] px-4 py-16" aria-labelledby="wf-h">
          <div className="mx-auto max-w-5xl text-center">
            <RevealOnScroll>
              <h2 id="wf-h" className="font-space text-2xl font-bold text-ice-50 sm:text-3xl">{t('landing.workflow')}</h2>
              <p className="mb-10 mt-1 text-sm text-ice-400">{t('landing.workflowSub')}</p>
            </RevealOnScroll>
            <ol className="flex flex-wrap items-center justify-center gap-2">
              {[{ l: 'Contribute', i: Upload }, { l: 'AI analysis', i: Bot }, { l: 'Metadata', i: Sparkles }, { l: 'Human review', i: UserCheck }, { l: 'Publish', i: ShieldCheck }, { l: 'Discover', i: Search }].map((s, i, arr) => (
                <RevealOnScroll as="li" key={s.l} delay={i * 0.08} className="flex items-center gap-2">
                  <span className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold uppercase tracking-wider ${s.l === 'Human review' ? 'border-amber-300/40 bg-amber-400/10 text-amber-100' : s.l === 'AI analysis' ? 'border-violet-300/40 bg-violet-500/10 text-violet-100' : 'border-cyan-400/20 bg-cyan-400/[0.07] text-ice-100'}`}>
                    <s.i size={13} aria-hidden />{s.l}
                  </span>
                  {i < arr.length - 1 && <ArrowRight size={14} className="text-cyan-400/50" aria-hidden />}
                </RevealOnScroll>
              ))}
            </ol>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link href="/contribute" className="btn-primary"><Upload size={15} aria-hidden /> {t('nav.upload')}</Link>
              <Link href="/education" className="btn-secondary"><GraduationCap size={15} aria-hidden /> {t('nav.education')}</Link>
              <Link href="/explore/map" className="btn-secondary"><MapIcon size={15} aria-hidden /> {t('nav.map')}</Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-cyan-400/10 px-4 py-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: 'linear-gradient(135deg,#00B4D8,#0077B6)' }}><Layers size={14} color="white" aria-hidden /></span>
              <span className="font-space font-bold text-gradient">PolarSync</span>
              <span className="ml-2 text-xs text-ice-500">SIH 2026 · SIH26063</span>
            </div>
            <p className="max-w-md text-center text-xs text-ice-500">{t('common.sampleNotice')} Photographs from Unsplash are illustrative.</p>
            <Link href="/about" className="text-xs text-ice-400 hover:text-ice-100">{t('nav.about')}</Link>
          </div>
        </footer>
      </main>
      <BottomNav />
    </div>
  );
}
