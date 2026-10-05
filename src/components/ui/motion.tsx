'use client';
// Motion primitives. All of them degrade to static rendering in low-bandwidth /
// reduced-motion mode so 3D effects never cost usability or performance.
import { useRef, type ReactNode, type MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useScroll, useReducedMotion } from 'framer-motion';
import { useAppStore } from '@/lib/store';

export function useCalm() {
  const low = useAppStore((s) => s.lowBandwidth);
  const reduce = useAppStore((s) => s.reduceMotion);
  const sys = useReducedMotion();
  return low || reduce || !!sys;
}

export function RevealOnScroll({ children, delay = 0, y = 24, className, as = 'div' }: {
  children: ReactNode; delay?: number; y?: number; className?: string; as?: 'div' | 'section' | 'li';
}) {
  const calm = useCalm();
  const Comp = motion[as];
  if (calm) return <Comp className={className}>{children}</Comp>;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Comp>
  );
}

/** Background layer that moves slower than the page — classic depth parallax. */
export function ParallaxSection({ children, image, speed = 0.25, className = '', overlay = true, height = 'min-h-[60vh]' }: {
  children: ReactNode; image: string; speed?: number; className?: string; overlay?: boolean; height?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const calm = useCalm();
  const low = useAppStore((s) => s.lowBandwidth);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${speed * 100}%`, `${speed * 100}%`]);
  return (
    <div ref={ref} className={`relative overflow-hidden ${height} ${className}`}>
      <motion.div
        aria-hidden
        style={calm ? undefined : { y }}
        className="absolute inset-[-25%_0] bg-cover bg-center will-change-transform"
      >
        {low
          ? <div className="absolute inset-0 bg-gradient-to-br from-[#0b3352] via-[#0a2036] to-[#061628]" />
          : <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${image}')` }} />}
      </motion.div>
      {overlay && <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[rgba(2,11,24,0.55)] via-[rgba(2,11,24,0.35)] to-[rgba(2,11,24,0.95)]" />}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

/** Card that gently tilts toward the cursor (desktop only). */
export function TiltCard({ children, className = '', max = 7, glare = true }: { children: ReactNode; className?: string; max?: number; glare?: boolean }) {
  const calm = useCalm();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [max, -max]), { stiffness: 220, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-max, max]), { stiffness: 220, damping: 20 });
  const glareBg = useTransform([mx, my], ([x, y]) =>
    `radial-gradient(circle at ${(x as number) * 100}% ${(y as number) * 100}%, rgba(144,224,239,0.16), transparent 55%)`);

  if (calm) return <div className={className}>{children}</div>;

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const reset = () => { mx.set(0.5); my.set(0.5); };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={`relative [transform-style:preserve-3d] ${className}`}
    >
      {children}
      {glare && <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: glareBg }} />}
    </motion.div>
  );
}

/** Floating glass panel with idle bobbing (hero cards). */
export function FloatingCard({ children, className = '', delay = 0, amplitude = 8 }: { children: ReactNode; className?: string; delay?: number; amplitude?: number }) {
  const calm = useCalm();
  return (
    <motion.div
      initial={calm ? false : { opacity: 0, scale: 0.9, y: 20 }}
      animate={calm ? undefined : { opacity: 1, scale: 1, y: [0, -amplitude, 0] }}
      transition={calm ? undefined : {
        opacity: { delay, duration: 0.6 }, scale: { delay, duration: 0.6 },
        y: { delay: delay + 0.6, duration: 6, repeat: Infinity, ease: 'easeInOut' },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
