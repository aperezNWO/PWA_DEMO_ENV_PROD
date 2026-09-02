import { HttpHeaders } from '@angular/common/http';
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
  private readonly __baseUrlGoLangFractal   = `${this._configService.getConfigValue('baseUrlGoLang')}api/fractals/generate`;  
  private readonly __baseUrlRustLangFractal = `${this._configService.getConfigValue('baseUrlRustLang')}api/fractals/generate`;  
 
 
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
  // RPC  
  /////////////////////////////////////////////////////////////////////////
  private _decodeGrpcResponse(
    responseBuffer: ArrayBuffer,
    maxIterations: number
  ): FractalPoint[] {
    if (!responseBuffer || responseBuffer.byteLength === 0) {
      return [];
    }

    const uint8View = new Uint8Array(responseBuffer);
    let bytes: Uint8Array;

    const rawText = new TextDecoder('utf-8').decode(responseBuffer).trim();
    let base64String = rawText.replace(/\s+/g, '');

    // Check if the payload is actually valid base64 text
    const base64Regex = /^[A-Za-z0-9+\/]*={0,2}$/;
    const isBase64Text = base64String.length > 0 && 
                         base64String.length % 4 === 0 && 
                         base64Regex.test(base64String);

    if (isBase64Text) {
      let binaryString: string;
      try {
        binaryString = atob(base64String);
      } catch (e) {
        console.error('[gRPC Mandelbrot] Base64 decode failed:', e);
        return [];
      }

      bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
    } else {
      // Fallback: Treat buffer directly as raw binary gRPC-web
      bytes = uint8View;
    }

    let offset = 0;
    let dataPoints: FractalPoint[] = [];

    while (offset + 5 <= bytes.length) {
      const flag = bytes[offset];
      const length =
        (bytes[offset + 1] << 24) | (bytes[offset + 2] << 16) |
        (bytes[offset + 3] << 8)  |  bytes[offset + 4];

      const payloadStart = offset + 5;
      const payloadEnd   = payloadStart + length;
      if (payloadEnd > bytes.length) break;

      const payload = bytes.subarray(payloadStart, payloadEnd);

      if ((flag & 0x80) !== 0) {
        const trailerText  = new TextDecoder().decode(payload);
        const statusMatch  = trailerText.match(/grpc-status:\s*(\d+)/i);
        const messageMatch = trailerText.match(/grpc-message:\s*(.+)/i);
        if (statusMatch && statusMatch[1] !== '0') {
          console.error(`[gRPC Mandelbrot] status ${statusMatch[1]}: ${messageMatch?.[1] ?? trailerText}`);
        }
      } else {
        const decoded = FractalResponse.decode(payload);
        const mappedPoints = this._mapBufferToPoints(decoded.points, maxIterations);
        
        // Safely append points using a loop instead of the spread operator
        for (let i = 0; i < mappedPoints.length; i++) {
          dataPoints.push(mappedPoints[i]);
        }
      }

      offset = payloadEnd;
    }

    return dataPoints;
  }

    private _mapBufferToPoints(
      points: { x: number; y: number; intensity: number }[],
      maxIterations: number
    ): FractalPoint[] {
      return points.map(p => ({
        x: p.x,
        y: p.y,
        iterations: p.intensity,
        escaped: p.intensity < maxIterations,
        value: p.intensity
      }));
    }


  public GenerateFractalServerMandelbrotGrpc(
      p_fractalParams: FractalParams
  ): Observable<FractalPoint[]> {
    const url = `${this._configService.getConfigValue('baseUrlGoLang')}fractal.FractalService/GetFractal`;
    const bounds = p_fractalParams.isZoomable ?? DEFAULT_BOUNDS_MANDELBROT;

    // Encode FractalRequest using generated TS classes
    const requestPayload = FractalRequest.encode({
      kind: FractalType.MANDELBROT,
      maxIterations: p_fractalParams.maxIterations,
      xMin: bounds.xMin,
      xMax: bounds.xMax,
      yMin: bounds.yMin,
      yMax: bounds.yMax
    }).finish();

    // Wrap in 5-byte gRPC frame header
    const frame = new Uint8Array(5 + requestPayload.length);
    frame[0] = 0x00; // Data frame
    const len = requestPayload.length;
    frame[1] = (len >> 24) & 0xFF;
    frame[2] = (len >> 16) & 0xFF;
    frame[3] = (len >> 8) & 0xFF;
    frame[4] = len & 0xFF;
    frame.set(requestPayload, 5);

    // Encode gRPC payload to base64 for grpc-web-text header compliance
    const base64Request = btoa(String.fromCharCode(...frame));

    const headers = new HttpHeaders({
      'Content-Type': 'application/grpc-web-text',
      'Accept': 'application/grpc-web-text',
      'X-User-Agent': 'grpc-web-javascript/0.1',
      'X-Grpc-Web': '1'
    });

    return this.http.post(url, base64Request, {
      headers,
      responseType: 'arraybuffer'
    }).pipe(
      map((response: ArrayBuffer) => 
        this._decodeGrpcResponse(response, p_fractalParams.maxIterations)
      )
    );
  }
 
}