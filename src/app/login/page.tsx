'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Loader2, ArrowRight, ShieldCheck, ChefHat, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      // Successful login -> redirect to home which branches on role
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPass }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block">
          <div className="w-14 h-14 rounded-2xl bg-ink text-white mx-auto flex items-center justify-center font-serif text-2xl font-bold shadow-lg mb-3 hover:scale-105 transition-transform">
            A
          </div>
        </Link>
        <p className="text-xs uppercase font-mono tracking-widest text-muted">
          STAFF &amp; PORTAL ACCESS
        </p>
        <h1 className="font-serif text-3xl text-ink font-semibold mt-1">
          Employee &amp; Admin Sign In
        </h1>
        <p className="text-xs text-muted mt-1">
          Sign in to access your branch&apos;s kitchen ticket rail or admin console
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-paper-dim sm:px-10 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Staff Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@restaurant.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-paper rounded-xl border border-paper-dim focus:outline-none focus:border-ink font-mono text-ink"
                />
                <Mail className="w-4 h-4 text-muted absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Station Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-paper rounded-xl border border-paper-dim focus:outline-none focus:border-ink font-mono text-ink"
                />
                <Lock className="w-4 h-4 text-muted absolute left-3.5 top-3" />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-ember/10 border border-ember/20 rounded-xl text-xs text-ember font-medium">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-ink text-white rounded-xl text-sm font-medium hover:bg-ink/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Seed Account Login Buttons */}
          <div className="pt-4 border-t border-paper-dim space-y-2.5">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono uppercase text-muted font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber" />
              <span>1-Click Seed Demo Logins</span>
            </div>

            <div className="space-y-2">
              {/* Downtown Staff */}
              <button
                type="button"
                onClick={() => handleQuickLogin('downtown@restaurant.com', 'password123')}
                disabled={loading}
                className="w-full p-3 rounded-xl border border-paper-dim bg-paper/60 hover:bg-paper hover:border-ink/50 text-left transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-ink">
                    <ChefHat className="w-3.5 h-3.5 text-ember" />
                    <span>Downtown Staff (Live Queue Pre-loaded)</span>
                  </div>
                  <p className="text-[11px] text-muted font-mono mt-0.5">
                    downtown@restaurant.com · password123
                  </p>
                </div>
                <span className="text-[11px] font-mono text-ink font-semibold group-hover:translate-x-0.5 transition-transform">
                  Enter →
                </span>
              </button>

              {/* Admin Portal */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@restaurant.com', 'admin123')}
                disabled={loading}
                className="w-full p-3 rounded-xl border border-paper-dim bg-paper/60 hover:bg-paper hover:border-ink/50 text-left transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-ink">
                    <ShieldCheck className="w-3.5 h-3.5 text-sage" />
                    <span>Owner / Admin Portal</span>
                  </div>
                  <p className="text-[11px] text-muted font-mono mt-0.5">
                    admin@restaurant.com · admin123
                  </p>
                </div>
                <span className="text-[11px] font-mono text-ink font-semibold group-hover:translate-x-0.5 transition-transform">
                  Enter →
                </span>
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs font-mono text-muted hover:text-ink underline transition-colors"
            >
              ← Back to Customer Ordering
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
