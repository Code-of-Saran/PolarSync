'use client';
import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Shield, User, Loader2, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, type User as U } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useT } from '@/lib/i18n';

const DEMO = [
  { email: 'alex@polarsync.in', password: 'polar123', label: 'Alex Johnson', role: 'Contributor', icon: User },
  { email: 'admin@polarsync.in', password: 'admin123', label: 'Dr. Kavya Iyer', role: 'Admin · Curator', icon: Shield },
];

export function LoginPanel({ onDone, highlight }: { onDone?: (u: U) => void; highlight?: 'contributor' | 'admin' }) {
  const setAuth = useAppStore((s) => s.setAuth);
  const t = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const login = async (e: string, p: string) => {
    setBusy(e);
    try {
      const res = await api<{ token: string; user: U }>('/api/auth/login', { method: 'POST', json: { email: e, password: p } });
      setAuth(res.token, res.user);
      toast.success(`Signed in as ${res.user.name}`);
      onDone?.(res.user);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ice-400">Demo accounts — one click</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {DEMO.map((d) => {
            const hl = highlight && d.role.toLowerCase().startsWith(highlight);
            return (
              <button key={d.email} onClick={() => login(d.email, d.password)} disabled={!!busy}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors disabled:opacity-60 ${hl ? 'border-cyan-300/50 bg-cyan-400/12' : 'border-cyan-400/15 bg-white/[0.02] hover:border-cyan-400/35'}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                  {busy === d.email ? <Loader2 size={17} className="animate-spin" /> : <d.icon size={17} aria-hidden />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ice-100">{d.label}</span>
                  <span className="block text-[11px] text-ice-500">{d.role} · {d.email}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); login(email, password); }} className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ice-400">Or sign in with email</p>
        <div>
          <label htmlFor="login-email" className="sr-only">Email</label>
          <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@institute.in" className="polar-input" />
        </div>
        <div>
          <label htmlFor="login-pass" className="sr-only">Password</label>
          <input id="login-pass" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="polar-input" />
        </div>
        <button type="submit" disabled={!!busy} className="btn-primary w-full justify-center">
          {busy === email ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} aria-hidden />} {t('nav.signin')}
        </button>
        <p className="flex items-center gap-1.5 text-[11px] text-ice-500"><KeyRound size={11} aria-hidden /> Prototype authentication (token sessions). SSO / Keycloak is out of scope.</p>
      </form>
    </div>
  );
}

/** Renders children only for signed-in users with the right role; otherwise an inline sign-in card. */
export default function AuthGate({ role, children, title, reason }: { role?: 'admin' | 'contributor'; children: ReactNode; title: string; reason: string }) {
  const user = useAppStore((s) => s.user);
  const hydrated = useAppStore((s) => s.hydrated);
  if (!hydrated) return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="animate-spin text-cyan-300" aria-label="Loading" /></div>;
  const ok = user && (!role || user.role === role || (role === 'contributor' && user.role === 'admin'));
  if (ok) return <>{children}</>;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-xl py-8">
      <div className="glass-panel rounded-2xl p-6 sm:p-8">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10">
            {role === 'admin' ? <Shield className="text-cyan-300" size={20} aria-hidden /> : <LogIn className="text-cyan-300" size={20} aria-hidden />}
          </span>
          <div>
            <h1 className="font-space text-xl font-bold text-ice-50">{title}</h1>
            <p className="text-sm text-ice-400">{user ? `You are signed in as ${user.name} (${user.role}). ${reason}` : reason}</p>
          </div>
        </div>
        <LoginPanel highlight={role} />
      </div>
    </motion.div>
  );
}
