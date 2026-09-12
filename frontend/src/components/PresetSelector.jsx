import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export const PRESETS = [
  {
    id: 'chicago-la',
    title: 'Chicago, IL → Los Angeles, CA',
    tag: 'Primary Assessment Benchmark',
    tagColor: 'bg-spotter-cyan/20 text-spotter-cyan border-spotter-cyan/30',
    distance: '~2,015 mi',
    current_location: 'Chicago, IL',
    pickup_location: 'Gary, IN',
    dropoff_location: 'Los Angeles, CA',
    current_cycle_used: 15.0,
    carrier_name: 'Spotter Logistics LLC',
    driver_name: 'Kavankumar',
    driver_signature: 'Kavankumar',
    tractor_number: 'TRK-408',
    trailer_number: 'TRL-992',
    shipping_doc: 'BOL #48291-SP',
    commodity: 'Commercial Industrial Freight #48291',
    description: 'Multi-day interstate journey testing 11h driving, 14h window, 1000-mi fuel stops, and 10h sleeper berth breaks.'
  },
  {
    id: 'ny-dallas',
    title: 'New York, NY → Dallas, TX',
    tag: 'Mid-Atlantic to South',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    distance: '~1,540 mi',
    current_location: 'New York, NY',
    pickup_location: 'Newark, NJ',
    dropoff_location: 'Dallas, TX',
    current_cycle_used: 8.0,
    carrier_name: 'Spotter Express Freight',
    driver_name: 'Kavankumar',
    driver_signature: 'Kavankumar',
    tractor_number: 'TRK-512',
    trailer_number: 'TRL-108',
    shipping_doc: 'BOL #99023-NY',
    commodity: 'Consumer Electronics & Perishables',
    description: '1,540-mile corridor via I-81 and I-40 with Newark pickup and fueling interval.'
  },
  {
    id: 'atlanta-seattle',
    title: 'Atlanta, GA → Seattle, WA',
    tag: '34-Hr Restart Trigger',
    tagColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    distance: '~2,600 mi',
    current_location: 'Atlanta, GA',
    pickup_location: 'Atlanta, GA',
    dropoff_location: 'Seattle, WA',
    current_cycle_used: 42.0,
    carrier_name: 'Spotter Transcontinental LLC',
    driver_name: 'Kavankumar',
    driver_signature: 'Kavankumar',
    tractor_number: 'TRK-770',
    trailer_number: 'TRL-334',
    shipping_doc: 'BOL #77412-AT',
    commodity: 'Aerospace Components',
    description: 'Long haul with 42 hours starting cycle, demonstrating automatic 34-hour restart trigger when 70 hours is reached.'
  },
  {
    id: 'ahmedabad-mumbai',
    title: 'Ahmedabad → Mumbai, India',
    tag: 'India Logistics Corridor',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    distance: '~317 mi',
    current_location: 'Ahmedabad, Gujarat',
    pickup_location: 'Vadodara, Gujarat',
    dropoff_location: 'Mumbai, Maharashtra',
    current_cycle_used: 6.0,
    carrier_name: 'Spotter India Logistics',
    driver_name: 'Kavankumar',
    driver_signature: 'Kavankumar',
    tractor_number: 'GJ-01-TRK-88',
    trailer_number: 'GJ-06-TRL-99',
    shipping_doc: 'LR #IND-90214',
    commodity: 'Textiles & Industrial Machinery',
    description: 'Western India freight transit via NH 48 connecting Gujarat industrial manufacturing hub to Mumbai container terminals.'
  }
];

export default function PresetSelector({ onSelectPreset, activePresetId, disabled }) {
  return (
    <div className="mb-6">
      <div className="flex items-center space-x-2 mb-3">
        <Sparkles className="h-4 w-4 text-spotter-cyan" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Quick-Load Commercial Test Scenarios
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              disabled={disabled}
              onClick={() => onSelectPreset(preset)}
              className={`text-left rounded-xl p-3 border transition-all duration-200 relative group overflow-hidden ${
                isActive
                  ? 'border-spotter-cyan bg-spotter-cyan/10 shadow-lg shadow-spotter-cyan/10'
                  : 'border-slate-800 bg-navy-900/60 hover:bg-slate-800/80 hover:border-slate-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${preset.tagColor}`}>
                  {preset.tag}
                </span>
                <span className="font-mono text-xs font-bold text-slate-300">
                  {preset.distance}
                </span>
              </div>

              <h4 className="font-bold text-xs text-white group-hover:text-spotter-cyan transition-colors mb-1">
                {preset.title}
              </h4>

              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {preset.description}
              </p>

              <div className="mt-2.5 flex items-center text-[10px] font-bold text-spotter-cyan opacity-80 group-hover:opacity-100 transition-opacity">
                <span>Load Trip Parameters</span>
                <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
