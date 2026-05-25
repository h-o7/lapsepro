import React from 'react';
import { ExportSettings } from '../types';
import { Video, Sliders, Play, Settings, Save, FileArchive, Info } from 'lucide-react';

interface ControlPanelProps {
  settings: ExportSettings;
  onChangeSettings: (settings: ExportSettings) => void;
  onStartExport: () => void;
  framesCount: number;
}

const ASPECT_RATIOS: { value: ExportSettings['aspectRatio']; label: string; aspect: string }[] = [
  { value: 'original', label: 'Match Source', aspect: 'Auto' },
  { value: '16:9', label: 'Widescreen (16:9)', aspect: '16:9' },
  { value: '4:3', label: 'Classic (4:3)', aspect: '4:3' },
  { value: '1:1', label: 'Square (1:1)', aspect: '1:1' },
  { value: '9:16', label: 'Vertical (9:16)', aspect: '9:16' },
];

const RESOLUTION_PRESETS = [
  { label: '4K Ultra HD', width: 3840, height: 2160 },
  { label: '1080p Full HD', width: 1920, height: 1080 },
  { label: '720p HD Ready', width: 1280, height: 720 },
  { label: 'Square Canvas', width: 1080, height: 1080 },
];

export default function ControlPanel({
  settings,
  onChangeSettings,
  onStartExport,
  framesCount,
}: ControlPanelProps) {
  const updateSetting = <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
    const updated = { ...settings, [key]: value };
    
    // Automatically keep resolution width/height in sync if aspect ratio changes
    if (key === 'aspectRatio' && value !== 'original') {
      const parts = (value as string).split(':').map(Number);
      if (parts.length === 2) {
        const [wRatio, hRatio] = parts;
        // Default base height to 1080p standard
        updated.resolutionHeight = 1080;
        updated.resolutionWidth = Math.round((1080 / hRatio) * wRatio);
      }
    }
    onChangeSettings(updated);
  };

  const selectResolution = (width: number, height: number, label: string) => {
    let idealAspect: ExportSettings['aspectRatio'] = '16:9';
    if (width === height) idealAspect = '1:1';
    
    onChangeSettings({
      ...settings,
      resolutionWidth: width,
      resolutionHeight: height,
      aspectRatio: idealAspect,
    });
  };

  return (
    <div className="bg-[#0A0A0A] border border-zinc-800 rounded-2xl p-6 flex flex-col gap-6 shadow-xl" id="control-panel-settings">
      
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-zinc-850 pb-3">
        <Sliders className="w-4 h-4 text-blue-400" />
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Export Settings</h2>
      </div>

      {/* Frame Rate Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm text-zinc-300">Frame Rate</label>
          <span className="px-2 py-0.5 bg-blue-950/40 text-blue-400 font-mono text-xs font-bold rounded border border-blue-900/40">
            {settings.frameRate} FPS
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={60}
          value={settings.frameRate}
          onChange={(e) => updateSetting('frameRate', parseInt(e.target.value, 10))}
          className="w-full accent-blue-500 h-1 bg-zinc-800 rounded-lg cursor-pointer appearance-none"
          id="framerate-slider"
        />
        <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
          <span>1 FPS</span>
          <span>24 FPS (Cinema)</span>
          <span>30 FPS (Standard)</span>
          <span>60 FPS</span>
        </div>
      </div>

      {/* Speed Multiplier section */}
      <div className="space-y-3 pt-1 border-t border-zinc-850/40">
        <div className="flex justify-between items-center bg-transparent mt-2">
          <label className="text-sm text-zinc-300">Timelapse Speed Factor</label>
          <span className="px-2 py-0.5 bg-zinc-900 text-zinc-300 font-mono text-xs rounded border border-zinc-800">
            {settings.speedMultiplier === 1 ? '1x (Normal)' : `${settings.speedMultiplier}x`}
          </span>
        </div>
        
        {/* Horizontal choice segments */}
        <div className="grid grid-cols-5 gap-1.5 p-1 bg-black/40 rounded-lg border border-zinc-850">
          {[1, 2, 3, 4, 8].map((factor) => {
            const isSelected = settings.speedMultiplier === factor;
            return (
              <button
                key={factor}
                onClick={() => updateSetting('speedMultiplier', factor)}
                className={`py-1 text-center font-mono text-xs rounded transition-all font-semibold ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
                }`}
                title={factor > 1 ? `Skips frames to speed up rendering by ${factor}x` : 'Processes every frame sequentially'}
              >
                {factor}x
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-zinc-500 leading-normal">
          {settings.speedMultiplier > 1 
            ? `Speeding up: App will sample every ${settings.speedMultiplier}th frame, skipping others.`
            : 'Smooth sequence: Processing every uploaded photo frame in correct order.'
          }
        </p>
      </div>

      {/* Aspect Ratio Config */}
      <div className="space-y-3 pt-1 border-t border-zinc-850/40">
        <label className="text-sm text-zinc-300 block">Output Aspect Ratio</label>
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-1.5">
          {ASPECT_RATIOS.map((item) => {
            const isSelected = settings.aspectRatio === item.value;
            return (
              <button
                key={item.value}
                onClick={() => updateSetting('aspectRatio', item.value)}
                className={`py-2 px-1 rounded-lg border text-center transition ${
                  isSelected
                    ? 'bg-blue-950/20 border-blue-600/70 text-blue-300 font-medium shadow-inner'
                    : 'border-zinc-800 bg-zinc-950/30 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <p className="text-[11px] truncate leading-none font-semibold">{item.label.split(' ')[0]}</p>
                <p className="text-[9px] text-zinc-500 font-mono mt-1">{item.aspect}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Export Specifications */}
      <div className="space-y-3 pt-1 border-t border-zinc-850/40">
        <label className="text-sm text-zinc-300 block">Resolution Presets</label>
        <div className="grid grid-cols-2 gap-2">
          {RESOLUTION_PRESETS.map((res) => {
            const isSelected = settings.resolutionWidth === res.width && settings.resolutionHeight === res.height;
            return (
              <button
                key={res.label}
                onClick={() => selectResolution(res.width, res.height, res.label)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  isSelected
                    ? 'border-blue-600 bg-blue-950/15 text-blue-450'
                    : 'border-zinc-800 bg-zinc-950/20 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <p className="text-xs font-semibold">{res.label}</p>
                <p className="text-[10px] text-zinc-500 font-mono mt-1">
                  {res.width} × {res.height} px
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Export Format choosing */}
      <div className="space-y-3 pt-1 border-t border-zinc-850/40">
        <label className="text-sm text-zinc-300 block">Export Format</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => updateSetting('exportFormat', 'mp4')}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition text-left ${
              settings.exportFormat === 'mp4'
                ? 'border-blue-600 bg-blue-950/15 text-blue-300'
                : 'border-zinc-800 bg-zinc-950/20 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <Video className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold animate-pulse">MP4 Video</p>
              <p className="text-[9px] text-zinc-500">Universal H.264</p>
            </div>
          </button>

          <button
            onClick={() => updateSetting('exportFormat', 'webm')}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition text-left ${
              settings.exportFormat === 'webm'
                ? 'border-blue-600 bg-blue-950/15 text-blue-300'
                : 'border-zinc-800 bg-zinc-950/20 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <Video className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold">WebM Movie</p>
              <p className="text-[9px] text-zinc-500">Fast HTML5 web</p>
            </div>
          </button>

          <button
            onClick={() => updateSetting('exportFormat', 'frames-zip')}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition text-left ${
              settings.exportFormat === 'frames-zip'
                ? 'border-blue-600 bg-blue-950/15 text-blue-300'
                : 'border-zinc-800 bg-zinc-950/20 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <FileArchive className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold">Sequenced ZIP</p>
              <p className="text-[9px] text-zinc-500">For video editors</p>
            </div>
          </button>
        </div>
      </div>

      {/* Export button */}
      <div className="pt-4 border-t border-zinc-850">
        <button
          onClick={onStartExport}
          disabled={framesCount === 0}
          className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg hover:shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-30 disabled:hover:bg-blue-600 disabled:pointer-events-none"
          id="export-trigger-btn"
        >
          <Save className="w-5 h-5" />
          <span>GENERATE &amp; SAVE</span>
        </button>
        <p className="text-[10px] text-zinc-500 mt-2.5 text-center leading-normal font-mono">
          {framesCount === 0 
            ? 'Import some photographs or trigger the demo sequencer to enable export.'
            : `Compiles ${Math.ceil(framesCount / settings.speedMultiplier)} active frames at ${settings.resolutionWidth}x${settings.resolutionHeight} px.`
          }
        </p>
      </div>

    </div>
  );
}
