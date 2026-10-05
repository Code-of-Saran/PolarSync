'use client';
import { use, useRef } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowDown, Clock, BookOpen } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useAppStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { imgUrl } from '@/lib/format';
import { STORIES, tr, type StorySection } from '@/lib/education';
import { RevealOnScroll, useCalm } from '@/components/ui';

function Section({ s, index }: { s: StorySection; index: number }) {
  const lang = useAppStore((st) => st.lang);
  const low = useAppStore((st) => st.lowBandwidth);
  const calm = useCalm();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  const imgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1.02, 1.1]);
  const clip = useTransform(scrollYProgress, [0, 0.35], ['inset(18% 12% 18% 12% round 28px)', 'inset(0% 0% 0% 0% round 28px)']);
  const flip = index % 2 === 1;
  return (
    <section ref={ref} id={s.key} className="grid min-h-[90vh] scroll-mt-20 items-center gap-8 py-16 lg:grid-cols-2 lg:gap-14">
      <motion.div style={calm ? undefined : { clipPath: clip }} className={`relative h-[46vh] overflow-hidden rounded-[28px] lg:h-[70vh] ${flip ? 'lg:order-2' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img src={imgUrl(s.image, 1400, low)} alt="" loading="lazy" style={calm ? undefined : { y: imgY, scale: imgScale }} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(2,11,24,0.6)] to-transparent" />
        {s.fact && (
          <div className="glass absolute bottom-5 left-5 max-w-[75%] rounded-2xl px-4 py-3">
            <p className="font-space text-3xl font-bold text-cyan-200">{s.fact.value}</p>
            <p className="text-xs text-ice-200">{tr(s.fact.label, lang)}</p>
          </div>
        )}
      </motion.div>
      <div className={flip ? 'lg:order-1' : ''}>
        <RevealOnScroll><p className="font-space text-sm font-bold tracking-[0.3em] text-cyan-300">0{index + 1}</p></RevealOnScroll>
        <RevealOnScroll delay={0.05}><h2 className="mt-2 font-space text-3xl font-bold leading-tight text-ice-50 sm:text-4xl">{tr(s.heading, lang)}</h2></RevealOnScroll>
        {s.body.map((p, i) => (
          <RevealOnScroll key={i} delay={0.1 + i * 0.08}><p className="mt-4 text-base leading-relaxed text-ice-300 sm:text-lg">{tr(p, lang)}</p></RevealOnScroll>
        ))}
        {s.link && (
          <RevealOnScroll delay={0.25}><Link href={s.link.href} className="btn-secondary mt-6">{tr(s.link.label, lang)} <ArrowRight size={15} aria-hidden /></Link></RevealOnScroll>
        )}
      </div>
    </section>
  );
}

export default function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const low = useAppStore((s) => s.lowBandwidth);
  const story = STORIES.find((s) => s.id === id);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.12], ['0%', '25%']);
  if (!story) return notFound();
  const others = STORIES.filter((s) => s.id !== id);

  return (
    <AppShell fullBleed>
      <motion.div className="fixed left-0 right-0 top-16 z-40 h-1 origin-left bg-gradient-to-r from-sky-500 via-cyan-300 to-emerald-300" style={{ scaleX: progress }} aria-hidden />
      <header className="relative flex min-h-[88vh] items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgUrl(story.hero, 2000, low)} alt="" className="kenburns absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(2,11,24,0.5)] via-[rgba(2,11,24,0.55)] to-[#020B18]" />
        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <Link href="/education" className="mx-auto mb-8 flex w-fit items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs text-ice-100 backdrop-blur hover:bg-black/60"><ArrowLeft size={13} aria-hidden /> {t('nav.education')}</Link>
          <p className="mb-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-pink-300"><BookOpen size={13} aria-hidden /> {t('type.story')} · <Clock size={12} aria-hidden /> {story.readTime}</p>
          <h1 className="font-space text-4xl font-bold uppercase leading-[1.05] text-white sm:text-6xl">{tr(story.title, lang)}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-ice-200">{tr(story.subtitle, lang)}</p>
          <nav aria-label="Story chapters" className="mt-8 flex flex-wrap justify-center gap-2">
            {story.sections.map((s, i) => (
              <a key={s.key} href={`#${s.key}`} className="glass rounded-full px-3 py-1.5 text-xs text-ice-100 hover:border-cyan-300/50">{i + 1}. {tr(s.heading, lang)}</a>
            ))}
          </nav>
          <ArrowDown size={20} className="mx-auto mt-10 animate-bounce text-cyan-300" aria-hidden />
        </motion.div>
      </header>

      <article className="mx-auto max-w-6xl px-4 sm:px-8">
        {story.sections.map((s, i) => <Section key={s.key} s={s} index={i} />)}
      </article>

      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-8">
        <div className="glass-panel rounded-3xl p-6 sm:p-8">
          <h2 className="mb-4 font-space text-xl font-bold text-ice-50">Keep exploring</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {others.map((o) => (
              <Link key={o.id} href={`/education/stories/${o.id}`} className="group relative h-36 overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgUrl(o.hero, 600, low)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                <p className="absolute bottom-3 left-3 right-3 font-space text-sm font-semibold text-white">{tr(o.title, lang)}</p>
              </Link>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/education/quiz/quiz-polar" className="btn-primary">{t('edu.startQuiz')} <ArrowRight size={15} aria-hidden /></Link>
            <Link href="/education/tour/tour-maitri" className="btn-secondary">{t('edu.takeTour')}</Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
