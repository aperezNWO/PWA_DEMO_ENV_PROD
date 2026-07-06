import { map
        , Observable
        , of                          } from "rxjs";
import { BaseService                  } from "../__baseService/base.service";
import { HttpClient                   } from "@angular/common/http";
import { inject, Injectable           } from "@angular/core";
import { ConfigService                } from "../__Utils/ConfigService/config.service";
import { DEFAULT_BOUNDS_JULIA, FractalBounds
       , FractalEngine, FractalPoint
       , FractalType                  } from "src/app/_engines/fractal.engine";


@Injectable({ providedIn: 'root' })
export class FractalService extends BaseService {
  
  private readonly http                   = inject(HttpClient);
  private readonly _configService         = inject(ConfigService);
  private readonly __baseUrlCPPOpenCv     = `${this._configService.getConfigValue('baseUrlNetCoreCPPEntry')}api/computervision/`;
  private readonly __baseUrlNodeJsFractal = `${this._configService.getConfigValue('baseUrlNodeJsOcr')}api/fractal/`;
  private readonly __baseUrlJ2seFractal   = `${this._configService.getConfigValue('baseUrlSpringBootJava')}api/fractals/generate')`;
 
 
  // ═══════════════════════════════════════════════════════════════════════════
  //  C++ / .NET CORE BACKEND
  // ═══════════════════════════════════════════════════════════════════════════

  GetFractal_CPP(
    p_maxIterations : number,
    p_realPart      : number,
    p_imagPart      : number
  ): Observable<Blob> {
    const url = `${this.__baseUrlCPPOpenCv}generatejuliaparams/?maxIterations=${p_maxIterations}&realPart=${p_realPart}&imagPart=${p_imagPart}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  NODE.JS BACKEND
  // ═══════════════════════════════════════════════════════════════════════════
  
  /*
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
              };
            }
          }
      
          console.log(`[TS Engine] ${width * height} points in ${(performance.now() - t0).toFixed(2)}ms`);
          return points;
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

  */
  
  //
    public _NodeJs_Julia(
    p_maxIterations: number,
    p_bounds?: FractalBounds
  ): Observable<FractalPoint[]> {

    const bounds = p_bounds ?? DEFAULT_BOUNDS_JULIA;

    // Bounds-based, mirrors _generateTSJulia — no zoomInOut/zoomStep anymore.
    // Real/imaginary part (Julia constant c) stays server-side, same as before.
    const url =
      `${this.__baseUrlNodeJsFractal}julia` +
      `?xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
      `&yMin=${bounds.yMin}&yMax=${bounds.yMax}`;

    const rawData$ = this.http.get<{ x: number; y: number; intensity: number }[]>(url);

    return rawData$.pipe(
      map(raw => FractalEngine._adaptRemotePoints(raw, FractalType.JULIA, p_maxIterations))
    );
  }

  //
  public _NodeJs_BarnsleyFern(p_maxIterations: number): Observable<FractalPoint[]>{
    //
    const url = `${this.__baseUrlNodeJsFractal}leaf`;

    // 1. Fetch raw data from the Node.js backend
    const rawData$ = this.http.get<{ x: number; y: number; intensity: number }[]>(url);

    // 2. Map raw data to internal FractalPoint[] format
    return rawData$.pipe(
      map(raw => FractalEngine._adaptRemotePoints(raw, FractalType.BARNSLEY_FERN, p_maxIterations))
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
      return FractalEngine._renderPipeline(points$, p_maxIterations);

  }

  private _J2SE_BarnsleyFern(p_maxIterations: number): Observable<FractalPoint[]>{
    const url = this._buildJ2SEUrl(FractalType.BARNSLEY_FERN);
    
    // 1. Fetch raw data from the Java backend
    const rawData$ = this.http.get<{ x: number; y: number; intensity: number }[]>(url);

    // 2. Map raw data to internal FractalPoint[] format
    return rawData$.pipe(
      map(raw => FractalEngine._adaptRemotePoints(raw, FractalType.BARNSLEY_FERN, p_maxIterations))
    );
  }

  private _buildJ2SEUrl(
    fractalType : FractalType,
    bounds?     : FractalBounds
  ): string {

    if (!bounds) {
      // No zoom — send neutral params; Java uses its default window
      return `${this.__baseUrlJ2seFractal}?kind=${fractalType}&zoomInOut=false&zoomStep=1.0`;
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

    return `${this.__baseUrlJ2seFractal}?kind=${fractalType}`
        + `&zoomInOut=${zoomInOut}`
        + `&zoomStep=${zoomStep.toFixed(6)}`
        + `&centerX=${centerX.toFixed(6)}`
        + `&centerY=${centerY.toFixed(6)}`;
  }
}




