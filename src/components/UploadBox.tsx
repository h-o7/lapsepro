import React, { useRef, useState } from 'react';
import { Upload, FileDown, Layers, Image as ImageIcon } from 'lucide-react';

interface UploadBoxProps {
  onFilesSelected: (files: FileList | File[]) => void;
  isProcessing: boolean;
  processingProgress: number;
  processingTotal: number;
}

export default function UploadBox({
  onFilesSelected,
  isProcessing,
  processingProgress,
  processingTotal,
}: UploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  const triggerPicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Drag & Drop Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerPicker}
        className={`w-full min-h-[300px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition relative overflow-hidden ${
          isDragActive
            ? 'border-blue-500 bg-blue-950/20'
            : 'border-zinc-800 bg-[#0A0A0A] hover:bg-zinc-900/40 hover:border-[#1E1E1E]'
        }`}
        id="drag-drop-zone"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.webp,.avif,.nef,.dng,.cr2,.arw"
          onChange={handleFileChange}
          className="hidden"
          id="file-element-input"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center gap-4" id="processing-loader">
            <div className="relative flex items-center justify-center">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-zinc-900 border-t-blue-500"></div>
              <Layers className="absolute w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">
                Processing Photo Sequence ({processingProgress} / {processingTotal})
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Decoding raw sensor files & extracting high-res EXIF JPEGs...
              </p>
            </div>
            
            {/* ProgressBar */}
            <div className="w-64 bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800 mt-2">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(processingProgress / processingTotal) * 100}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-zinc-900 rounded-full text-blue-400 border border-zinc-800 shadow-inner group-hover:scale-105 transition-transform">
              <Upload className="w-8 h-8" />
            </div>
            
            <div>
              <p className="text-base font-semibold text-zinc-200">
                Drag &amp; drop photos here or <span className="text-blue-400 underline">browse files</span>
              </p>
              <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                Supports Standard JPEGs (<span className="text-zinc-300">.jpg, .jpeg</span>), PNGs/WebPs/AVIFs (<span className="text-zinc-300">.png, .webp, .avif</span>), and RAW Images (<span className="text-zinc-300">.nef, .dng, .cr2, .arw</span>).
              </p>
            </div>

            <div className="flex items-center gap-6 mt-4 p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 text-left">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <ImageIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Auto Preview decoders</span>
              </div>
              <div className="h-4 w-px bg-zinc-800"></div>
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <FileDown className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>EXIF meta timestamps read</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="p-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl space-y-2">
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">How RAW NEF files are processed:</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          RAW images (like Nikon <code className="text-zinc-300 px-1 py-0.5 bg-zinc-850 rounded text-[11px] font-mono">.nef</code> and Adobe <code className="text-zinc-300 px-1 py-0.5 bg-zinc-850 rounded text-[11px] font-mono">.dng</code>) store uncompressed sensor data. When loaded, this app executes an ultra-fast raw-scanner routine directly in your memory space to extract its high-resolution camera-recorded companion JPEG and reconstructs the real Exif metadata. No files are uploaded to any server – everything runs securely in your Electron-ready environment.
        </p>
      </div>
    </div>
  );
}
