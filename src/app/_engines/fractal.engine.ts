import { inject, Injectable        } from "@angular/core";
import { Observable, of, switchMap } from "rxjs";
import { FractalService            } from "../_services/fractalService/fractalService";

export interface FractalPoint {
  x          : number;
  y          : number;
  value      : number;          
  iterations : number; 
  escaped?   : boolean;
}

export interface FractalCapability {
  supported: boolean;
  zoomable: boolean;
}

export enum BackendLanguage {
  TYPESCRIPT     = 1,
  NODEJS         = 2,
  CPP            = 3,
  J2SE           = 4,
  KOTLIN         = 5,
  DART           = 6,
  GOLANG         = 7,
  RUSTLANG       = 8,
  SWIFTLANG      = 9,
}

export enum FractalType {
  MANDELBROT      = 1,
  JULIA           = 2,
  BARNSLEY_FERN   = 3,
  MANDELBROT_GRPC = 4,
}

export interface FractalBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface FractalParams
{
    selectedBackend : BackendLanguage | undefined;
    maxIterations   : number;
    realPart        : number;
    imagPart        : number;
    selectedFractal : FractalType;
    isZoomable      : FractalBounds | undefined;
    serverZoomFactor: number;
    serverZoomIn    : boolean;

}

export interface LanguageCapability {
  backendLanguage  : BackendLanguage;
  languageCode     : string;
  label            : string;
  icon             : string;
  description      : string;
  enabled          : boolean;   // false = temporarily disabled (e.g. C++ on hold) — hidden from dropdown, kept in config for later re-enable
  supportedFractals: { [key in FractalType]: FractalCapability };
}

export type ZoomMode = 'in' | 'out' | null;

export const FERN_SENTINEL = -1;

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
export const CANVAS_WIDTH  = 800;
export const CANVAS_HEIGHT = 600;

// Default complex-plane bounds per fractal type
export const DEFAULT_BOUNDS_MANDELBROT : FractalBounds = { 
  xMin: -2.0, 
  xMax: 1.0,  
  yMin: -1.2, 
  yMax: 1.2 
};
export const DEFAULT_BOUNDS_JULIA      : FractalBounds = { xMin: -1.5, xMax: 1.5,  yMin: -1.5, yMax: 1.5 };

//
export const DEFAULT_FRACTAL_PARAMS: FractalParams = {
  selectedBackend : BackendLanguage.TYPESCRIPT,
  selectedFractal : FractalType.MANDELBROT,
  maxIterations   : 100,
  realPart        : -0.4,
  imagPart        : 0.6,
  isZoomable      : undefined,
  serverZoomFactor:  1.0,
  serverZoomIn    : true,
};

@Injectable({ providedIn: 'root' })
export class FractalEngine{

  // ═══════════════════════════════════════════════════════════════════════════
  //  PROPERTIES / FIELDS
  // ═══════════════════════════════════════════════════════════════════════════

  private readonly _fractalService        = inject(FractalService);
    
