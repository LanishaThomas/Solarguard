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
  Layers,
  Smartphone,
  Settings2,
  X,
  Radio,
  Image as ImageIcon
} from 'lucide-react';
import { formatDateFull } from '../utils/formatters';
import StatusBadge from '../components/common/StatusBadge';

export default function CameraDetectionPage() {
  const { 
    inspection, 
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

  const currentPreset = inspection.preset || {};
  const isCrack = currentPreset.isDamage;
  const isCleanable = currentPreset.isCleanable;
  const hasResult = !!currentPreset.className && currentPreset.className !== 'clean';

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
      setCameraError('Live stream declined or unavailable. Tap "Snap Photo (Phone)" to take a photo directly with your camera.');
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

  // Run live inference on current camera frame or uploaded image
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
        const res = await fetch(uploadedPreview);
        blob = await res.blob();
      } else {
        throw new Error('Please snap a photo using your mobile camera or upload an image to inspect.');
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
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight">
            Camera &amp; Vision Surface Inspection
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Real-time deep learning inference powered by fine-tuned MobileNetV3
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
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-medium flex items-center gap-1.5 transition ${
              modelStatus.isConnected 
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-300' 
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${modelStatus.isConnected ? 'bg-blue-600' : 'bg-rose-500'}`} />
            <span>FastAPI: {modelStatus.isConnected ? 'Online' : 'Offline'}</span>
            <Settings2 className="w-3.5 h-3.5 text-slate-500 hover:text-slate-700 ml-0.5" />
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm"
            title="Open phone camera to take photo directly"
          >
            <Smartphone className="w-3.5 h-3.5" /> Snap Photo (Phone)
          </button>

          {!useLiveCamera ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition border border-slate-200 shadow-sm"
            >
              <Video className="w-3.5 h-3.5 text-blue-600" /> Live Stream
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition border border-rose-200"
            >
              <VideoOff className="w-3.5 h-3.5 text-rose-600" /> Stop Stream
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition border border-slate-200 shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" /> Upload
          </button>
        </div>
      </div>

      {/* Backend Connection Config Modal */}
      {showBackendModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2 font-heading">
                <Settings2 className="w-4 h-4 text-blue-600" /> AI Backend Connection
              </h3>
              <button 
                onClick={() => setShowBackendModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Configure the SolarGuard FastAPI server URL. When connecting from your phone on the same Wi-Fi, use your local LAN IP (e.g. <span className="font-mono text-blue-700 font-semibold">http://10.239.45.122:8000</span>).
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-semibold text-slate-700">FastAPI Server URL:</label>
              <input
                type="text"
                value={tempBackendUrl}
                onChange={(e) => setTempBackendUrl(e.target.value)}
                placeholder="http://10.239.45.122:8000"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold">Quick Select:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setTempBackendUrl('http://127.0.0.1:8000')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 transition"
                >
                  Localhost (127.0.0.1:8000)
                </button>
                <button
                  type="button"
                  onClick={() => setTempBackendUrl('http://10.239.45.122:8000')}
                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-mono text-blue-700 transition font-medium"
                >
                  Phone Wi-Fi (10.239.45.122:8000)
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowBackendModal(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setBackendUrl(tempBackendUrl);
                  setShowBackendModal(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
              >
                Save &amp; Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      {inferenceError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{inferenceError}</span>
          </div>
          <button 
            onClick={checkBackendStatus}
            className="text-xs font-semibold underline text-rose-700 hover:text-rose-900"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main Vision Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Viewport (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase font-mono tracking-wider text-blue-700 font-bold flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-600" /> Optical Surface Viewport
              </span>
              <div className="flex items-center gap-2">
                {useLiveCamera && (
                  <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-xs font-mono text-slate-700">
                    <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
                    <span>Auto-Capture:</span>
                    <select
                      value={autoCaptureInterval}
                      onChange={(e) => setAutoCaptureInterval(Number(e.target.value))}
                      className="bg-transparent text-blue-700 border-none outline-none font-bold cursor-pointer"
                    >
                      <option value={0}>Off</option>
                      <option value={5}>5s</option>
                      <option value={10}>10s</option>
                      <option value={30}>30s</option>
                    </select>
                  </div>
                )}
                <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
                  {useLiveCamera ? 'Live Stream' : uploadedPreview ? 'Uploaded Photo' : 'Standby'}
                </span>
              </div>
            </div>

            {/* Video / Graphic Area */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-300 flex items-center justify-center">
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
                  alt="Uploaded solar surface"
                  className="w-full h-full object-contain bg-slate-950"
                />
              ) : (
                /* Clean standby state: No fake drawings */
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-slate-100 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-3">
                    <Camera className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900 font-heading">
                    Optical Inspection Ready
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Snap a photo with your mobile camera, start a live video stream, or upload an image file to evaluate with MobileNetV3.
                  </p>
                </div>
              )}

              {/* Classifying Loading Overlay */}
              {isClassifying && (
                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
                  <RotateCw className="w-8 h-8 text-amber-400 animate-spin" />
                  <span className="text-xs font-mono font-semibold text-white">
                    Running MobileNetV3 Neural Network...
                  </span>
                </div>
              )}
            </div>

            {/* Controls Bar */}
            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                onClick={handleCaptureAndPredict}
                disabled={isClassifying || (!useLiveCamera && !uploadedPreview)}
                className={`flex-1 py-2.5 px-4 rounded-xl font-heading font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-sm ${
                  isClassifying || (!useLiveCamera && !uploadedPreview)
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Classify Current Image with Model</span>
              </button>

              {uploadedPreview && (
                <button
                  onClick={() => setUploadedPreview(null)}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-semibold border border-slate-200 transition"
                >
                  Clear Photo
                </button>
              )}
            </div>

            {/* Neural Network Class Specifications */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                <span>Model Target Classification Classes:</span>
                <span className="text-[10px] text-blue-700 font-mono font-semibold">MobileNetV3 4-Class Architecture</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: 'Crack', desc: 'Structural fracture (Safety lock engaged)', badge: 'critical' },
                  { name: 'Dust', desc: 'Fine dust particulate accumulation', badge: 'warning' },
                  { name: 'Bird Droppings', desc: 'Opaque soiling & hot-spot risk', badge: 'warning' },
                  { name: 'Snow', desc: 'Solid snow and frost covering', badge: 'warning' },
                ].map((item) => (
                  <div key={item.name} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="font-heading font-semibold text-slate-900">{item.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Inference Decision & Cleaning Policy (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold text-base sm:text-lg text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" /> Model Decision
              </h3>
              <StatusBadge
                status={isCrack ? 'critical' : isCleanable ? 'warning' : 'optimal'}
                text={currentPreset.className ? currentPreset.className.toUpperCase() : 'STANDBY'}
                size="xs"
              />
            </div>

            {/* Prediction Details Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-600 font-sans font-medium">Predicted Class:</span>
                <span className="font-bold text-slate-900 font-sans text-sm">
                  {currentPreset.title || 'Awaiting Image Capture'}
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-sans font-medium">Confidence Score:</span>
                  <span className="font-bold text-blue-700">
                    {currentPreset.confidence ? `${(currentPreset.confidence * 100).toFixed(1)}%` : '--'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden border border-slate-300">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isCrack ? 'bg-rose-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${(currentPreset.confidence || 0) * 100}%` }}
                  />
                </div>
              </div>

              {/* Class Probabilities Distribution if genuine prediction */}
              {currentPreset.classProbabilities && (
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-600 font-bold flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-600" /> Softmax Probabilities:
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {Object.entries(currentPreset.classProbabilities).map(([cls, prob]) => (
                      <div key={cls} className="flex items-center justify-between">
                        <span className="capitalize text-slate-700 font-medium">{cls.replace('_', ' ')}:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${cls === 'crack' ? 'bg-rose-500' : 'bg-blue-600'}`} 
                              style={{ width: `${Math.round(prob * 100)}%` }} 
                            />
                          </div>
                          <span className="w-9 text-right font-mono font-bold text-slate-800">
                            {(prob * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentPreset.description && (
                <div className="text-xs text-slate-600 pt-1 font-sans">
                  {currentPreset.description}
                </div>
              )}
            </div>

            {/* Cleanability & Safety Rule Policy Box */}
            <div
              className={`p-3.5 rounded-xl border ${
                isCrack
                  ? 'bg-rose-50 border-rose-200'
                  : isCleanable
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {isCrack ? (
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                ) : isCleanable ? (
                  <RotateCw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                )}

                <div>
                  <div className="text-xs font-semibold text-slate-900">
                    Cleaning Safety Policy
                  </div>
                  <div className="text-xs text-slate-700 mt-1 leading-snug">
                    {isCrack
                      ? 'CRACK SAFETY RULE: Automatic and manual wiping are strictly BLOCKED. Running the wiper over fractured silicon causes severe abrasion.'
                      : isCleanable
                      ? 'Surface obstruction detected as cleanable debris. Wiper cleaning cycle authorized.'
                      : 'Surface status clear. No immediate cleaning action required.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => triggerWipe('Vision Inspection Trigger')}
                disabled={isCrack || cleaningState.status === 'wiping' || cleaningState.status === 'cooldown' || !isCleanable}
                className={`w-full py-2.5 px-4 rounded-xl font-heading font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
                  isCrack
                    ? 'bg-rose-100 text-rose-700 border border-rose-300 cursor-not-allowed'
                    : cleaningState.status === 'wiping' || cleaningState.status === 'cooldown' || !isCleanable
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
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
            </div>
          </div>
        </div>
      </div>

      {/* Past Inspections Log Table */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <h3 className="font-heading font-semibold text-base text-slate-900">
              Recent Visual Inspection Events
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500 font-medium">
            MongoDB Audit Trail
          </span>
        </div>

        {inspection.history.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
            No inspection events recorded yet. Capture or upload a photo to evaluate.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-2 font-semibold">Event ID</th>
                  <th className="pb-2 font-semibold">Timestamp</th>
                  <th className="pb-2 font-semibold">Condition</th>
                  <th className="pb-2 font-semibold">Confidence</th>
                  <th className="pb-2 font-semibold">Cleanable?</th>
                  <th className="pb-2 font-semibold">Action Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {inspection.history.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold text-blue-700">{item.id || `INSP-${idx + 1}`}</td>
                    <td className="py-2.5 text-slate-500">{formatDateFull(item.timestamp)}</td>
                    <td className="py-2.5">
                      <StatusBadge
                        status={item.isDamage ? 'critical' : item.isCleanable ? 'warning' : 'optimal'}
                        text={item.title}
                        size="xs"
                      />
                    </td>
                    <td className="py-2.5 text-slate-900 font-bold">
                      {Math.round((item.confidence || 0.9) * 100)}%
                    </td>
                    <td className="py-2.5">
                      {item.isCleanable ? (
                        <span className="text-amber-600 font-semibold">Yes</span>
                      ) : (
                        <span className="text-slate-400">No</span>
                      )}
                    </td>
                    <td className="py-2.5 text-slate-600 font-sans">{item.recommendedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
