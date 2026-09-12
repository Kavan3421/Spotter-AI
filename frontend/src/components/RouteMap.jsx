import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Truck, MapPin, Fuel, Moon, Coffee, RotateCcw, Package, Flag } from 'lucide-react';
import { formatDateTimeNice, formatDuration } from '../utils/formatters';

// Component to dynamically auto-fit map view to the polyline and all stop markers
function MapBoundsUpdater({ polyline, stops }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const bounds = [];
    if (polyline && polyline.length > 0) {
      polyline.forEach(coord => bounds.push([coord[0], coord[1]]));
    } else if (stops && stops.length > 0) {
      stops.forEach(s => {
        if (s.location && s.location.lat && s.location.lng) {
          bounds.push([s.location.lat, s.location.lng]);
        }
      });
    }

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [map, polyline, stops]);

  return null;
}

// Generate custom Leaflet DivIcon with inline SVG and distinct color rings
function createCustomIcon(stopType) {
  let bgClass = "bg-blue-600";
  let borderClass = "border-blue-400";
  let glyph = "TRK";

  switch (stopType) {
    case "ORIGIN":
      bgClass = "bg-blue-600";
      borderClass = "border-blue-300 shadow-blue-500/50";
      glyph = "📍";
      break;
    case "PICKUP":
      bgClass = "bg-emerald-600";
      borderClass = "border-emerald-300 shadow-emerald-500/50";
      glyph = "📦";
      break;
    case "FUEL":
      bgClass = "bg-amber-600";
      borderClass = "border-amber-300 shadow-amber-500/50";
      glyph = "⛽";
      break;
    case "REST_10":
      bgClass = "bg-indigo-600";
      borderClass = "border-indigo-300 shadow-indigo-500/50";
      glyph = "🛏️";
      break;
    case "REST_30":
      bgClass = "bg-amber-500";
      borderClass = "border-amber-300 shadow-amber-500/50";
      glyph = "☕";
      break;
    case "RESTART_34":
      bgClass = "bg-purple-600";
      borderClass = "border-purple-300 shadow-purple-500/50";
      glyph = "🔄";
      break;
    case "DROPOFF":
      bgClass = "bg-rose-600";
      borderClass = "border-rose-300 shadow-rose-500/50";
      glyph = "🏁";
      break;
    default:
      bgClass = "bg-slate-700";
      borderClass = "border-slate-400";
      glyph = "•";
  }

  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="flex h-8 w-8 items-center justify-center rounded-full ${bgClass} border-2 ${borderClass} text-white shadow-lg transition-transform hover:scale-125 cursor-pointer font-bold text-xs">
          ${glyph}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

export default function RouteMap({ polyline = [], stops = [], locations = {} }) {
  const defaultCenter = [39.8283, -98.5795]; // Center of USA

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-navy-950">
      {/* Map Header Overlay */}
      <div className="absolute top-4 left-4 z-[1000] rounded-xl bg-navy-900/90 backdrop-blur-md px-4 py-2 border border-slate-700 shadow-lg flex items-center space-x-3">
        <div className="h-2.5 w-2.5 rounded-full bg-spotter-cyan animate-pulse" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
          Interactive Interstate Route Map
        </span>
        <span className="text-xs text-slate-400 font-mono">
          ({stops.length} Waypoints / Stops)
        </span>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] rounded-xl bg-navy-900/95 backdrop-blur-md p-3 border border-slate-700 shadow-xl text-xs space-y-1.5 hidden md:block">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Route Legend
        </span>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span className="text-slate-300">Origin</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-300">Pickup (1.0h)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-300">Fuel Stop (30m)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span className="text-slate-300">10-Hr Rest (SB)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-slate-300">30-Min Rest Break</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span className="text-slate-300">Dropoff (1.0h)</span>
          </div>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={4}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* Crisp Voyager / OpenStreetMap base tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Auto fit bounds */}
        <MapBoundsUpdater polyline={polyline} stops={stops} />

        {/* Route Polyline */}
        {polyline && polyline.length > 0 && (
          <>
            {/* Outer polyline glow */}
            <Polyline
              positions={polyline}
              color="#00F0FF"
              weight={7}
              opacity={0.3}
            />
            {/* Core polyline */}
            <Polyline
              positions={polyline}
              color="#0284C7"
              weight={4}
              opacity={0.9}
            />
          </>
        )}

        {/* Stop / Waypoint Markers */}
        {stops.map((stop, idx) => {
          if (!stop.location || !stop.location.lat || !stop.location.lng) return null;
          const pos = [stop.location.lat, stop.location.lng];
          const icon = createCustomIcon(stop.stop_type);

          return (
            <Marker key={`stop-${idx}`} position={pos} icon={icon}>
              <Popup className="custom-popup">
                <div className="p-1 text-slate-100 min-w-[210px]">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-spotter-cyan">
                      {stop.stop_type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Mile {stop.cumulative_miles?.toFixed(1) || 0}
                    </span>
                  </div>

                  <p className="font-bold text-sm text-white mb-1">
                    {stop.location.city}, {stop.location.state}
                  </p>
                  <p className="text-xs text-slate-300 mb-2">
                    {stop.remarks}
                  </p>

                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono border-t border-slate-800 pt-2 text-slate-400">
                    <div>
                      <span className="block text-[9px] uppercase">Arrival:</span>
                      <span className="text-slate-200">{formatDateTimeNice(stop.arrival_time)}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase">Duration:</span>
                      <span className="text-spotter-cyan">{formatDuration(stop.duration_hours)}</span>
                    </div>
                    <div className="col-span-2 pt-1 flex items-center justify-between text-slate-300">
                      <span>Cycle Remaining:</span>
                      <span className="font-bold text-emerald-400">{stop.cycle_remaining}h</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