  // ═══════════════════════════════════════════════════════════════════════════
  //  UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  //
  public static _getFractalColorRGB(
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

  //
  public static renderPointsToBlob(
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

  //
  public static applyZoomToBounds(params: ZoomParams): FractalBounds {
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

  public static _adaptRemotePoints(
    raw           : { x: number; y: number; intensity: number }[],
    fractalType   : FractalType,
    maxIterations : number
  ): FractalPoint[] {
    return raw.map(p => {
      if (fractalType === FractalType.BARNSLEY_FERN) {
        // IFS scatter — intensity is a fixed sentinel, not a real value
        return { x: p.x, y: p.y, value: FERN_SENTINEL, iterations: maxIterations };
      }
      // Escape-time — back-calculate iteration from the 0-255 intensity
      const iter = p.intensity === 0
        ? maxIterations
        : Math.round((p.intensity * maxIterations) / 255);
      return { x: p.x, y: p.y, value: iter, iterations: maxIterations };
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  UNIFIED RENDERING PIPELINE
  // ═══════════════════════════════════════════════════════════════════════════

  public static _renderPipeline(
    points$: Observable<FractalPoint[]>, 
    maxIterations: number
  ): Observable<Blob> {
    return points$.pipe(
      switchMap(points => 
        FractalEngine.renderPointsToBlob(points, {
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          maxIterations
        })
      )
    );
  }
  
  //
  public static _runEscapeTimeEngine(
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
            iterations: maxIterations
          };
        }
      }
  
      console.log(`[TS Engine] ${width * height} points in ${(performance.now() - t0).toFixed(2)}ms`);
      return points;
    }
  
    // ═══════════════════════════════════════════════════════════════════════════
    //  TYPESCRIPT MATH
    // ═══════════════════════════════════════════════════════════════════════════
  
    // MANDERBLROT
    public static _generateTSMandelbrot(p_maxIterations: number, p_bounds?: FractalBounds): Observable<FractalPoint[]> {
      const bounds = p_bounds ?? DEFAULT_BOUNDS_MANDELBROT;
      return of(FractalEngine._runEscapeTimeEngine(p_maxIterations, bounds, (cx, cy) => {
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
  
    // JULIA
    public static _generateTSJulia(p_maxIterations: number, p_realPart: number, p_imagPart: number, p_bounds?: FractalBounds): Observable<FractalPoint[]> {
      const bounds = p_bounds ?? DEFAULT_BOUNDS_JULIA;
      return of(FractalEngine._runEscapeTimeEngine(p_maxIterations, bounds, (zx, zy) => {
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
  
    // BARNSLEY FERN 
    public static _generateTSBarnsley(p_maxIterations: number): Observable<FractalPoint[]> {
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
          points.push({ x: px, y: py, value: FERN_SENTINEL, iterations: p_maxIterations });
        }
      }
  
      return of(points);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CLIENT ENTRY POINT
  // ═══════════════════════════════════════════════════════════════════════════

  public GetFractalClient(
      p_fractalParams : FractalParams
    ): Observable<FractalPoint[]> {
      let points$: Observable<FractalPoint[]>;
      
      switch (p_fractalParams.selectedFractal) {
        case FractalType.MANDELBROT: 
          points$ = FractalEngine._generateTSMandelbrot(p_fractalParams.maxIterations, p_fractalParams.isZoomable); 
          break;
        case FractalType.JULIA:      
          points$ = FractalEngine._generateTSJulia(p_fractalParams.maxIterations, p_fractalParams.realPart, p_fractalParams.imagPart, p_fractalParams.isZoomable); 
          break;
        case FractalType.BARNSLEY_FERN: 
          points$ = FractalEngine._generateTSBarnsley(p_fractalParams.maxIterations); 
          break;
        default: 
          points$ = FractalEngine._generateTSJulia(p_fractalParams.maxIterations, p_fractalParams.realPart, p_fractalParams.imagPart, p_fractalParams.isZoomable);
      }
      
      return points$;
      
    }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SERVER  ENTERY POINT 
  // ═══════════════════════════════════════════════════════════════════════════
  public GetFractalServer(
      p_fractalParams : FractalParams

    ): Observable<FractalPoint[]> {

      //
      console.info(`[Server] backend=${p_fractalParams.selectedBackend?.toString()} fractal=${p_fractalParams.selectedFractal} zoom=${p_fractalParams.serverZoomIn} factor=${p_fractalParams.serverZoomFactor}`);
  
      //
      switch (p_fractalParams.selectedFractal)
      {
        case FractalType.MANDELBROT    :
            return this._fractalService.GenerateFractalServerMandelbrot(p_fractalParams);
        break;
        case FractalType.JULIA         :
            return this._fractalService.GenerateFractalServerJulia(p_fractalParams);
        break;
        case FractalType.BARNSLEY_FERN :
            return this._fractalService.GenerateFractalServerBarnsleyFern(p_fractalParams);
        break;
        case FractalType.MANDELBROT_GRPC:
            return this._fractalService.GenerateFractalServerMandelbrotGrpc(p_fractalParams);        
        default :
            return this._fractalService.GenerateFractalServerJulia(p_fractalParams);
      }
  }
    
  // ═══════════════════════════════════════════════════════════════════════════
  //  PROXY FUNCTION
  // ═══════════════════════════════════════════════════════════════════════════

  public GetFractal(
      p_fractalParams : FractalParams
  ): Observable<Blob>  {
      //
      let points$: Observable<FractalPoint[]> = (p_fractalParams.selectedBackend == BackendLanguage.TYPESCRIPT)? 
                                                this.GetFractalClient(p_fractalParams) : 
                                                this.GetFractalServer(p_fractalParams); 
      //
      return FractalEngine._renderPipeline(points$, p_fractalParams.maxIterations);
   }
}

// ═══════════════════════════════════════════════════════════════════════════
//  LANGUAGE BENCHMARK — localStorage-backed best-time tracking
// ═══════════════════════════════════════════════════════════════════════════

export interface BenchmarkEntry {
  bestTimeMs  : number;
  lastUpdated : number;   // epoch ms — not displayed yet, reserved for a future "stale data" indicator
}

// backendCode (LanguageCapability.languageCode) → fractal id → best time recorded for that pair
export type BenchmarkStore = { [backendCode: string]: { [fractalId: number]: BenchmarkEntry } };

export const BENCHMARK_STORAGE_KEY = 'fractal_benchmark_v1';

export interface FractalSliceScore {
  fractalType : FractalType;
  score       : number;   // higher = more/faster benchmarking activity recorded for this fractal
}

export interface BackendTimeBar {
  backendCode : string;
  label       : string;
  bestTimeMs  : number | null;  // null = no time recorded yet for this backend/fractal pair
  score       : number;         // performanceScore(bestTimeMs) — 0 when bestTimeMs is null
}

export class FractalBenchmark {

  // ── Persistence ──────────────────────────────────────────────────────────

  static load(): BenchmarkStore {
    if (typeof localStorage === 'undefined') return {};
    try {
      const raw = localStorage.getItem(BENCHMARK_STORAGE_KEY);
      return raw ? JSON.parse(raw) as BenchmarkStore : {};
    } catch {
      return {};
    }
  }

  private static save(store: BenchmarkStore): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(BENCHMARK_STORAGE_KEY, JSON.stringify(store));
  }

// Inside FractalBenchmark class in fractal.engine.ts
static record(backendCode: string, fractalType: FractalType, timeMs: number): void {
    const store = FractalBenchmark.load();
    
    // Explicitly convert to number to ensure consistency
    const id = Number(fractalType); 
    
    if (!store[backendCode]) {
        store[backendCode] = {};
    }
    
    const existing = store[backendCode][id]?.bestTimeMs;

    if (existing === undefined || timeMs < existing) {
      store[backendCode][id] = { bestTimeMs: timeMs, lastUpdated: Date.now() };
      FractalBenchmark.save(store);
      console.log(`[Benchmark] Stored ${timeMs.toFixed(2)}ms for ${backendCode} / ID ${id}`);
    }
}

//
static clear(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(BENCHMARK_STORAGE_KEY);
  }

  // ── Performance measure ──────────────────────────────────────────────────

  /**
   * Converts a raw execution time into a "performance score" where HIGHER
   * always means FASTER / BETTER — the inverse of what a stopwatch gives you.
   *
   *     score = 1000 / timeMs
   *
   * - Inverting is the only way to turn "lower is better" into "higher is
   *   better" without changing what's actually being measured.
   * - The ×1000 just rescales milliseconds into friendlier numbers
   *   (50ms → 20.0, 5ms → 200.0) — it doesn't change the ranking, only
   *   how readable the numbers are.
   * - It's a pure ratio, so it composes cleanly under averaging/weighting
   *   (see computeSliceScores) without needing extra normalization
   *   constants per fractal or backend.
   */
  static performanceScore(timeMs: number): number {
    if (timeMs <= 0) return 0;
    return 1000 / timeMs;
  }

  // ── Pie chart: per-fractal aggregate score across all backends ─────────

  /**
   * For each fractal type, combines every backend's best time for that
   * fractal, weighted by that backend's own average performance across
   * ALL fractals it has ever recorded a time for:
   *
   *     sliceValue(fractal) = Σ over backends [ score(backend,fractal) × avgScore(backend) ]
   *
   * This is intentionally approximate — it mixes fractals of very different
   * computational complexity (Mandelbrot/Julia escape-time vs. Barnsley's
   * IFS point-scatter) into one number, and a backend that's fast in
   * general (high avgScore) inflates every fractal it has data for, whether
   * or not it was actually fastest at THAT specific fractal. Treat this pie
   * chart as a rough "where has benchmarking activity + backend speed
   * concentrated" view — the bar chart (raw best times, task 7) is the
   * precise one.
   */
  static computeSliceScores(
    store           : BenchmarkStore,
    enabledBackends : string[],
    fractalTypes    : FractalType[]
  ): FractalSliceScore[] {

    // avgScore(backend) = average performanceScore across every fractal
    // that backend has ever recorded a time for.
    const avgScoreByBackend: { [backendCode: string]: number } = {};

    for (const backendCode of enabledBackends) {
      const entries = store[backendCode];
      if (!entries) continue;

      const scores = Object.values(entries).map(e => FractalBenchmark.performanceScore(e.bestTimeMs));
      if (scores.length === 0) continue;

      avgScoreByBackend[backendCode] = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    return fractalTypes.map(fractalType => {
      let sliceValue = 0;

      for (const backendCode of enabledBackends) {
        const entry    = store[backendCode]?.[fractalType];
        const avgScore = avgScoreByBackend[backendCode];
        if (!entry || avgScore === undefined) continue;

        sliceValue += FractalBenchmark.performanceScore(entry.bestTimeMs) * avgScore;
      }

      return { fractalType, score: sliceValue };
    });
  }

  // ── Bar chart: performance score per backend, for ONE fractal ───────────

  /**
   * Returns the best (lowest) recorded time for a single fractal, one entry
   * per backend — plus its performanceScore so the chart can plot with the
   * SAME "taller = better" convention as the pie chart. bestTimeMs is kept
   * alongside for the tooltip, since the score alone isn't human-readable.
   */
  static computeBackendTimeBars(
    store       : BenchmarkStore,
    backends    : { code: string; label: string }[],
    fractalType : FractalType
  ): BackendTimeBar[] {
    return backends.map(b => {
      const bestTimeMs = store[b.code]?.[fractalType]?.bestTimeMs ?? null;
      return {
        backendCode : b.code,
        label       : b.label,
        bestTimeMs,
        score       : bestTimeMs !== null ? FractalBenchmark.performanceScore(bestTimeMs) : 0,
      };
    });
  }
}