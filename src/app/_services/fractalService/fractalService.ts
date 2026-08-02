import { map
        , Observable                  } from "rxjs";
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
  private readonly __baseUrlKotlinFractal = `${this._configService.getConfigValue('baseUrlSpringBoot_Kotlin')}api/fractals/generate`;
 
 
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
      case BackendLanguage.J2SE:
          url =
            `${this.__baseUrlJ2seFractal}` +
            `?kind=${FractalType.JULIA}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
      break;
      case BackendLanguage.KOTLIN:
          url =
            `${this.__baseUrlKotlinFractal}` +
            `?kind=${FractalType.JULIA}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
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
      case BackendLanguage.J2SE:
          url =
            `${this.__baseUrlJ2seFractal}` +
            `?kind=${FractalType.MANDELBROT}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
      break;
      case BackendLanguage.KOTLIN:
          url =
            `${this.__baseUrlKotlinFractal}` +
            `?kind=${FractalType.MANDELBROT}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
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
    const bounds : FractalBounds | undefined = p_fractalParams.isZoomable ?? DEFAULT_BOUNDS_MANDELBROT;
    let   url    : string                    = "";


    //
    switch(p_fractalParams.selectedBackend){
      case BackendLanguage.NODEJS:
            url = `${this.__baseUrlNodeJsFractal}leaf`;      
      break;
      case BackendLanguage.J2SE:
            url = `${this.__baseUrlJ2seFractal}` +
            `?kind=${FractalType.BARNSLEY_FERN}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
      break;
      case BackendLanguage.KOTLIN:
            url = `${this.__baseUrlKotlinFractal}` +
            `?kind=${FractalType.BARNSLEY_FERN}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
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
}