import React from 'react';
import { Smartphone, X, Maximize2 } from 'lucide-react';

export default function DevicePreviewModal({ isOpen, onClose, children }) {
  if (!isOpen) return children;

  return (
    <div className="min-h-screen bg-[#050a06] flex flex-col items-center justify-center p-2 sm:p-6 select-none">
      {/* Top Bar with Motorola Edge 50 Information */}
      <div className="w-full max-w-[440px] flex items-center justify-between py-2 px-3 text-xs text-zinc-400 bg-zinc-900/80 rounded-t-2xl border border-zinc-800">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-emerald-300">Motorola Edge 50 Viewport</span>
          <span className="text-[10px] font-mono bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-400 border border-emerald-500/30">
            412 × 915 px
          </span>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition"
          title="Exit Mobile Frame"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Realistic Edge 50 Chassis */}
      <div className="relative w-full max-w-[440px] h-[880px] bg-[#121613] rounded-[44px] p-3 shadow-2xl border-4 border-zinc-700/80 ring-1 ring-emerald-500/30 flex flex-col overflow-hidden">
        {/* Curved Glass Side Highlight */}
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-r from-emerald-500/20 to-transparent pointer-events-none z-50"></div>
        <div className="absolute top-0 bottom-0 right-0 w-1 bg-gradient-to-l from-emerald-500/20 to-transparent pointer-events-none z-50"></div>

        {/* Motorola Edge 50 Front Punch Hole Camera */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-black border border-zinc-800 shadow-inner z-50 flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60"></div>
        </div>

        {/* Inner Screen Display (Interactive App) */}
        <div className="w-full h-full bg-[#080f0a] rounded-[34px] overflow-y-auto overflow-x-hidden relative flex flex-col pt-5">
          {children}
        </div>

        {/* Motorola Bottom Navigation Bar pill */}
        <div className="w-28 h-1 bg-zinc-600 rounded-full mx-auto my-1.5 shrink-0"></div>
      </div>

      <div className="mt-3 text-center text-xs text-zinc-500">
        Simulating Motorola Edge 50 curved-display ergonomics &amp; touch margins. Click &apos;X&apos; to return to desktop width.
      </div>
    </div>
  );
}
