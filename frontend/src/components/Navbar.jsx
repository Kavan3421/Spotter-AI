import React from 'react';
import { Truck, ShieldCheck, Printer, Radio, ExternalLink } from 'lucide-react';

export default function Navbar({ backendOnline, onPrintAll, hasData }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-navy-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Title */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-spotter-cyan to-blue-600 text-navy-950 shadow-lg shadow-spotter-cyan/20">
            <Truck className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-tight text-white font-sans">
                SPOTTER <span className="text-spotter-cyan">AI</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-spotter-cyan/10 text-spotter-cyan border border-spotter-cyan/30">
                FMCSA §395.8 Compliant
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Commercial Interstate Logistics & 24-Hour ELD Daily Log Engine
            </p>
          </div>
        </div>

        {/* Right: Status Indicators & Actions */}
        <div className="flex items-center space-x-3">
          {/* Backend Status Pill */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-navy-900 border border-slate-800">
            <span className={`h-2 w-2 rounded-full ${backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className={backendOnline ? 'text-emerald-400' : 'text-rose-400'}>
              {backendOnline ? 'API Online' : 'Connecting...'}
            </span>
          </div>

          {/* Quick Print All Button */}
          {hasData && (
            <button
              onClick={onPrintAll}
              className="hidden sm:inline-flex items-center space-x-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-semibold text-slate-200 border border-slate-700 hover:border-slate-600 transition-all shadow-sm active:scale-95"
            >
              <Printer className="h-3.5 w-3.5 text-spotter-cyan" />
              <span>Print All Logs</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
