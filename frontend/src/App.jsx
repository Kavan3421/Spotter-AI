import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PresetSelector, { PRESETS } from './components/PresetSelector';
import TripForm from './components/TripForm';
import TripSummary from './components/TripSummary';
import RouteMap from './components/RouteMap';
import DailyLogSheet from './components/DailyLogSheet';
import ItineraryTimeline from './components/ItineraryTimeline';
import { planTrip, checkBackendHealth } from './api/client';
import { Map, FileText, ListOrdered, ChevronLeft, ChevronRight, AlertCircle, ShieldCheck } from 'lucide-react';

const INITIAL_FORM_DATA = {
  current_location: 'Chicago, IL',
  pickup_location: 'Gary, IN',
  dropoff_location: 'Los Angeles, CA',
  current_cycle_used: 15.0,
  carrier_name: 'Spotter Logistics LLC',
  main_office: '500 W Madison St, Chicago, IL 60661',
  driver_name: 'Kavankumar',
  driver_signature: 'Kavankumar',
  tractor_number: 'TRK-408',
  trailer_number: 'TRL-992',
  shipping_doc: 'BOL #48291-SP',
  commodity: 'Commercial Freight #48291',
  trip_start_time: '',
};

export default function App() {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [activePresetId, setActivePresetId] = useState('chicago-la');
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'logs' | 'itinerary'
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  
  const [tripPlan, setTripPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendOnline, setBackendOnline] = useState(false);

  // Poll backend health status
  useEffect(() => {
    let interval;
    const check = async () => {
      const ok = await checkBackendHealth();
      setBackendOnline(ok);
    };
    check();
    interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  // Initial calculation on mount
  useEffect(() => {
    handlePlanTrip(INITIAL_FORM_DATA);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'current_cycle_used' ? parseFloat(value) || 0 : value
    }));
    setActivePresetId(null); // Clear active preset if user customizes fields
  };

  const handleSelectPreset = (preset) => {
    const updated = {
      ...formData,
      current_location: preset.current_location,
      pickup_location: preset.pickup_location,
      dropoff_location: preset.dropoff_location,
      current_cycle_used: preset.current_cycle_used,
      carrier_name: preset.carrier_name,
      driver_name: preset.driver_name,
      driver_signature: preset.driver_signature,
      tractor_number: preset.tractor_number,
      trailer_number: preset.trailer_number,
      shipping_doc: preset.shipping_doc,
      commodity: preset.commodity,
    };
    setFormData(updated);
    setActivePresetId(preset.id);
    handlePlanTrip(updated);
  };

  const handlePlanTrip = async (dataToSubmit = formData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await planTrip(dataToSubmit);
      setTripPlan(response);
      setSelectedDayIndex(0); // Reset to Day 1
    } catch (err) {
      console.error("Trip planning error:", err);
      setError(err.message || 'Failed to calculate interstate route and HOS schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_DATA);
    setActivePresetId('chicago-la');
    handlePlanTrip(INITIAL_FORM_DATA);
  };

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col font-sans selection:bg-spotter-cyan selection:text-navy-950">
      <Navbar
        backendOnline={backendOnline}
        onPrintAll={handlePrintAll}
        hasData={!!tripPlan}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Scenario Presets Bar */}
        <PresetSelector
          onSelectPreset={handleSelectPreset}
          activePresetId={activePresetId}
          disabled={isLoading}
        />

        {/* Dispatch & Trip Parameters Form */}
        <TripForm
          formData={formData}
          onChange={handleInputChange}
          onSubmit={() => handlePlanTrip(formData)}
          isLoading={isLoading}
          onReset={handleReset}
        />

        {/* Error Alert Box */}
        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 flex items-center space-x-3 text-rose-300">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-400" />
            <div className="text-sm">
              <strong className="font-semibold">Calculation Error: </strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Results Section */}
        {tripPlan && (
          <div className="space-y-6">
            {/* KPI Stat Cards Summary */}
            <TripSummary summary={tripPlan.summary} />

            {/* Navigation Tabs Bar */}
            <div className="no-print flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
              <div className="flex items-center space-x-2 bg-navy-900/90 p-1.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'map'
                      ? 'bg-spotter-cyan text-navy-950 shadow-md shadow-spotter-cyan/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Map className="h-4 w-4" />
                  <span>Interactive Route Map</span>
                </button>

                <button
                  onClick={() => setActiveTab('logs')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'logs'
                      ? 'bg-spotter-cyan text-navy-950 shadow-md shadow-spotter-cyan/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>FMCSA 24-Hr Daily Logs ({tripPlan.daily_logs?.length || 0} Days)</span>
                </button>

                <button
                  onClick={() => setActiveTab('itinerary')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'itinerary'
                      ? 'bg-spotter-cyan text-navy-950 shadow-md shadow-spotter-cyan/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ListOrdered className="h-4 w-4" />
                  <span>Trip Itinerary ({tripPlan.timeline?.length || 0} Events)</span>
                </button>
              </div>

              {/* Day Selector (Shown when on Logs tab) */}
              {activeTab === 'logs' && tripPlan.daily_logs?.length > 1 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-mono">Select Day:</span>
                  <div className="flex items-center space-x-1 bg-navy-900 p-1 rounded-lg border border-slate-800">
                    <button
                      disabled={selectedDayIndex === 0}
                      onClick={() => setSelectedDayIndex(prev => Math.max(0, prev - 1))}
                      className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {tripPlan.daily_logs.map((log, dIdx) => (
                      <button
                        key={dIdx}
                        onClick={() => setSelectedDayIndex(dIdx)}
                        className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${
                          selectedDayIndex === dIdx
                            ? 'bg-spotter-cyan/20 text-spotter-cyan border border-spotter-cyan/40'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        Day {log.day_number}
                      </button>
                    ))}

                    <button
                      disabled={selectedDayIndex === tripPlan.daily_logs.length - 1}
                      onClick={() => setSelectedDayIndex(prev => Math.min(tripPlan.daily_logs.length - 1, prev + 1))}
                      className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tab 1: Interactive Map View */}
            {activeTab === 'map' && (
              <div className="space-y-4">
                <RouteMap
                  polyline={tripPlan.route_geometry?.polyline || []}
                  stops={tripPlan.stops || []}
                  locations={tripPlan.locations || {}}
                />
              </div>
            )}

            {/* Tab 2: FMCSA Daily Log Sheets */}
            {activeTab === 'logs' && (
              <div>
                {/* Print mode prints all log sheets sequentially */}
                <div className="print-only hidden space-y-8">
                  {tripPlan.daily_logs?.map((dayLog, idx) => (
                    <DailyLogSheet
                      key={`print-${idx}`}
                      log={dayLog}
                      totalDays={tripPlan.daily_logs.length}
                    />
                  ))}
                </div>

                {/* Normal screen view shows selected day sheet */}
                <div className="no-print">
                  {tripPlan.daily_logs?.[selectedDayIndex] && (
                    <DailyLogSheet
                      log={tripPlan.daily_logs[selectedDayIndex]}
                      totalDays={tripPlan.daily_logs.length}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Chronological Itinerary Timeline */}
            {activeTab === 'itinerary' && (
              <ItineraryTimeline events={tripPlan.timeline || []} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-900 bg-navy-950 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Spotter AI Logistics Assessment Engine &bull; Built with Django & React
          </span>
          <span className="font-mono text-slate-400">
            Property-Carrying 70-Hr / 8-Day Rule &bull; 49 CFR §395.8
          </span>
        </div>
      </footer>
    </div>
  );
}
