import React, { useState, useEffect } from 'react';
import { TimelapseFrame, ExportSettings } from './types';
import Navbar from './components/Navbar';
import UploadBox from './components/UploadBox';
import Timeline from './components/Timeline';
import TimelapsePlayer from './components/TimelapsePlayer';
import ControlPanel from './components/ControlPanel';
import ExportModal from './components/ExportModal';
import { parseUploadFile } from './utils/photoParser';
import { Layers, Image as ImageIcon, ChevronRight, HelpCircle, HardDrive, Trash2 } from 'lucide-react';

const INITIAL_SETTINGS: ExportSettings = {
  frameRate: 15,
  resolutionWidth: 1920,
  resolutionHeight: 1080,
  aspectRatio: '16:9',
  speedMultiplier: 1,
  loop: true,
  exportFormat: 'webm',
};

export default function App() {
  const [frames, setFrames] = useState<TimelapseFrame[]>([]);
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [settings, setSettings] = useState<ExportSettings>(INITIAL_SETTINGS);

  // File loading states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingTotal, setProcessingTotal] = useState(0);

  // Export overlay state
  const [isExportOpen, setIsExportOpen] = useState(false);

  // 1. Playback Timer: Advances frame based on Frame Rate
  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;

    const intervalTime = 1000 / settings.frameRate;
    const timer = setInterval(() => {
      setSelectedFrameIndex((prev) => {
        if (prev === null) return 0;
        const next = prev + 1;
        if (next >= frames.length) {
          if (settings.loop) {
            return 0;
          } else {
            setIsPlaying(false);
            return prev;
          }
        }
        return next;
      });
    }, intervalTime);

    // Guard clean-up
    return () => clearInterval(timer);
  }, [isPlaying, frames.length, settings.frameRate, settings.loop]);

  // 2. Memory Clean Up: Revoke object URLs on unmount of component
  useEffect(() => {
    return () => {
      frames.forEach((f) => {
        if (f.previewUrl) {
          URL.revokeObjectURL(f.previewUrl);
        }
      });
    };
  }, []);

  // 3. Handle File uploads
  const handleFilesSelected = async (fileList: FileList | File[]) => {
    const list = Array.from(fileList);
    if (list.length === 0) return;

    setIsProcessing(true);
    setProcessingTotal(list.length);
    setProcessingProgress(0);

    const loadedFrames: TimelapseFrame[] = [];

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      try {
        const metadata = await parseUploadFile(file);
        
        loadedFrames.push({
          id: Math.random().toString(36).substring(2, 11),
          name: file.name,
          size: file.size,
          type: file.type || 'image/jpeg',
          lastModified: file.lastModified,
          previewUrl: metadata.previewUrl || '',
          status: 'ready',
          width: metadata.width,
          height: metadata.height,
          dateTaken: metadata.dateTaken,
        });
      } catch (err: any) {
        console.error('Frame decode failed:', file.name, err);
        // Load item anyway with 'error' status so the user can see faulty cells on timeline
        loadedFrames.push({
          id: Math.random().toString(36).substring(2, 11),
          name: file.name,
          size: file.size,
          type: file.type || 'image/jpeg',
          lastModified: file.lastModified,
          previewUrl: '',
          status: 'error',
          errorMessage: err.message || 'Corrupt format',
        });
      }
      setProcessingProgress((prev) => prev + 1);
    }

    setFrames((prev) => {
      const newSequence = [...prev, ...loadedFrames];
      if (selectedFrameIndex === null && newSequence.length > 0) {
        setSelectedFrameIndex(0);
      }
      return newSequence;
    });
    
    setIsProcessing(false);
  };

  // 4. Clear/Delete frames safely
  const handleRemoveFrame = (id: string) => {
    setFrames((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      const updated = prev.filter((f) => f.id !== id);
      
      // Keep selected index in bound
      if (updated.length === 0) {
        setSelectedFrameIndex(null);
        setIsPlaying(false);
      } else if (selectedFrameIndex !== null && selectedFrameIndex >= updated.length) {
        setSelectedFrameIndex(updated.length - 1);
      }
      return updated;
    });
  };

  const handleClearAll = () => {
    frames.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setFrames([]);
    setSelectedFrameIndex(null);
    setIsPlaying(false);
  };

  // 5. Sequence Sorting mechanisms
  const handleSortByFilename = (direction: 'asc' | 'desc') => {
    setFrames((prev) => {
      const sorted = [...prev].sort((a, b) => {
        return direction === 'asc'
          ? a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
          : b.name.localeCompare(a.name, undefined, { numeric: true, sensitivity: 'base' });
      });
      return sorted;
    });
    setSelectedFrameIndex(0);
  };

  const handleSortByDate = (direction: 'asc' | 'desc') => {
    setFrames((prev) => {
      const sorted = [...prev].sort((a, b) => {
        const timeA = a.dateTaken?.getTime() || a.lastModified;
        const timeB = b.dateTaken?.getTime() || b.lastModified;
        return direction === 'asc' ? timeA - timeB : timeB - timeA;
      });
      return sorted;
    });
    setSelectedFrameIndex(0);
  };

  const handleReverseAll = () => {
    setFrames((prev) => [...prev].reverse());
    setSelectedFrameIndex(0);
  };

  // 6. Generate Stunning Astronomical Landscape demo sequence
  const handleShowDemo = async () => {
    setIsProcessing(true);
    const numFrames = 30;
    setProcessingTotal(numFrames);
    setProcessingProgress(0);

    const demoFrames: TimelapseFrame[] = [];

    // Helper to linear blend Hex colors
    const blendColors = (c1: string, c2: string, ratio: number): string => {
      const r1 = parseInt(c1.substring(1, 3), 16);
      const g1 = parseInt(c1.substring(3, 5), 16);
      const b1 = parseInt(c1.substring(5, 7), 16);

      const r2 = parseInt(c2.substring(1, 3), 16);
      const g2 = parseInt(c2.substring(3, 5), 16);
      const b2 = parseInt(c2.substring(5, 7), 16);

      const r = Math.round(r1 + (r2 - r1) * ratio).toString(16).padStart(2, '0');
      const g = Math.round(g1 + (g2 - g1) * ratio).toString(16).padStart(2, '0');
      const b = Math.round(b1 + (b2 - b1) * ratio).toString(16).padStart(2, '0');

      return `#${r}${g}${b}`;
    };

    for (let i = 0; i < numFrames; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d')!;

      const ratio = i / (numFrames - 1);

      // Sky gradient shifting from starlight to magnificent dawn
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (ratio < 0.4) {
        const localRatio = ratio / 0.4;
        skyGrad.addColorStop(0, '#020206');
        skyGrad.addColorStop(0.5, '#060a1e');
        skyGrad.addColorStop(1, blendColors('#080f29', '#2d083c', localRatio));
      } else {
        const localRatio = (ratio - 0.4) / 0.6;
        skyGrad.addColorStop(0, blendColors('#060a1e', '#00254d', localRatio));
        skyGrad.addColorStop(0.5, blendColors('#2d083c', '#d35400', localRatio));
        skyGrad.addColorStop(1, blendColors('#f39c12', '#ffd32a', localRatio));
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Rotating starry orbits
      if (ratio < 0.6) {
        ctx.fillStyle = `rgba(255, 255, 255, ${1.0 - ratio / 0.6})`;
        for (let s = 0; s < 100; s++) {
          const orbitRadius = ((s * 17) % 700) + 100;
          const initialAngle = s * 0.15;
          const currentAngle = initialAngle + ratio * 0.4; // Star rotation flow
          
          const starX = canvas.width * 0.5 + Math.cos(currentAngle) * orbitRadius;
          const starY = canvas.height * 0.2 + Math.sin(currentAngle) * orbitRadius * 0.4;

          if (starX >= 0 && starX <= canvas.width && starY >= 0 && starY <= canvas.height) {
            ctx.beginPath();
            ctx.arc(starX, starY, 1 + (s % 2), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Sunrise glowing sun
      if (ratio > 0.3) {
        const sunPos = (ratio - 0.3) / 0.7;
        const sunX = canvas.width * 0.5;
        const sunY = canvas.height * 0.78 - sunPos * 300;

        // Aureole Glow
        const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 180 * sunPos);
        glow.addColorStop(0, 'rgba(255, 243, 205, 1.0)');
        glow.addColorStop(0.3, 'rgba(243, 156, 18, 0.5)');
        glow.addColorStop(1, 'rgba(230, 126, 34, 0.0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 180 * sunPos, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mountain silhouetted horizons with depth
      ctx.fillStyle = '#05060d';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let x = 0; x <= canvas.width; x += 15) {
        const y = canvas.height * 0.65 + Math.sin(x * 0.003 + 2.5) * 60 + Math.cos(x * 0.009) * 12;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Front hill layer
      ctx.fillStyle = '#010205';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height);
      for (let x = 0; x <= canvas.width; x += 8) {
        const y = canvas.height * 0.8 + Math.cos(x * 0.002) * 90 + Math.sin(x * 0.007) * 18;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(canvas.width, canvas.height);
      ctx.closePath();
      ctx.fill();

      // Overlay text label mimicking a camera EXIF tag
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '13px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`DEMO SEQUENCER • SUNRISE_0${30 + i}.NEF`, canvas.width - 40, canvas.height - 40);

      // Save JPEG Blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95);
      });

      const url = URL.createObjectURL(blob);
      
      demoFrames.push({
        id: `demo-${i}`,
        name: `sunrise_frame_0${i + 130}.nef`,
        size: blob.size,
        type: 'image/jpeg',
        lastModified: Date.now() - (30 - i) * 60 * 1000,
        previewUrl: url,
        status: 'ready',
        width: 1920,
        height: 1080,
        dateTaken: new Date(2026, 4, 24, 5, i * 6, 0), // Increments by 6 mins
      });

      setProcessingProgress((prev) => prev + 1);
    }

    setFrames(demoFrames);
    setSelectedFrameIndex(0);
    setIsProcessing(false);
  };  return (
    <div className="min-h-screen bg-[#060606] text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white antialiased" id="studio-root-container">
      
      {/* Navbar component */}
      <Navbar
        totalFrames={frames.length}
        onShowDemo={handleShowDemo}
        onClearAll={handleClearAll}
      />

      {/* Main split work space */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="main-workbench">
        
        {/* Left column: Upload picker and compilation Controls */}
        <section className="lg:col-span-4 flex flex-col gap-6 w-full" id="left-sidebar-controls">
          {frames.length === 0 ? (
            <UploadBox
              onFilesSelected={handleFilesSelected}
              isProcessing={isProcessing}
              processingProgress={processingProgress}
              processingTotal={processingTotal}
            />
          ) : (
            <ControlPanel
              settings={settings}
              onChangeSettings={setSettings}
              onStartExport={() => setIsExportOpen(true)}
              framesCount={frames.length}
            />
          )}

          {/* Instructions card */}
          <div className="bg-[#0A0A0A] border border-zinc-805 p-5 rounded-2xl flex items-start gap-3 shadow-xl">
            <Layers className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">Production Workflow</h4>
              <p className="text-[11px] text-zinc-400 leading-normal mt-1">
                Drag on additional raw photo items anytime to insert them directly into the current sequence. Use the timeline tool to inspect frame counts. You can sort items chronologically leveraging original EXIF timestamp tags.
              </p>
            </div>
          </div>
        </section>

        {/* Right column: Dynamic player + timeline manager */}
        <section className="lg:col-span-8 flex flex-col gap-6 w-full" id="right-workspace-content">
          {frames.length > 0 ? (
            <>
              {/* Output Preview Screen */}
              <TimelapsePlayer
                frames={frames}
                currentFrameIndex={selectedFrameIndex !== null ? selectedFrameIndex : 0}
                isPlaying={isPlaying}
                onSetFrameIndex={setSelectedFrameIndex}
                onSetPlaying={setIsPlaying}
                settings={settings}
              />

              {/* Advanced Timeline grid */}
              <Timeline
                frames={frames}
                selectedFrameIndex={selectedFrameIndex}
                onSelectFrame={setSelectedFrameIndex}
                onRemoveFrame={handleRemoveFrame}
                onSortByFilename={handleSortByFilename}
                onSortByDate={handleSortByDate}
                onReverseAll={handleReverseAll}
              />

              {/* Fast Drag additions zone if frames have already been uploaded */}
              <div className="p-4.5 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/20 flex flex-col xs:flex-row items-center justify-between gap-3 text-xs shadow-md">
                <span className="text-zinc-400 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  Have more photos or other raw frames to add?
                </span>
                
                <button
                  onClick={() => {
                    const input = document.getElementById('file-element-input');
                    if (input) input.click();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-zinc-200 transition-all border border-zinc-800 hover:border-zinc-700 hover:text-white font-mono text-xs font-bold shadow-sm"
                >
                  Append Images
                </button>
              </div>
            </>
          ) : (
            <div className="bg-[#0A0A0A] border border-zinc-800 rounded-2xl p-12 text-center h-[460px] flex flex-col items-center justify-center gap-5 shadow-xl">
              <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-450 shadow-inner rounded-2xl">
                <Layers className="w-8 h-8 animate-pulse text-blue-400" />
              </div>
              <div className="max-w-md">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">No Active Sequence</h3>
                <p className="text-xs text-zinc-455 leading-relaxed mt-2 font-mono">
                  Start by dragging some photos into the upload box on the left, or trigger the instant sunrise sequencer to trial our high-resolution compiler and explore the playback settings.
                </p>
              </div>
              <button
                onClick={handleShowDemo}
                className="mt-2 text-xs uppercase tracking-wider font-mono font-bold px-5 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-all active:scale-95 shadow-md shadow-blue-900/10"
              >
                Load Demo Sunrise Sequence
              </button>
            </div>
          )}
        </section>

      </main>

      {/* Export manager compilation modal dialogue */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        frames={frames}
        settings={settings}
      />

    </div>
  );
}
