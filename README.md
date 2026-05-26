# 🎬 LapsePro Studio

LapsePro Studio is a powerful, privacy-first, offline-ready desktop and web-based timelapse creator and video compiler. Built with **React 19**, **Vite**, **TypeScript**, and **Tailwind CSS**, and wrapped in an **Electron** desktop container, it allows you to bundle high-resolution photo folders directly into beautifully-timed, visually stunning cinematic motion sequences entirely within your local browser sandbox or desktop environment.

No servers, no queues, and **zero data uploads**—your original high-resolution photos never leave your machine.

---

## ✨ Features

*   **🔒 Complete Local Privacy**: Image parsing, rendering, and video assembly run entirely locally in the client-side browser context or the desktop app sandbox using standard canvas capturing APIs.
*   **📐 Resolution Safety (Up to 4K)**: Automatically manages high-resolution inputs with an built-in 4K capper and even-pixel resizing algorithm to prevent hardware video encoder crashes.
*   **🏎️ Custom Speed Engine**: Adjust frame rate limits (FPS) and multiplier speeds (frame skipping or repeating) to match your desired timeline pace.
*   **🎯 Multiple Aspect Ratios & Resizing**: Supports **Original (Match Source)**, **16:9 Cinema Wide**, **4:3 Vintage Film**, **1:1 Social Square**, and **9:16 Portrait Reel**, keeping your original dimensions cleanly centered.
*   **🎛️ Three-Tier Visual Bitrate Profiles**:
    *   **Pristine / Lossless (95 Mbps Master)**: Absolute highest-fidelity. Designed for photographers who want the absolute closest match to original RAW/JPEG image detail.
    *   **High Q (45 Mbps Studio)**: Balanced full-HD/4K production quality with minimal compression artifacts.
    *   **Standard (5 Mbps Compact)**: Ideal for fast uploads, social media sharing, and lightweight email attachments.
*   **📼 Flexible Formats**: Render and download directly to lossless-bounded **WebM**, container-wrapped **MP4**, or dynamic sequential **Frame ZIPs**.
*   **🎞️ Interactive Timeline & Viewer**: Drag-and-drop upload sequences, preview individual frames, inspect metadata, zoom to check alignment, and play the timeline before initiating final exports.

---

## 🛠️ Installation & Setup

Ensure you have [Node.js (v18+)](https://nodejs.org/) installed before proceeding.

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/lapsepro-studio.git
cd lapsepro-studio
npm install
```

### 2. Run in Development Mode
You can spin up LapsePro Studio either in the standard web-browser interface or inside the native Electron desktop application frame:

*   **Launch in Web Browser**:
    ```bash
    npm run dev
    ```
    This launches a hot-reloading development server available at `http://localhost:3000`.

*   **Launch in Electron Desktop App**:
    ```bash
    npm run dev:electron
    ```
    This directly opens the application window locally on your desktop for native-feel interactions.

### 3. Build & Local Preview (Web Output)
If you want to construct the optimized web assets and verify performance:
```bash
npm run build
npm run preview
```

---

## 📦 Packaging Instructions (Desktop Apps)

LapsePro Studio uses `electron-builder` to package the web build into standalone, zero-dependency desktop executable installers.

To package LapsePro Studio for your operating system:

```bash
# This compiles the web bundle and creates the platform-specific desktop installers
npm run package
```

### What Happens During Packaging?
1. The app compiles and optimizations the React workspace into directory `dist/`.
2. `electron-builder` wraps the `dist/` directory and active electron module files (`main.js`, `package.json`).
3. Binary executables are placed in the newly created **`/release`** directory.

### Build Targets Configurations:
The configuration specified in `package.json` compiles the following assets inside the `/release` directory based on your current operating system:
*   **macOS**: Generates a disk image platform mount (`.dmg`) target under app ID `com.lapsepro.studio`.
*   **Windows**: Generates a zero-install, completely self-contained desktop executable (`.exe` Portable).
*   **Linux**: Generates a standard portable visual app format package (`.AppImage`).

---

## 🚀 How to Use the Program (Step-by-Step)

Follow these simple steps to construct high-quality timelapse clips from your pictures:

### Step 1: Upload Your Workspace Photos
Drag and drop your sorted sequence images directly into the centered **Upload Box** or click on it to use your system's native file explorer. 
* *Tip*: Ensure all frames are named sequentially (e.g., `img_001.jpg`, `img_002.jpg`) so that the timeline arranges them in order automatically.

### Step 2: Manage the Timeline and Preview
Once imported, use the bottom **Timeline Slider** to scan through individual frames. You can click on specific frames to preview details or hit the **Spacebar / Play Button** to watch the video playback animation in real-time.

### Step 3: Choose Aspect Ratio and Dimensions
In the left **Control Panel**, you can:
* Select **Original (Match Source)** to automatically adjust render dimensions to your image format.
* Switch to other presets like **16:9** or **1:1**.
* Set frame rates dynamically (e.g., `24 FPS`, `30 FPS`, `60 FPS`).

### Step 4: Configure Output and Encoding Quality
1. Verify the output format in the **Export Format** section: **WebM** (optimized browser video), **MP4** (universal compatibility), or **Frame ZIP** (perfect for sequential archival repackaging).
2. For video outputs, choose your **Video Encoding Quality**:
    * Tap **Pristine** for maximum visual detail with a **95 Mbps** bitrate limit.
    * Tap **High Q** for a robust **45 Mbps** studio-grade bitrate.
    * Tap **Standard** for a lighter weight **5 Mbps** sharing profile.

### Step 5: Render and Download the Timelapse Video
1. Click the large, green **Export Timelapse** button on the bottom layout. 
2. Inside the rendering pop-up window, click **Start Export Process**.
3. Watch the applet draw and compile every image in lock-step onto the video stream.
4. Once completed, the download starts automatically, saving your crystal-clear timelapse video directly to your computer!

---

## 🎨 Tech Stack & Libraries

*   **Vite & React**: Lightning-fast compilation and highly interactive user components.
*   **Tailwind CSS**: Crisp interface layouts, dark slate backgrounds, and custom UI transitions.
*   **Lucide React**: Clean vector-drawn UI iconography.
*   **JSZip**: Fast in-memory sequence compression for offline ZIP packaging.
*   **Electron & Electron-Builder**: Simplified native desktop framing and compiler tools.
