'use client';

import React from 'react';
import { Utensils, ChefHat, ArrowRight, ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface WelcomeScreenProps {
  onStartCustomerOrder: () => void;
}

export default function WelcomeScreen({ onStartCustomerOrder }: WelcomeScreenProps) {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto text-center font-sans animate-fadeIn">
      {/* Brand Icon & Heading */}
      <div className="w-16 h-16 rounded-3xl bg-ink text-white flex items-center justify-center font-serif text-3xl font-bold shadow-xl mb-4 border border-white/10">
        A
      </div>

      <p className="text-xs uppercase font-mono tracking-widest text-muted mb-1.5">
        ARTISAN HOSPITALITY GROUP
      </p>
      
      <h1 className="font-serif text-4xl sm:text-5xl text-ink font-bold tracking-tight mb-3">
        Artisan Kitchen &amp; Bar
      </h1>
      
      <p className="text-sm sm:text-base text-muted max-w-md mx-auto mb-10 leading-relaxed">
        Wood-fired pizza, prime steaks, and handcrafted cocktails. Choose your dining or service portal below.
      </p>

      {/* Two Choice Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-xl">
        {/* Customer Button */}
        <button
          onClick={onStartCustomerOrder}
          className="group relative p-6 rounded-2xl bg-white border-2 border-paper-dim hover:border-ember transition-all duration-200 shadow-md hover:shadow-xl text-left flex flex-col justify-between overflow-hidden active:scale-[0.99]"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Utensils className="w-24 h-24 text-ink" />
          </div>

          <div>
            <div className="w-12 h-12 rounded-xl bg-ember/10 text-ember flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Utensils className="w-6 h-6" />
            </div>

            <span className="text-[11px] font-mono text-muted uppercase tracking-wider block font-bold">
              Guests &amp; Dining
            </span>
            <h2 className="font-serif text-2xl font-bold text-ink mt-0.5 group-hover:text-ember transition-colors">
              I&apos;m a Customer
            </h2>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Browse menu, capture table/GPS location, and place your order instantly. No login required.
            </p>
          </div>

          <div className="mt-6 pt-3 border-t border-paper-dim flex items-center justify-between font-medium text-xs text-ember font-mono">
            <span>Start Ordering</span>
            <div className="p-1 rounded-full bg-ember/10 group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </button>

        {/* Employee / Management Button */}
        <Link
          href="/login"
          className="group relative p-6 rounded-2xl bg-white border-2 border-paper-dim hover:border-ink transition-all duration-200 shadow-md hover:shadow-xl text-left flex flex-col justify-between overflow-hidden active:scale-[0.99]"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ChefHat className="w-24 h-24 text-ink" />
          </div>

          <div>
            <div className="w-12 h-12 rounded-xl bg-ink text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ChefHat className="w-6 h-6" />
            </div>

            <span className="text-[11px] font-mono text-muted uppercase tracking-wider block font-bold">
              Staff &amp; Management
            </span>
            <h2 className="font-serif text-2xl font-bold text-ink mt-0.5 group-hover:text-ink transition-colors">
              I&apos;m an Employee
            </h2>
            <p className="text-xs text-muted mt-2 leading-relaxed">
              Kitchen ticket rail, live branch orders, inventory tracking, and owner admin dashboard.
            </p>
          </div>

          <div className="mt-6 pt-3 border-t border-paper-dim flex items-center justify-between font-medium text-xs text-ink font-mono">
            <span>Staff Portal Login</span>
            <div className="p-1 rounded-full bg-paper group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </div>

      {/* Pre-seeded Features Summary Badge */}
      <div className="mt-10 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-paper-dim text-xs text-muted font-mono shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-amber" />
        <span>Pre-loaded with 3 branch locations, live kitchen tickets &amp; menu items</span>
      </div>
    </div>
  );
}
