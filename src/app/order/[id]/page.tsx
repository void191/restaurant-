'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import OrderTracker from '@/components/customer/OrderTracker';
import Link from 'next/link';

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  return (
    <div className="min-h-screen bg-paper flex flex-col font-sans">
      <header className="px-4 py-3 bg-white/80 backdrop-blur-md border-b border-paper-dim sticky top-0 z-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-ink text-white flex items-center justify-center font-serif text-sm font-bold shadow-sm">
            A
          </div>
          <span className="font-serif text-base font-bold text-ink tracking-tight">
            Artisan Kitchen &amp; Bar
          </span>
        </Link>
      </header>

      <main className="flex-1 py-6">
        <OrderTracker
          orderId={orderId}
          onNewOrder={() => router.push('/')}
        />
      </main>
    </div>
  );
}
