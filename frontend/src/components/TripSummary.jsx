import React from 'react';
import { Route, Clock, Fuel, Moon, ShieldAlert, Calendar, CheckCircle2 } from 'lucide-react';
import { formatDuration } from '../utils/formatters';

export default function TripSummary({ summary }) {
  if (!summary) return null;

  const cycleUsed = (70.0 - (summary.remaining_cycle_hours || 0)).toFixed(1);
  const cyclePercent = Math.min(100, Math.round((cycleUsed / 70.0) * 100));

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {/* 1. Total Distance */}
      <div className="rounded-2xl border border-slate-800 bg-navy-900/80 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider">Total Distance</span>
          <Route className="h-4 w-4 text-spotter-cyan" />
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-extrabold font-mono text-white">
            {summary.total_distance_miles.toLocaleString()}
          </span>
          <span className="text-xs font-semibold text-slate-400">mi</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          Leg 1: {summary.leg1_distance_miles} mi | Leg 2: {summary.leg2_distance_miles} mi
        </p>
      </div>

      {/* 2. Total Driving Time */}
      <div className="rounded-2xl border border-slate-800 bg-navy-900/80 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider">Driving Time</span>
          <Clock className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-extrabold font-mono text-emerald-400">
            {summary.total_driving_hours.toFixed(1)}
          </span>
          <span className="text-xs font-semibold text-slate-400">hrs</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          Avg Highway Speed: 55 mph
        </p>
      </div>

      {/* 3. Total Trip Duration */}
      <div className="rounded-2xl border border-slate-800 bg-navy-900/80 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider">Total Duration</span>
          <Calendar className="h-4 w-4 text-blue-400" />
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-extrabold font-mono text-blue-400">
            {summary.total_trip_duration_hours.toFixed(1)}
          </span>
          <span className="text-xs font-semibold text-slate-400">hrs</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          Spans {summary.total_days} Log Sheet{summary.total_days > 1 ? 's' : ''}
        </p>
      </div>

      {/* 4. Fuel Stops */}
      <div className="rounded-2xl border border-slate-800 bg-navy-900/80 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider">Fuel Stops</span>
          <Fuel className="h-4 w-4 text-amber-400" />
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-extrabold font-mono text-amber-400">
            {summary.fuel_stops_count}
          </span>
          <span className="text-xs font-semibold text-slate-400">stops</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          Every 1,000 miles (30m On-Duty)
        </p>
      </div>

      {/* 5. 10-Hr Rest Breaks */}
      <div className="rounded-2xl border border-slate-800 bg-navy-900/80 p-4 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider">10-Hr Rests</span>
          <Moon className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-extrabold font-mono text-indigo-400">
            {summary.rest_10_count}
          </span>
          <span className="text-xs font-semibold text-slate-400">resets</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1">
          {summary.rest_30_count > 0 ? `+${summary.rest_30_count} 30-min break` : 'FMCSA 11h/14h reset'}
        </p>
      </div>

      {/* 6. Remaining 70-Hr Cycle */}
      <div className="rounded-2xl border border-slate-800 bg-navy-900/80 p-4 shadow-lg backdrop-blur-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cycle Remaining</span>
            <CheckCircle2 className="h-4 w-4 text-spotter-cyan" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-extrabold font-mono text-spotter-cyan">
              {summary.remaining_cycle_hours.toFixed(1)}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 70h</span>
          </div>
        </div>

        <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              cyclePercent > 80 ? 'bg-rose-500' : cyclePercent > 50 ? 'bg-amber-400' : 'bg-spotter-cyan'
            }`}
            style={{ width: `${cyclePercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
