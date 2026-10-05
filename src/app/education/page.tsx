'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Globe2, HelpCircle, Package, ArrowRight, Clock, GraduationCap, MapPin, Award } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { useAppStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { imgUrl } from '@/lib/format';
import { EDU_IMG, KITS, QUIZZES, STORIES, TOURS, tr } from '@/lib/education';
import { ParallaxSection, RevealOnScroll, SectionHeader, SmartImage, TiltCard } from '@/components/ui';

function BigCard({ href, image, eyebrow, title, desc, meta, cta, tone, index, tall = false }: {
  href: string; image: string; eyebrow: string; title: string; desc: string; meta?: string; cta: string; tone: string; index: number; tall?: boolean;
}) {
  return (
    <RevealOnScroll delay={index * 0.08} className="h-full">
      <TiltCard className="h-full rounded-3xl" max={4}>
        <Link href={href} className={`glass-panel glass-panel-hover group relative block h-full overflow-hidden rounded-3xl ${tall ? 'min-h-[420px]' : 'min-h-[300px]'}`}>
          <SmartImage src={image} alt="" width={1000} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(2,11,24,0.97)] via-[rgba(2,11,24,0.45)] to-[rgba(2,11,24,0.1)]" />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <p className={`mb-2 text-[11px] font-bold uppercase tracking-[0.2em] ${tone}`}>{eyebrow}</p>
            <h3 className="font-space text-2xl font-bold leading-tight text-white">{title}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-ice-200">{desc}</p>
            <div className="mt-4 flex items-center justify-between">
              {meta && <span className="flex items-center gap-1.5 text-xs text-ice-300"><Clock size={12} aria-hidden />{meta}</span>}
              <span className="flex items-center gap-1 text-sm font-semibold text-white">{cta} <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" aria-hidden /></span>
            </div>
          </div>
        </Link>
      </TiltCard>
    </RevealOnScroll>
  );
}

export default function EducationPage() {
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const low = useAppStore((s) => s.lowBandwidth);

  return (
    <AppShell fullBleed>
      <ParallaxSection image={imgUrl(EDU_IMG.aurora, 2000, low)} height="min-h-[460px] sm:min-h-[540px]" speed={0.3}>
        <div className="mx-auto flex min-h-[460px] max-w-screen-2xl flex-col items-start justify-end px-4 pb-12 sm:min-h-[540px] sm:px-8">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-cyan-300"><GraduationCap size={14} aria-hidden /> {t('nav.education')} · Outreach</p>
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="max-w-4xl font-space text-4xl font-bold uppercase leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            {t('edu.hero')}
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4 max-w-2xl text-base text-ice-200 sm:text-lg">{t('edu.subtitle')}</motion.p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/education/stories/story-antarctica" className="btn-primary">{t('edu.readStory')} <ArrowRight size={15} aria-hidden /></Link>
            <Link href="/education/quiz/quiz-polar" className="btn-secondary"><Award size={15} aria-hidden /> {t('edu.startQuiz')}</Link>
          </div>
        </div>
      </ParallaxSection>

      <div className="mx-auto max-w-screen-2xl space-y-14 px-4 py-12 sm:px-8">
        <section aria-labelledby="stories-h">
          <SectionHeader id="stories-h" icon={BookOpen} title={t('edu.stories')} subtitle={t('edu.storiesDesc')} />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
            {STORIES.map((s, i) => (
              <div key={s.id} className={i === 0 ? 'md:col-span-2 lg:col-span-1 lg:row-span-2' : ''}>
                <BigCard href={`/education/stories/${s.id}`} image={s.hero} eyebrow={t('type.story')} title={tr(s.title, lang)} desc={tr(s.subtitle, lang)}
                  meta={`${s.readTime} read`} cta={t('edu.readStory')} tone="text-pink-300" index={i} tall={i === 0} />
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="tours-h">
          <SectionHeader id="tours-h" icon={Globe2} title={t('edu.tours')} subtitle={t('edu.toursDesc')} />
          <div className="grid gap-5 md:grid-cols-2">
            {TOURS.map((tour, i) => (
              <BigCard key={tour.id} href={`/education/tour/${tour.id}`} image={tour.image} eyebrow={`${t('type.tour')} · ${tour.hotspots.length} hotspots`}
                title={tr(tour.title, lang)} desc={tr(tour.intro, lang)} cta={t('edu.takeTour')} tone="text-teal-300" index={i} />
            ))}
          </div>
        </section>

        <section aria-labelledby="quiz-h">
          <SectionHeader id="quiz-h" icon={HelpCircle} title={t('edu.quizzes')} subtitle={t('edu.quizzesDesc')} />
          <div className="grid gap-5 md:grid-cols-2">
            {QUIZZES.map((q, i) => (
              <BigCard key={q.id} href={`/education/quiz/${q.id}`} image={q.image} eyebrow={`${t('type.quiz')} · ${q.questions.length} questions`}
                title={tr(q.title, lang)} desc="Instant feedback with explanations, a progress tracker and your Polar Explorer level." cta={t('edu.startQuiz')} tone="text-orange-300" index={i} />
            ))}
          </div>
        </section>

        <section aria-labelledby="kits-h">
          <SectionHeader id="kits-h" icon={Package} title={t('edu.kits')} subtitle={t('edu.kitsDesc')}
            action={<Link href="/education/kits" className="flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-cyan-100">{t('common.viewAll')} <ArrowRight size={12} aria-hidden /></Link>} />
          <div className="grid gap-5 md:grid-cols-3">
            {KITS.map((k, i) => (
              <BigCard key={k.id} href={`/education/kits#${k.id}`} image={k.image} eyebrow={`${t('type.kit')} · ${k.level}`} title={k.title} desc={k.summary}
                meta={k.duration} cta={t('edu.openKit')} tone="text-indigo-300" index={i} />
            ))}
          </div>
        </section>

        <RevealOnScroll className="glass-panel flex flex-col items-center gap-4 rounded-3xl p-8 text-center sm:flex-row sm:text-left">
          <MapPin size={36} className="shrink-0 text-cyan-300" aria-hidden />
          <div className="flex-1">
            <h2 className="font-space text-xl font-bold text-ice-50">Every story is connected to real places and research</h2>
            <p className="mt-1 text-sm text-ice-400">Jump from a story to the station on the map, then to the papers and datasets produced there.</p>
          </div>
          <Link href="/explore/map" className="btn-primary shrink-0">{t('nav.map')} <ArrowRight size={15} aria-hidden /></Link>
        </RevealOnScroll>
      </div>
    </AppShell>
  );
}
