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
      // Convert ArrayBuffer to raw ASCII string (handles gRPC-Web text encoding)
      const textDecoder = new TextDecoder('ascii');
      const rawText = textDecoder.decode(responseBuffer).trim();

      if (!rawText) {
        return [];
      }

      // Decode gRPC-Web base64 transport payload
      const binaryString = atob(rawText);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      if (bytes.length < 5) {
        return [];
      }

      // Strip 5-byte gRPC framing header (1 byte flag + 4 bytes big-endian length)
      const length = (bytes[1] << 24) | (bytes[2] << 16) | (bytes[3] << 8) | bytes[4];
      const protobufPayload = bytes.subarray(5, 5 + length);

      // Deserialize Protobuf payload using generated ts-proto / protobuf decoder
      const decodedResponse = FractalResponse.decode(protobufPayload);

      return this._mapBufferToPoints(decodedResponse.points, maxIterations);
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