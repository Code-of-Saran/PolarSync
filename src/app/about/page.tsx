'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Globe2, MapPin, Award, Users, ExternalLink } from 'lucide-react';
import AppShell from '@/components/AppShell';

const stations = [
  { name: 'Maitri Station', location: 'Schirmacher Oasis, Antarctica', est: 1989, type: 'Antarctic', color: 'text-cyan-300' },
  { name: 'Dakshin Gangotri', location: 'Princess Astrid Coast, Antarctica', est: 1983, type: 'Antarctic', color: 'text-blue-300' },
  { name: 'Bharati Station', location: 'Larsemann Hills, Antarctica', est: 2012, type: 'Antarctic', color: 'text-teal-300' },
  { name: 'Himadri Station', location: 'Ny-Ålesund, Svalbard, Norway', est: 2008, type: 'Arctic', color: 'text-violet-300' },
  { name: 'Himansh Station', location: 'Chandra basin, Spiti, Himachal Pradesh', est: 2016, type: 'Himalayan', color: 'text-emerald-300' },
];

const partners = ['National Centre for Polar and Ocean Research (NCPOR)', 'Ministry of Earth Sciences (MoES)', 'ISRO Space Applications Centre', 'Wadia Institute of Himalayan Geology', 'CSIR-National Institute of Oceanography', 'Norwegian Polar Institute (collaborative)'];

export default function AboutPage() {
  return (
    <AppShell>
      <div className="max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 text-xs text-[rgba(144,224,239,0.4)] mb-2">
            <Globe2 size={12} /> About PolarSync
          </div>
          <h1 className="font-space text-3xl font-bold text-gradient-white mb-3">About PolarSync</h1>
          <p className="text-sm text-[rgba(202,240,248,0.55)] leading-relaxed max-w-2xl">
            PolarSync is India&apos;s integrated polar science outreach, knowledge repository and media dissemination portal — developed under the Smart India Hackathon 2026 (Problem Statement SIH26063) for the National Centre for Polar and Ocean Research.
          </p>
        </motion.div>

        {/* Objective */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-6 mb-5">
          <h2 className="font-space text-lg font-semibold text-[#CAF0F8] mb-3">Objective</h2>
          <p className="text-sm text-[rgba(202,240,248,0.6)] leading-relaxed">
            To create a unified digital platform that democratises access to India&apos;s polar science knowledge, streamlines research data management, and amplifies public outreach for the polar science community — from professional researchers to school students.
          </p>
        </motion.div>

        {/* Architecture */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-card rounded-2xl p-6 mb-5">
          <h2 className="font-space text-lg font-semibold text-[#CAF0F8] mb-4">How PolarSync works</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Frontend', 'Next.js · React · TypeScript · Tailwind · Framer Motion · Leaflet'],
              ['Backend', 'FastAPI (Python) REST API · SQLite repository layer · local file storage'],
              ['Semantic search', 'Sentence-Transformer embeddings (all-MiniLM-L6-v2) with an LSA fallback; hybrid ranking 0.4 semantic + 0.4 BM25 + 0.2 metadata'],
              ['AI metadata', 'Extractive summaries, controlled-vocabulary + keyphrase tagging, region / type / research-area classification, duplicate detection'],
              ['Trusted publishing', 'Contribute → AI analysis → human review → approve → publish → indexed for discovery'],
              ['Inclusive access', 'English / Tamil / Hindi UI, low-bandwidth mode, keyboard & screen-reader support'],
            ].map(([h, d]) => (
              <div key={h} className="rounded-xl border border-white/5 bg-black/15 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">{h}</p>
                <p className="mt-1 text-xs leading-relaxed text-ice-300">{d}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Research Stations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl p-6 mb-5">
          <h2 className="font-space text-lg font-semibold text-[#CAF0F8] mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-[#48CAE4]" /> India&apos;s Research Stations
          </h2>
          <div className="space-y-3">
            {stations.map((s) => (
              <div key={s.name} className="flex items-start gap-3 p-3 rounded-xl bg-[rgba(0,180,216,0.04)] border border-[rgba(0,180,216,0.08)]">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${s.color.replace('text-', 'bg-').replace('-300', '-500/15')} border ${s.color.replace('text-', 'border-').replace('-300', '-500/20')}`}>
                  {s.type[0]}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${s.color}`}>{s.name}</p>
                  <p className="text-xs text-[rgba(144,224,239,0.5)]">{s.location} · Est. {s.est}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Partners */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-2xl p-6 mb-5">
          <h2 className="font-space text-lg font-semibold text-[#CAF0F8] mb-4 flex items-center gap-2">
            <Users size={16} className="text-[#48CAE4]" /> Intended stakeholders
          </h2>
          <p className="mb-3 text-xs text-ice-500">Organisations this portal is designed to serve. The prototype is not affiliated with or endorsed by them.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {partners.map((p) => (
              <div key={p} className="flex items-start gap-2 text-xs text-[rgba(202,240,248,0.6)]">
                <span className="text-[#48CAE4] mt-0.5">•</span> {p}
              </div>
            ))}
          </div>
        </motion.div>

        {/* SIH Note */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card rounded-2xl p-5 border border-[rgba(0,180,216,0.15)]">
          <div className="flex items-center gap-2 mb-2">
            <Award size={14} className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">SIH 2026 Prototype</span>
          </div>
          <p className="text-xs text-[rgba(202,240,248,0.5)] leading-relaxed">
            This platform is a working prototype built for Smart India Hackathon 2026. All scientific content is representative sample data. It includes a working FastAPI backend, hybrid semantic search, AI-assisted metadata with mandatory human review, and a geo-linked knowledge model ready to be connected to real institutional data.
          </p>
        </motion.div>

        <div className="mt-8 flex gap-3">
          <Link href="/repository" className="btn-primary">Browse Repository</Link>
          <Link href="/explore/map" className="btn-secondary">Explore Map</Link>
        </div>
      </div>
    </AppShell>
  );
}
