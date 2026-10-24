import React from 'react';

export default function StatusBadge({ status, text, size = 'sm', pulse = false }) {
  let badgeStyles = 'bg-zinc-800/80 text-zinc-300 border-zinc-700';
  let dotStyles = 'bg-zinc-400';

  const normalized = (status || '').toLowerCase();

  if (['optimal', 'normal', 'connected', 'completed', 'success', 'clean'].includes(normalized)) {
    badgeStyles = 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30';
    dotStyles = 'bg-emerald-400 shadow-[0_0_8px_#34d399]';
  } else if (['warning', 'cooldown', 'shaded', 'dust', 'leaves'].includes(normalized)) {
    badgeStyles = 'bg-amber-950/50 text-amber-300 border-amber-500/30';
    dotStyles = 'bg-amber-400 shadow-[0_0_8px_#fbbf24]';
  } else if (['critical', 'fault', 'error', 'stopped', 'crack', 'offline'].includes(normalized)) {
    badgeStyles = 'bg-rose-950/50 text-rose-300 border-rose-500/30';
    dotStyles = 'bg-rose-500 shadow-[0_0_8px_#f43f5e]';
  } else if (['wiping', 'running', 'active'].includes(normalized)) {
    badgeStyles = 'bg-cyan-950/50 text-cyan-300 border-cyan-500/30';
    dotStyles = 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-ping';
  }

  const sizeClasses = size === 'xs' 
    ? 'text-[11px] px-2 py-0.5' 
    : size === 'md' 
    ? 'text-sm px-3 py-1' 
    : 'text-xs px-2.5 py-0.5';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border backdrop-blur-sm ${sizeClasses} ${badgeStyles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles} ${pulse ? 'animate-pulse' : ''}`} />
      <span>{text || status}</span>
    </span>
  );
}
