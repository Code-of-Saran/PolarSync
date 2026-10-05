'use client';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import AppShell from '@/components/AppShell';
import { LoginPanel } from '@/components/AuthGate';
import { useT } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const t = useT();
  return (
    <AppShell>
      <div className="mx-auto max-w-xl py-6">
        <div className="glass-panel rounded-3xl p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10"><LogIn className="text-cyan-300" size={20} aria-hidden /></span>
            <div>
              <h1 className="font-space text-2xl font-bold text-ice-50">{t('nav.signin')}</h1>
              <p className="text-sm text-ice-400">Contributors upload and track content; curators review and publish.</p>
            </div>
          </div>
          <LoginPanel onDone={(u) => router.push(u.role === 'admin' ? '/admin' : '/dashboard')} />
        </div>
      </div>
    </AppShell>
  );
}
