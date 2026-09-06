import { HttpHeaders } from '@angular/common/http';
import { map
        , Observable,                  
        take} from "rxjs";
import { BaseService                  } from "../__baseService/base.service";
import { HttpClient                   } from "@angular/common/http";
import { inject, Injectable           } from "@angular/core";
import { ConfigService                } from "../__Utils/ConfigService/config.service";
import { BackendLanguage
       , DEFAULT_BOUNDS_JULIA
       , DEFAULT_BOUNDS_MANDELBROT
       , FERN_SENTINEL, FractalBounds
       , FractalEngine
       , FractalParams
       , FractalPoint
       , FractalType                     } from "src/app/_engines/fractal.engine";
import { FractalRequest, FractalResponse } from 'src/app/grpc/fractal';


@Injectable({ providedIn: 'root' })
export class FractalService extends BaseService {
  
  private readonly http                   = inject(HttpClient);
  private readonly _configService         = inject(ConfigService);
  private readonly __baseUrlCPPOpenCv     = `${this._configService.getConfigValue('baseUrlNetCoreCPPEntry')}api/computervision/`;
  private readonly __baseUrlNodeJsFractal = `${this._configService.getConfigValue('baseUrlNodeJsOcr')}api/fractal/`;
  private readonly __baseUrlJ2seFractal   = `${this._configService.getConfigValue('baseUrlSpringBootJava')}api/fractals/generate`;
  private readonly __baseUrlKotlinFractal = `${this._configService.getConfigValue('baseUrlSpringBoot_Kotlin')}api/fractals/generate`;
  private readonly __baseUrlDartFractal   = `${this._configService.getConfigValue('baseUrlDart')}api/fractals/generate`;  
  private readonly __baseUrlGoLangFractal    = `${this._configService.getConfigValue('baseUrlGoLang')}api/fractals/generate`;  
  private readonly __baseUrlRustLangFractal  = `${this._configService.getConfigValue('baseUrlRustLang')}api/fractals/generate`;  
  private readonly __baseUrlSwiftLangFractal = `${this._configService.getConfigValue('baseUrlSwiftLang')}api/fractals/generate`;  
  private readonly __baseUrlZigLangFractal   = `${this._configService.getConfigValue('baseUrlZigLang')}api/fractals/generate`;  
  private readonly __baseUrlCppWebServer     = `${this._configService.getConfigValue('baseUrlCppWebServer')}api/fractals/generate`;  
 
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
      case BackendLanguage.DART :
          url =
            `${this.__baseUrlDartFractal}` +
            `?kind=${FractalType.JULIA}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
      break; 
      case BackendLanguage.GOLANG :
          url =
            `${this.__baseUrlGoLangFractal}` +
            `?kind=${FractalType.JULIA}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
      break; 
      case BackendLanguage.RUSTLANG :
          url =
            `${this.__baseUrlRustLangFractal}` +
            `?kind=${FractalType.JULIA}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
      break;
     case BackendLanguage.SWIFTLANG :
          url =
            `${this.__baseUrlSwiftLangFractal}` +
            `?kind=${FractalType.JULIA}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
      break;     
      case BackendLanguage.ZIGLANG :
          url =
            `${this.__baseUrlZigLangFractal}` +
            `?kind=${FractalType.JULIA}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
      break;    
      case BackendLanguage.CPP_WS :
          url =
            `${this.__baseUrlCppWebServer}` +
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
      case BackendLanguage.DART:
          url =
            `${this.__baseUrlDartFractal}` +
            `?kind=${FractalType.MANDELBROT}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
      break;    
      case BackendLanguage.GOLANG:
          url =
            `${this.__baseUrlGoLangFractal}` +
            `?kind=${FractalType.MANDELBROT}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
      break;    
      case BackendLanguage.RUSTLANG:
          url =
            `${this.__baseUrlRustLangFractal}` +
            `?kind=${FractalType.MANDELBROT}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
      break;     
     case BackendLanguage.SWIFTLANG:
          url =
            `${this.__baseUrlSwiftLangFractal}` +
            `?kind=${FractalType.MANDELBROT}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
      break;  
     case BackendLanguage.ZIGLANG:
          url =
            `${this.__baseUrlZigLangFractal}` +
            `?kind=${FractalType.MANDELBROT}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
      break;    
    case BackendLanguage.CPP_WS:
          url =
            `${this.__baseUrlCppWebServer}` +
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
      case BackendLanguage.DART:
            url = `${this.__baseUrlDartFractal}` +
            `?kind=${FractalType.BARNSLEY_FERN}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
      break;    
      case BackendLanguage.GOLANG:
            url = `${this.__baseUrlGoLangFractal}` +
            `?kind=${FractalType.BARNSLEY_FERN}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
      break;    
       case BackendLanguage.RUSTLANG:
            url = `${this.__baseUrlRustLangFractal}` +
            `?kind=${FractalType.BARNSLEY_FERN}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
      break;  
      case BackendLanguage.SWIFTLANG:
            url = `${this.__baseUrlSwiftLangFractal}` +
            `?kind=${FractalType.BARNSLEY_FERN}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
      break;     
      case BackendLanguage.ZIGLANG:
            url = `${this.__baseUrlZigLangFractal}` +
            `?kind=${FractalType.BARNSLEY_FERN}` +
            `&xMin=${bounds.xMin}&xMax=${bounds.xMax}` +
            `&yMin=${bounds.yMin}&yMax=${bounds.yMax}` +
            `&maxIterations=${p_fractalParams.maxIterations}` +
            `&zoomInOut=${p_fractalParams.serverZoomIn}` +
            `&zoomStep=${p_fractalParams.serverZoomFactor}` 
      break;           
      case BackendLanguage.CPP_WS:
            url = `${this.__baseUrlCppWebServer}` +
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

