import { Injectable, inject } from '@angular/core';
import { HttpClient         } from '@angular/common/http';
import { Observable         } from 'rxjs';
import { ConfigService      } from '../../__Utils/ConfigService/config.service';
import { BaseService        } from '../../__baseService/base.service';
import { OCRResponse        } from '../OCRService/ocr.service';

// ─────────────────────────────────────────────────────────────────────────────
// SHARED TYPES
// Centralised here so every backend adapter and the unified renderer
// speak the same language.  When you standardise the Node.js escape-time
// JSON later, only the adapter functions at the bottom need to change —
// the renderer and zoom logic stay untouched.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Canonical point format used internally by the Angular layer.
 * Backends may return a different wire format; convert with an adapter
 * (see _adaptRemotePoints) before passing to the renderer.
 *
 * x, y        — pixel coordinates (0…width-1, 0…height-1)
 * value       — escape iteration count  (escape-time fractals)
 *               OR a fixed sentinel (IFS/scatter fractals, see FERN_SENTINEL)
 * kind        — drives the renderer's coloring branch
 */
export interface FractalPoint {
  x     : number;
  y     : number;
  value : number;          // iteration count or FERN_SENTINEL
}

/**
 * Sentinel value used for Barnsley-Fern / IFS scatter points.
 * The renderer sees this and switches to the fern color palette
 * instead of the escape-time polynomial.
 * Value chosen to be clearly outside the [0…maxIterations] range.
 */
export const FERN_SENTINEL = -1;

/** Complex-plane view window — drives both generation and zoom math. */
export interface FractalBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/** Options passed to the unified canvas renderer. */
export interface FractalRenderOptions {
  width         : number;          // canvas width  in pixels  (default 800)
  height        : number;          // canvas height in pixels  (default 600)
  maxIterations : number;          // only meaningful for escape-time fractals
}

/** Parameters for the unified zoom function. */
export interface ZoomParams {
  /** Current view window before zoom is applied. */
  currentBounds  : FractalBounds;
  /**
   * Zoom factor per step.
   * > 1 → zoom IN  (narrow the window around the center)
   * < 1 → zoom OUT (widen the window)
   * A typical UI step is 1.5 or 2.0.
   */
  factor         : number;
  /**
   * Complex-plane coordinate to zoom towards / away from.
   * If omitted the current center of the bounds is used.
   */
  centerReal?    : number;
  centerImag?    : number;
}

export enum FractalType {
  MANDELBROT     = 1,
  JULIA          = 2,
  BARNSLEY_FERN  = 3,
}

// Default canvas dimensions — single source of truth
const CANVAS_WIDTH  = 800;
const CANVAS_HEIGHT = 600;

// Default complex-plane bounds per fractal type
const DEFAULT_BOUNDS_MANDELBROT : FractalBounds = { xMin: -2.0, xMax: 1.0,  yMin: -1.2, yMax: 1.2 };
const DEFAULT_BOUNDS_JULIA      : FractalBounds = { xMin: -1.5, xMax: 1.5,  yMin: -1.5, yMax: 1.5 };


@Injectable({ providedIn: 'root' })
export class ComputerVisionService extends BaseService {

  private readonly http                  = inject(HttpClient);
  private readonly _configService        = inject(ConfigService);
  private readonly __baseUrlCPP          = `${this._configService.getConfigValue('baseUrlNetCoreCPPEntry')}api/computervision/`;
  private readonly __baseUrlNodeJsOpenCv = `${this._configService.getConfigValue('baseUrlNodeJsOcr')}api/OpenCv/`;

  //////////////////////////////////////////////////////////////
  // --- OPENCV -- SHAPES -- CPP LOGIC ---
  //////////////////////////////////////////////////////////////

  _OpenCv_GetAppVersion(): Observable<string> {
    return this.http.get<string>(`${this.__baseUrlCPP}GetAppVersion`, this.HTTPOptions_Text);
  }

  _OpenCv_GetAPIVersion(): Observable<string> {
    return this.http.get<string>(`${this.__baseUrlCPP}GetAPIVersion`, this.HTTPOptions_Text);
  }

  _OpenCv_GetCPPSTDVersion(): Observable<string> {
    return this.http.get<string>(`${this.__baseUrlCPP}GetCPPSTDVersion`, this.HTTPOptions_Text);
  }

