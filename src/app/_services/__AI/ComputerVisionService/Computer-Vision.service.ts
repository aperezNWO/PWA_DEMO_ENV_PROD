import { Injectable, inject } from '@angular/core';
import { HttpClient         } from '@angular/common/http';
import { Observable         } from 'rxjs';
import { ConfigService      } from '../../__Utils/ConfigService/config.service';
import { BaseService        } from '../../__baseService/base.service';
import { OCRResponse        } from '../OCRService/ocr.service';
import { FractalType        } from 'src/app/_modules/_Demos/_DemosFeatures/miscelaneous/fractalDemo/fractalDemo.component';

// 1. ADD THIS STRUCTURAL INTERFACE CONTRACT HERE (Outside the class)
interface NodeJsFractalResponse {
  success: boolean;
  width: number;
  height: number;
  maxIterations: number;
  bounds: { 
    xMin: number; 
    xMax: number; 
    yMin: number; 
    yMax: number; 
  };
  matrix: number[][];
}

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

  
  ///////////////////////////////////////////////////////////////////
  // FRACTALS - HELPER FUNCTIONS 
  ///////////////////////////////////////////////////////////////////

  /**
   * Helper — maps iteration count to RGB using the same smooth-coloring
   * polynomial used by the C++ backend, so visual output is comparable
   * across engines for Mandelbrot / Julia.
   * NOTE: Not used by the Barnsley Fern (which has its own green palette).
   */
  public _getFractalColorRGB(iteration: number, maxIterations: number): { r: number; g: number; b: number } {
    if (iteration === maxIterations) return { r: 0, g: 0, b: 0 };
    const t = iteration / maxIterations;
    return {
      r: Math.floor(9   * (1 - t) * t * t * t * 255),
      g: Math.floor(15  * (1 - t) * (1 - t) * t * t * 255),
      b: Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255),
    };
  }

  //
  private _renderFractalPipelinej2se(p_url: string, p_maxIterations: number): Observable<Blob> {
    return new Observable<Blob>((observer) => {
      const width = 800, height = 600;
      this.http.get<any[]>(p_url).subscribe({
        next: (points) => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { observer.error(new Error('Could not get canvas context')); return; }

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);
            const imageData = ctx.createImageData(width, height);
            const data      = imageData.data;
            for (let i = 3; i < data.length; i += 4) data[i] = 255;

            points.forEach(point => {
              if (point.x >= 0 && point.x < width && point.y >= 0 && point.y < height) {
                const calcIter  = Math.round((point.intensity * p_maxIterations) / 255);
                const finalIter = point.intensity === 0 ? p_maxIterations : calcIter;
                const color     = this._getFractalColorRGB(finalIter, p_maxIterations);
                const idx       = (point.y * width + point.x) * 4;
                data[idx] = color.r; data[idx+1] = color.g; data[idx+2] = color.b;
              }
            });
            ctx.putImageData(imageData, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) { observer.next(blob); observer.complete(); }
              else        observer.error(new Error('Failed to convert canvas to blob'));
            }, 'image/png');
          } catch (e) { observer.error(e); }
        },
        error: (e) => { console.error('[J2SE Pipeline] Fetching error:', e); observer.error(e); }
      });
    });
  }
  
  ///////////////////////////////////////////////////////////////////
  // OPEN CV -- FRACTALS -- CPP
  ///////////////////////////////////////////////////////////////////

  _OpenCv_GetFractal_CPP(p_maxIterations: number, p_realPart: number, p_imagPart: number): Observable<Blob> {
    const url = `${this.__baseUrlCPP}generatejuliaparams/?maxIterations=${p_maxIterations}&realPart=${p_realPart}&imagPart=${p_imagPart}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  ///////////////////////////////////////////////////////////////////
  // OPEN CV -- FRACTALS -- Node.js
  ///////////////////////////////////////////////////////////////////

  // DISABLED
  _GetFractal_NodeJs(p_maxIterations: number, p_realPart: number, p_imagPart: number): Observable<Blob> {
    const url = `${this.__baseUrlNodeJsOpenCv}generatejuliaImage/?maxIterations=${p_maxIterations}&realPart=${p_realPart}&imagPart=${p_imagPart}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  // 1. Update the signature to accept zoom parameters
GetFractal_NodeJs(
    p_maxIterations : number,
    p_realPart      : number,
    p_imagPart      : number,
    p_fractalType   : number,
    p_bounds?       : { xMin: number; xMax: number; yMin: number; yMax: number }
): Observable<Blob> {
  //
  console.info(`selected fractal: ${p_fractalType}, zoom: ${p_bounds}`);
  //
  switch (p_fractalType) {
    case FractalType.JULIA:
      return this.GetFractal_Julia_NodeJs(p_maxIterations, p_realPart, p_imagPart, p_bounds);
    case FractalType.BARNSLEY_FERN:
      return this.GenerateFractal_Leaf_NodeJs(p_maxIterations);
    default:
      return this.GetFractal_Julia_NodeJs(p_maxIterations, p_realPart, p_imagPart, p_bounds);
  }
}

// 2. Update the Julia method to construct the URL with query params
GetFractal_Julia_NodeJs(
    p_maxIterations : number,
    p_realPart      : number,
    p_imagPart      : number,
    p_bounds?       : { xMin: number; xMax: number; yMin: number; yMax: number }
  ): Observable<Blob> 
  {
    //
    let zoomStep     = 2.0;
    //
    console.info(`node.js julia fractal, zoom: ${p_bounds}, step: ${zoomStep} , realPart : ${p_realPart}, imagPart : ${p_imagPart}`);
    
    const activeBounds = p_bounds ?? { xMin: -1.5, xMax: 1.5, yMin: -1.5, yMax: 1.5 };
    const baseUrl      = this._configService.getConfigValue('baseUrlNodeJsOcr');
    // Append query parameters to the URL
    //const url          = `${baseUrl}api/fractal/julia?zoomInOut=${p_bounds}&zoomStep=${zoomStep}`;
    const url          = `${baseUrl}api/fractal/julia`;
    return this._renderFractalPipelinej2se(url, p_maxIterations);
  }

  //
  GenerateFractal_Leaf_NodeJs(p_maxIterations: number): Observable<Blob> {
    const url = `${this._configService.getConfigValue('baseUrlNodeJsOcr')}api/fractal/leaf`;
    return this._renderFractalPipelinej2se(url, p_maxIterations);
  }

  ///////////////////////////////////////////////////////////////////
  // FRACTALS -- TypeScript (pure math)
  ///////////////////////////////////////////////////////////////////

  /**
   * Router/Proxy for the local TypeScript engine.
   * Dispatches to the correct renderer based on fractal type.
   * Passes optional bounds so Mandelbrot and Julia support zoom/pan.
   *
   * case 1 → Mandelbrot
   * case 2 → Julia
   * case 4 → Barnsley Fern (IFS, TypeScript-only)
   */
  GetFractal_Typescript(
    p_maxIterations : number,
    p_realPart      : number,
    p_imagPart      : number,
    p_fractalType   : number,
    p_bounds?       : { xMin: number; xMax: number; yMin: number; yMax: number }
  ): Observable<Blob> {
    switch (p_fractalType) {
      case FractalType.MANDELBROT    :  return this.GetFractal_Typescript_Manderblot(p_maxIterations, p_bounds);
      case FractalType.JULIA         :  return this.GetFractal_Typescript_Julia(p_maxIterations, p_realPart, p_imagPart, p_bounds);
      case FractalType.BARNSLEY_FERN :  return this.GetFractal_Typescript_BarnsleyFern(p_maxIterations);
      default: return this.GetFractal_Typescript_Julia(p_maxIterations, p_realPart, p_imagPart, p_bounds);
    }
  }

  GetFractal_Typescript_Manderblot(
    p_maxIterations : number,
    p_bounds?       : { xMin: number; xMax: number; yMin: number; yMax: number }
  ): Observable<Blob> {
    const activeBounds = p_bounds ?? { xMin: -2.0, xMax: 1.0, yMin: -1.2, yMax: 1.2 };
    return this._renderTSCanvasPipeline(p_maxIterations, (cx, cy) => {
      let zReal = 0, zImag = 0, iter = 0;
      while (iter < p_maxIterations) {
        if (zReal * zReal + zImag * zImag > 4.0) break;
        const nr = zReal * zReal - zImag * zImag + cx;
        const ni = 2 * zReal * zImag + cy;
        zReal = nr; zImag = ni; iter++;
      }
      return iter;
    }, activeBounds);
  }

  /**
   * Julia renderer — accepts optional bounds for zoom/pan.
   * Default bounds: classic [-1.5, 1.5] × [-1.5, 1.5] view.
   */
  GetFractal_Typescript_Julia(
    p_maxIterations : number,
    p_realPart      : number,
    p_imagPart      : number,
    p_bounds?       : { xMin: number; xMax: number; yMin: number; yMax: number }
  ): Observable<Blob> {
    const activeBounds = p_bounds ?? { xMin: -1.5, xMax: 1.5, yMin: -1.5, yMax: 1.5 };
    return this._renderTSCanvasPipeline(p_maxIterations, (zx, zy) => {
      let zReal = zx, zImag = zy, iter = 0;
      while (iter < p_maxIterations) {
        if (zReal * zReal + zImag * zImag > 4.0) break;
        const nr = zReal * zReal - zImag * zImag + p_realPart;
        const ni = 2 * zReal * zImag + p_imagPart;
        zReal = nr; zImag = ni; iter++;
      }
      return iter;
    }, activeBounds);
  }

  ///////////////////////////////////////////////////////////////////
  // BARNSLEY FERN  — Iterated Function System (IFS), TypeScript
  ///////////////////////////////////////////////////////////////////
  /**
   * Renders the Barnsley Fern fractal using the classic four-affine-
   * transformation IFS algorithm (Michael Barnsley, 1988).
   *
   * Algorithm overview
   * ──────────────────
   * Starting from (x=0, y=0) we repeatedly apply one of four affine
   * transformations chosen by a weighted random roll.  After a short
   * warm-up the orbit traces the attractor — the fern shape.
   *
   * The four transformations and their probabilities:
   *
   *  f1  (p = 1%)   — stem:    maps everything to the base stalk
   *  f2  (p = 85%)  — leaflet: the main self-similar frond
   *  f3  (p = 7%)   — left sub-frond
   *  f4  (p = 7%)   — right sub-frond
   *
   * Coordinate mapping
   * ──────────────────
   * The IFS attractor lives in the real plane roughly:
   *   x ∈ [-2.6, 2.6]   y ∈ [0, 10]
   * We map that linearly onto the canvas pixels with a small padding,
   * then mirror the y-axis (canvas y grows downward, math y grows up).
   *
   * Coloring
   * ────────
   * Each point is colored with a green gradient that varies with the
   * normalized y-coordinate of the attractor point, giving the fern
   * a natural depth from dark roots to bright frond tips.
   *
   * @param p_numPoints  Number of IFS iterations (default used: p_maxIterations
   *                     is repurposed as a multiplier → actual points =
   *                     p_maxIterations * 20, capped at 1 000 000).
   *                     Higher values produce a denser, smoother fern.
   */
  GetFractal_Typescript_BarnsleyFern(p_maxIterations: number): Observable<Blob> {
    return new Observable<Blob>((observer) => {
      try {
        const width     = 800;
        const height    = 600;
        const canvas    = document.createElement('canvas');
        canvas.width    = width;
        canvas.height   = height;
        const ctx       = canvas.getContext('2d');
        if (!ctx) { observer.error(new Error('Could not get canvas context')); return; }

        // Black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        const imageData = ctx.createImageData(width, height);
        const data      = imageData.data;

        // Fill alpha channel — all pixels fully opaque
        for (let i = 3; i < data.length; i += 4) data[i] = 255;

        // ── IFS attractor bounds (real plane) ───────────────────────────
        // Matches the Java renderer bounds exactly for consistent output.
        const xMin = -2.182, xMax = 2.655;
        const yMin =  0.0,   yMax = 9.96;
        const padding = 20;

        // Map attractor coords → canvas pixels (Y-axis inverted: math grows up, canvas grows down)
        const toPixelX = (ax: number) =>
          Math.round(padding + ((ax - xMin) / (xMax - xMin)) * (width  - 2 * padding));
        const toPixelY = (ay: number) =>
          Math.round(height - padding - ((ay - yMin) / (yMax - yMin)) * (height - 2 * padding));

        // ── IFS parameters ───────────────────────────────────────────────
        // Each row: [a, b, c, d, e, f, probability]
        // Transformation: x' = a*x + b*y + e
        //                 y' = c*x + d*y + f
        const transforms: [number, number, number, number, number, number, number][] = [
          //   a       b       c       d      e      f      p
          [  0.00,   0.00,   0.00,   0.16,  0.00,  0.00,  0.01 ],  // f1 — stem
          [  0.85,   0.04,  -0.04,   0.85,  0.00,  1.60,  0.85 ],  // f2 — main frond
          [  0.20,  -0.26,   0.23,   0.22,  0.00,  1.60,  0.07 ],  // f3 — left sub-frond
          [ -0.15,   0.28,   0.26,   0.24,  0.00,  0.44,  0.07 ],  // f4 — right sub-frond
        ];

        // Pre-compute cumulative probability thresholds
        const thresholds: number[] = [];
        let cumulative = 0;
        for (const t of transforms) {
          cumulative += t[6];
          thresholds.push(cumulative);
        }

        // ── Pixel grid buffer (mirrors Java's pixelGrid[][]) ─────────────
        // Stores a normalized y value (0–1) per hit pixel instead of
        // accumulating RGB directly. This eliminates the bloom/washout
        // problem caused by heavily-visited pixels overflowing to white.
        // Un-hit pixels remain -1.
        const pixelNormY = new Float32Array(width * height).fill(-1);

        // ── Main IFS iteration loop ──────────────────────────────────────
        const numPoints = Math.max(150_000, Math.min(p_maxIterations * 20, 1_000_000));
        const t0        = performance.now();

        let ax = 0, ay = 0;

        // Warm-up: discard first 20 iterations so the orbit settles onto
        // the attractor before painting begins.
        for (let w = 0; w < 20; w++) {
          const roll = Math.random();
          let ti = 0;
          while (ti < thresholds.length - 1 && roll > thresholds[ti]) ti++;
          const [a, b, c, d, e, f] = transforms[ti];
          const nx = a * ax + b * ay + e;
          const ny = c * ax + d * ay + f;
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

          // Record the normalized height of the first visit to each pixel.
          // First-visit wins (like Java's flat 200): no accumulation bloom.
          const bufIdx = py * width + px;
          if (pixelNormY[bufIdx] < 0) {
            pixelNormY[bufIdx] = Math.min(1, Math.max(0, (ay - yMin) / (yMax - yMin)));
          }
        }

        // ── Palette pass — paint buffered pixels ──────────────────────────
        // Two palettes are available; swap the comment to switch:
        //
        //  A) OCHRE  — matches the Java/_getFractalColorRGB warm amber tone.
        //              Uses the same polynomial as the escape-time fractals,
        //              with a fixed mid-range t so the output sits in the
        //              ochre/amber band (t ≈ 0.35–0.65 maps to warm tones).
        //
        //  B) GREEN  — natural botanical gradient, high-contrast version.
        //              More legible than the original because it starts at
        //              a much higher base brightness (80 instead of 60)
        //              and spans a wider range (80→230 instead of 60→210).

        const fernColor = (normY: number): [number, number, number] => {

          // ── Palette A: OCHRE (mirrors Java output) ──────────────────
          // Map normY into the warm region of the escape-time polynomial.
          // t ∈ [0.25, 0.70] keeps us in the amber/gold band.
          const t  = 0.25 + normY * 0.45;
          const cr = Math.min(255, Math.floor(9   * (1 - t) * t * t * t * 255 * 3.5));
          const cg = Math.min(255, Math.floor(15  * (1 - t) * (1 - t) * t * t * 255 * 2.0));
          const cb = Math.min(255, Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255 * 1.2));
          return [cr, cg, cb];

          // ── Palette B: HIGH-CONTRAST GREEN (uncomment to use) ───────
          // const cr = Math.floor(15  + normY * 40);   //  15 →  55
          // const cg = Math.floor(80  + normY * 150);  //  80 → 230
          // const cb = Math.floor(15  + normY * 25);   //  15 →  40
          // return [cr, cg, cb];
        };

        for (let py = 0; py < height; py++) {
          for (let px = 0; px < width; px++) {
            const normY = pixelNormY[py * width + px];
            if (normY < 0) continue;                    // un-hit pixel — leave black
            const [cr, cg, cb] = fernColor(normY);
            const idx = (py * width + px) * 4;
            data[idx    ] = cr;
            data[idx + 1] = cg;
            data[idx + 2] = cb;
            // alpha already set to 255 in the fill pass above
          }
        }

        ctx.putImageData(imageData, 0, 0);
        console.log(`[TS Barnsley Fern] ${numPoints} points in ${(performance.now() - t0).toFixed(2)}ms`);

        canvas.toBlob((blob) => {
          if (blob) { observer.next(blob); observer.complete(); }
          else        observer.error(new Error('Failed to assemble Barnsley Fern canvas stream'));
        }, 'image/png');

      } catch (e) { observer.error(e); }
    });
  }

  /** Shared canvas pipeline — used by Mandelbrot and Julia (per-pixel iteration). */
  private _renderTSCanvasPipeline(
    p_maxIterations : number,
    p_pixelFormula  : (x: number, y: number) => number,
    p_bounds        = { xMin: -1.5, xMax: 1.5, yMin: -1.5, yMax: 1.5 }
  ): Observable<Blob> {
    return new Observable<Blob>((observer) => {
      try {
        const width  = 800;
        const height = 600;
        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { observer.error(new Error('Could not get canvas context')); return; }

        const imageData = ctx.createImageData(width, height);
        const data      = imageData.data;
        const xStep     = (p_bounds.xMax - p_bounds.xMin) / width;
        const yStep     = (p_bounds.yMax - p_bounds.yMin) / height;

        const t0 = performance.now();
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const iter  = p_pixelFormula(p_bounds.xMin + x * xStep, p_bounds.yMin + y * yStep);
            const idx   = (y * width + x) * 4;
            const color = this._getFractalColorRGB(iter, p_maxIterations);
            data[idx]     = color.r;
            data[idx + 1] = color.g;
            data[idx + 2] = color.b;
            data[idx + 3] = 255;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        console.log(`[TS Engine] ${(performance.now() - t0).toFixed(2)}ms`);

        canvas.toBlob((blob) => {
          if (blob) { observer.next(blob); observer.complete(); }
          else        observer.error(new Error('Failed to assemble canvas image stream data'));
        }, 'image/png');
      } catch (e) { observer.error(e); }
    });
  }

  //-------------------------------------------------------------------
  // J2SE
  //-------------------------------------------------------------------

  GetFractal_j2se(p_maxIterations: number, p_fractalType: number): Observable<Blob> {
    console.info(`selected fractal for j2se : ${p_fractalType}`);
    switch (p_fractalType) {
      case FractalType.JULIA        :  return this.GetFractal_Julia_j2se(p_maxIterations);
      case FractalType.BARNSLEY_FERN:  return this.GenerateFractal_Leaf_j2se(p_maxIterations);
      default:
        console.warn(`[J2SE Proxy] Unhandled fractal type: ${p_fractalType}. Falling back to Julia.`);
        return this.GetFractal_Julia_j2se(p_maxIterations);
    }
  }

  GetFractal_Julia_j2se(p_maxIterations: number): Observable<Blob> {
    const url = `${this._configService.getConfigValue('baseUrlSpringBootJava')}api/fractals/generate?kind=2&zoomInOut=false&zoomStep=1`;
    return this._renderFractalPipelinej2se(url, p_maxIterations);
  }

  GenerateFractal_Leaf_j2se(p_maxIterations: number): Observable<Blob> {
    const url = `${this._configService.getConfigValue('baseUrlSpringBootJava')}api/fractals/generate?kind=3&zoomInOut=false&zoomStep=1`;
    return this._renderFractalPipelinej2se(url, p_maxIterations);
  }
}