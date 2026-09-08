'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Phone, ChevronRight } from 'lucide-react';
import { calculateDistance } from '@/lib/geo';
import { FALLBACK_BRANCHES } from '@/lib/fallback-data';

export interface Branch {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  opening_hours: Record<string, string>;
  is_active: boolean;
  distance?: number;
}

interface BranchSelectProps {
  branches: Branch[];
  onSelectBranch: (branch: Branch) => void;
}

export default function BranchSelect({ branches, onSelectBranch }: BranchSelectProps) {
  // Always use fallback branches if branches array is empty
  const activeBranches = branches && branches.length > 0 ? branches : (FALLBACK_BRANCHES as unknown as Branch[]);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [sortedBranches, setSortedBranches] = useState<Branch[]>(activeBranches);

  useEffect(() => {
    const list = branches && branches.length > 0 ? branches : (FALLBACK_BRANCHES as unknown as Branch[]);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          setLocationStatus('granted');

          // Sort branches by distance
          const withDist = list.map((b) => ({
            ...b,
            distance: calculateDistance(lat, lng, b.latitude, b.longitude),
          }));
          withDist.sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
          setSortedBranches(withDist);
        },
        () => {
          setLocationStatus('denied');
          setSortedBranches(list);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setLocationStatus('denied');
      setSortedBranches(list);
    }
  }, [branches]);

  const getTodayHours = (hours: Record<string, string>) => {
    if (!hours) return 'Open today: 09:00 - 22:00';
    const dayName = new Date()
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();
    return hours[dayName] || Object.values(hours)[0] || 'Open today';
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-xs uppercase tracking-widest text-muted font-mono mb-2">
          ARTISAN HOSPITALITY GROUP
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink mb-3">
          Select Your Dining Branch
        </h1>
        <p className="text-sm text-muted">
          {locationStatus === 'granted'
            ? 'We detected your location — nearest branch highlighted below'
            : 'Choose a location to browse today’s fresh seasonal menu & place your order'}
        </p>
      </div>

      {/* Branch List */}
      <div className="space-y-4">
        {sortedBranches.map((branch, index) => {
          const isNearest = locationStatus === 'granted' && index === 0;

          return (
            <button
              key={branch.id}
              onClick={() => onSelectBranch(branch)}
              className={`w-full text-left p-5 rounded-xl transition-all duration-200 bg-white border ${
                isNearest
                  ? 'border-ember ring-2 ring-ember/20 shadow-md'
                  : 'border-paper-dim hover:border-ink/40 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="font-serif text-xl text-ink font-semibold">
                      {branch.name}
                    </h2>
                    {isNearest && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase bg-ember text-white px-2 py-0.5 rounded-full font-medium">
                        <Navigation className="w-3 h-3" /> Nearest to you
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted flex items-center gap-1.5 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-ember shrink-0" />
                    {branch.address}
                    {branch.distance !== undefined && (
                      <span className="font-mono text-ink font-medium ml-1">
                        · {branch.distance} mi away
                      </span>
                    )}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted pt-2 border-t border-paper-dim">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {getTodayHours(branch.opening_hours)}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5" />
                      {branch.phone}
                    </span>
                  </div>
                </div>

                <div className="self-center p-2 rounded-full bg-paper text-ink shrink-0">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