  _OpenCv_CPP_uploadBase64Image(base64Image: string): Observable<OCRResponse> {
    return this.http.post<OCRResponse>(`${this.__baseUrlCPP}uploadOpenCv`, { base64Image });
  }

  //////////////////////////////////////////////////////////////
  // --- OPENCV -- SHAPES -- TYPESCRIPT
  //////////////////////////////////////////////////////////////

  _OpenCv_ts_detectShapes(imageElement: HTMLImageElement): string[] {
    const shapes: string[] = [];
    const cv = (window as any).cv;
    if (!cv) return ['OpenCV not loaded'];

    const src       = cv.imread(imageElement);
    const gray      = new cv.Mat();
    const edges     = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    cv.Canny(gray, edges, 50, 150, 3, false);

    const contours  = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    for (let i = 0; i < contours.size(); i++) {
      const approx = new cv.Mat();
      cv.approxPolyDP(contours.get(i), approx, 0.04 * cv.arcLength(contours.get(i), true), true);
      if      (approx.rows === 3) shapes.push('[Triangle]');
      else if (approx.rows === 4) shapes.push('[Rectangle/Square]');
      else if (approx.rows  >  4) shapes.push('[Circle]');
      approx.delete();
    }
    src.delete(); gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
    return shapes;
  }

  uploadBase64ImageNodeJs(base64Image: string): Observable<OCRResponse> {
    return this.http.post<OCRResponse>(`${this.__baseUrlNodeJsOpenCv}uploadCV`, { base64Image });
  }


  // ═══════════════════════════════════════════════════════════════════════════
  //  UNIFIED FRACTAL RENDERING LAYER
  //  ─────────────────────────────────────────────────────────────────────────
  //  Two public functions cover every fractal / every backend:
  //
  //    applyZoomToBounds   — pure math, no canvas, no HTTP
  //    renderPointsToBlob  — pure rendering, no math, no HTTP
  //
  //  Backend-specific methods (TS pure math, Node.js, J2SE, C++) live below
  //  and all funnel into renderPointsToBlob for the final canvas step.
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * UNIFIED ZOOM MATH
   * ─────────────────
   * Pure coordinate transform — no canvas, no HTTP, no fractal math.
   * Call this whenever the user zooms in or out; pass the returned bounds
   * back to the fractal generator as the new view window.
   *
   * Works identically for Mandelbrot and Julia (both are escape-time
   * fractals defined on the complex plane).
   * Do NOT call for Barnsley Fern — zoom does not apply to IFS attractors.
   *
   * @param params  ZoomParams — see interface definition above
   * @returns       New FractalBounds narrowed/widened around the target point
   *
   * Example — zoom in 2× towards the center of the current view:
   *   const newBounds = this.applyZoomToBounds({
   *     currentBounds : { xMin: -2, xMax: 1, yMin: -1.2, yMax: 1.2 },
   *     factor        : 2.0,
   *   });
   */
  applyZoomToBounds(params: ZoomParams): FractalBounds {
    const { currentBounds, factor } = params;

    // Default zoom center: midpoint of the current view window
    const centerReal = params.centerReal ?? (currentBounds.xMin + currentBounds.xMax) / 2;
    const centerImag = params.centerImag ?? (currentBounds.yMin + currentBounds.yMax) / 2;

    // Half-widths of the current window
    const halfW = (currentBounds.xMax - currentBounds.xMin) / 2;
    const halfH = (currentBounds.yMax - currentBounds.yMin) / 2;

    // Divide half-widths by the factor:
    //   factor > 1 → smaller half-width → zoom IN
    //   factor < 1 → larger  half-width → zoom OUT
    const newHalfW = halfW / factor;
    const newHalfH = halfH / factor;

    return {
      xMin: centerReal - newHalfW,
      xMax: centerReal + newHalfW,
      yMin: centerImag - newHalfH,
      yMax: centerImag + newHalfH,
    };
  }

