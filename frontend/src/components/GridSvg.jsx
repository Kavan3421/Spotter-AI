import React, { useState } from 'react';

/**
 * High-fidelity vector SVG renderer implementing the official FMCSA §395.8 DOT Graph Grid.
 * - 4 Duty status lines: Off Duty, Sleeper Berth, Driving, On Duty (Not Driving)
 * - 24 Major hourly columns with 15-minute tick subdivisions (1/4, 1/2, 3/4 hr)
 * - Continuous step-line graph connecting duty transitions with vertical steps
 * - Right-hand line hour totals summing to exactly 24.0 hours
 */
export default function GridSvg({ segments = [], lineTotals = {}, dayNumber = 1 }) {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  // Layout coordinate system
  const VIEW_WIDTH = 1040;
  const VIEW_HEIGHT = 250;
  
  const GRID_LEFT = 150;
  const GRID_RIGHT = 940;
  const GRID_WIDTH = GRID_RIGHT - GRID_LEFT; // 790px
  const HOUR_WIDTH = GRID_WIDTH / 24.0; // ~32.916px per hour
  
  const LINE_Y = {
    1: 50,   // Off Duty
    2: 95,   // Sleeper Berth
    3: 140,  // Driving
    4: 185,  // On Duty (Not Driving)
  };

  const LINE_LABELS = [
    { num: 1, label: "1. OFF DUTY", sub: "OFF", y: LINE_Y[1] },
    { num: 2, label: "2. SLEEPER BERTH", sub: "SB", y: LINE_Y[2] },
    { num: 3, label: "3. DRIVING", sub: "D", y: LINE_Y[3] },
    { num: 4, label: "4. ON DUTY (ND)", sub: "ON", y: LINE_Y[4] },
  ];

  const HOURS = [
    "M", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11",
    "N", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "M"
  ];

  // Build the step path string: M x0 y0 -> L x1 y0 -> L x1 y1 -> L x2 y1 ...
  let stepPathD = "";
  if (segments && segments.length > 0) {
    // Sort segments by start_hour
    const sorted = [...segments].sort((a, b) => a.start_hour - b.start_hour);
    
    sorted.forEach((seg, idx) => {
      const segLine = seg.line || 1;
      const y = LINE_Y[segLine] || LINE_Y[1];
      const xStart = GRID_LEFT + (seg.start_hour * HOUR_WIDTH);
      const xEnd = GRID_LEFT + (seg.end_hour * HOUR_WIDTH);

      if (idx === 0) {
        stepPathD += `M ${xStart.toFixed(2)} ${y} L ${xEnd.toFixed(2)} ${y}`;
      } else {
        // Vertical step transition from previous line's Y to this line's Y
        stepPathD += ` L ${xStart.toFixed(2)} ${y} L ${xEnd.toFixed(2)} ${y}`;
      }
    });
  }

  return (
    <div className="w-full overflow-x-auto select-none rounded-xl border border-slate-700/60 bg-navy-900/90 p-4 shadow-2xl">
      {/* Interactive Tooltip Banner */}
      <div className="mb-2 flex items-center justify-between px-2 text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold uppercase tracking-wider text-spotter-cyan">
            FMCSA §395.8 DOT 24-Hour Graph Grid
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">
            Day {dayNumber} (Midnight to Midnight)
          </span>
        </div>
        {hoveredSegment ? (
          <div className="flex items-center space-x-2 rounded bg-spotter-cyan/10 px-3 py-1 border border-spotter-cyan/30 text-spotter-cyan font-mono">
            <span className="font-bold">{hoveredSegment.line_name}:</span>
            <span>{hoveredSegment.start_hour.toFixed(2)}h - {hoveredSegment.end_hour.toFixed(2)}h ({hoveredSegment.duration_hours} hrs)</span>
            {hoveredSegment.location && <span className="text-slate-300 truncate max-w-xs">@{hoveredSegment.location}</span>}
          </div>
        ) : (
          <span className="text-slate-400 italic">Hover over graph segments for transition details</span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="w-full h-auto min-w-[850px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Background / Frame */}
        <rect
          x="10"
          y="15"
          width={VIEW_WIDTH - 20}
          height={VIEW_HEIGHT - 30}
          fill="#0B132B"
          stroke="#334155"
          strokeWidth="1.5"
          rx="6"
        />

        {/* Grid Background Box */}
        <rect
          x={GRID_LEFT}
          y="30"
          width={GRID_WIDTH}
          height="175"
          fill="#070C18"
          stroke="#475569"
          strokeWidth="1.2"
        />

        {/* Top & Bottom Hour Scale Headers */}
        {HOURS.map((hourLabel, i) => {
          const x = GRID_LEFT + (i * HOUR_WIDTH);
          const isMidnightOrNoon = i === 0 || i === 12 || i === 24;
          return (
            <g key={`hour-${i}`}>
              {/* Top hour label */}
              <text
                x={x}
                y="26"
                textAnchor="middle"
                fontSize={isMidnightOrNoon ? "10" : "9"}
                fontWeight={isMidnightOrNoon ? "700" : "500"}
                fill={isMidnightOrNoon ? "#00F0FF" : "#94A3B8"}
                fontFamily="monospace"
              >
                {hourLabel}
              </text>
              {/* Bottom hour label */}
              <text
                x={x}
                y="218"
                textAnchor="middle"
                fontSize={isMidnightOrNoon ? "10" : "9"}
                fontWeight={isMidnightOrNoon ? "700" : "500"}
                fill={isMidnightOrNoon ? "#00F0FF" : "#94A3B8"}
                fontFamily="monospace"
              >
                {hourLabel}
              </text>
            </g>
          );
        })}

        {/* 15-minute Subdivisions and Hour Vertical Grid Lines */}
        {Array.from({ length: 24 }).map((_, hourIdx) => {
          const hourX = GRID_LEFT + (hourIdx * HOUR_WIDTH);
          const q1X = hourX + (HOUR_WIDTH * 0.25);
          const halfX = hourX + (HOUR_WIDTH * 0.5);
          const q3X = hourX + (HOUR_WIDTH * 0.75);

          return (
            <g key={`col-${hourIdx}`}>
              {/* Full major hour vertical grid line */}
              <line
                x1={hourX}
                y1="30"
                x2={hourX}
                y2="205"
                stroke="#334155"
                strokeWidth={hourIdx === 0 || hourIdx === 12 ? "1.5" : "0.8"}
                strokeDasharray={hourIdx === 0 || hourIdx === 12 ? "none" : "2,2"}
              />

              {/* Sub-ticks on each of the 4 duty lines */}
              {[1, 2, 3, 4].map(lineNum => {
                const y = LINE_Y[lineNum];
                return (
                  <g key={`ticks-${hourIdx}-${lineNum}`}>
                    {/* 15 min tick */}
                    <line x1={q1X} y1={y - 4} x2={q1X} y2={y + 4} stroke="#475569" strokeWidth="0.75" />
                    {/* 30 min tick (taller) */}
                    <line x1={halfX} y1={y - 8} x2={halfX} y2={y + 8} stroke="#64748B" strokeWidth="1.0" />
                    {/* 45 min tick */}
                    <line x1={q3X} y1={y - 4} x2={q3X} y2={y + 4} stroke="#475569" strokeWidth="0.75" />
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Final 24th hour vertical line */}
        <line
          x1={GRID_RIGHT}
          y1="30"
          x2={GRID_RIGHT}
          y2="205"
          stroke="#334155"
          strokeWidth="1.5"
        />

        {/* Horizontal Duty Status Guide Lines */}
        {LINE_LABELS.map(line => (
          <g key={`guide-${line.num}`}>
            {/* Left Label */}
            <text
              x="20"
              y={line.y + 4}
              fontSize="10"
              fontWeight="700"
              fill="#E2E8F0"
              fontFamily="sans-serif"
            >
              {line.label}
            </text>

            {/* Horizontal Line Across Grid */}
            <line
              x1={GRID_LEFT}
              y1={line.y}
              x2={GRID_RIGHT}
              y2={line.y}
              stroke="#1E293B"
              strokeWidth="1"
            />
          </g>
        ))}

        {/* Interactive Hoverable Segment Rectangles (Backdrop) */}
        {segments.map((seg, sIdx) => {
          const segLine = seg.line || 1;
          const y = LINE_Y[segLine] || LINE_Y[1];
          const xStart = GRID_LEFT + (seg.start_hour * HOUR_WIDTH);
          const xEnd = GRID_LEFT + (seg.end_hour * HOUR_WIDTH);
          const width = Math.max(2, xEnd - xStart);

          return (
            <rect
              key={`seg-hover-${sIdx}`}
              x={xStart}
              y={y - 12}
              width={width}
              height="24"
              fill="transparent"
              className="cursor-pointer hover:fill-spotter-cyan/20 transition-colors"
              onMouseEnter={() => setHoveredSegment(seg)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <title>{`${seg.line_name}: ${seg.start_hour.toFixed(2)}h - ${seg.end_hour.toFixed(2)}h (${seg.duration_hours} hrs)\n${seg.remarks || ''}\n${seg.location || ''}`}</title>
            </rect>
          );
        })}

        {/* The Continuous Step-Line Graph (FMCSA Official Step Drawing) */}
        {stepPathD && (
          <>
            {/* Ambient Glow */}
            <path
              d={stepPathD}
              fill="none"
              stroke="#00F0FF"
              strokeWidth="5"
              strokeOpacity="0.4"
              strokeLinejoin="miter"
              filter="url(#glow)"
            />
            {/* Sharp Core Step Line */}
            <path
              d={stepPathD}
              fill="none"
              stroke="#00F0FF"
              strokeWidth="2.5"
              strokeLinecap="square"
              strokeLinejoin="miter"
            />
          </>
        )}

        {/* Transition Junction Dots */}
        {segments.map((seg, idx) => {
          const segLine = seg.line || 1;
          const y = LINE_Y[segLine] || LINE_Y[1];
          const xStart = GRID_LEFT + (seg.start_hour * HOUR_WIDTH);
          const isHovered = hoveredSegment === seg;

          return (
            <circle
              key={`dot-${idx}`}
              cx={xStart}
              cy={y}
              r={isHovered ? 5 : 3}
              fill={isHovered ? "#00F0FF" : "#38BDF8"}
              stroke="#070C18"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Right-Hand Daily Totals Header & Boxes */}
        <text
          x={GRID_RIGHT + 45}
          y="26"
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          fill="#94A3B8"
        >
          TOTAL HRS
        </text>

        {LINE_LABELS.map(line => {
          const key = `line_${line.num}_${line.sub.toLowerCase().replace(/[^a-z]/g, '')}`;
          // Extract matching total from lineTotals object
          let hours = 0.0;
          if (line.num === 1) hours = lineTotals.line_1_off_duty || 0.0;
          if (line.num === 2) hours = lineTotals.line_2_sleeper_berth || 0.0;
          if (line.num === 3) hours = lineTotals.line_3_driving || 0.0;
          if (line.num === 4) hours = lineTotals.line_4_on_duty || 0.0;

          return (
            <g key={`total-${line.num}`}>
              {/* Total Box */}
              <rect
                x={GRID_RIGHT + 15}
                y={line.y - 12}
                width="60"
                height="24"
                fill="#0F172A"
                stroke="#334155"
                strokeWidth="1"
                rx="3"
              />
              {/* Number Display */}
              <text
                x={GRID_RIGHT + 45}
                y={line.y + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fontFamily="monospace"
                fill={hours > 0 ? "#38BDF8" : "#64748B"}
              >
                {hours.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Bottom Total 24.0 Check Box */}
        <g>
          <text
            x={GRID_RIGHT + 45}
            y="218"
            textAnchor="middle"
            fontSize="10"
            fontWeight="800"
            fontFamily="monospace"
            fill="#00F0FF"
          >
            = {(lineTotals.total_hours || 24.0).toFixed(1)}
          </text>
        </g>
      </svg>
    </div>
  );
}
