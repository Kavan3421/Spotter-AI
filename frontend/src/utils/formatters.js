/**
 * Utility formatters for logistics and HOS metrics.
 */

export function formatDuration(hours) {
  if (hours == null || isNaN(hours)) return '0h 00m';
  const totalMins = Math.round(hours * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h}h ${m < 10 ? '0' : ''}${m}m`;
}

export function formatHourMinute(isoStr) {
  if (!isoStr) return '--:--';
  const d = new Date(isoStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDateTimeNice(isoStr) {
  if (!isoStr) return '--';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function getDutyStatusBadge(dutyStatus) {
  switch (dutyStatus) {
    case 'DRIVING':
      return {
        label: 'Driving (D)',
        short: 'D',
        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        dot: 'bg-emerald-400',
        line: 3
      };
    case 'ON_DUTY':
      return {
        label: 'On Duty (ND)',
        short: 'ON',
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        dot: 'bg-amber-400',
        line: 4
      };
    case 'SLEEPER_BERTH':
      return {
        label: 'Sleeper Berth (SB)',
        short: 'SB',
        color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        dot: 'bg-indigo-400',
        line: 2
      };
    case 'OFF_DUTY':
    default:
      return {
        label: 'Off Duty (OFF)',
        short: 'OFF',
        color: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
        dot: 'bg-slate-400',
        line: 1
      };
  }
}
