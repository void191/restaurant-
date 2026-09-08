'use client';

import React, { useState, useEffect } from 'react';
import { Utensils, MapPin, CheckCircle2, ArrowLeft, Loader2, Navigation, AlertCircle } from 'lucide-react';
import { reverseGeocode } from '@/lib/geo';
import { Branch } from './BranchSelect';

export interface LocationData {
  order_type: 'dine_in_table' | 'outdoor_gps' | 'pickup';
  table_id: string | null;
  table_label: string | null;
  latitude: number | null;
  longitude: number | null;
  location_note: string | null;
  display_summary: string;
}

interface TableOption {
  id: string;
  label: string;
}

interface LocationCaptureProps {
  branch: Branch;
  onBack: () => void;
  onConfirmLocation: (location: LocationData) => void;
}

export default function LocationCapture({
  branch,
  onBack,
  onConfirmLocation,
}: LocationCaptureProps) {
  const [selectedOption, setSelectedOption] = useState<'inside' | 'outside' | null>(null);

  // Inside table selection state
  const [tables, setTables] = useState<TableOption[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableOption | null>(null);

  // Outside GPS & fallback state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geocodedAddress, setGeocodedAddress] = useState<string>('');
  const [customOutdoorNote, setCustomOutdoorNote] = useState<string>('');

  // Fetch tables when component mounts
  useEffect(() => {
    async function loadTables() {
      setLoadingTables(true);
      try {
        const res = await fetch(`/api/branches/${branch.id}/tables`);
        if (res.ok) {
          const data = await res.json();
          setTables(data.tables || []);
        }
      } catch (err) {
        console.error('Error fetching tables:', err);
      } finally {
        setLoadingTables(false);
      }
    }
    loadTables();
  }, [branch.id]);

  // Handle Outside GPS capture
  const triggerGpsCapture = () => {
    setSelectedOption('outside');
    setGpsLoading(true);
    setGpsError(false);

    if (!('geolocation' in navigator)) {
      setGpsLoading(false);
      setGpsError(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });

        try {
          const readable = await reverseGeocode(lat, lng);
          setGeocodedAddress(readable);
        } catch {
          setGeocodedAddress(`Outdoor near branch (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        console.warn('GPS permission denied or unavailable:', err);
        setGpsLoading(false);
        setGpsError(true);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Determine if continue button is ready
  const isReady =
    (selectedOption === 'inside' && selectedTable !== null) ||
    (selectedOption === 'outside' && !gpsLoading && (coords !== null || customOutdoorNote.trim().length > 0));

  const handleContinue = () => {
    if (!isReady) return;

    if (selectedOption === 'inside' && selectedTable) {
      onConfirmLocation({
        order_type: 'dine_in_table',
        table_id: selectedTable.id,
        table_label: selectedTable.label,
        latitude: null,
        longitude: null,
        location_note: null,
        display_summary: `🍽️ ${selectedTable.label}`,
      });
    } else if (selectedOption === 'outside') {
      if (coords && !gpsError) {
        const note = customOutdoorNote.trim()
          ? `${geocodedAddress} · ${customOutdoorNote.trim()}`
          : geocodedAddress;

        onConfirmLocation({
          order_type: 'outdoor_gps',
          table_id: null,
          table_label: null,
          latitude: coords.lat,
          longitude: coords.lng,
          location_note: note,
          display_summary: `📍 Outside · ${geocodedAddress.split(',')[0]}`,
        });
      } else {
        // Fallback to pickup with customer description per Section 5.2
        onConfirmLocation({
          order_type: 'pickup',
          table_id: null,
          table_label: null,
          latitude: null,
          longitude: null,
          location_note: customOutdoorNote.trim() || 'Outdoor pickup at entrance',
          display_summary: `🛍️ Pickup · ${customOutdoorNote.trim() || 'Entrance'}`,
        });
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-28">
      {/* Back button & Branch info */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-white border border-paper-dim hover:border-ink text-ink transition-colors"
          aria-label="Back to branch selection"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs uppercase font-mono text-muted tracking-wider">
            {branch.name}
          </p>
          <h1 className="font-serif text-2xl text-ink font-semibold">
            Where are you dining?
          </h1>
        </div>
      </div>

      {/* Two explicit option cards (Section 9.2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* I'm Inside card */}
        <button
          onClick={() => setSelectedOption('inside')}
          className={`p-5 rounded-xl text-left transition-all border-2 ${
            selectedOption === 'inside'
              ? 'border-ember bg-white shadow-md ring-2 ring-ember/10'
              : 'border-paper-dim bg-white/70 hover:border-ink/40'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-sage-dim flex items-center justify-center text-sage mb-3">
            <Utensils className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-lg font-semibold text-ink mb-1">
            I&apos;m inside
          </h2>
          <p className="text-xs text-muted">
            Seated at a dining table, patio booth, or counter bar.
          </p>
        </button>

        {/* I'm Outside card */}
        <button
          onClick={triggerGpsCapture}
          className={`p-5 rounded-xl text-left transition-all border-2 ${
            selectedOption === 'outside'
              ? 'border-ember bg-white shadow-md ring-2 ring-ember/10'
              : 'border-paper-dim bg-white/70 hover:border-ink/40'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-ember/10 flex items-center justify-center text-ember mb-3">
            <MapPin className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-lg font-semibold text-ink mb-1">
            I&apos;m outside
          </h2>
          <p className="text-xs text-muted">
            In the parking lot, curb, or outdoor garden area.
          </p>
        </button>
      </div>

      {/* Inline Section for "I'm inside" (Section 9.2) */}
      {selectedOption === 'inside' && (
        <div className="bg-white p-5 rounded-xl border border-paper-dim shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-base font-semibold text-ink">
              Select Your Table
            </h3>
            <span className="text-xs text-muted font-mono">
              {tables.length} tables available
            </span>
          </div>

          {loadingTables ? (
            <div className="py-8 flex justify-center items-center text-muted">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading tables...
            </div>
          ) : tables.length === 0 ? (
            <p className="text-sm text-muted py-4">No active tables found for this branch.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {tables.map((tbl) => {
                const isSelected = selectedTable?.id === tbl.id;
                return (
                  <button
                    key={tbl.id}
                    onClick={() => setSelectedTable(tbl)}
                    className={`py-3 px-2 rounded-lg text-xs font-mono font-medium transition-all text-center border ${
                      isSelected
                        ? 'bg-ink text-white border-ink shadow-sm ring-1 ring-ink'
                        : 'bg-paper text-ink border-paper-dim hover:border-ink/40'
                    }`}
                  >
                    {tbl.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Inline Section for "I'm outside" (Section 9.2) */}
      {selectedOption === 'outside' && (
        <div className="bg-white p-5 rounded-xl border border-paper-dim shadow-sm space-y-4 animate-fadeIn">
          {gpsLoading && (
            <div className="py-6 flex flex-col items-center justify-center text-center text-muted gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-ember" />
              <p className="text-sm">Acquiring accurate GPS location & reverse-geocoding...</p>
            </div>
          )}

          {!gpsLoading && coords && !gpsError && (
            <div>
              {/* sage-dim colored confirmation banner per Section 9.2 */}
              <div className="bg-sage-dim p-4 rounded-xl text-ink border border-sage/20 mb-4">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-sage shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-mono uppercase tracking-wider text-sage font-bold">
                      Location Resolved
                    </p>
                    <p className="text-sm font-medium mt-0.5 text-ink">
                      {geocodedAddress}
                    </p>
                    <p className="text-xs font-mono text-muted mt-1">
                      Coordinates: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Optional detail note */}
              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">
                  Specific spot / vehicle detail (optional)
                </label>
                <input
                  type="text"
                  value={customOutdoorNote}
                  onChange={(e) => setCustomOutdoorNote(e.target.value)}
                  placeholder="e.g. silver sedan with hazards on, or north patio bench"
                  className="w-full px-3.5 py-2.5 text-sm bg-paper rounded-lg border border-paper-dim focus:outline-none focus:border-ink text-ink"
                />
              </div>
            </div>
          )}

          {/* GPS Denied / Failed fallback per Section 5.2 & 9.2 */}
          {!gpsLoading && (gpsError || !coords) && (
            <div className="space-y-3">
              <div className="bg-paper p-3.5 rounded-lg flex items-start gap-2.5 border border-paper-dim text-xs text-muted">
                <AlertCircle className="w-4 h-4 text-amber shrink-0 mt-0.5" />
                <p>
                  GPS was denied or unavailable. Please describe where you are so our staff can bring your order to you!
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink mb-1.5">
                  Describe where you are (e.g. red car by entrance, picnic table) *
                </label>
                <textarea
                  rows={3}
                  value={customOutdoorNote}
                  onChange={(e) => setCustomOutdoorNote(e.target.value)}
                  placeholder="e.g. In the west parking lot, white Toyota Prius, near spot #14"
                  className="w-full px-3.5 py-2.5 text-sm bg-paper rounded-lg border border-paper-dim focus:outline-none focus:border-ink text-ink resize-none"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Primary Continue Button pinned to bottom per Section 9.2 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-paper/95 backdrop-blur-md border-t border-paper-dim z-20">
        <div className="max-w-xl mx-auto">
          <button
            onClick={handleContinue}
            disabled={!isReady}
            className={`w-full py-3.5 rounded-xl font-medium text-sm transition-all duration-200 shadow-md ${
              isReady
                ? 'bg-ink text-white hover:bg-ink/90 active:scale-[0.99]'
                : 'bg-muted/30 text-muted cursor-not-allowed'
            }`}
          >
            Continue to menu
          </button>
        </div>
      </div>
    </div>
  );
}
