import React from 'react';
import GridSvg from './GridSvg';
import { FileText, Printer, ShieldCheck, CheckCircle2, Truck, User, Calendar, MapPin, Package } from 'lucide-react';
import { getDutyStatusBadge } from '../utils/formatters';

export default function DailyLogSheet({ log, totalDays = 1, onPrint }) {
  if (!log) return null;

  const { day_number, date_formatted, header, line_totals, grid_segments, duty_transitions, recap } = log;

  return (
    <div className="log-sheet-printable rounded-2xl border border-slate-800 bg-navy-900 shadow-2xl p-6 mb-8 text-slate-100">
      {/* Top Banner & Control Bar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-spotter-cyan/10 border border-spotter-cyan/30 text-spotter-cyan">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Driver's Daily Log Sheet — Day {day_number} of {totalDays}
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> FMCSA §395.8 Compliant
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Official 24-hour record of duty status (Midnight to Midnight)
            </p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center space-x-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-spotter-cyan border border-slate-700 hover:border-spotter-cyan/40 transition-all shadow-md active:scale-95"
        >
          <Printer className="h-4 w-4" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Official Header Block (DOT Standard Format) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 rounded-xl border border-slate-700/60 bg-navy-950/60 p-4 mb-6 text-xs">
        {/* Column 1: Carrier & Office */}
        <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-800 pb-3 md:pb-0 md:pr-4">
          <div>
            <span className="text-slate-400 block uppercase font-mono text-[10px]">Carrier Name:</span>
            <span className="font-bold text-slate-100 text-sm">{header.carrier_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase font-mono text-[10px]">Main Office Address:</span>
            <span className="text-slate-300">{header.main_office}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-slate-400 block uppercase font-mono text-[10px]">Tractor No:</span>
              <span className="font-bold text-spotter-cyan font-mono">{header.tractor_number}</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-mono text-[10px]">Trailer No:</span>
              <span className="font-bold text-spotter-cyan font-mono">{header.trailer_number}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Date & Mileage */}
        <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-800 pb-3 md:pb-0 md:px-4">
          <div>
            <span className="text-slate-400 block uppercase font-mono text-[10px]">Calendar Date (24-hr period):</span>
            <span className="font-bold text-slate-100 text-sm">{date_formatted}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase font-mono text-[10px]">Total Miles Driven Today:</span>
            <span className="font-bold text-emerald-400 text-base font-mono">
              {header.total_miles_today.toFixed(1)} <span className="text-xs font-normal text-slate-400">miles</span>
            </span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase font-mono text-[10px]">Shipper & Commodity:</span>
            <span className="text-slate-200">{header.commodity}</span>
          </div>
        </div>

        {/* Column 3: Driver Signature & Doc */}
        <div className="space-y-2 md:pl-4">
          <div>
            <span className="text-slate-400 block uppercase font-mono text-[10px]">Driver's Name:</span>
            <span className="font-bold text-slate-100 text-sm">{header.driver_name}</span>
          </div>
          <div>
            <span className="text-slate-400 block uppercase font-mono text-[10px]">Shipping Document / B.O.L:</span>
            <span className="font-mono text-slate-200">{header.shipping_doc}</span>
          </div>
          <div className="pt-1">
            <span className="text-slate-400 block uppercase font-mono text-[10px]">Driver's Signature:</span>
            <span className="font-serif italic text-base text-spotter-cyan underline decoration-slate-600">
              {header.driver_signature}
            </span>
          </div>
        </div>
      </div>

      {/* The Authentic 24-Hour Vector Graph Grid */}
      <div className="mb-6">
        <GridSvg
          segments={grid_segments}
          lineTotals={line_totals}
          dayNumber={day_number}
        />
      </div>

      {/* Bottom Split: Remarks & Duty Status Transitions + 70-Hr Recap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Remarks & Status Changes Table (2 cols wide) */}
        <div className="lg:col-span-2 rounded-xl border border-slate-700/60 bg-navy-950/70 p-4">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Duty Status Changes & Timeline Remarks
            </h3>
            <span className="text-[11px] text-slate-400">
              {duty_transitions.length} Record(s) logged
            </span>
          </div>

          <div className="overflow-x-auto max-h-56 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-navy-900 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-2">Time</th>
                  <th className="py-2 px-2">Line</th>
                  <th className="py-2 px-2">Location</th>
                  <th className="py-2 px-2">Remarks / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {duty_transitions.map((item, idx) => {
                  const badge = getDutyStatusBadge(item.duty_status);
                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-2 text-spotter-cyan font-bold whitespace-nowrap">
                        {item.time}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badge.color}`}>
                          {badge.short}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-slate-300 font-sans whitespace-nowrap">
                        {item.location || 'En route'}
                      </td>
                      <td className="py-2 px-2 text-slate-300 font-sans">
                        {item.remarks}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 70-Hour / 8-Day Cycle Recap Card */}
        <div className="rounded-xl border border-slate-700/60 bg-navy-950/70 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                70-Hr / 8-Day Cycle Recap
              </h3>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Total Driving Today (Line 3):</span>
                <span className="font-mono font-bold text-slate-100">
                  {line_totals.line_3_driving.toFixed(1)} hrs
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Total On-Duty Today (Lines 3+4):</span>
                <span className="font-mono font-bold text-amber-400">
                  {recap.on_duty_today.toFixed(1)} hrs
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Cumulative Cycle Hours Used:</span>
                <span className="font-mono font-bold text-slate-200">
                  {recap.cycle_hours_used.toFixed(1)} / 70.0 hrs
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Available Cycle Hours Tomorrow:</span>
                <span className="font-mono font-bold text-spotter-cyan text-sm">
                  {recap.cycle_hours_remaining.toFixed(1)} hrs
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Certification:</span>
            <span className="text-slate-300 italic">True and Correct Record</span>
          </div>
        </div>
      </div>
    </div>
  );
}