  /**
   * UNIFIED CANVAS RENDERER
   * ───────────────────────
   * Accepts any array of FractalPoint (escape-time OR IFS scatter) and
   * renders it to a PNG Blob via an offscreen HTML canvas.
   *
   * Coloring branches:
   *   point.value === FERN_SENTINEL  → fern/IFS ochre palette
   *   point.value  <  maxIterations  → escape-time smooth polynomial
   *   point.value === maxIterations  → inside the set → black
   *
   * This is the ONLY place in the service that touches a canvas or
   * produces a Blob.  Every backend path must convert its data to
   * FractalPoint[] first (use _adaptRemotePoints for remote JSON),
   * then call this function.
   *
   * @param points   Canonical FractalPoint array
   * @param options  Canvas size + maxIterations
   * @returns        Observable<Blob> PNG image
   */
  renderPointsToBlob(
    points  : FractalPoint[],
    options : FractalRenderOptions
  ): Observable<Blob> {
    return new Observable<Blob>((observer) => {
      try {
        const { width, height, maxIterations } = options;

        const canvas  = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { observer.error(new Error('Could not get canvas context')); return; }

        // Black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        const imageData = ctx.createImageData(width, height);
        const data      = imageData.data;

        // Pre-fill alpha to fully opaque — avoids per-pixel alpha writes
        for (let i = 3; i < data.length; i += 4) data[i] = 255;

        for (const point of points) {
          // Bounds check — silently skip out-of-range points from any backend
          if (point.x < 0 || point.x >= width || point.y < 0 || point.y >= height) continue;

          const idx = (point.y * width + point.x) * 4;
          let r: number, g: number, b: number;

          if (point.value === FERN_SENTINEL) {
            // ── IFS / Barnsley Fern branch ──────────────────────────────
            // value carries no iteration information; color is determined
            // by y position, which is encoded in the pixel coordinate.
            // We re-derive a normalised [0,1] height from the pixel y so
            // the palette reads naturally root-to-tip.
            const normY  = 1 - (point.y / height);   // 0 = bottom, 1 = top
            const t      = 0.25 + normY * 0.45;       // keep in ochre band
            r = Math.min(255, Math.floor(9   * (1 - t) * t * t * t         * 255 * 3.5));
            g = Math.min(255, Math.floor(15  * (1 - t) * (1 - t) * t * t   * 255 * 2.0));
            b = Math.min(255, Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255 * 1.2));
          } else {
            // ── Escape-time branch (Mandelbrot / Julia) ──────────────────
            const color = this._getFractalColorRGB(point.value, maxIterations);
            r = color.r; g = color.g; b = color.b;
          }

          data[idx    ] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          // [idx + 3] already 255 from pre-fill
        }

        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) { observer.next(blob); observer.complete(); }
          else        observer.error(new Error('renderPointsToBlob: canvas.toBlob failed'));
        }, 'image/png');

      } catch (e) { observer.error(e); }
    });
  }

  /**
   * REMOTE JSON ADAPTER
   * ───────────────────
   * Converts the wire format returned by Node.js and J2SE backends
   * into the canonical FractalPoint[] expected by renderPointsToBlob.
   *
   * Current wire format (identical for both backends):
   *   { x: number, y: number, intensity: number }
   *
   * Mapping rules
   * ─────────────
   * Barnsley Fern (IFS scatter):
   *   intensity is always 200 — a fixed "hit" marker, not a real value.
   *   → value = FERN_SENTINEL  (tells renderer to use the fern palette)
   *
   * Escape-time fractals (Mandelbrot / Julia — future backends):
   *   intensity encodes the iteration count scaled to [0…255].
   *   → value = round(intensity * maxIterations / 255)
   *
   * NOTE: when you add escape-time fractals to Node.js / J2SE and
   * standardise the JSON, you may want to change the wire format to
   * carry `iteration` directly instead of `intensity` to avoid the
   * lossy round-trip through [0…255].  Only this adapter needs to
   * change when that happens — renderPointsToBlob is unaffected.
   *
   * @param raw             Raw JSON array from the backend
   * @param fractalType     Determines which mapping rule to apply
   * @param maxIterations   Used only for escape-time back-calculation
   */
  private _adaptRemotePoints(
    raw           : { x: number; y: number; intensity: number }[],
    fractalType   : FractalType,
    maxIterations : number
  ): FractalPoint[] {
    return raw.map(p => {
      if (fractalType === FractalType.BARNSLEY_FERN) {
        // IFS scatter — intensity is a fixed sentinel, not a real value
        return { x: p.x, y: p.y, value: FERN_SENTINEL };
      }
      // Escape-time — back-calculate iteration from the 0-255 intensity
      const iter = p.intensity === 0
        ? maxIterations
        : Math.round((p.intensity * maxIterations) / 255);
      return { x: p.x, y: p.y, value: iter };
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SHARED COLOR HELPER
  // Used by the TS pure-math engine only — renderPointsToBlob has its own
  // inline copy so it doesn't depend on `this` context in the pixel loop.
  // ─────────────────────────────────────────────────────────────────────────

  public _getFractalColorRGB(
    iteration     : number,
    maxIterations : number
  ): { r: number; g: number; b: number } {
    if (iteration === maxIterations) return { r: 0, g: 0, b: 0 };
    const t = iteration / maxIterations;
    return {
      r: Math.floor(9   * (1 - t) * t * t * t         * 255),
      g: Math.floor(15  * (1 - t) * (1 - t) * t * t   * 255),
      b: Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255),
    };
  }


  // ═══════════════════════════════════════════════════════════════════════════
  //  TYPESCRIPT PURE-MATH ENGINE
  //  Each generator runs the fractal math locally, builds FractalPoint[],
  //  then calls renderPointsToBlob — same final step as remote backends.
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Router — dispatches to the correct TS generator by fractal type.
   * p_bounds is optional; when omitted each generator uses its default view.
   */
  GetFractal_Typescript(
    p_maxIterations : number,
    p_realPart      : number,
    p_imagPart      : number,
    p_fractalType   : number,
    p_bounds?       : FractalBounds
  ): Observable<Blob> {
    switch (p_fractalType) {
      case FractalType.MANDELBROT   : return this._TS_Mandelbrot(p_maxIterations, p_bounds);
      case FractalType.JULIA        : return this._TS_Julia(p_maxIterations, p_realPart, p_imagPart, p_bounds);
      case FractalType.BARNSLEY_FERN: return this._TS_BarnsleyFern(p_maxIterations);
      default                       : return this._TS_Julia(p_maxIterations, p_realPart, p_imagPart, p_bounds);
    }
  }

  // ── Mandelbrot ─────────────────────────────────────────────────────────────
  GetFractal_Typescript_Manderblot(
    p_maxIterations : number,
    p_bounds?       : FractalBounds
  ): Observable<Blob> {
    return this._TS_Mandelbrot(p_maxIterations, p_bounds);
  }

  private _TS_Mandelbrot(
    p_maxIterations : number,
    p_bounds?       : FractalBounds
  ): Observable<Blob> {
    const bounds = p_bounds ?? DEFAULT_BOUNDS_MANDELBROT;
    const points = this._runEscapeTimeEngine(
      p_maxIterations,
      bounds,
      (cx, cy) => {
        let zr = 0, zi = 0, i = 0;
        while (i < p_maxIterations) {
          if (zr * zr + zi * zi > 4.0) break;
          const nr = zr * zr - zi * zi + cx;
          const ni = 2 * zr * zi + cy;
          zr = nr; zi = ni; i++;
        }
        return i;
      }
    );
    return this.renderPointsToBlob(points, {
      width: CANVAS_WIDTH, height: CANVAS_HEIGHT, maxIterations: p_maxIterations
    });
  }

  // ── Julia ──────────────────────────────────────────────────────────────────
  GetFractal_Typescript_Julia(
    p_maxIterations : number,
    p_realPart      : number,
    p_imagPart      : number,
    p_bounds?       : FractalBounds
  ): Observable<Blob> {
    return this._TS_Julia(p_maxIterations, p_realPart, p_imagPart, p_bounds);
  }

  private _TS_Julia(
    p_maxIterations : number,
    p_realPart      : number,
    p_imagPart      : number,
    p_bounds?       : FractalBounds
  ): Observable<Blob> {
    const bounds = p_bounds ?? DEFAULT_BOUNDS_JULIA;
    const points = this._runEscapeTimeEngine(
      p_maxIterations,
      bounds,
      (zx, zy) => {
        let zr = zx, zi = zy, i = 0;
        while (i < p_maxIterations) {
          if (zr * zr + zi * zi > 4.0) break;
          const nr = zr * zr - zi * zi + p_realPart;
          const ni = 2 * zr * zi + p_imagPart;
          zr = nr; zi = ni; i++;
        }
        return i;
      }
    );
    return this.renderPointsToBlob(points, {
      width: CANVAS_WIDTH, height: CANVAS_HEIGHT, maxIterations: p_maxIterations
    });
  }

  /**
   * SHARED ESCAPE-TIME ENGINE
   * ─────────────────────────
   * Iterates every pixel in the canvas, applies the formula callback,
   * and returns a FractalPoint[] ready for renderPointsToBlob.
   *
   * This replaces _renderTSCanvasPipeline — the formula is still a
   * callback so Mandelbrot and Julia stay separate, but the output is
   * now a data array instead of going straight to the canvas, making
   * it consistent with the remote-backend path.
   */
  private _runEscapeTimeEngine(
    maxIterations : number,
    bounds        : FractalBounds,
    formula       : (x: number, y: number) => number
  ): FractalPoint[] {
    const width  = CANVAS_WIDTH;
    const height = CANVAS_HEIGHT;
    const xStep  = (bounds.xMax - bounds.xMin) / width;
    const yStep  = (bounds.yMax - bounds.yMin) / height;

    const t0     = performance.now();
    const points : FractalPoint[] = new Array(width * height);

    let idx = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        points[idx++] = {
          x,
          y,
          value: formula(bounds.xMin + x * xStep, bounds.yMin + y * yStep),
        };
      }
    }

    console.log(`[TS Engine] ${width * height} points in ${(performance.now() - t0).toFixed(2)}ms`);
    return points;
  }

  // ── Barnsley Fern ──────────────────────────────────────────────────────────
  GetFractal_Typescript_BarnsleyFern(p_maxIterations: number): Observable<Blob> {
    return this._TS_BarnsleyFern(p_maxIterations);
  }

  private _TS_BarnsleyFern(p_maxIterations: number): Observable<Blob> {
    const width   = CANVAS_WIDTH;
    const height  = CANVAS_HEIGHT;
    const padding = 20;

    // IFS attractor bounds (real plane) — matches Java renderer
    const xMin = -2.182, xMax = 2.655;
    const yMin =  0.0,   yMax = 9.96;

    const toPixelX = (ax: number) =>
      Math.round(padding + ((ax - xMin) / (xMax - xMin)) * (width  - 2 * padding));
    const toPixelY = (ay: number) =>
      Math.round(height - padding - ((ay - yMin) / (yMax - yMin)) * (height - 2 * padding));

    // IFS transforms: [a, b, c, d, e, f, probability]
    const transforms: [number, number, number, number, number, number, number][] = [
      [  0.00,  0.00,  0.00,  0.16, 0.00, 0.00, 0.01 ],
      [  0.85,  0.04, -0.04,  0.85, 0.00, 1.60, 0.85 ],
      [  0.20, -0.26,  0.23,  0.22, 0.00, 1.60, 0.07 ],
      [ -0.15,  0.28,  0.26,  0.24, 0.00, 0.44, 0.07 ],
    ];

    const thresholds: number[] = [];
    let cumulative = 0;
    for (const t of transforms) { cumulative += t[6]; thresholds.push(cumulative); }

    // Pixel visit map — tracks first-visit normY per pixel to avoid bloom
    const pixelNormY = new Float32Array(width * height).fill(-1);

    const numPoints = Math.max(150_000, Math.min(p_maxIterations * 20, 1_000_000));
    const t0        = performance.now();

    let ax = 0, ay = 0;
    // Warm-up: let the orbit settle onto the attractor
    for (let w = 0; w < 20; w++) {
      const roll = Math.random();
      let ti = 0;
      while (ti < thresholds.length - 1 && roll > thresholds[ti]) ti++;
      const [a, b, c, d, e, f] = transforms[ti];
      const nx = a * ax + b * ay + e;
      ax = c * ax + d * ay + f; ay = nx; // BUG-FIX NOTE: intentional swap removed — see below
      ax = nx; ay = c * ax + d * ay + f;
    }

    // Correct warm-up (avoids the variable-swap mistake above)
    ax = 0; ay = 0;
    for (let w = 0; w < 20; w++) {
      const roll = Math.random();
      let ti = 0;
      while (ti < thresholds.length - 1 && roll > thresholds[ti]) ti++;
      const [ta, tb, tc, td, te, tf] = transforms[ti];
      const nx = ta * ax + tb * ay + te;
      const ny = tc * ax + td * ay + tf;
      ax = nx; ay = ny;
    }

    for (let i = 0; i < numPoints; i++) {
      const roll = Math.random();
      let ti = 0;
      while (ti < thresholds.length - 1 && roll > thresholds[ti]) ti++;
      const [ta, tb, tc, td, te, tf] = transforms[ti];
      const nx = ta * ax + tb * ay + te;
      const ny = tc * ax + td * ay + tf;
      ax = nx; ay = ny;

      const px = toPixelX(ax);
      const py = toPixelY(ay);
      if (px < 0 || px >= width || py < 0 || py >= height) continue;

      const bufIdx = py * width + px;
      if (pixelNormY[bufIdx] < 0) {
        pixelNormY[bufIdx] = Math.min(1, Math.max(0, (ay - yMin) / (yMax - yMin)));
      }
    }

    // Convert pixelNormY buffer into canonical FractalPoint[]
    // value = FERN_SENTINEL signals the renderer to use the fern palette.
    // We encode normY in a separate field by temporarily repurposing the
    // pixel y coordinate approach inside renderPointsToBlob (renderer
    // re-derives normY from point.y / height, which is equivalent).
    const points: FractalPoint[] = [];
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        if (pixelNormY[py * width + px] >= 0) {
          points.push({ x: px, y: py, value: FERN_SENTINEL });
        }
      }
    }

    console.log(`[TS Barnsley Fern] ${numPoints} IFS iterations → ${points.length} pixels in ${(performance.now() - t0).toFixed(2)}ms`);

    return this.renderPointsToBlob(points, {
      width, height, maxIterations: p_maxIterations
    });
  }


  // ═══════════════════════════════════════════════════════════════════════════
  //  NODE.JS BACKEND
  // ═══════════════════════════════════════════════════════════════════════════

  GetFractal_NodeJs(
    p_maxIterations : number,
    p_fractalType   : FractalType,
    zoomInOut       : boolean,
    zoomStep        : number
  ): Observable<Blob> {
    console.info(`[Node.js] fractal=${p_fractalType} zoom=${zoomInOut} step=${zoomStep}`);
    switch (p_fractalType) {
      case FractalType.BARNSLEY_FERN: return this._NodeJs_BarnsleyFern(p_maxIterations);
      default                       : return this._NodeJs_BarnsleyFern(p_maxIterations);
    }
  }

  private _NodeJs_BarnsleyFern(p_maxIterations: number): Observable<Blob> {
    const url = `${this._configService.getConfigValue('baseUrlNodeJsOcr')}api/fractal/leaf`;
    return this._fetchAndRender(url, FractalType.BARNSLEY_FERN, p_maxIterations);
  }


  // ═══════════════════════════════════════════════════════════════════════════
  //  J2SE / SPRING BOOT BACKEND
  // ═══════════════════════════════════════════════════════════════════════════

  //
  GetFractal_j2se(
      p_maxIterations : number,
      p_fractalType   : number,
      p_bounds?       : FractalBounds   // NEW — optional zoom bounds from applyZoomToBounds()
    ): Observable<Blob> {
      console.info(`[J2SE] fractal=${p_fractalType}`);
      switch (p_fractalType) {
        case FractalType.MANDELBROT   : return this._J2SE_Mandelbrot(p_maxIterations, p_bounds);
        case FractalType.JULIA        : return this._J2SE_Julia(p_maxIterations, p_bounds);
        case FractalType.BARNSLEY_FERN: return this._J2SE_BarnsleyFern(p_maxIterations);
        default:
          console.warn(`[J2SE] Unknown fractal type ${p_fractalType} — falling back to Julia`);
          return this._J2SE_Julia(p_maxIterations, p_bounds);
      }
  }

  //
  private _J2SE_Mandelbrot(
    p_maxIterations : number,
    p_bounds?       : FractalBounds
  ): Observable<Blob> {
    const url = this._buildJ2SEUrl(FractalType.MANDELBROT, p_bounds);
    return this._fetchAndRender(url, FractalType.MANDELBROT, p_maxIterations);
  }

  //
  private _J2SE_Julia(
    p_maxIterations : number,
    p_bounds?       : FractalBounds
  ): Observable<Blob> {
    const url = this._buildJ2SEUrl(FractalType.JULIA, p_bounds);
    return this._fetchAndRender(url, FractalType.JULIA, p_maxIterations);
  }

  //
  private _J2SE_BarnsleyFern(p_maxIterations: number): Observable<Blob> {
    const url = this._buildJ2SEUrl(FractalType.BARNSLEY_FERN);
    return this._fetchAndRender(url, FractalType.BARNSLEY_FERN, p_maxIterations);
  }

  // ── ADD: URL builder — single place where J2SE query params are assembled ────
  //
  // Translates FractalBounds (from applyZoomToBounds) into the query params
  // the Spring Boot endpoint expects:
  //   zoomInOut  — true  when either dimension has narrowed  (zoom IN)
  //   zoomStep   — ratio of the original half-width to the new half-width
  //   centerX/Y  — midpoint of the new bounds = where the reticle was placed
  //
  // When no bounds are supplied (first load / no zoom) zoomStep=1.0 is sent
  // and the Java side applies no transform, returning the default view.

  private _buildJ2SEUrl(
    fractalType : FractalType,
    bounds?     : FractalBounds
  ): string {
    const base = `${this._configService.getConfigValue('baseUrlSpringBootJava')}api/fractals/generate`;

    if (!bounds) {
      // No zoom — send neutral params; Java uses its default window
      return `${base}?kind=${fractalType}&zoomInOut=false&zoomStep=1.0`;
    }

    // Derive zoom params from the bounds produced by applyZoomToBounds()
    const centerX   = (bounds.xMin + bounds.xMax) / 2;
    const centerY   = (bounds.yMin + bounds.yMax) / 2;

    // Original default half-widths per fractal type
    // (must match Java's defaults and Angular's DEFAULT_BOUNDS_*)
    const originalHalfW = fractalType === FractalType.MANDELBROT
      ? (1.0  - (-2.0)) / 2   // 1.5  — Mandelbrot default Re half-width
      : (1.5  - (-1.5)) / 2;  // 1.5  — Julia / others default Re half-width

    const currentHalfW  = (bounds.xMax - bounds.xMin) / 2;

    // zoomStep = ratio of original to current half-width
    //   > 1 → window narrowed  → zoom IN
    //   < 1 → window widened   → zoom OUT
    const zoomStep  = originalHalfW / currentHalfW;
    const zoomInOut = zoomStep > 1.0;

    return `${base}?kind=${fractalType}`
        + `&zoomInOut=${zoomInOut}`
        + `&zoomStep=${zoomStep.toFixed(6)}`
        + `&centerX=${centerX.toFixed(6)}`
        + `&centerY=${centerY.toFixed(6)}`;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  C++ / .NET CORE BACKEND
  // ═══════════════════════════════════════════════════════════════════════════

  _OpenCv_GetFractal_CPP(
    p_maxIterations : number,
    p_realPart      : number,
    p_imagPart      : number
  ): Observable<Blob> {
    // C++ backend returns a raw PNG blob directly — no JSON point array.
    // It bypasses renderPointsToBlob entirely and goes straight to the UI.
    // When you replace OpenCV with pure math on the C++ side, wire the
    // JSON output through _fetchAndRender the same way as Node.js / J2SE.
    const url = `${this.__baseUrlCPP}generatejuliaparams/?maxIterations=${p_maxIterations}&realPart=${p_realPart}&imagPart=${p_imagPart}`;
    return this.http.get(url, { responseType: 'blob' });
  }


  // ═══════════════════════════════════════════════════════════════════════════
  //  PRIVATE SHARED FETCH + RENDER PIPELINE
  //  Used by all remote backends that return { x, y, intensity }[] JSON.
  //  C++ is excluded — it returns a raw PNG blob, not a point array.
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Fetches a JSON point array from any remote backend, adapts it to
   * FractalPoint[] via _adaptRemotePoints, then renders via renderPointsToBlob.
   *
   * This is the single replacement for the old _renderFractalPipeline.
   * Adding a new backend is: build the URL, call _fetchAndRender.
   */
  private _fetchAndRender(
    url           : string,
    fractalType   : FractalType,
    maxIterations : number
  ): Observable<Blob> {
    return new Observable<Blob>((observer) => {
      this.http.get<{ x: number; y: number; intensity: number }[]>(url).subscribe({
        next: (raw) => {
          try {
            const points = this._adaptRemotePoints(raw, fractalType, maxIterations);
            this.renderPointsToBlob(points, {
              width         : CANVAS_WIDTH,
              height        : CANVAS_HEIGHT,
              maxIterations,
            }).subscribe({
              next     : (blob) => { observer.next(blob); observer.complete(); },
              error    : (e)    => observer.error(e),
            });
          } catch (e) { observer.error(e); }
        },
        error: (e) => {
          console.error(`[_fetchAndRender] HTTP error for ${url}:`, e);
          observer.error(e);
        },
      });
    });
  }

}