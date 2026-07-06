import { map
        , Observable
        , of                          } from "rxjs";
import { BaseService                  } from "../__baseService/base.service";
import { HttpClient                   } from "@angular/common/http";
import { inject, Injectable           } from "@angular/core";
import { ConfigService                } from "../__Utils/ConfigService/config.service";
import { BackendLanguage
       , DEFAULT_BOUNDS_JULIA
       , DEFAULT_BOUNDS_MANDELBROT
       , FractalBounds
       , FractalEngine
       , FractalParams
       , FractalPoint
       , FractalType                  } from "src/app/_engines/fractal.engine";


@Injectable({ providedIn: 'root' })
export class FractalService extends BaseService {
  
  private readonly http                   = inject(HttpClient);
  private readonly _configService         = inject(ConfigService);
  private readonly __baseUrlCPPOpenCv     = `${this._configService.getConfigValue('baseUrlNetCoreCPPEntry')}api/computervision/`;
  private readonly __baseUrlNodeJsFractal = `${this._configService.getConfigValue('baseUrlNodeJsOcr')}api/fractal/`;
  private readonly __baseUrlJ2seFractal   = `${this._configService.getConfigValue('baseUrlSpringBootJava')}api/fractals/generate`;
 
 
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
  // GENERIC BACKEND
  // ═══════════════════════════════════════════════════════════════════════════
  
  //
  public GenerateFractalServerJulia(
      p_fractalParams : FractalParams
  ): Observable<FractalPoint[]> {

    //  
    const bounds : FractalBounds | undefined = p_fractalParams.isZoomable ?? DEFAULT_BOUNDS_JULIA;
    let   url    : string                    = "";

    // Bounds-based, mirrors _generateTSJulia — no zoomInOut/zoomStep anymore.
    // Real/imaginary part (Julia constant c) stays server-side, same as before.
    switch(p_fractalParams.selectedBackend){
      case BackendLanguage.NODEJS:
          url =
            `${this.__baseUrlNodeJsFractal}julia` +
            `?xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}`;
      break;
      default : 
          url =
            `${this.__baseUrlNodeJsFractal}julia` +
            `?xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}`;
    }

    //
    const rawData$ = this.http.get<{ x: number; y: number; intensity: number }[]>(url);

    //
    return rawData$.pipe(
      map(raw => FractalEngine._adaptRemotePoints(raw, FractalType.JULIA, p_fractalParams.maxIterations))
    );
  }

  //
  public GenerateFractalServerMandelbrot(
      p_fractalParams : FractalParams
  ): Observable<FractalPoint[]> {

    //
    const bounds : FractalBounds | undefined = p_fractalParams.isZoomable ?? DEFAULT_BOUNDS_MANDELBROT;
    let   url    : string                    = "";

    // Bounds-based, same contract as GenerateFractalServerJulia — no zoomInOut/zoomStep.
    switch(p_fractalParams.selectedBackend){
      case BackendLanguage.NODEJS:
          url =
            `${this.__baseUrlNodeJsFractal}mandelbrot` +
            `?xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}`;
      break;
      default :
          url =
            `${this.__baseUrlNodeJsFractal}mandelbrot` +
            `?xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}`;
    }

    //
    const rawData$ = this.http.get<{ x: number; y: number; intensity: number }[]>(url);

    //
    return rawData$.pipe(
      map(raw => FractalEngine._adaptRemotePoints(raw, FractalType.MANDELBROT, p_fractalParams.maxIterations))
    );
  }

  //
  public GenerateFractalServerBarnsleyFern(p_fractalParams : FractalParams): Observable<FractalPoint[]>{
    //
    let url : string = "";

    //
    switch(p_fractalParams.selectedBackend){
      case BackendLanguage.NODEJS:
            url = `${this.__baseUrlNodeJsFractal}leaf`;      
      break;
      default : 
            url = `${this.__baseUrlNodeJsFractal}leaf`;      
    }

    // 1. Fetch raw data from the Node.js backend
    const rawData$ = this.http.get<{ x: number; y: number; intensity: number }[]>(url);

    // 2. Map raw data to internal FractalPoint[] format
    return rawData$.pipe(
      map(raw => FractalEngine._adaptRemotePoints(raw, FractalType.BARNSLEY_FERN, p_fractalParams.maxIterations))
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