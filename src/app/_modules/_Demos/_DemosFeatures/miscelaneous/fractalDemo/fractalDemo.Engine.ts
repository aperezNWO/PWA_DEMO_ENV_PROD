import { Observable, switchMap } from "rxjs";

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

export interface FractalCapability {
  supported: boolean;
  zoomable: boolean;
}

export interface LanguageCapability {
  languageCode: string;
  label: string;
  icon: string;
  description: string;
  supportedFractals: { [key in FractalType]: FractalCapability };
}

export type ZoomMode = 'in' | 'out' | null;

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
export const CANVAS_WIDTH  = 800;
export const CANVAS_HEIGHT = 600;

// Default complex-plane bounds per fractal type
export const DEFAULT_BOUNDS_MANDELBROT : FractalBounds = { xMin: -2.0, xMax: 1.0,  yMin: -1.2, yMax: 1.2 };
export const DEFAULT_BOUNDS_JULIA      : FractalBounds = { xMin: -1.5, xMax: 1.5,  yMin: -1.5, yMax: 1.5 };

export class FractalEngine{

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
        return { x: p.x, y: p.y, value: FERN_SENTINEL };
      }
      // Escape-time — back-calculate iteration from the 0-255 intensity
      const iter = p.intensity === 0
        ? maxIterations
        : Math.round((p.intensity * maxIterations) / 255);
      return { x: p.x, y: p.y, value: iter };
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
}


