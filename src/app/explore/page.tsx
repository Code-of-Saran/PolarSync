'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Map, Database, Film, BookOpen, Compass, ArrowRight, Radio } from 'lucide-react';
import AppShell from '@/components/AppShell';

const sections = [
  {
    href: '/explore/map',
    icon: Map,
    title: 'Polar Map',
    desc: 'Interactive map of research stations, expeditions, and data sites across Antarctica, Arctic, and Himalayas.',
    image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80',
    badge: 'Interactive',
    badgeColor: 'text-teal-300 bg-teal-500/10 border-teal-500/20',
  },
  {
    href: '/repository',
    icon: Database,
    title: 'Repository',
    desc: 'Browse verified research papers, datasets, and technical reports from India\'s polar science programs.',
    image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&q=80',
    badge: 'Papers · Data',
    badgeColor: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
  },
  {
    href: '/media',
    icon: Film,
    title: 'Media Gallery',
    desc: 'Explore stunning photographs, expedition videos and press releases from the frontlines of polar science.',
    image: 'https://images.unsplash.com/photo-1551415923-a2297c7fda79?w=800&q=80',
    badge: 'Photos · Films',
    badgeColor: 'text-purple-300 bg-purple-500/10 border-purple-500/20',
  },
  {
    href: '/education',
    icon: BookOpen,
    title: 'Learn & Engage',
    desc: 'Science stories, virtual tours, quizzes and classroom kits that bring polar science to life.',
    image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&q=80',
    badge: 'Interactive',
    badgeColor: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  },
];

export default function ExplorePage() {
  return (
    <AppShell>
      <div>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-xs text-[rgba(144,224,239,0.4)] mb-2">
            <Compass size={12} /> Explore
          </div>
          <h1 className="font-space text-3xl font-bold text-gradient-white mb-2">Explore PolarSync</h1>
          <p className="text-sm text-[rgba(202,240,248,0.5)]">
            Navigate India&apos;s polar knowledge ecosystem — maps, research, media and education.
          </p>
        </motion.div>

        {/* Live indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 mb-8 px-4 py-3 rounded-xl bg-[rgba(0,180,216,0.05)] border border-[rgba(0,180,216,0.12)] w-fit"
        >
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-[#00B4D8] animate-pulse" />
            <span className="text-xs font-medium text-[#90E0EF]">Live data from NCPOR repositories</span>
          </div>
          <span className="text-[10px] text-[rgba(144,224,239,0.3)]">Updated: Oct 4, 2026</span>
        </motion.div>

        {/* Grid of explore sections */}
        <div className="grid md:grid-cols-2 gap-5">
          {sections.map((s, i) => (
            <motion.div
              key={s.href}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Link href={s.href}>
                <div className="glass-card rounded-2xl overflow-hidden group h-full">
                  <div className="relative h-48">
                    <img
                      src={s.image}
                      alt={s.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(2,11,24,0.93)] via-[rgba(2,11,24,0.3)] to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${s.badgeColor}`}>
                        {s.badge}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-4">
                      <div className="flex items-center gap-2">
                        <s.icon size={18} className="text-[#48CAE4]" />
                        <h2 className="font-space text-lg font-bold text-white">{s.title}</h2>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex items-center justify-between">
                    <p className="text-sm text-[rgba(202,240,248,0.5)] leading-relaxed flex-1 mr-4">{s.desc}</p>
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-[rgba(0,180,216,0.1)] border border-[rgba(0,180,216,0.2)] flex items-center justify-center group-hover:bg-[rgba(0,180,216,0.2)] transition-all">
                      <ArrowRight size={15} className="text-[#48CAE4]" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
