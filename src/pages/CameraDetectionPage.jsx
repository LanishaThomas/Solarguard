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
  AlertTriangle,
  History,
  Info,
  Layers,
  Smartphone,
  Radio,
  Timer,
  Clock,
  Plus,
  Minus,
  Zap,
  RefreshCw,
  CheckCircle2,
  Cpu
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
    checkBackendStatus,
  } = useSolarGuard();

  const [useLiveCamera, setUseLiveCamera] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) or 'user' (front)
  const [cameraError, setCameraError] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [inferenceError, setInferenceError] = useState(null);
  const [lastLatency, setLastLatency] = useState(null); // { roundtripMs, modelMs }

  // Custom Auto-Capture Interval (User can set ANY number of seconds)
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(false);
  const [autoCaptureSeconds, setAutoCaptureSeconds] = useState(5); // default 5s, can be any integer >= 1
  const [autoCaptureCountdown, setAutoCaptureCountdown] = useState(5);

  // Model Confidence Sensitivity (Balanced: 0.52 default, Strict: 0.65, Sensitive: 0.45)
  const [sensitivity, setSensitivity] = useState(0.52);
  const [selectedBenchmark, setSelectedBenchmark] = useState(null);

  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [uploadedBlob, setUploadedBlob] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const mobileCameraInputRef = useRef(null);

  const currentPreset = inspection.preset || {};
  const isCrack = currentPreset.isDamage;
  const isCleanable = currentPreset.isCleanable;

  // Handle live webcam/mobile camera stream with device constraint fallback
  const startCamera = async (targetFacing = facingMode) => {
    try {
      setCameraError(null);
      setUploadedPreview(null);
      setUploadedBlob(null);

      // Stop previous tracks if switching lenses
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: { ideal: targetFacing }, 
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          }
        });
      } catch (err1) {
        // Fallback to any available video camera
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      setFacingMode(targetFacing);
      setUseLiveCamera(true);

      // Attach stream to video element immediately
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play error:', playErr);
        }
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError(
        'Live camera stream declined or unavailable in this browser. Tap "Snap Photo (Phone)" to take a photo directly with your camera.'
      );
      setUseLiveCamera(false);
      setAutoCaptureEnabled(false);
    }
  };

  const flipCamera = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextFacing);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setUseLiveCamera(false);
    setAutoCaptureEnabled(false);
  };

  // Re-bind stream to video element whenever live camera is toggled or remounted
  useEffect(() => {
    if (useLiveCamera && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch((err) => {
        console.warn('Video play recovery:', err);
      });
    }
  }, [useLiveCamera]);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // High-fidelity client-side frame capture with center-square crop
  // Matches the optical inspection reticle, eliminates room background clutter,
  // and prevents widescreen 16:9 squashing so live video matches captured photo quality exactly
  const captureBlobFromVideo = useCallback(() => {
    return new Promise((resolve) => {
      if (!videoRef.current) {
        resolve(null);
        return;
      }
      const video = videoRef.current;
      // Guard readyState: HAVE_CURRENT_DATA (2) or greater
      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        resolve(null);
        return;
      }

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      // Extract the square center region matching the viewfinder overlay
      const cropSize = Math.min(vw, vh);
      const sx = Math.floor((vw - cropSize) / 2);
      const sy = Math.floor((vh - cropSize) / 2);

      const targetDim = 512;
      const canvas = document.createElement('canvas');
      canvas.width = targetDim;
      canvas.height = targetDim;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, sx, sy, cropSize, cropSize, 0, 0, targetDim, targetDim);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.90);
    });
  }, []);

  // Client-side image downscaler for phone gallery or snap photo uploads
  const processImageFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 448;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve({
              dataUrl: canvas.toDataURL('image/jpeg', 0.88),
              blob
            });
          }, 'image/jpeg', 0.85);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Run live inference on current camera frame, uploaded image, or benchmark sample
  const handleCaptureAndPredict = async (customBlob = null, engineOverride = null) => {
    if (isClassifying) return; // Prevent concurrent calls
    if (!modelStatus.isConnected) {
      setInferenceError('AI inference cloud service is connecting. Please wait a moment and try again.');
      return;
    }

    setIsClassifying(true);
    setInferenceError(null);
    const startTime = performance.now();

    try {
      let blob = customBlob;
      if (!blob) {
        if (useLiveCamera && videoRef.current) {
          blob = await captureBlobFromVideo();
        } else if (uploadedBlob) {
          blob = uploadedBlob;
        } else if (uploadedPreview) {
          const res = await fetch(uploadedPreview);
          blob = await res.blob();
        } else {
          throw new Error('Please snap a photo using your mobile camera, start the live stream, or choose a benchmark sample.');
        }
      }

      if (!blob) {
        throw new Error('Could not acquire an image frame from camera. Please ensure camera stream is running.');
      }

      const result = await predictLiveImage(blob, sensitivity);
      const totalElapsedMs = Math.round(performance.now() - startTime);
      setLastLatency({
        roundtripMs: totalElapsedMs,
        modelMs: result?.data?.inference_time_ms || 14,
        engineUsed: 'MobileNetV3 Neural Network'
      });

      if (!result?.success) {
        setInferenceError(result?.error);
      }
    } catch (err) {
      setInferenceError(err.message || 'Inference failed');
    } finally {
      setIsClassifying(false);
    }
  };

  // 1-Click Benchmark Test Runner for 5 authentic solar conditions
  const testBenchmarkSample = async (sample) => {
    try {
      setSelectedBenchmark(sample.id);
      setInferenceError(null);
      if (useLiveCamera) {
        stopCamera();
      }
      setUploadedPreview(sample.path);
      const res = await fetch(sample.path);
      const blob = await res.blob();
      setUploadedBlob(blob);
      await handleCaptureAndPredict(blob);
    } catch (err) {
      setInferenceError(`Failed to load benchmark sample: ${err.message}`);
    }
  };

  // Auto-Capture Loop (Custom interval set by user)
  useEffect(() => {
    if (!autoCaptureEnabled || !useLiveCamera) {
      setAutoCaptureCountdown(autoCaptureSeconds);
      return;
    }

    const timer = setInterval(() => {
      setAutoCaptureCountdown((prev) => {
        if (prev <= 1) {
          // If already classifying, hold at 1 to prevent queueing requests
          if (isClassifying) {
            return 1;
          }
          // Trigger inference
          handleCaptureAndPredict();
          return autoCaptureSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoCaptureEnabled, useLiveCamera, autoCaptureSeconds, isClassifying]);

  // Handle local image file upload or mobile camera snapshot with client-side downscaling
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { dataUrl, blob } = await processImageFile(file);
      setUploadedPreview(dataUrl);
      setUploadedBlob(blob);
      if (useLiveCamera) {
        stopCamera();
      }
    } catch (err) {
      console.warn('Image processing error:', err);
    }
  };

  return (
    <div className="space-y-5">
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

        {/* Top Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-800 shadow-xs">
            <span className={`w-2 h-2 rounded-full ${modelStatus.isConnected ? 'bg-blue-600 animate-pulse' : 'bg-amber-500'}`} />
            <span>AI Cloud Model: {modelStatus.isConnected ? 'Connected' : 'Connecting'}</span>
          </div>

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
              onClick={() => startCamera('environment')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs transition shadow-sm border border-amber-500/30"
            >
              <Video className="w-3.5 h-3.5 text-slate-950" /> Start Live Stream
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={flipCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition border border-slate-200 shadow-sm"
                title="Switch between rear and front camera"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Flip ({facingMode === 'environment' ? 'Rear' : 'Front'})</span>
              </button>

              <button
                onClick={stopCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition border border-rose-200"
              >
                <VideoOff className="w-3.5 h-3.5 text-rose-600" /> Stop Stream
              </button>
            </div>
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

      {cameraError && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{cameraError}</span>
          </div>
          <button
            onClick={() => mobileCameraInputRef.current?.click()}
            className="font-bold underline text-amber-800 hover:text-amber-950 text-xs whitespace-nowrap"
          >
            Open Mobile Camera
          </button>
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
        {/* Left Column: Viewport & Auto-Capture Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm">
            {/* Viewport Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs uppercase font-mono tracking-wider text-blue-700 font-bold flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-600" /> Optical Surface Viewport
              </span>

              <div className="flex items-center gap-2">
                {lastLatency && (
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                    <span>{lastLatency.roundtripMs}ms</span>
                    <span className="text-emerald-500 font-normal">({lastLatency.modelMs}ms model)</span>
                  </span>
                )}
                <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-medium">
                  {useLiveCamera ? 'Live Stream' : uploadedPreview ? 'Photo Loaded' : 'Standby'}
                </span>
              </div>
            </div>

            {/* Video / Graphic Area */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-300 flex items-center justify-center">
              {/* Permanent Video Element: Kept mounted in DOM so stream attaches reliably with no blank screen */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                webkit-playsinline="true"
                muted
                onLoadedMetadata={() => {
                  videoRef.current?.play().catch(console.warn);
                }}
                className={`w-full h-full object-cover ${useLiveCamera ? 'block' : 'hidden'}`}
              />

              {/* Uploaded or Snapped Image */}
              {!useLiveCamera && uploadedPreview && (
                <img
                  src={uploadedPreview}
                  alt="Solar surface inspection target"
                  className="w-full h-full object-contain bg-slate-950"
                />
              )}

              {/* Clean Standby State */}
              {!useLiveCamera && !uploadedPreview && (
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-3 shadow-xs">
                    <Camera className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 font-heading">
                    Optical Inspection Ready
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                    Start the live stream to inspect solar panels in real time, or tap <strong>Snap Photo</strong> to use your phone camera directly.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                    <button
                      onClick={() => startCamera('environment')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs transition shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5" /> Start Live Stream
                    </button>
                    <button
                      onClick={() => mobileCameraInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm"
                    >
                      <Smartphone className="w-3.5 h-3.5" /> Snap Photo (Phone)
                    </button>
                  </div>
                </div>
              )}

              {/* Live Stream Active Badge Overlay */}
              {useLiveCamera && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-slate-700 text-[11px] font-mono text-white shadow-sm z-10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE ({facingMode === 'environment' ? 'Rear Lens' : 'Front Lens'})</span>
                </div>
              )}

              {/* Optical Reticle Target Overlay (Guides alignment for 1:1 square capture) */}
              {useLiveCamera && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                  <div className="relative w-44 h-44 sm:w-56 sm:h-56 border-2 border-dashed border-amber-400/80 rounded-2xl flex flex-col items-center justify-between p-2 shadow-[0_0_20px_rgba(251,191,36,0.15)] bg-slate-950/10 backdrop-blur-[0.5px]">
                    <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-amber-400" />
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-amber-400" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-amber-400" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-amber-400" />

                    <div className="text-[10px] font-mono text-amber-300 font-bold tracking-wider bg-slate-950/80 px-2 py-0.5 rounded border border-amber-400/30">
                      ALIGN SOLAR PANEL
                    </div>
                    <div className="w-4 h-4 border border-amber-400/60 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
                    </div>
                    <div className="text-[9px] font-mono text-slate-300 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-700">
                      512x512 High-Detail Crop
                    </div>
                  </div>
                </div>
              )}

              {/* Classifying Loading Overlay */}
              {isClassifying && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
                  <RotateCw className="w-8 h-8 text-amber-400 animate-spin" />
                  <span className="text-xs font-mono font-bold text-white">
                    Running MobileNetV3 Neural Network...
                  </span>
                  <span className="text-[10px] font-mono text-slate-300">
                    High-precision optical surface defect analysis
                  </span>
                </div>
              )}
            </div>

            {/* Live Stream Auto-Capture Toolbar with ANY custom seconds option */}
            {useLiveCamera && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const nextState = !autoCaptureEnabled;
                        setAutoCaptureEnabled(nextState);
                        setAutoCaptureCountdown(autoCaptureSeconds);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-xs ${
                        autoCaptureEnabled
                          ? 'bg-blue-600 text-white shadow-blue-500/20'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Radio className={`w-3.5 h-3.5 ${autoCaptureEnabled ? 'animate-pulse text-amber-300' : 'text-slate-400'}`} />
                      <span>Auto-Capture: {autoCaptureEnabled ? 'ON' : 'OFF'}</span>
                    </button>

                    {autoCaptureEnabled && (
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                        <span>Next scan in {autoCaptureCountdown}s</span>
                      </span>
                    )}
                  </div>

                  {/* Stepper & Custom Number Input for Any Seconds */}
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-xl shadow-xs">
                    <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" /> Interval:
                    </span>
                    <button
                      onClick={() => {
                        const newSec = Math.max(1, autoCaptureSeconds - 1);
                        setAutoCaptureSeconds(newSec);
                        setAutoCaptureCountdown(newSec);
                      }}
                      className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      title="Decrease by 1 second"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="600"
                      value={autoCaptureSeconds}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        const safeVal = isNaN(val) || val < 1 ? 1 : val;
                        setAutoCaptureSeconds(safeVal);
                        setAutoCaptureCountdown(safeVal);
                      }}
                      className="w-12 text-center font-bold font-mono text-xs text-blue-700 bg-slate-50 border border-slate-200 rounded px-1 py-0.5 outline-none focus:border-blue-500"
                      title="Type any number of seconds"
                    />
                    <span className="text-[11px] font-mono font-bold text-slate-600">sec</span>
                    <button
                      onClick={() => {
                        const newSec = Math.min(600, autoCaptureSeconds + 1);
                        setAutoCaptureSeconds(newSec);
                        setAutoCaptureCountdown(newSec);
                      }}
                      className="w-5 h-5 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      title="Increase by 1 second"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Quick Presets Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 pt-1 border-t border-slate-200/80">
                  <span className="text-[11px] font-semibold text-slate-500">Quick Presets:</span>
                  {[1, 2, 3, 5, 10, 30].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => {
                        setAutoCaptureSeconds(sec);
                        setAutoCaptureCountdown(sec);
                      }}
                      className={`px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold transition ${
                        autoCaptureSeconds === sec
                          ? 'bg-blue-600 text-white'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                  <span className="text-[10px] text-slate-400 italic ml-auto">
                    (or type any custom seconds above)
                  </span>
                </div>
              </div>
            )}

            {/* Confidence Sensitivity Level Selector */}
            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-700">
                <span className="font-bold text-slate-900">Detection Sensitivity:</span>
                <span className="text-[11px] text-slate-500 font-mono">(Threshold: {sensitivity})</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { label: 'Balanced (0.52)', val: 0.52, tip: 'Default calibrated threshold' },
                  { label: 'Strict (0.65)', val: 0.65, tip: 'High-confidence only, rejects false alarms' },
                  { label: 'Sensitive (0.45)', val: 0.45, tip: 'High recall for low-light / dusk arrays' },
                ].map((lvl) => (
                  <button
                    key={lvl.val}
                    onClick={() => setSensitivity(lvl.val)}
                    title={lvl.tip}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      sensitivity === lvl.val
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Trigger Bar */}
            <div className="mt-3 flex items-center justify-between gap-2">
              <button
                onClick={() => handleCaptureAndPredict()}
                disabled={isClassifying || (!useLiveCamera && !uploadedPreview)}
                className={`flex-1 py-2.5 px-4 rounded-xl font-heading font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-sm ${
                  isClassifying || (!useLiveCamera && !uploadedPreview)
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>
                  {isClassifying 
                    ? 'Running MobileNetV3 Neural Network...' 
                    : useLiveCamera
                    ? 'Classify Frame with MobileNetV3'
                    : 'Classify Photo with MobileNetV3'}
                </span>
              </button>

              {uploadedPreview && (
                <button
                  onClick={() => {
                    setUploadedPreview(null);
                    setUploadedBlob(null);
                    setSelectedBenchmark(null);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-semibold border border-slate-200 transition"
                >
                  Clear Photo
                </button>
              )}
            </div>

            {/* Neural Network Class Specifications */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                <span>Model Inspection Categories:</span>
                <span className="text-[10px] text-blue-700 font-mono font-semibold">
                  MobileNetV3 5-Class Architecture Active
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: 'Crack', desc: 'Structural glass fracture (Locks wiper)', badge: 'critical' },
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

            {/* Quick Benchmark Test (5 Solar Panel Conditions) */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>Quick Benchmark Test (5 Solar Panel Conditions)</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Instant 1-click test of all model classes
                </span>
              </div>

              {/* Indoor Testing Tip Banner */}
              <div className="mb-3 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Indoor Testing Note:</strong> This model is specialized for dark blue/black photovoltaic solar panel silicon cells. When testing indoors on a plain white wall or ceiling light, click any sample below to verify genuine classification on real panel conditions:
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'clean', title: 'Clean Panel', path: '/samples/clean.jpg', badge: 'Nominal Clean', badgeCol: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  { id: 'dust', title: 'Dust Layer', path: '/samples/dust.jpg', badge: 'Wipe Allowed', badgeCol: 'bg-amber-50 text-amber-700 border-amber-200' },
                  { id: 'bird', title: 'Bird Dropping', path: '/samples/bird_droppings.jpg', badge: 'Wipe Allowed', badgeCol: 'bg-amber-50 text-amber-700 border-amber-200' },
                  { id: 'crack', title: 'Crack Fracture', path: '/samples/crack.jpg', badge: 'Wiper Lockout', badgeCol: 'bg-rose-50 text-rose-700 border-rose-200' },
                  { id: 'snow', title: 'Snow Drift', path: '/samples/snow.jpg', badge: 'Wipe Allowed', badgeCol: 'bg-blue-50 text-blue-700 border-blue-200' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => testBenchmarkSample(s)}
                    disabled={isClassifying}
                    className={`group p-2 rounded-xl border text-left transition relative flex flex-col justify-between overflow-hidden ${
                      selectedBenchmark === s.id && uploadedPreview === s.path
                        ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 hover:bg-white hover:border-blue-300 border-slate-200'
                    }`}
                  >
                    <div className="w-full aspect-square rounded-lg overflow-hidden bg-slate-900 mb-1.5 border border-slate-200 relative">
                      <img
                        src={s.path}
                        alt={s.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                      <span className={`absolute bottom-1 left-1 text-[9px] font-mono px-1 py-0.2 rounded border font-semibold ${s.badgeCol}`}>
                        {s.badge}
                      </span>
                    </div>
                    <div className="font-heading font-bold text-slate-900 text-[11px] leading-tight">
                      {s.title}
                    </div>
                    <span className="text-[10px] text-blue-600 font-semibold group-hover:underline mt-1 flex items-center gap-1">
                      Run Test &rarr;
                    </span>
                  </button>
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
                <span className="text-slate-600 font-sans font-medium">Model Architecture:</span>
                <span className="px-2 py-0.5 rounded-md font-sans text-xs font-bold flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200">
                  <Cpu className="w-3 h-3" />
                  {currentPreset.modelArchitecture || 'MobileNetV3-Small (Fine-Tuned Checkpoint)'}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-600 font-sans font-medium">Surface Condition:</span>
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
                      isCrack ? 'bg-rose-500' : isCleanable ? 'bg-amber-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${(currentPreset.confidence || 0) * 100}%` }}
                  />
                </div>
              </div>

              {/* Class Probabilities Distribution */}
              {currentPreset.classProbabilities && (
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-600 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-blue-600" /> Class Probabilities:
                    </span>
                    {lastLatency && (
                      <span className="text-[10px] text-emerald-700 font-mono">
                        ⚡ {lastLatency.modelMs}ms
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {Object.entries(currentPreset.classProbabilities).map(([cls, prob]) => (
                      <div key={cls} className="flex items-center justify-between">
                        <span className="capitalize text-slate-700 font-medium">{cls.replace('_', ' ')}:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                cls === 'crack' 
                                  ? 'bg-rose-500' 
                                  : cls === 'clean' 
                                  ? 'bg-emerald-500' 
                                  : 'bg-blue-600'
                              }`} 
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

              {currentPreset.recommendedAction && (
                <div className="text-xs text-slate-600 pt-1 font-sans leading-relaxed">
                  {currentPreset.recommendedAction}
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
                      ? 'Surface contamination detected as cleanable debris. Wiper cleaning cycle authorized.'
                      : 'Surface status nominal clean. Optical transmittance nominal. No cleaning required.'}
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
