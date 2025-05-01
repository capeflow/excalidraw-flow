# Excalidraw → Animated GIF Pipeline

_Last updated: {{date}}

## Goal

1. Ingest an `.excalidraw` scene file (JSON).
2. Detect every dashed **arrow/line** element.
3. Animate the marching dashes so that they appear to move along the arrow path.
4. Encode the animation to a GIF (expandable to other formats later).
5. Provide a React-based UI that shows:
   - Validation summary (`✅ 4 dashed arrows found`, `⚠️ 0 dashed arrows found`, etc.)
   - Live progress/ETA while exporting.
   - Preview + download link for the resulting GIF.

## High-Level Architecture

```
App.tsx  ─┐                ┌─►  animator/gifEncoder.ts
           │                │
           │                ├─►  animator/frameRenderer.ts    (canvg)
           │                │
DropZone ──┼──► parser.ts ───┤
           │                │
Progress  ─┘                └─►  ui/Preview.tsx
```

## Detailed Steps

### 1. Parse + Validate (parser.ts)

1. `JSON.parse` the file.
2. Narrow to `elements` where `type === "arrow" || type === "line"` **and** `strokeStyle === "dashed"`.
3. Output:
   ```ts
   interface ParsedScene {
     elements: ExcalidrawElement[];
     appState: AppState;
     dashedArrows: ExcalidrawElement[]; // dashed only
   }
   ```
4. Throw descriptive errors if schema is wrong.

### 2. Generate SVG Snapshot (sceneToSVG.ts)

Use `exportToSvg()` from `@excalidraw/excalidraw` – **once**. After that we mutate only `stroke-dashoffset` on the cloned SVG DOM so we don't pay export cost per frame.

### 3. Frame Rendering (animator/frameRenderer.ts)

We render each frame in memory:

1. Compute `dashLength = sum(strokeDasharray)` for every dashed path (once at start).
2. For `frameIndex ∈ [0 .. nFrames)`
   ```ts
   const t = frameIndex / nFrames;
   path.style.strokeDashoffset = dashLength * t;
   ```
3. Render SVG → Canvas via **canvg** (pure JS, no CORS issues):
   ```ts
   const canvas = createCanvas(width, height);
   const ctx = canvas.getContext('2d');
   await Canvg.fromString(ctx, svg.outerHTML).render();
   ```
4. Return the `ImageData` or `<canvas>`.

Rationale for **canvg** over `html2canvas`:
- `html2canvas` rasterises DOM but struggles with inline SVG filters and produced black screens earlier.
- canvg converts the SVG string straight into a `<canvas>` 100% deterministically.

### 4. GIF Encoding (animator/gifEncoder.ts)

1. Create `new GIF({ workerScript, workers: 2, quality, width, height, repeat: 0 })`.
2. `gif.addFrame(canvas, { copy: true, delay })` per frame.
3. Hook into `gif.on('progress', cb)` to compute ETA.
4. On `finished`, resolve `Blob` → Object URL.

### 5. React UI Workflow

1. **DropZone** → calls `parseScene()`.
2. Show validation summary (number of dashed arrows, warnings).
3. On "Animate Arrows"
   1. Disable controls.
   2. Kick `generateGif(scene, opts)` which returns an async iterator:
      ```ts
      for await (const p of generateGif(scene)) setProgress(p);
      ```
   3. Render `ProgressBar` with percentage & ETA.
4. When done, show `<img src={gifUrl}/>` + download link.

### 6. Configuration / Extensibility

```ts
interface AnimationOptions {
  fps: number;           // default 12
  duration: number;      // sec, default 2
  resolution: number;    // scale factor, default 1 (original SVG size)
}
```

Future: different element types (e.g. animated dashed rectangles), export MP4 via ffmpeg.wasm, per-arrow colour animation, CLI-batch mode.

## Dependencies

| Package                | Reason                              |
| ---------------------- | ----------------------------------- |
| `@excalidraw/excalidraw` | SVG export + type defs             |
| `canvg`                | SVG → Canvas rasterising            |
| `gif.js.optimized`     | Efficient GIF encoding in WebWorker |
| `react-dropzone`       | Drag-and-drop file upload           |
| `zod` *(optional)*     | Runtime schema validation           |

Dev-only:
- `@types/canvg`, `@types/gif.js.optimized` (declare module if missing)

## Milestones

1. **MVP** (✓ parsing, ✓ dashed arrow detection, ✓ GIF generation without black frames).
2. Progress/ETA + validation UI.
3. Configurable FPS/duration.
4. Fancy export formats & batch CLI.

---

_This plan is meant to evolve. Feel free to comment inline or open issues for refinements._ 