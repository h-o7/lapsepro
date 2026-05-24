import React from 'react';
import { Video } from 'lucide-react';

interface NavbarProps {
  totalFrames: number;
  onShowDemo: () => void;
  onClearAll: () => void;
}

export default function Navbar({ totalFrames, onShowDemo, onClearAll }: NavbarProps) {
  return (
    <header className="border-b border-zinc-800 bg-[#0A0A0A] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4" id="app-header">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-900/30">
          <Video className="w-5 h-5" id="logo-icon" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight uppercase text-zinc-100 font-sans">
            LapsePro <span className="text-zinc-500 font-normal">v1.1</span>
          </h1>
          <p className="text-[10px] text-zinc-400 font-mono tracking-wide uppercase">High-Speed Raw Sequence Compiler</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono">
        <div className="bg-zinc-900/80 border border-zinc-850 px-3 py-1.5 rounded-lg text-zinc-400">
          Project: <span className="text-blue-400 font-semibold">{totalFrames > 0 ? "Active_Sequence_Studio" : "Unloaded_Workspace"}</span>
        </div>

        {totalFrames === 0 && (
          <button
            onClick={onShowDemo}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-900/10"
            id="demo-load-btn"
            title="Load demo images to immediately see the timelapse player in action"
          >
            <span>Load Demo Sequence</span>
          </button>
        )}
        
        {totalFrames > 0 && (
          <button
            onClick={onClearAll}
            className="px-3.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-950/80 text-red-300 border border-red-900/40 font-semibold transition"
            id="clear-all-btn"
          >
            Clear Workspace
          </button>
        )}

        <div className="flex items-center gap-2 border-l border-zinc-800 pl-4 h-5">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] uppercase font-bold text-zinc-300 tracking-wider">GPU ACCELERATED</span>
        </div>
      </div>
    </header>
  );
}
