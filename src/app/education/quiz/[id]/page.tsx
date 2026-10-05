'use client';
import { use, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, ArrowRight, RotateCcw, Award, HelpCircle, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AppShell from '@/components/AppShell';
import { useAppStore } from '@/lib/store';
import { useT, type TKey } from '@/lib/i18n';
import { cn, imgUrl } from '@/lib/format';
import { QUIZZES, tr } from '@/lib/education';

function levelFor(pct: number): TKey {
  if (pct >= 0.9) return 'quiz.level.expert';
  if (pct >= 0.7) return 'quiz.level.advanced';
  if (pct >= 0.4) return 'quiz.level.intermediate';
  return 'quiz.level.beginner';
}

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  const lang = useAppStore((s) => s.lang);
  const low = useAppStore((s) => s.lowBandwidth);
  const quiz = QUIZZES.find((q) => q.id === id);
  const [i, setI] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);
  if (!quiz) return notFound();
  const q = quiz.questions[i];
  const total = quiz.questions.length;
  const score = answers.filter(Boolean).length;

  const submit = () => {
    if (choice === null) return;
    setSubmitted(true);
    setAnswers((a) => [...a, choice === q.answer]);
  };
  const next = () => {
    if (i + 1 >= total) { setDone(true); return; }
    setI(i + 1); setChoice(null); setSubmitted(false);
  };
  const restart = () => { setI(0); setChoice(null); setSubmitted(false); setAnswers([]); setDone(false); };

  return (
    <AppShell>
      <Link href="/education" className="mb-4 inline-flex items-center gap-1.5 text-xs text-ice-400 hover:text-ice-100"><ArrowLeft size={13} aria-hidden /> {t('nav.education')}</Link>
      <div className="relative mx-auto max-w-3xl">
        <div aria-hidden className="decorative absolute -inset-x-10 -top-10 h-64 rounded-full opacity-40 aurora-ribbon" />
        <div className="relative overflow-hidden rounded-3xl border border-cyan-400/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl(quiz.image, 1200, low)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(2,11,24,0.6)] to-[rgba(2,11,24,0.96)]" />
          <div className="relative p-5 sm:p-8">
            <p className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-orange-300"><HelpCircle size={13} aria-hidden /> {t('type.quiz')}</p>
            <h1 className="font-space text-2xl font-bold text-ice-50 sm:text-3xl">{tr(quiz.title, lang)}</h1>

            {!done ? (
              <>
                <div className="mt-6 flex items-center justify-between text-xs text-ice-300">
                  <span className="font-bold uppercase tracking-wider">{t('quiz.question')} {i + 1} {t('quiz.of')} {total}</span>
                  <span>{score} ✓</span>
                </div>
                <div className="mt-2 flex gap-1" role="progressbar" aria-valuenow={i + (submitted ? 1 : 0)} aria-valuemin={0} aria-valuemax={total} aria-label="Quiz progress">
                  {quiz.questions.map((_, k) => (
                    <span key={k} className={cn('h-1.5 flex-1 rounded-full transition-colors',
                      k < answers.length ? (answers[k] ? 'bg-emerald-400' : 'bg-rose-400') : k === i ? 'bg-cyan-300' : 'bg-white/10')} />
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div key={i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
                    <h2 className="mt-6 font-space text-xl font-semibold leading-snug text-white sm:text-2xl" id="q-text">{tr(q.q, lang)}</h2>
                    <div role="radiogroup" aria-labelledby="q-text" className="mt-5 grid gap-3 sm:grid-cols-2">
                      {q.options.map((opt, k) => {
                        const correct = submitted && k === q.answer;
                        const wrong = submitted && k === choice && k !== q.answer;
                        return (
                          <button key={k} role="radio" aria-checked={choice === k} disabled={submitted} onClick={() => setChoice(k)}
                            className={cn('flex items-center gap-3 rounded-2xl border p-4 text-left text-sm font-medium transition-all',
                              correct ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-50' : wrong ? 'border-rose-400/60 bg-rose-500/15 text-rose-50'
                                : choice === k ? 'border-cyan-300/60 bg-cyan-400/15 text-white' : 'border-white/10 bg-white/[0.03] text-ice-100 hover:border-cyan-400/35')}>
                            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-space text-sm font-bold',
                              choice === k || correct ? 'border-transparent bg-white/15' : 'border-white/15')}>{String.fromCharCode(65 + k)}</span>
                            <span className="flex-1">{tr(opt, lang)}</span>
                            {correct && <CheckCircle2 size={18} className="text-emerald-300" aria-hidden />}
                            {wrong && <XCircle size={18} className="text-rose-300" aria-hidden />}
                          </button>
                        );
                      })}
                    </div>
                    <AnimatePresence>
                      {submitted && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} role="status"
                          className={cn('mt-5 rounded-2xl border p-4 text-sm', answers.at(-1) ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-amber-400/30 bg-amber-500/10')}>
                          <p className="font-semibold text-white">{answers.at(-1) ? t('quiz.correct') : t('quiz.incorrect')}</p>
                          <p className="mt-1 text-ice-200">{tr(q.explain, lang)}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="mt-6 flex justify-end">
                      {!submitted ? (
                        <button onClick={submit} disabled={choice === null} className="btn-primary disabled:opacity-50">{t('quiz.submit')}</button>
                      ) : (
                        <button onClick={next} className="btn-primary" autoFocus>{i + 1 >= total ? t('quiz.finish') : t('quiz.next')} <ArrowRight size={15} aria-hidden /></button>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center" role="status">
                <motion.div initial={{ rotate: -20, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', delay: 0.15 }}
                  className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-amber-300/40 bg-amber-400/15 shadow-[0_0_50px_rgba(251,191,36,0.25)]">
                  <Award size={38} className="text-amber-200" aria-hidden />
                </motion.div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-ice-300">{t('quiz.score')}</p>
                <p className="mt-1 font-space text-6xl font-bold text-white">{score} <span className="text-3xl text-ice-400">/ {total}</span></p>
                <p className="mt-3 text-sm text-ice-300">{t('quiz.level')}: <strong className="text-amber-200">{t(levelFor(score / total))}</strong></p>
                <div className="mx-auto mt-5 flex max-w-sm justify-center gap-1">{answers.map((a, k) => <span key={k} className={cn('h-2 flex-1 rounded-full', a ? 'bg-emerald-400' : 'bg-rose-400')} />)}</div>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <button onClick={restart} className="btn-secondary"><RotateCcw size={15} aria-hidden /> {t('quiz.retry')}</button>
                  <button onClick={async () => { await navigator.clipboard.writeText(`I scored ${score}/${total} on the PolarSync polar quiz! ${window.location.href}`); toast.success('Copied to clipboard'); }} className="btn-secondary"><Share2 size={15} aria-hidden /> {t('common.share')}</button>
                  <Link href="/education/stories/story-antarctica" className="btn-primary">{t('edu.readStory')} <ArrowRight size={15} aria-hidden /></Link>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-ice-500">Other quizzes: {QUIZZES.filter((x) => x.id !== id).map((x) => <Link key={x.id} href={`/education/quiz/${x.id}`} className="text-cyan-300 hover:underline">{tr(x.title, lang)}</Link>)}</p>
      </div>
    </AppShell>
  );
}