  /////////////////////////////////////////////////////////////////////////
  // gRPC  
  /////////////////////////////////////////////////////////////////////////
  
  public GenerateFractalServerGrpc(
    p_fractalParams: FractalParams
  ): Observable<FractalPoint[]> {
    const url = `${this._configService.getConfigValue('baseUrlGoLang')}fractal.FractalService/GetFractal`;
    const bounds = p_fractalParams.isZoomable ?? DEFAULT_BOUNDS_MANDELBROT;
    const GRPC_OFFSET = 3;
    const fractalKind = ((p_fractalParams.selectedFractal) ?? FractalType.MANDELBROT_GRPC) - GRPC_OFFSET;

    const requestPayload = FractalRequest.encode({
      kind: fractalKind,
      maxIterations: p_fractalParams.maxIterations,
      xMin: bounds.xMin,
      xMax: bounds.xMax,
      yMin: bounds.yMin,
      yMax: bounds.yMax
    }).finish();

    // Build the 5-byte gRPC-Web frame header (1 byte flag + 4-byte big-endian length)
    const frame = new Uint8Array(5 + requestPayload.length);
    frame[0] = 0x00;
    const len = requestPayload.length;
    frame[1] = (len >> 24) & 0xFF;
    frame[2] = (len >> 16) & 0xFF;
    frame[3] = (len >> 8) & 0xFF;
    frame[4] = len & 0xFF;
    frame.set(requestPayload, 5);

    // Binary transport — send the frame bytes directly, no base64 involved,
    // so there's no base64 frame-boundary alignment bug possible.
    const headers = new HttpHeaders({
      'Content-Type': 'application/grpc-web+proto',
      'Accept': 'application/grpc-web+proto',
      'X-User-Agent': 'grpc-web-javascript/0.1',
      'X-Grpc-Web': '1'
    });

    return this.http.post(url, frame, {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map((buffer: ArrayBuffer) => this._parseGrpcArrayBuffer(buffer, p_fractalParams.maxIterations, fractalKind)),
      take(1)
    );
  }
  
  private _parseGrpcArrayBuffer(
    buffer: ArrayBuffer,
    maxIterations: number,
    fractalKind: number
  ): FractalPoint[] {
    if (!buffer || buffer.byteLength === 0) {
      console.warn('[gRPC] Empty response buffer — nothing to parse.');
      return [];
    }

    const bytes = new Uint8Array(buffer);
    let offset = 0;
    const dataPoints: FractalPoint[] = [];
    let sawDataFrame = false;

    while (offset + 5 <= bytes.length) {
      const flag = bytes[offset];
      const length =
        ((bytes[offset + 1] << 24) >>> 0) +
        ((bytes[offset + 2] << 16) |
        (bytes[offset + 3] << 8)  |
          bytes[offset + 4]);

      const payloadStart = offset + 5;
      const payloadEnd = payloadStart + length;
      if (payloadEnd > bytes.length) {
        console.error('[gRPC] Frame length overruns buffer — malformed response.', { offset, length, total: bytes.length });
        break;
      }

      const payload = bytes.subarray(payloadStart, payloadEnd);

      if ((flag & 0x80) === 0) {
        sawDataFrame = true;
        const decoded = FractalResponse.decode(payload);
        const points = this._mapBufferToPoints(decoded.points, maxIterations, fractalKind);
        for (let i = 0; i < points.length; i++) {
          dataPoints.push(points[i]);
        }
      } else {
        // Trailer frame — surface the real gRPC status instead of failing silently
        const trailerText  = new TextDecoder().decode(payload);
        const statusMatch  = trailerText.match(/grpc-status:\s*(\d+)/i);
        const messageMatch = trailerText.match(/grpc-message:\s*(.+)/i);
        if (statusMatch && statusMatch[1] !== '0') {
          console.error(`[gRPC] call failed — status ${statusMatch[1]}: ${messageMatch?.[1] ?? trailerText}`);
        }
      }

      offset = payloadEnd;
    }

    if (!sawDataFrame) {
      console.warn('[gRPC] No data frame in response — only trailers, or the buffer was malformed.');
    }

    return dataPoints;
  }

  private _mapBufferToPoints(
    points: { x: number; y: number; intensity: number }[],
    maxIterations: number,
    fractalKind: number
  ): FractalPoint[] {
    return points.map(p => {
      if (fractalKind === 3 /* Leaf/BarnsleyFern on the Go side */) {
        return { x: p.x, y: p.y, value: FERN_SENTINEL, iterations: maxIterations };
      }
      const iter = p.intensity === 0 ? maxIterations : Math.round((p.intensity * maxIterations) / 255);
      return { x: p.x, y: p.y, value: iter, iterations: maxIterations, escaped: p.intensity < 255 };
    });
  }
}