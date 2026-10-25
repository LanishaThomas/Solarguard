import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Info,
  Cpu,
  RefreshCw,
  Clock,
  Layers,
  Smartphone,
  Settings2,
  X,
  Radio
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
    modelStatus,
    predictLiveImage,
    backendUrl,
    setBackendUrl,
    checkBackendStatus,
  } = useSolarGuard();

  const [useLiveCamera, setUseLiveCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [inferenceError, setInferenceError] = useState(null);
  const [autoCaptureInterval, setAutoCaptureInterval] = useState(0); // 0 = off, 5, 10, 30
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [showBackendModal, setShowBackendModal] = useState(false);
  const [tempBackendUrl, setTempBackendUrl] = useState(backendUrl);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const mobileCameraInputRef = useRef(null);
  const autoCaptureTimerRef = useRef(null);

  const currentPreset = inspection.preset || INSPECTION_PRESETS[0];
  const isCrack = currentPreset.isDamage;
  const isCleanable = currentPreset.isCleanable;

  // Handle live webcam/mobile camera stream with device constraint fallback
  const startCamera = async () => {
    try {
      setCameraError(null);
      setUploadedPreview(null);
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      } catch (err1) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setUseLiveCamera(true);
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Live stream declined or unavailable on HTTP. You can still tap "Snap Photo (Phone)" to take a photo with your mobile camera directly.');
      setUseLiveCamera(false);
    }
  };


  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setUseLiveCamera(false);
    setAutoCaptureInterval(0);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (autoCaptureTimerRef.current) {
        clearInterval(autoCaptureTimerRef.current);
      }
    };
  }, []);

  // Capture frame from video element or canvas
  const captureBlobFromVideo = useCallback(() => {
    return new Promise((resolve) => {
      if (!videoRef.current) {
        resolve(null);
        return;
      }
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        resolve(null);
        return;
      }

      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    });
  }, []);

  // Run live inference on current camera frame
  const handleCaptureAndPredict = async () => {
    if (!modelStatus.isConnected) {
      setInferenceError('FastAPI inference backend is not connected. Start the server at ' + backendUrl);
      return;
    }

    setIsClassifying(true);
    setInferenceError(null);

    try {
      let blob = null;
      if (useLiveCamera && videoRef.current) {
        blob = await captureBlobFromVideo();
      } else if (uploadedPreview) {
        // Fetch blob from uploaded data url
        const res = await fetch(uploadedPreview);
        blob = await res.blob();
      } else {
        // Create synthetic image from current preset for testing
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = 224;
        canvas.height = 224;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = isCrack ? '#3a1e1e' : isCleanable ? '#2d2715' : '#10281b';
        ctx.fillRect(0, 0, 224, 224);
        ctx.fillStyle = '#10b981';
        ctx.font = '16px monospace';
        ctx.fillText(currentPreset.className, 20, 110);
        blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
      }

      if (!blob) {
        throw new Error('Could not acquire an image frame for classification.');
      }

      const result = await predictLiveImage(blob);
      if (!result.success) {
        setInferenceError(result.error);
      }
    } catch (err) {
      setInferenceError(err.message || 'Inference failed');
    } finally {
      setIsClassifying(false);
    }
  };

  // Auto capture loop
  useEffect(() => {
    if (autoCaptureTimerRef.current) {
      clearInterval(autoCaptureTimerRef.current);
      autoCaptureTimerRef.current = null;
    }

    if (autoCaptureInterval > 0 && useLiveCamera) {
      autoCaptureTimerRef.current = setInterval(() => {
        handleCaptureAndPredict();
      }, autoCaptureInterval * 1000);
    }

    return () => {
      if (autoCaptureTimerRef.current) {
        clearInterval(autoCaptureTimerRef.current);
      }
    };
  }, [autoCaptureInterval, useLiveCamera]);

  // Handle local image file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedPreview(event.target.result);
      if (useLiveCamera) {
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      {/* Hidden canvas for video captures */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-zinc-100 tracking-tight">
            Camera &amp; Computer Vision Surface Inspection
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Real-time inference pipeline powered by fine-tuned MobileNetV3 (Section 2.2 Classes)
          </p>
        </div>

        {/* Model Backend Indicator & Camera Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            onClick={() => {
              setTempBackendUrl(backendUrl);
              setShowBackendModal(true);
            }}
            title="Configure Backend Connection URL"
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition ${
              modelStatus.isConnected 
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:border-emerald-400' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${modelStatus.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span>FastAPI: {modelStatus.isConnected ? 'Online' : 'Offline'}</span>
            <Settings2 className="w-3 h-3 text-zinc-500 hover:text-zinc-300 ml-0.5" />
          </button>

          {/* Native Phone Camera Snap */}
          <input
            type="file"
            ref={mobileCameraInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => mobileCameraInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow-glow-green"
            title="Open phone camera to take photo directly"
          >
            <Smartphone className="w-3.5 h-3.5" /> Snap Photo (Phone)
          </button>

          {!useLiveCamera ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition border border-zinc-700"
            >
              <Video className="w-3.5 h-3.5 text-emerald-400" /> Live Stream
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition border border-zinc-700"
            >
              <VideoOff className="w-3.5 h-3.5 text-rose-400" /> Stop Stream
            </button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs transition border border-zinc-700"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" /> Upload
          </button>
        </div>
      </div>

      {/* Backend Connection Config Modal */}
      {showBackendModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1710] border border-emerald-500/30 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2 font-heading">
                <Settings2 className="w-4 h-4 text-emerald-400" /> AI Backend Connection
              </h3>
              <button 
                onClick={() => setShowBackendModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-400">
              Configure the SolarGuard FastAPI server URL. When connecting from your phone, use your computer's Wi-Fi LAN IP (e.g. <span className="font-mono text-emerald-300">http://10.239.45.122:8000</span>).
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-zinc-400">FastAPI Server URL:</label>
              <input
                type="text"
                value={tempBackendUrl}
                onChange={(e) => setTempBackendUrl(e.target.value)}
                placeholder="http://10.239.45.122:8000"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs font-mono text-emerald-300 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setTempBackendUrl('http://127.0.0.1:8000')}
                  className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] font-mono text-zinc-300 transition"
                >
                  Localhost (127.0.0.1:8000)
                </button>
                <button
                  type="button"
                  onClick={() => setTempBackendUrl('http://10.239.45.122:8000')}
                  className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-lg text-[11px] font-mono text-emerald-300 transition"
                >
                  Phone Wi-Fi (10.239.45.122:8000)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowBackendModal(false)}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setBackendUrl(tempBackendUrl);
                  setShowBackendModal(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-glow-green"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </div>
      )}


      {cameraError && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {inferenceError && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{inferenceError}</span>
          </div>
          <button 
            onClick={checkBackendStatus}
            className="text-[11px] underline text-rose-300 hover:text-white"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main Vision Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Viewport & Inspection Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel rounded-2xl p-4 sm:p-5 border-emerald-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400" /> Optical Surface Viewport
              </span>
              <div className="flex items-center gap-2">
                {useLiveCamera && (
                  <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-300">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    <span>Auto-Capture:</span>
                    <select
                      value={autoCaptureInterval}
                      onChange={(e) => setAutoCaptureInterval(Number(e.target.value))}
                      className="bg-transparent text-emerald-300 border-none outline-none font-bold cursor-pointer"
                    >
                      <option value={0} className="bg-zinc-900">Off</option>
                      <option value={5} className="bg-zinc-900">5s</option>
                      <option value={10} className="bg-zinc-900">10s</option>
                      <option value={30} className="bg-zinc-900">30s</option>
                    </select>
                  </div>
                )}
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
                  {useLiveCamera ? 'Live Stream' : uploadedPreview ? 'Uploaded Photo' : 'Simulation Preset'}
                </span>
              </div>
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
              ) : uploadedPreview ? (
                <img
                  src={uploadedPreview}
                  alt="Uploaded panel"
                  className="w-full h-full object-contain bg-black/60"
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
                    {currentPreset.svgType === 'clean' && (
                      <div className="space-y-2">
                        <CheckCircle2 className="w-16 h-16 text-emerald-400 shadow-glow-green" />
                        <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs px-3 py-1 rounded-full font-mono">
                          Clean Panel Surface — High Optical Transmittance
                        </div>
                      </div>
                    )}

                    {currentPreset.svgType === 'dust' && (
                      <div className="space-y-2">
                        <div className="w-32 h-20 bg-yellow-600/30 rounded-2xl flex items-center justify-center border border-yellow-500/40 backdrop-blur-xs">
                          <span className="text-sm font-mono text-yellow-200 font-bold">Dust Film</span>
                        </div>
                        <div className="bg-yellow-950/80 border border-yellow-500/40 text-yellow-200 text-xs px-3 py-1 rounded-full font-mono">
                          Fine Particulate Film Attenuating Irradiance
                        </div>
                      </div>
                    )}

                    {(currentPreset.svgType === 'bird_droppings' || currentPreset.svgType === 'droppings') && (
                      <div className="space-y-2">
                        <span className="text-5xl inline-block">🐦</span>
                        <div className="bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs px-3 py-1 rounded-full font-mono">
                          Localized Bird Droppings — Hot-Spot Risk
                        </div>
                      </div>
                    )}

                    {currentPreset.svgType === 'snow' && (
                      <div className="space-y-2">
                        <span className="text-5xl inline-block">❄️</span>
                        <div className="bg-sky-950/80 border border-sky-500/40 text-sky-200 text-xs px-3 py-1 rounded-full font-mono">
                          Snow Accumulation Detected
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
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-20">
                  <RotateCw className="w-8 h-8 text-emerald-400 animate-spin" />
                  <span className="text-xs font-mono text-emerald-300">
                    Running MobileNetV3 Forward Pass...
                  </span>
                </div>
              )}
            </div>

            {/* Controls Bar */}
            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                onClick={handleCaptureAndPredict}
                disabled={isClassifying}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs font-mono flex items-center justify-center gap-2 transition shadow-glow-green disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Capture &amp; Classify Image with Model</span>
              </button>

              {uploadedPreview && (
                <button
                  onClick={() => setUploadedPreview(null)}
                  className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono border border-zinc-700 transition"
                >
                  Clear Upload
                </button>
              )}
            </div>

            {/* Test Model Presets Selector Bar */}
            <div className="mt-4 pt-3 border-t border-emerald-500/15">
              <div className="text-xs font-semibold text-zinc-300 mb-2 flex items-center justify-between">
                <span>Model Supported Class Presets:</span>
                <span className="text-[10px] text-zinc-500 font-mono">MobileNetV3 5-Class Head</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {INSPECTION_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setUploadedPreview(null);
                      setInspectionPreset(preset.id);
                    }}
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
                <Sparkles className="w-4 h-4 text-emerald-400" /> Model Decision
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

              {/* Class Probabilities Distribution if genuine prediction */}
              {currentPreset.classProbabilities && (
                <div className="space-y-1.5 pt-2 border-t border-emerald-500/10">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-emerald-400" /> Softmax Probabilities:
                  </div>
                  <div className="space-y-1 text-[10px]">
                    {Object.entries(currentPreset.classProbabilities).map(([cls, prob]) => (
                      <div key={cls} className="flex items-center justify-between">
                        <span className="capitalize text-zinc-400">{cls.replace('_', ' ')}:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${cls === 'crack' ? 'bg-rose-500' : 'bg-emerald-400'}`} 
                              style={{ width: `${Math.round(prob * 100)}%` }} 
                            />
                          </div>
                          <span className="w-8 text-right font-mono text-zinc-300">
                            {(prob * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                      ? 'CRACK SAFETY RULE: Automatic and manual wiping are strictly BLOCKED. Running the wiper over fractured silicon causes severe abrasion. Physical inspection requested.'
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
                onClick={handleCaptureAndPredict}
                disabled={isClassifying}
                className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono transition flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isClassifying ? 'animate-spin' : ''}`} />
                <span>Re-evaluate Image Inference</span>
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
