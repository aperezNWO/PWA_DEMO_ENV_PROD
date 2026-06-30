import { map, Observable, of, switchMap    } from "rxjs";
import { BaseService                  } from "../__baseService/base.service";
import { HttpClient                   } from "@angular/common/http";
import { inject, Injectable           } from "@angular/core";
import { ConfigService                } from "../__Utils/ConfigService/config.service";


export enum FractalType {
  MANDELBROT     = 1,
  JULIA          = 2,
  BARNSLEY_FERN  = 3,
}
export interface FractalPoint {
  x     : number;
  y     : number;
  value : number;          // iteration count or FERN_SENTINEL
}

export const FERN_SENTINEL = -1;

export interface FractalBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface FractalRenderOptions {
  width         : number;          // canvas width  in pixels  (default 800)
  height        : number;          // canvas height in pixels  (default 600)
  maxIterations : number;          // only meaningful for escape-time fractals
}

export interface ZoomParams {
  currentBounds  : FractalBounds;
  factor         : number;
  centerReal?    : number;
  centerImag?    : number;
}

// Default canvas dimensions — single source of truth
const CANVAS_WIDTH  = 800;
const CANVAS_HEIGHT = 600;

// Default complex-plane bounds per fractal type
const DEFAULT_BOUNDS_MANDELBROT : FractalBounds = { xMin: -2.0, xMax: 1.0,  yMin: -1.2, yMax: 1.2 };
const DEFAULT_BOUNDS_JULIA      : FractalBounds = { xMin: -1.5, xMax: 1.5,  yMin: -1.5, yMax: 1.5 };

@Injectable({ providedIn: 'root' })
export class FractalEngine extends BaseService {

  private readonly http                  = inject(HttpClient);
  private readonly _configService        = inject(ConfigService);
  private readonly __baseUrlCPP          = `${this._configService.getConfigValue('baseUrlNetCoreCPPEntry')}api/computervision/`;
  private readonly __baseUrlNodeJsOpenCv = `${this._configService.getConfigValue('baseUrlNodeJsOcr')}api/OpenCv/`;

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
  //  C++ / .NET CORE BACKEND
  // ═══════════════════════════════════════════════════════════════════════════

