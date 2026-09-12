import React from 'react';
import { Clock, MapPin, Navigation, Fuel, Moon, Coffee, RotateCcw, Package, Flag, CheckCircle } from 'lucide-react';
import { formatDateTimeNice, formatDuration, getDutyStatusBadge } from '../utils/formatters';

function getEventIcon(ev) {
  if (ev.stop_type === 'ORIGIN') return <MapPin className="h-4 w-4 text-blue-400" />;
  if (ev.stop_type === 'PICKUP') return <Package className="h-4 w-4 text-emerald-400" />;
  if (ev.stop_type === 'FUEL') return <Fuel className="h-4 w-4 text-amber-400" />;
  if (ev.stop_type === 'REST_10') return <Moon className="h-4 w-4 text-indigo-400" />;
  if (ev.stop_type === 'REST_30') return <Coffee className="h-4 w-4 text-amber-300" />;
  if (ev.stop_type === 'RESTART_34') return <RotateCcw className="h-4 w-4 text-purple-400" />;
  if (ev.stop_type === 'DROPOFF') return <Flag className="h-4 w-4 text-rose-400" />;
  if (ev.duty_status === 'DRIVING') return <Navigation className="h-4 w-4 text-emerald-400" />;
  return <Clock className="h-4 w-4 text-slate-400" />;
}

export default function ItineraryTimeline({ events = [] }) {
  if (!events || events.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-navy-900/90 p-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Complete Trip Itinerary & Simulation Chronology
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Sequential log of driving segments, FMCSA mandatory breaks, fuel stops, and freight handling
          </p>
        </div>
        <span className="text-xs font-mono text-spotter-cyan bg-spotter-cyan/10 border border-spotter-cyan/20 px-3 py-1 rounded-full">
          {events.length} Simulated Segments
        </span>
      </div>

      <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
        {events.map((ev, idx) => {
          const badge = getDutyStatusBadge(ev.duty_status);
          const icon = getEventIcon(ev);

          return (
            <div key={idx} className="relative pl-6 group">
              {/* Timeline marker icon */}
              <div className="absolute -left-[17px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-navy-950 border-2 border-slate-700 shadow-md group-hover:border-spotter-cyan transition-colors">
                {icon}
              </div>

              {/* Event card */}
              <div className="rounded-xl border border-slate-800/80 bg-navy-950/60 p-4 hover:border-slate-700 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${badge.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} mr-1.5`}></span>
                      {badge.label}
                    </span>

                    {ev.is_stop && ev.stop_type && (
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {ev.stop_type.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
                    <span>
                      {formatDateTimeNice(ev.start_time)} → {formatDateTimeNice(ev.end_time)}
                    </span>
                    <span className="text-spotter-cyan font-bold">
                      ({formatDuration(ev.duration_hours)})
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mt-1">
                  <p className="text-sm font-semibold text-slate-100">
                    {ev.remarks}
                  </p>
                  {ev.miles_driven > 0 && (
                    <span className="text-xs font-mono text-emerald-400 font-bold ml-2">
                      +{ev.miles_driven.toFixed(1)} mi
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-900 text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    <span>{ev.location?.city}, {ev.location?.state}</span>
                  </div>

                  <div className="flex items-center space-x-4 font-mono text-[11px]">
                    <span>Mile Marker: <strong className="text-slate-300">{ev.end_miles?.toFixed(1) || 0} mi</strong></span>
                    <span>Cycle Rem: <strong className="text-emerald-400">{ev.cycle_remaining}h</strong></span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
