import React from 'react';
import { Camera, CheckCircle2, AlertTriangle, ShieldX, Sparkles, ArrowRight, Image as ImageIcon } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function SurfaceInspectionSnippet({ inspection, onNavigate }) {
  const preset = inspection.preset || {};
  const isCrack = preset.isDamage;
  const isClean = preset.className === 'clean';
  const hasRealImage = !!inspection.imageUrl;
  const hasResult = !!preset.className && preset.className !== 'clean';

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-600" />
            <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900">
              Surface Inspection AI
            </h3>
          </div>
          <StatusBadge
            status={isCrack ? 'critical' : isClean ? 'optimal' : 'warning'}
            text={preset.className ? preset.className.replace(/_/g, ' ').toUpperCase() : 'STANDBY'}
            size="xs"
          />
        </div>

        {/* Visual Inspection Area: Clean Standby or Real Image */}
        <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mb-3 flex items-center justify-center p-2">
          {hasRealImage ? (
            <img
              src={inspection.imageUrl}
              alt="Inspected solar surface"
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-2 text-slate-400">
              <Camera className="w-8 h-8 text-blue-500 mb-1" />
              <span className="text-xs font-medium text-slate-700">Camera Inspection Ready</span>
              <span className="text-[10px] text-slate-500">Snap a photo on your phone or upload to test</span>
            </div>
          )}
        </div>

        {/* Prediction & Confidence */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">Classification:</span>
            <span className="font-semibold text-slate-900 font-mono">
              {preset.title || 'Awaiting Image Capture'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600 font-medium">Confidence Score:</span>
            <span className="font-mono text-blue-700 font-bold">
              {preset.confidence ? `${Math.round(preset.confidence * 100)}%` : '--'}
            </span>
          </div>

          {/* Confidence Bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-300">
            <div
              className={`h-full rounded-full transition-all duration-300 ${isCrack ? 'bg-rose-500' : 'bg-amber-400'}`}
              style={{ width: `${Math.round((preset.confidence || 0) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200">
        <button
          onClick={onNavigate}
          className="w-full flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          <span>Open Full Vision Camera Lab</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

