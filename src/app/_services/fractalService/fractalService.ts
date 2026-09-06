import { HttpHeaders } from '@angular/common/http';
import { map, Observable, take } from "rxjs";
import { BaseService } from "../__baseService/base.service";
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ConfigService } from "../__Utils/ConfigService/config.service";
import { BackendLanguage, DEFAULT_BOUNDS_JULIA, DEFAULT_BOUNDS_MANDELBROT, FERN_SENTINEL, FractalBounds, FractalEngine, FractalParams, FractalPoint, FractalType } from "src/app/_engines/fractal.engine";
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
  
  public GenerateFractalServerJulia(
      p_fractalParams : FractalParams
  ): Observable<FractalPoint[]> {
    const bounds : FractalBounds | undefined = p_fractalParams.isZoomable ?? DEFAULT_BOUNDS_JULIA;
    let   url    : string                    = "";

    switch(p_fractalParams.selectedBackend){
      case BackendLanguage.NODEJS:
          url = `${this.__baseUrlNodeJsFractal}julia?xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}`;
      break;
      case BackendLanguage.J2SE:
          url = `${this.__baseUrlJ2seFractal}?kind=${FractalType.JULIA}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;
      case BackendLanguage.KOTLIN:
          url = `${this.__baseUrlKotlinFractal}?kind=${FractalType.JULIA}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;
      case BackendLanguage.DART :
          url = `${this.__baseUrlDartFractal}?kind=${FractalType.JULIA}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break; 
      case BackendLanguage.GOLANG :
          url = `${this.__baseUrlGoLangFractal}?kind=${FractalType.JULIA}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break; 
      case BackendLanguage.RUSTLANG :
          url = `${this.__baseUrlRustLangFractal}?kind=${FractalType.JULIA}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;
     case BackendLanguage.SWIFTLANG :
          url = `${this.__baseUrlSwiftLangFractal}?kind=${FractalType.JULIA}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;     
      case BackendLanguage.ZIGLANG :
          url = `${this.__baseUrlZigLangFractal}?kind=${FractalType.JULIA}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;    
      case BackendLanguage.CPP_WS :
          url = `${this.__baseUrlCppWebServer}?kind=${FractalType.JULIA}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;           
      default : 
          url = `${this.__baseUrlNodeJsFractal}julia?xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}`;
    }

    const rawData$ = this.http.get<{ x: number; y: number; intensity: number }[]>(url);
    return rawData$.pipe(
      map(raw => FractalEngine._adaptRemotePoints(raw, FractalType.JULIA, p_fractalParams.maxIterations))
    );
  }

  public GenerateFractalServerMandelbrot(
      p_fractalParams : FractalParams
  ): Observable<FractalPoint[]> {
    const bounds : FractalBounds | undefined = p_fractalParams.isZoomable ?? DEFAULT_BOUNDS_MANDELBROT;
    let   url    : string                    = "";

    switch(p_fractalParams.selectedBackend){
      case BackendLanguage.NODEJS:
          url = `${this.__baseUrlNodeJsFractal}mandelbrot?xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}`;
      break;
      case BackendLanguage.J2SE:
          url = `${this.__baseUrlJ2seFractal}?kind=${FractalType.MANDELBROT}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;
      case BackendLanguage.KOTLIN:
          url = `${this.__baseUrlKotlinFractal}?kind=${FractalType.MANDELBROT}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;
      case BackendLanguage.DART:
          url = `${this.__baseUrlDartFractal}?kind=${FractalType.MANDELBROT}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;    
      case BackendLanguage.GOLANG:
          url = `${this.__baseUrlGoLangFractal}?kind=${FractalType.MANDELBROT}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;    
      case BackendLanguage.RUSTLANG:
          url = `${this.__baseUrlRustLangFractal}?kind=${FractalType.MANDELBROT}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;     
     case BackendLanguage.SWIFTLANG:
          url = `${this.__baseUrlSwiftLangFractal}?kind=${FractalType.MANDELBROT}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;  
     case BackendLanguage.ZIGLANG:
          url = `${this.__baseUrlZigLangFractal}?kind=${FractalType.MANDELBROT}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;    
    case BackendLanguage.CPP_WS:
          url = `${this.__baseUrlCppWebServer}?kind=${FractalType.MANDELBROT}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;                
      default :
          url = `${this.__baseUrlNodeJsFractal}mandelbrot?xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}`;
    }

    const rawData$ = this.http.get<{ x: number; y: number; intensity: number }[]>(url);
    return rawData$.pipe(
      map(raw => FractalEngine._adaptRemotePoints(raw, FractalType.MANDELBROT, p_fractalParams.maxIterations))
    );
  }

  public GenerateFractalServerBarnsleyFern(p_fractalParams : FractalParams): Observable<FractalPoint[]>{
    const bounds : FractalBounds | undefined = p_fractalParams.isZoomable ?? DEFAULT_BOUNDS_MANDELBROT;
    let   url    : string                    = "";

    switch(p_fractalParams.selectedBackend){
      case BackendLanguage.NODEJS:
            url = `${this.__baseUrlNodeJsFractal}leaf`;      
      break;
      case BackendLanguage.J2SE:
            url = `${this.__baseUrlJ2seFractal}?kind=${FractalType.BARNSLEY_FERN}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;
      case BackendLanguage.KOTLIN:
            url = `${this.__baseUrlKotlinFractal}?kind=${FractalType.BARNSLEY_FERN}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;
      case BackendLanguage.DART:
            url = `${this.__baseUrlDartFractal}?kind=${FractalType.BARNSLEY_FERN}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;    
      case BackendLanguage.GOLANG:
            url = `${this.__baseUrlGoLangFractal}?kind=${FractalType.BARNSLEY_FERN}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;    
       case BackendLanguage.RUSTLANG:
            url = `${this.__baseUrlRustLangFractal}?kind=${FractalType.BARNSLEY_FERN}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;  
      case BackendLanguage.SWIFTLANG:
            url = `${this.__baseUrlSwiftLangFractal}?kind=${FractalType.BARNSLEY_FERN}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;     
      case BackendLanguage.ZIGLANG:
            url = `${this.__baseUrlZigLangFractal}?kind=${FractalType.BARNSLEY_FERN}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;           
      case BackendLanguage.CPP_WS:
            url = `${this.__baseUrlCppWebServer}?kind=${FractalType.BARNSLEY_FERN}&xMin=${bounds.xMin}&xMax=${bounds.xMax}&yMin=${bounds.yMin}&yMax=${bounds.yMax}&maxIterations=${p_fractalParams.maxIterations}&zoomInOut=${p_fractalParams.serverZoomIn}&zoomStep=${p_fractalParams.serverZoomFactor}`;
      break;           
      default : 
            url = `${this.__baseUrlNodeJsFractal}leaf`;      
    }

    const rawData$ = this.http.get<{ x: number; y: number; intensity: number }[]>(url);
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

    const frame = new Uint8Array(5 + requestPayload.length);
    frame[0] = 0x00;
    const len = requestPayload.length;
    frame[1] = (len >> 24) & 0xFF;
    frame[2] = (len >> 16) & 0xFF;
    frame[3] = (len >> 8) & 0xFF;
    frame[4] = len & 0xFF;
    frame.set(requestPayload, 5);

    return new Observable<FractalPoint[]>(observer => {
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/grpc-web+proto',
          'Accept': 'application/grpc-web+proto',
          'X-User-Agent': 'grpc-web-javascript/0.1',
          'X-Grpc-Web': '1'
        },
        body: frame
      })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const buffer = await response.arrayBuffer();
        const points = this._parseGrpcArrayBuffer(buffer, p_fractalParams.maxIterations, fractalKind);
        observer.next(points);
        observer.complete();
      })
      .catch(err => {
        console.error('[gRPC Fetch Error]:', err);
        observer.error(err);
      });
    }).pipe(take(1));
  }
  
private _parseGrpcArrayBuffer(
    buffer: ArrayBuffer,
    maxIterations: number,
    fractalKind: number
  ): FractalPoint[] {
    if (!buffer || buffer.byteLength === 0) {
      console.warn('[gRPC] Empty response buffer received from server (byteLength = 0).');
      return [];
    }

    const dataView = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
    let offset = 0;
    const dataPoints: FractalPoint[] = [];
    let sawDataFrame = false;

    console.log(`[gRPC] Parsing buffer of size ${bytes.length} bytes for fractalKind=${fractalKind}`);

    while (offset + 5 <= bytes.length) {
      const flag = bytes[offset];
      const length = dataView.getUint32(offset + 1, false);

      const payloadStart = offset + 5;
      const payloadEnd = payloadStart + length;
      
      console.log(`[gRPC Frame] Offset: ${offset}, Flag: 0x${flag.toString(16)}, Length: ${length}, PayloadEnd: ${payloadEnd}`);

      if (payloadEnd > bytes.length) {
        console.error('[gRPC] Frame length overruns buffer bounds.', { offset, length, total: bytes.length });
        break;
      }

      const payload = bytes.subarray(payloadStart, payloadEnd);

      if ((flag & 0x80) === 0) {
        sawDataFrame = true;
        try {
          const decoded = FractalResponse.decode(payload);
          console.log('[gRPC] Decoded FractalResponse payload:', decoded);

          const rawPoints = decoded.points ?? (decoded as any).Points ?? [];
          console.log(`[gRPC] Points extracted from frame: ${rawPoints.length}`);

          const points = this._mapBufferToPoints(rawPoints, maxIterations, fractalKind);
          for (let i = 0; i < points.length; i++) {
            dataPoints.push(points[i]);
          }
        } catch (decodeErr) {
          console.error('[gRPC] Failed to decode protobuf payload:', decodeErr);
        }
      } else {
        const trailerText  = new TextDecoder().decode(payload);
        console.warn('[gRPC Trailer]:', trailerText);
        
        const statusMatch  = trailerText.match(/grpc-status:\s*(\d+)/i);
        const messageMatch = trailerText.match(/grpc-message:\s*(.+)/i);
        if (statusMatch && statusMatch[1] !== '0') {
          const errorMessage = `[gRPC] call failed — status ${statusMatch[1]}: ${messageMatch?.[1] ?? trailerText}`;
          console.error(errorMessage);
          throw new Error(errorMessage);
        }
      }

      offset = payloadEnd;
    }

    if (!sawDataFrame) {
      console.warn('[gRPC] No data frame found in response buffer — check server handler stream writing.');
    }

    console.log(`[gRPC] Parsing complete. Total mapped points: ${dataPoints.length}`);
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