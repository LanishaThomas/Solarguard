import React from 'react';

export default function StatusBadge({ status, text, size = 'sm', pulse = false }) {
  let badgeStyles = 'bg-slate-100 text-slate-700 border-slate-300';
  let dotStyles = 'bg-slate-400';

  const normalized = (status || '').toLowerCase();

  if (['optimal', 'normal', 'connected', 'completed', 'success', 'clean'].includes(normalized)) {
    badgeStyles = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    dotStyles = 'bg-emerald-500';
  } else if (['warning', 'cooldown', 'shaded', 'dust', 'bird_droppings', 'snow', 'leaves'].includes(normalized)) {
    badgeStyles = 'bg-amber-100 text-amber-900 border-amber-300';
    dotStyles = 'bg-amber-500';
  } else if (['critical', 'fault', 'error', 'stopped', 'crack'].includes(normalized)) {
    badgeStyles = 'bg-rose-50 text-rose-800 border-rose-300';
    dotStyles = 'bg-rose-500';
  } else if (['wiping', 'running', 'active'].includes(normalized)) {
    badgeStyles = 'bg-blue-100 text-blue-900 border-blue-300';
    dotStyles = 'bg-blue-600 animate-ping';
  } else if (['standby', 'offline'].includes(normalized)) {
    badgeStyles = 'bg-slate-100 text-slate-700 border-slate-300';
    dotStyles = 'bg-slate-400';
  }

  const sizeClasses = size === 'xs' 
    ? 'text-[11px] px-2 py-0.5' 
    : size === 'md' 
    ? 'text-sm px-3 py-1' 
    : 'text-xs px-2.5 py-0.5';

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-2xs ${sizeClasses} ${badgeStyles}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles} ${pulse ? 'animate-pulse' : ''}`} />
      <span>{text || status}</span>
    </span>
  );
}
