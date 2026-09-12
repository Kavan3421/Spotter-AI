import React, { useState, useEffect, useRef } from 'react';
import { Truck, MapPin, Clock, Shield, Sliders, ChevronDown, ChevronUp, Play, Loader2, RotateCcw, Search } from 'lucide-react';

function LocationAutocomplete({ label, iconColor, name, value, onChange, placeholder, subtext }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(e);

    if (val.trim().length >= 2) {
      setIsSearching(true);
      // Query free Photon / OpenStreetMap API directly (supports any city globally)
      fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(val.trim())}&limit=5`)
        .then(res => res.json())
        .then(data => {
          const items = [];
          if (data && data.features) {
            data.features.forEach(f => {
              const p = f.properties || {};
              const name = p.name || p.city || '';
              const state = p.state || '';
              const country = p.country || '';
              const parts = [name, state, country].filter(Boolean);
              const disp = parts.join(', ');
              if (disp && !items.includes(disp)) {
                items.push(disp);
              }
            });
          }
          setSuggestions(items);
          setIsOpen(items.length > 0);
          setIsSearching(false);
        })
        .catch(() => {
          setIsSearching(false);
        });
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelect = (item) => {
    onChange({ target: { name, value: item } });
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center">
        <MapPin className={`h-3.5 w-3.5 ${iconColor} mr-1`} />
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          required
          autoComplete="off"
          name={name}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-700 bg-navy-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-spotter-cyan focus:outline-none focus:ring-1 focus:ring-spotter-cyan transition-all pr-8"
        />
        {isSearching && (
          <div className="absolute right-3 top-3">
            <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-700 bg-navy-900 shadow-2xl divide-y divide-slate-800 text-xs">
          {suggestions.map((item, idx) => (
            <li
              key={idx}
              onClick={() => handleSelect(item)}
              className="px-3.5 py-2.5 hover:bg-slate-800 cursor-pointer text-slate-200 hover:text-spotter-cyan transition-colors flex items-center space-x-2"
            >
              <Search className="h-3 w-3 text-slate-500 flex-shrink-0" />
              <span className="truncate">{item}</span>
            </li>
          ))}
        </ul>
      )}
      <span className="text-[10px] text-slate-400 mt-1 block">{subtext}</span>
    </div>
  );
}

export default function TripForm({ formData, onChange, onSubmit, isLoading, onReset }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="trip-input-form rounded-2xl border border-slate-800 bg-navy-900/90 p-5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <Truck className="h-5 w-5 text-spotter-cyan" />
          <h2 className="text-base font-bold tracking-tight text-white">
            Dispatch & Trip Parameters (Global City Search via Live API)
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 px-2 py-1 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Location Inputs with Live Global Autocomplete */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Current Location */}
        <LocationAutocomplete
          label="1. Current Location"
          iconColor="text-blue-400"
          name="current_location"
          value={formData.current_location}
          onChange={onChange}
          placeholder="e.g. Surat, Mumbai, Chicago, Dallas"
          subtext="Tractor starting location"
        />

        {/* Pickup Location */}
        <LocationAutocomplete
          label="2. Freight Pickup"
          iconColor="text-emerald-400"
          name="pickup_location"
          value={formData.pickup_location}
          onChange={onChange}
          placeholder="e.g. Vadodara, Ahmedabad, Gary"
          subtext="Origin (+1.0 hr On-Duty loading)"
        />

        {/* Dropoff Location */}
        <LocationAutocomplete
          label="3. Final Dropoff"
          iconColor="text-rose-400"
          name="dropoff_location"
          value={formData.dropoff_location}
          onChange={onChange}
          placeholder="e.g. Mumbai, Delhi, Los Angeles"
          subtext="Destination (+1.0 hr On-Duty unloading)"
        />
      </div>

      {/* Cycle Used Slider & Number Input */}
      <div className="rounded-xl border border-slate-800 bg-navy-950/70 p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center">
            <Clock className="h-3.5 w-3.5 text-spotter-cyan mr-1.5" />
            Current Cycle Used (70-Hour / 8-Day Limit)
          </label>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-extrabold text-spotter-cyan">
              {Number(formData.current_cycle_used).toFixed(1)}
            </span>
            <span className="text-xs text-slate-400">/ 70.0 hrs</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="0"
            max="70"
            step="0.5"
            name="current_cycle_used"
            value={formData.current_cycle_used}
            onChange={onChange}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-spotter-cyan"
          />
          <input
            type="number"
            min="0"
            max="70"
            step="0.5"
            name="current_cycle_used"
            value={formData.current_cycle_used}
            onChange={onChange}
            className="w-20 rounded-lg border border-slate-700 bg-navy-900 px-2 py-1 text-center font-mono text-sm text-white focus:border-spotter-cyan focus:outline-none"
          />
        </div>
        <p className="text-[10px] text-slate-400 mt-2">
          Available capacity before trip: <span className="font-bold text-slate-200">{(70.0 - Number(formData.current_cycle_used)).toFixed(1)} hrs</span>. A 34-hour restart will automatically be scheduled if capacity reaches 70.0 hours.
        </p>
      </div>

      {/* Advanced Metadata Toggle */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors py-1.5"
        >
          <div className="flex items-center space-x-1.5">
            <Sliders className="h-3.5 w-3.5" />
            <span>ELD Log Sheet Metadata (Carrier, Driver, Tractor/Trailer, BOL)</span>
          </div>
          {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showAdvanced && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border border-slate-800 bg-navy-950/50 p-4 text-xs">
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Carrier Name</label>
              <input
                type="text"
                name="carrier_name"
                value={formData.carrier_name}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-700 bg-navy-900 px-2.5 py-1.5 text-slate-200 focus:border-spotter-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Driver Name</label>
              <input
                type="text"
                name="driver_name"
                value={formData.driver_name}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-700 bg-navy-900 px-2.5 py-1.5 text-slate-200 focus:border-spotter-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Driver Signature</label>
              <input
                type="text"
                name="driver_signature"
                value={formData.driver_signature}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-700 bg-navy-900 px-2.5 py-1.5 text-slate-200 focus:border-spotter-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Tractor / Trailer No.</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="tractor_number"
                  value={formData.tractor_number}
                  onChange={onChange}
                  className="rounded-lg border border-slate-700 bg-navy-900 px-2.5 py-1.5 text-slate-200 focus:border-spotter-cyan focus:outline-none font-mono"
                />
                <input
                  type="text"
                  name="trailer_number"
                  value={formData.trailer_number}
                  onChange={onChange}
                  className="rounded-lg border border-slate-700 bg-navy-900 px-2.5 py-1.5 text-slate-200 focus:border-spotter-cyan focus:outline-none font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Shipping Document / Manifest</label>
              <input
                type="text"
                name="shipping_doc"
                value={formData.shipping_doc}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-700 bg-navy-900 px-2.5 py-1.5 text-slate-200 focus:border-spotter-cyan focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Commodity / Freight</label>
              <input
                type="text"
                name="commodity"
                value={formData.commodity}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-700 bg-navy-900 px-2.5 py-1.5 text-slate-200 focus:border-spotter-cyan focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit Action Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-spotter-cyan to-blue-600 hover:from-cyan-400 hover:to-blue-500 py-3 px-6 text-sm font-bold text-navy-950 shadow-lg shadow-spotter-cyan/20 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-navy-950" />
            <span>Calculating Route & FMCSA Compliance...</span>
          </>
        ) : (
          <>
            <Play className="h-4 w-4 fill-navy-950" />
            <span>Calculate Route & Generate FMCSA Daily Logs</span>
          </>
        )}
      </button>
    </form>
  );
}
