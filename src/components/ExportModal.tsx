import React, { useEffect, useState, useRef } from 'react';
import { TimelapseFrame, ExportSettings } from '../types';
import { Play, Pause, XCircle, HardDriveDownload, Sparkles, CheckCircle2, Video, FileArchive, ShieldAlert } from 'lucide-react';
import JSZip from 'jszip';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  frames: TimelapseFrame[];
  settings: ExportSettings;
}

export default function ExportModal({ isOpen, onClose, frames, settings }: ExportModalProps) {
  const [exporting, setExporting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  if (!isOpen) return null;

  // Compile frames according to speed multiplier
  const filteredFrames: TimelapseFrame[] = [];
  for (let i = 0; i < frames.length; i += settings.speedMultiplier) {
    filteredFrames.push(frames[i]);
  }

  const startCompilation = async () => {
    setErrorMsg(null);
    setComplete(false);
    setExporting(true);
    setProgress(0);
    setTotal(filteredFrames.length);

    try {
      if (settings.exportFormat === 'frames-zip') {
        await compileZip();
      } else {
        await compileVideo();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An unexpected compilation error occurred.');
      setExporting(false);
    }
  };

  // 1. Compile Sequenced JPG files inside a ZIP
  const compileZip = async () => {
    const zip = new JSZip();
    const canvas = document.createElement('canvas');
    canvas.width = settings.resolutionWidth;
    canvas.height = settings.resolutionHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not instantiate hidden canvas 2D rendering context.');

    for (let i = 0; i < filteredFrames.length; i++) {
      setProgress(i + 1);
      const frame = filteredFrames[i];
      
      // Draw image onto canvas with scaling to make standard fit
      await drawFrameToHiddenCanvas(frame, canvas, ctx);
      
      // Convert canvas drawing to high-quality JPEG blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.90); // 90% quality
      });

      if (blob) {
        // Pad sequence numbering: e.g. frame_0001.jpg
        const paddedIndex = String(i + 1).padStart(4, '0');
        zip.file(`frame_${paddedIndex}.jpg`, blob);
      }
      
      // Yield to main thread periodically so browser UI doesn't lock up
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
      // Scale zip compression progress as well
      // For now progress represents frames processed
    });

    const url = URL.createObjectURL(zipBlob);
    setDownloadUrl(url);
    setComplete(true);
    setExporting(false);
  };

  // 2. Compile Real WebM video recording via Canvas + MediaRecorder
  const compileVideo = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = settings.resolutionWidth;
    canvas.height = settings.resolutionHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not instantiate video capture canvas rendering context.');

    // Append canvas to DOM off-screen to prevent Chromium/Electron from optimizing away the painting pipeline for detached canvases
    canvas.style.position = 'fixed';
    canvas.style.top = '-9999px';
    canvas.style.left = '-9999px';
    canvas.style.visibility = 'hidden';
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    try {
      // Find supported type (excluding audio codec 'opus' to prevent encoder stalls on canvas-only silent streams)
      const typesSupported = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ];
      let selectedMimeType = '';
      for (const t of typesSupported) {
        if (MediaRecorder.isTypeSupported(t)) {
          selectedMimeType = t;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error('No compatible browser movie encoder formats (WebM/VP8/VP9) were found.');
      }

      // Capture standard frame stream
      const fps = settings.frameRate;
      const stream = canvas.captureStream(fps);
      const recordedChunks: Blob[] = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps high-quality WebM bitrate
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      // Returns a promise that resolves when the recorder finishes
      const recordingPromise = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
          resolve(videoBlob);
        };
      });

      // Warm up and start recording
      mediaRecorder.start();
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Draw first frame immediately to establish the stream keyframe
      if (filteredFrames.length > 0) {
        await drawFrameToHiddenCanvas(filteredFrames[0], canvas, ctx);
      }

      // Iterate through frames synchronously, drawing at frame step intervals
      for (let i = 0; i < filteredFrames.length; i++) {
        setProgress(i + 1);
        const frame = filteredFrames[i];
        
        await drawFrameToHiddenCanvas(frame, canvas, ctx);
        
        // Wait dynamic timeout matching precise FPS duration to allow MediaRecorder ingestion of frame state
        await new Promise((resolve) => setTimeout(resolve, 1000 / fps));
      }

      // Hold last frame slightly to satisfy final keyframes
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Stop and compile
      mediaRecorder.stop();
      const movieBlob = await recordingPromise;

      const url = URL.createObjectURL(movieBlob);
      setDownloadUrl(url);
      setComplete(true);
      setExporting(false);
    } finally {
      // Clean up the DOM-appended canvas safely
      if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  };

  // Shared Helper to render a frame onto a destination canvas, scaling or cropping correctly
  const drawFrameToHiddenCanvas = (frame: TimelapseFrame, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = frame.previewUrl;
      img.onload = () => {
        // Draw deep graphite background in case of aspect differences so it looks perfect
        ctx.fillStyle = '#0a0a0c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const imgW = img.naturalWidth || frame.width || 1;
        const imgH = img.naturalHeight || frame.height || 1;
        const targetRatio = imgW / imgH;

        let renderW = canvas.width;
        let renderH = canvas.width / targetRatio;

        if (renderH > canvas.height) {
          renderH = canvas.height;
          renderW = canvas.height * targetRatio;
        }

        const xOffset = (canvas.width - renderW) / 2;
        const yOffset = (canvas.height - renderH) / 2;

        ctx.drawImage(img, xOffset, yOffset, renderW, renderH);
        resolve();
      };
      img.onerror = () => {
        // Just fill simple color if image loading fails to avoid blocking compile
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fca5a5';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Error drawing ${frame.name}`, canvas.width / 2, canvas.height / 2);
        resolve();
      };
    });
  };

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    
    // Choose name based on format
    const nameSlug = 'timelapse_compulation';
    if (settings.exportFormat === 'frames-zip') {
      a.download = `${nameSlug}_frames.zip`;
    } else {
      a.download = `${nameSlug}.webm`;
    }
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" id="export-modal-backdrop">
      <div className="bg-[#0A0A0A] border border-zinc-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl shadow-black/85" id="export-modal-box">
        
        {/* Header */}
        <div className="bg-zinc-950/80 px-6 py-4.5 border-b border-zinc-850 flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Timelapse Compiler</span>
          {!exporting && (
            <button onClick={onClose} className="p-1.5 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-lg transition-all" id="close-modal-x-btn">
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-center">

          {/* Core Configuration details summary */}
          {!exporting && !complete && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-850 text-left">
                <h3 className="text-xs font-bold text-zinc-450 uppercase tracking-wide mb-3 font-mono">Export Summary</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-zinc-900/60 pb-1.5 flex-row">
                    <dt className="text-zinc-500">Resolution:</dt>
                    <dd className="text-zinc-200 font-bold">{settings.resolutionWidth}x{settings.resolutionHeight} px</dd>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900/60 pb-1.5 flex-row">
                    <dt className="text-zinc-550">Aspect Ratio:</dt>
                    <dd className="text-zinc-200 uppercase font-bold">{settings.aspectRatio}</dd>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900/60 pb-1.5 flex-row">
                    <dt className="text-zinc-550">Frame Rate:</dt>
                    <dd className="text-zinc-200 font-bold">{settings.frameRate} FPS</dd>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900/60 pb-1.5 flex-row">
                    <dt className="text-zinc-550">Speed multiplier:</dt>
                    <dd className="text-zinc-200 font-bold">{settings.speedMultiplier}x</dd>
                  </div>
                  <div className="flex justify-between pt-1.5 col-span-2 flex-row">
                    <dt className="text-zinc-500 font-sans italic">Total frames to write:</dt>
                    <dd className="text-blue-400 font-bold">{filteredFrames.length} items</dd>
                  </div>
                </dl>
              </div>

              {/* Format warning/notes */}
              <div className="p-4 bg-blue-950/20 border border-blue-900/40 rounded-xl flex items-start gap-2.5 text-left text-xs text-zinc-400 leading-normal">
                <Sparkles className="w-4 h-4 text-blue-405 flex-shrink-0 mt-0.5" />
                <p>
                  Your compilation will be scaled to exactly <span className="text-blue-300 font-mono font-bold">{settings.resolutionWidth}x{settings.resolutionHeight} px</span>.
                  {settings.exportFormat === 'frames-zip'
                    ? ' This will compile each static photo, save it to high-quality JPG, and pack them sequentially in a structure matching professional editing tools.'
                    : ' This will compile the frames in canvas and render an HTML5 compatible high-bitrate WebM movie.'}
                </p>
              </div>

              <button
                onClick={startCompilation}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg hover:shadow-blue-900/20 active:scale-[0.98]"
              >
                Begin Compiling Sequence
              </button>
            </div>
          )}

          {/* Compilation in progress layout */}
          {exporting && (
            <div className="space-y-5 py-4">
              <div className="relative flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-zinc-850 border-t-blue-500 font-sans"></div>
                {settings.exportFormat === 'frames-zip' ? (
                  <FileArchive className="absolute w-6 h-6 text-blue-400" />
                ) : (
                  <Video className="absolute w-6 h-6 text-blue-400 animate-pulse" />
                )}
              </div>

              <div className="space-y-1.5">
                <p className="text-xs uppercase tracking-wider font-bold text-zinc-300 font-mono">Compiling &amp; Encoding Sequence...</p>
                <p className="text-xs text-zinc-400 font-mono">
                  Writing frame {progress} / {total} ({Math.round((progress / total) * 100)}%)
                </p>
              </div>

              {/* Range progress bar */}
              <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-850">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-150"
                  style={{ width: `${(progress / total) * 100}%` }}
                ></div>
              </div>

              <p className="text-[10px] text-zinc-550 font-mono leading-normal">
                Please hold. Do not close your browser panel or refresh the page.
              </p>
            </div>
          )}

          {/* Complete View */}
          {complete && (
            <div className="space-y-5 py-4 animate-scale-up">
              <div className="mx-auto p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-full w-fit">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <p className="text-md font-bold text-emerald-400 uppercase tracking-wider font-mono">Compilation Successful!</p>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                  {settings.exportFormat === 'frames-zip'
                    ? 'Your zipped archive of perfectly sized sequential JPG frames has been successfully built.'
                    : 'Your high-bitrate WebM timelapse video compilation has been encoded successfully.'}
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2.5 max-w-xs mx-auto font-mono">
                <button
                  onClick={handleDownload}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg hover:shadow-emerald-900/20 flex items-center justify-center gap-2 active:scale-[0.98]"
                  id="final-download-trigger"
                >
                  <HardDriveDownload className="w-4 h-4" />
                  Save Compilation As...
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-zinc-900 border border-zinc-805 hover:bg-zinc-800 text-zinc-300 text-xs font-bold rounded-xl transition-all"
                >
                  Close Manager
                </button>
              </div>
            </div>
          )}

          {/* Error messages if compilation fails */}
          {errorMsg && (
            <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl text-left space-y-3">
              <div className="flex items-center gap-2 text-rose-455 font-semibold text-xs font-mono uppercase tracking-wide">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>Compilation Interrupted</span>
              </div>
              <p className="text-xs text-rose-300/90 leading-normal font-mono bg-rose-955/10 p-2.5 rounded border border-rose-955/35">
                {errorMsg}
              </p>
              <button
                onClick={startCompilation}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white text-xs font-bold rounded-lg transition"
              >
                Retry Compile
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