  GetFractal_CPP(
    p_maxIterations : number,
    p_realPart      : number,
    p_imagPart      : number
  ): Observable<Blob> {
    const url = `${this.__baseUrlCPP}generatejuliaparams/?maxIterations=${p_maxIterations}&realPart=${p_realPart}&imagPart=${p_imagPart}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  UNIFIED RENDERING PIPELINE
  // ═══════════════════════════════════════════════════════════════════════════

  private _renderPipeline(
    points$: Observable<FractalPoint[]>, 
    maxIterations: number
  ): Observable<Blob> {
    return points$.pipe(
      switchMap(points => 
        this.renderPointsToBlob(points, {
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          maxIterations
        })
      )
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  TYPESCRIPT DATA GENERATION (The "Mocking/Pure" functions)
  // ═══════════════════════════════════════════════════════════════════════════

  private _generateTSMandelbrot(p_maxIterations: number, p_bounds?: FractalBounds): Observable<FractalPoint[]> {
    const bounds = p_bounds ?? DEFAULT_BOUNDS_MANDELBROT;
    return of(this._runEscapeTimeEngine(p_maxIterations, bounds, (cx, cy) => {
      let zr = 0, zi = 0, i = 0;
      while (i < p_maxIterations) {
        if (zr * zr + zi * zi > 4.0) break;
        const nr = zr * zr - zi * zi + cx;
        const ni = 2 * zr * zi + cy;
        zr = nr; zi = ni; i++;
      }
      return i;
    }));
  }

  private _generateTSJulia(p_maxIterations: number, p_realPart: number, p_imagPart: number, p_bounds?: FractalBounds): Observable<FractalPoint[]> {
    const bounds = p_bounds ?? DEFAULT_BOUNDS_JULIA;
    return of(this._runEscapeTimeEngine(p_maxIterations, bounds, (zx, zy) => {
      let zr = zx, zi = zy, i = 0;
      while (i < p_maxIterations) {
        if (zr * zr + zi * zi > 4.0) break;
        const nr = zr * zr - zi * zi + p_realPart;
        const ni = 2 * zr * zi + p_imagPart;
        zr = nr; zi = ni; i++;
      }
      return i;
    }));
  }

  //
  private _generateTSBarnsley(p_maxIterations: number): Observable<FractalPoint[]> {
    const points: FractalPoint[] = [];
    
    // FIX 1: Ensure enough iterations for a dense render
    const iterations = Math.max(p_maxIterations, 50000);

    let x = 0;
    let y = 0;

    // FIX 2: Better Scaling. 
    // Fern Width range is roughly 4.84 units, Height is roughly 10 units.
    // Multiply by 0.95 to add a small margin so it doesn't touch edges.
    const scale = Math.min(CANVAS_WIDTH / 4.84, CANVAS_HEIGHT / 10) * 0.95;

    for (let i = 0; i < iterations; i++) {
      let nextX, nextY;
      const rand = Math.random();

      // Standard Barnsley IFS transformation matrices
      if (rand < 0.01) {
        nextX = 0;
        nextY = 0.16 * y;
      } else if (rand < 0.86) {
        nextX = 0.85 * x + 0.04 * y;
        nextY = -0.04 * x + 0.85 * y + 1.6;
      } else if (rand < 0.93) {
        nextX = 0.2 * x - 0.26 * y;
        nextY = 0.23 * x + 0.22 * y + 1.6;
      } else {
        nextX = -0.15 * x + 0.28 * y;
        nextY = 0.26 * x + 0.24 * y + 0.44;
      }

      x = nextX;
      y = nextY;

      // FIX 3: Centering logic. 
      // The horizontal center of the fern is at roughly 0.24.
      const px = Math.floor(CANVAS_WIDTH / 2 + (x - 0.24) * scale);
      const py = Math.floor(CANVAS_HEIGHT - y * scale); // Flip Y for canvas

      // Only push valid points to ensure the array stays clean
      if (px >= 0 && px < CANVAS_WIDTH && py >= 0 && py < CANVAS_HEIGHT) {
        points.push({ x: px, y: py, value: FERN_SENTINEL });
      }
    }

    return of(points);
  }

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
  
  // ═══════════════════════════════════════════════════════════════════════════
  //  TYPESCRIPT PURE-MATH ENGINE
  // ═══════════════════════════════════════════════════════════════════════════

  GetFractal_Typescript(
    p_maxIterations : number,
    p_realPart      : number,
    p_imagPart      : number,
    p_fractalType   : FractalType,
    p_bounds?       : FractalBounds
  ): Observable<Blob> {
    let points$: Observable<FractalPoint[]>;
    
    switch (p_fractalType) {
      case FractalType.MANDELBROT: 
        points$ = this._generateTSMandelbrot(p_maxIterations, p_bounds); 
        break;
      case FractalType.JULIA:      
        points$ = this._generateTSJulia(p_maxIterations, p_realPart, p_imagPart, p_bounds); 
        break;
      case FractalType.BARNSLEY_FERN: 
        points$ = this._generateTSBarnsley(p_maxIterations); 
        break;
      default: 
        points$ = this._generateTSJulia(p_maxIterations, p_realPart, p_imagPart, p_bounds);
    }
    
    return this._renderPipeline(points$, p_maxIterations);
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

    //
    let points$: Observable<FractalPoint[]>;

    switch (p_fractalType) {
      case FractalType.BARNSLEY_FERN: 
         points$ = this._NodeJs_BarnsleyFern(p_maxIterations);
      break;
      default: 
        points$ = this._NodeJs_BarnsleyFern(p_maxIterations);
    };

    // 
    return this._renderPipeline(points$, p_maxIterations);
  }

  //
  private _NodeJs_BarnsleyFern(p_maxIterations: number): Observable<FractalPoint[]>{
    //
    const url = `${this._configService.getConfigValue('baseUrlNodeJsOcr')}api/fractal/leaf`;
    
    // 1. Fetch raw data from the Node.js backend
    const rawData$ = this.http.get<{ x: number; y: number; intensity: number }[]>(url);

    // 2. Map raw data to internal FractalPoint[] format
    return rawData$.pipe(
      map(raw => this._adaptRemotePoints(raw, FractalType.BARNSLEY_FERN, p_maxIterations))
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  J2SE / SPRING BOOT BACKEND
  // ═══════════════════════════════════════════════════════════════════════════

 GetFractal_j2se(
    p_maxIterations : number,
    p_fractalType   : FractalType,
    zoomInOut       : boolean = true,
    zoomStep        : number  = 0
  ): Observable<Blob> {
    console.info(`[J2SE] fractal=${p_fractalType}, zoomIn=${zoomInOut}, step=${zoomStep}`);
   
    //
    let points$: Observable<FractalPoint[]>;

    switch (p_fractalType) {
      case FractalType.BARNSLEY_FERN: 
        points$ =  this._J2SE_BarnsleyFern(p_maxIterations);
      break;
      default:
        console.warn(`[J2SE] Unknown fractal type ${p_fractalType} — falling back to Barnsley`);
        points$ =  this._J2SE_BarnsleyFern(p_maxIterations);
    }

    // 
    return this._renderPipeline(points$, p_maxIterations);

  }

  //private _J2SE_BarnsleyFern(p_maxIterations: number): Observable<Blob> {
  private _J2SE_BarnsleyFern(p_maxIterations: number): Observable<FractalPoint[]>{
    const url = this._buildJ2SEUrl(FractalType.BARNSLEY_FERN);
    
    // 1. Fetch raw data from the Java backend
    const rawData$ = this.http.get<{ x: number; y: number; intensity: number }[]>(url);

    // 2. Map raw data to internal FractalPoint[] format
    return rawData$.pipe(
      map(raw => this._adaptRemotePoints(raw, FractalType.BARNSLEY_FERN, p_maxIterations))
    );
  }

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
}




