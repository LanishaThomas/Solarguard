import React, { useState, useRef, useEffect } from 'react';
import { useSolarGuard } from '../context/SolarGuardContext';
import { 
  Camera, 
  Video, 
  VideoOff, 
  Sparkles, 
  Upload, 
  RotateCw, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Info
} from 'lucide-react';
import { INSPECTION_PRESETS } from '../data/initialData';
import { formatDateFull } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';

export default function CameraDetectionPage() {
  const { 
    inspection, 
    setInspectionPreset, 
    triggerWipe, 
    cleaningState,
    addAlert 
  } = useSolarGuard();

  const [useLiveCamera, setUseLiveCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const currentPreset = inspection.preset || INSPECTION_PRESETS[0];
  const isCrack = currentPreset.isDamage;
  const isCleanable = currentPreset.isCleanable;

  // Handle live webcam/mobile camera stream
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setUseLiveCamera(true);
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera access declined or unavailable on this device. Using simulation presets.');
      setUseLiveCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setUseLiveCamera(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Simulate running ML inference on snapshot
  const handleRunInference = () => {
    setIsClassifying(true);
    setTimeout(() => {
      setIsClassifying(false);
      // cycle to a different sample or confirm
    }, 600);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-zinc-100 tracking-tight">
            Camera &amp; Computer Vision Surface Inspection
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Automated image classification with MobileNetV3 for dust, debris, bird soiling, and crack safety lock
          </p>
        </div>

        {/* Live Camera Toggle */}
        <div className="flex items-center gap-2 self-start">
          {!useLiveCamera ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-glow-green"
            >
              <Video className="w-3.5 h-3.5" /> Start Device Camera
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition border border-zinc-700"
            >
              <VideoOff className="w-3.5 h-3.5 text-rose-400" /> Stop Camera
            </button>
          )}
        </div>
      </div>

      {cameraError && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Main Vision Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Viewport & Inspection Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border-emerald-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400" /> Optical Surface Frame
              </span>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                {useLiveCamera ? 'Live Stream Active' : 'Test Model Preset'}
              </span>
            </div>

            {/* Video / Graphic Area */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#071109] border border-emerald-500/30 flex items-center justify-center">
              {useLiveCamera ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                /* Simulated Visual Representation of the Solar Panel Surface */
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#0c1e13] via-[#09150d] to-[#060e09]">
                  {/* Solar Photovoltaic Grid lines */}
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-1 p-4 opacity-25 pointer-events-none">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="bg-emerald-400/20 rounded-xs border border-emerald-500/40" />
                    ))}
                  </div>

                  {/* Visual Condition Overlay */}
                  <div className="relative z-10 flex flex-col items-center text-center">
                    {currentPreset.svgType === 'leaf' && (
                      <div className="space-y-2">
                        <span className="text-6xl animate-pulse inline-block">🍂</span>
                        <div className="bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs px-3 py-1 rounded-full font-mono">
                          Debris / Leaves Detected on Panel 2
                        </div>
                      </div>
                    )}

                    {currentPreset.svgType === 'clean' && (
                      <div className="space-y-2">
                        <CheckCircle2 className="w-16 h-16 text-emerald-400 shadow-glow-green" />
                        <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs px-3 py-1 rounded-full font-mono">
                          Clean Panel Surface — 97% Transmittance
                        </div>
                      </div>
                    )}

                    {currentPreset.svgType === 'dust' && (
                      <div className="space-y-2">
                        <div className="w-32 h-20 bg-yellow-600/30 rounded-2xl flex items-center justify-center border border-yellow-500/40 backdrop-blur-xs">
                          <span className="text-sm font-mono text-yellow-200 font-bold">Particulate Film</span>
                        </div>
                        <div className="bg-yellow-950/80 border border-yellow-500/40 text-yellow-200 text-xs px-3 py-1 rounded-full font-mono">
                          Fine Dust Layer Reducing Irradiance
                        </div>
                      </div>
                    )}

                    {currentPreset.svgType === 'droppings' && (
                      <div className="space-y-2">
                        <span className="text-5xl inline-block">🐦</span>
                        <div className="bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs px-3 py-1 rounded-full font-mono">
                          Localized Bird Droppings / Hot-spot Risk
                        </div>
                      </div>
                    )}

                    {currentPreset.svgType === 'crack' && (
                      <div className="space-y-2">
                        <ShieldAlert className="w-16 h-16 text-rose-500 animate-pulse" />
                        <div className="bg-rose-950 border border-rose-500/60 text-rose-200 text-xs px-3 py-1.5 rounded-full font-mono font-bold tracking-wide">
                          SURFACE CRACK: AUTO-WIPER LOCK ENGAGED
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Corner Target Reticles (CV Bounding Box look) */}
                  <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />
                </div>
              )}

              {/* Classifying Loading Overlay */}
              {isClassifying && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-20">
                  <RotateCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  <span className="text-xs font-mono text-emerald-300">
                    Running MobileNetV3 Inference...
                  </span>
                </div>
              )}
            </div>

            {/* Live Model Presets Selector Bar */}
            <div className="mt-4 pt-3 border-t border-emerald-500/15">
              <div className="text-xs font-semibold text-zinc-300 mb-2">
                Simulate Camera Condition Samples (Section 2.2 Classes):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {INSPECTION_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setInspectionPreset(preset.id)}
                    className={`p-2 rounded-xl text-left border text-xs transition ${
                      currentPreset.id === preset.id
                        ? 'bg-emerald-950/70 border-emerald-500/50 shadow-glow-green text-emerald-200'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-heading font-semibold truncate text-[11px]">
                      {preset.title}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                      {Math.round(preset.confidence * 100)}% conf
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Inference Decision & Cleaning Policy (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border-emerald-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-base sm:text-lg text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Inference Decision
              </h3>
              <StatusBadge
                status={isCrack ? 'critical' : isCleanable ? 'warning' : 'optimal'}
                text={currentPreset.className.toUpperCase()}
                size="xs"
              />
            </div>

            {/* Prediction Details Card */}
            <div className="p-3.5 rounded-xl bg-[#0b1710] border border-emerald-500/15 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-emerald-500/10 pb-2">
                <span className="text-zinc-400">Predicted Class:</span>
                <span className="font-bold text-emerald-300 font-sans text-sm">
                  {currentPreset.title}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Confidence Score:</span>
                  <span className="font-bold text-emerald-400">
                    {(currentPreset.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isCrack ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${currentPreset.confidence * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-[11px] text-zinc-400 pt-1">
                {currentPreset.description}
              </div>
            </div>

            {/* Cleanability & Safety Rule Policy Box */}
            <div
              className={`p-3.5 rounded-xl border ${
                isCrack
                  ? 'bg-rose-950/30 border-rose-500/40'
                  : isCleanable
                  ? 'bg-amber-950/20 border-amber-500/30'
                  : 'bg-emerald-950/20 border-emerald-500/20'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {isCrack ? (
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                ) : isCleanable ? (
                  <RotateCw className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                )}

                <div>
                  <div className="text-xs font-semibold text-zinc-200">
                    Cleaning Policy Engine (Section 2.3 &amp; 9)
                  </div>
                  <div className="text-[11px] text-zinc-300 mt-1 leading-snug">
                    {isCrack
                      ? '⚠️ CRACK SAFETY RULE: Automatic and manual wiping are strictly BLOCKED. Running the wiper over fractured silicon causes severe abrasion. Physical inspection requested.'
                      : isCleanable
                      ? 'Obstruction identified as cleanable debris. Automatic cleaning is authorized if confidence >= 85% and cooldown has elapsed.'
                      : 'Panel surface is clean. No wiping cycle required.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => triggerWipe('Vision Inspection Trigger')}
                disabled={isCrack || cleaningState.status === 'wiping' || cleaningState.status === 'cooldown'}
                className={`w-full py-2.5 px-4 rounded-xl font-heading font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                  isCrack
                    ? 'bg-rose-950/60 text-rose-400 border border-rose-500/40 cursor-not-allowed'
                    : cleaningState.status === 'wiping' || cleaningState.status === 'cooldown'
                    ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-green'
                }`}
              >
                <RotateCw className={`w-4 h-4 ${cleaningState.status === 'wiping' ? 'animate-spin' : ''}`} />
                <span>
                  {isCrack
                    ? 'WIPER LOCKED (Damage Detected)'
                    : cleaningState.status === 'wiping'
                    ? 'Wiping in Progress...'
                    : cleaningState.status === 'cooldown'
                    ? `Cooldown Active (${cleaningState.cooldownRemaining}s)`
                    : 'Clean This Obstruction Now'}
                </span>
              </button>

              <button
                onClick={handleRunInference}
                className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono transition"
              >
                Re-evaluate Model Inference
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Past Inspections Log Table */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border-emerald-500/20">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="font-heading font-semibold text-base text-zinc-100">
              Recent Visual Inspection Events
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            Audit Trail
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-emerald-500/15 text-zinc-400">
                <th className="pb-2 font-medium">Event ID</th>
                <th className="pb-2 font-medium">Timestamp</th>
                <th className="pb-2 font-medium">Condition</th>
                <th className="pb-2 font-medium">Confidence</th>
                <th className="pb-2 font-medium">Cleanable?</th>
                <th className="pb-2 font-medium">Action Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {inspection.history.map((item, idx) => (
                <tr key={idx} className="hover:bg-emerald-950/20">
                  <td className="py-2.5 font-bold text-emerald-400">{item.id || `INSP-${idx + 1}`}</td>
                  <td className="py-2.5 text-zinc-400">{formatDateFull(item.timestamp)}</td>
                  <td className="py-2.5">
                    <StatusBadge
                      status={item.isDamage ? 'critical' : item.isCleanable ? 'warning' : 'optimal'}
                      text={item.title}
                      size="xs"
                    />
                  </td>
                  <td className="py-2.5 text-emerald-300 font-bold">
                    {Math.round((item.confidence || 0.9) * 100)}%
                  </td>
                  <td className="py-2.5">
                    {item.isCleanable ? (
                      <span className="text-amber-400">Yes</span>
                    ) : (
                      <span className="text-zinc-500">No</span>
                    )}
                  </td>
                  <td className="py-2.5 text-zinc-400">{item.recommendedAction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
