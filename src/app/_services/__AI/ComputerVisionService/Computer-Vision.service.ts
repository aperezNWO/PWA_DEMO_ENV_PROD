import { Injectable, inject } from '@angular/core';
import { HttpClient         } from '@angular/common/http';
import { Observable         } from 'rxjs';
import { ConfigService      } from '../../__Utils/ConfigService/config.service';
import { BaseService        } from '../../__baseService/base.service';
import { OCRResponse        } from '../OCRService/ocr.service';

@Injectable({ providedIn: 'root' })
export class ComputerVisionService extends BaseService {

  private readonly http                  = inject(HttpClient);
  private readonly _configService        = inject(ConfigService);
  private readonly __baseUrlCPP          = `${this._configService.getConfigValue('baseUrlNetCoreCPPEntry')}api/computervision/`;
  private readonly __baseUrlNodeJsOpenCv = `${this._configService.getConfigValue('baseUrlNodeJsOcr')}api/OpenCv/`;

  //////////////////////////////////////////////////////////////
  // --- OPENCV -- SHAPES -- CPP LOGIC ---
  //////////////////////////////////////////////////////////////

  _OpenCv_GetAppVersion(): Observable<string> {
    return this.http.get<string>(`${this.__baseUrlCPP}GetAppVersion`, this.HTTPOptions_Text);
  }

  _OpenCv_GetAPIVersion(): Observable<string> {
    return this.http.get<string>(`${this.__baseUrlCPP}GetAPIVersion`, this.HTTPOptions_Text);
  }

  _OpenCv_GetCPPSTDVersion(): Observable<string> {
    return this.http.get<string>(`${this.__baseUrlCPP}GetCPPSTDVersion`, this.HTTPOptions_Text);
  }

  _OpenCv_CPP_uploadBase64Image(base64Image: string): Observable<OCRResponse> {
    return this.http.post<OCRResponse>(`${this.__baseUrlCPP}uploadOpenCv`, { base64Image });
  }

  //////////////////////////////////////////////////////////////
  // --- OPENCV -- SHAPES -- TYPESCRIPT
  //////////////////////////////////////////////////////////////

  _OpenCv_ts_detectShapes(imageElement: HTMLImageElement): string[] {
    const shapes: string[] = [];
    const cv = (window as any).cv;
    if (!cv) return ['OpenCV not loaded'];

    const src       = cv.imread(imageElement);
    const gray      = new cv.Mat();
    const edges     = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    cv.Canny(gray, edges, 50, 150, 3, false);

    const contours  = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    for (let i = 0; i < contours.size(); i++) {
      const approx = new cv.Mat();
      cv.approxPolyDP(contours.get(i), approx, 0.04 * cv.arcLength(contours.get(i), true), true);
      if      (approx.rows === 3) shapes.push('[Triangle]');
      else if (approx.rows === 4) shapes.push('[Rectangle/Square]');
      else if (approx.rows  >  4) shapes.push('[Circle]');
      approx.delete();
    }
    src.delete(); gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
    return shapes;
  }

  uploadBase64ImageNodeJs(base64Image: string): Observable<OCRResponse> {
    return this.http.post<OCRResponse>(`${this.__baseUrlNodeJsOpenCv}uploadCV`, { base64Image });
  }

  ///////////////////////////////////////////////////////////////////
  // OPEN CV -- FRACTALS -- CPP
  ///////////////////////////////////////////////////////////////////

  _OpenCv_GetFractal_CPP(p_maxIterations: number, p_realPart: number, p_imagPart: number): Observable<Blob> {
    const url = `${this.__baseUrlCPP}generatejuliaparams/?maxIterations=${p_maxIterations}&realPart=${p_realPart}&imagPart=${p_imagPart}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  ///////////////////////////////////////////////////////////////////
  // OPEN CV -- FRACTALS -- Node.js
  ///////////////////////////////////////////////////////////////////

  _OpenCv_GetFractal_NodeJs(p_maxIterations: number, p_realPart: number, p_imagPart: number): Observable<Blob> {
    const url = `${this.__baseUrlNodeJsOpenCv}generatejuliaImage/?maxIterations=${p_maxIterations}&realPart=${p_realPart}&imagPart=${p_imagPart}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  ///////////////////////////////////////////////////////////////////
  // FRACTALS -- TypeScript (pure math)
  ///////////////////////////////////////////////////////////////////

  public _getFractalColorRGB(iteration: number, maxIterations: number): { r: number; g: number; b: number } {
    if (iteration === maxIterations) return { r: 0, g: 0, b: 0 };
    const t = iteration / maxIterations;
    return {
      r: Math.floor(9  * (1 - t) * t * t * t * 255),
      g: Math.floor(15 * (1 - t) * (1 - t) * t * t * 255),
      b: Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255),
    };
  }

  /**
   * Router/Proxy for the local TypeScript engine.
   * Now accepts an optional `bounds` parameter so both Mandelbrot AND Julia
   * support zoom/pan from the component layer.
   */
  GetFractal_Typescript(
    p_maxIterations : number,
    p_realPart      : number,
    p_imagPart      : number,
    p_fractalType   : number,
    p_bounds?       : { xMin: number; xMax: number; yMin: number; yMax: number }
  ): Observable<Blob> {
    switch (p_fractalType) {
      case 1:  return this.GetFractal_Typescript_Manderblot(p_maxIterations, p_bounds);
      case 2:  return this.GetFractal_Typescript_Julia(p_maxIterations, p_realPart, p_imagPart, p_bounds);
      default: return this.GetFractal_Typescript_Julia(p_maxIterations, p_realPart, p_imagPart, p_bounds);
    }
  }

  GetFractal_Typescript_Manderblot(
    p_maxIterations : number,
    p_bounds?       : { xMin: number; xMax: number; yMin: number; yMax: number }
  ): Observable<Blob> {
    const activeBounds = p_bounds ?? { xMin: -2.0, xMax: 1.0, yMin: -1.2, yMax: 1.2 };
    return this._renderTSCanvasPipeline(p_maxIterations, (cx, cy) => {
      let zReal = 0, zImag = 0, iter = 0;
      while (iter < p_maxIterations) {
        if (zReal * zReal + zImag * zImag > 4.0) break;
        const nr = zReal * zReal - zImag * zImag + cx;
        const ni = 2 * zReal * zImag + cy;
        zReal = nr; zImag = ni; iter++;
      }
      return iter;
    }, activeBounds);
  }

  /**
   * Julia renderer — now accepts optional bounds for zoom/pan.
   * Default bounds show the classic [-1.5, 1.5] x [-1.5, 1.5] view.
   */
  GetFractal_Typescript_Julia(
    p_maxIterations : number,
    p_realPart      : number,
    p_imagPart      : number,
    p_bounds?       : { xMin: number; xMax: number; yMin: number; yMax: number }
  ): Observable<Blob> {
    const activeBounds = p_bounds ?? { xMin: -1.5, xMax: 1.5, yMin: -1.5, yMax: 1.5 };
    return this._renderTSCanvasPipeline(p_maxIterations, (zx, zy) => {
      let zReal = zx, zImag = zy, iter = 0;
      while (iter < p_maxIterations) {
        if (zReal * zReal + zImag * zImag > 4.0) break;
        const nr = zReal * zReal - zImag * zImag + p_realPart;
        const ni = 2 * zReal * zImag + p_imagPart;
        zReal = nr; zImag = ni; iter++;
      }
      return iter;
    }, activeBounds);
  }

  /** Shared canvas pipeline — used by both Mandelbrot and Julia. */
  private _renderTSCanvasPipeline(
    p_maxIterations : number,
    p_pixelFormula  : (x: number, y: number) => number,
    p_bounds        = { xMin: -1.5, xMax: 1.5, yMin: -1.5, yMax: 1.5 }
  ): Observable<Blob> {
    return new Observable<Blob>((observer) => {
      try {
        const width  = 800;
        const height = 600;
        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { observer.error(new Error('Could not get canvas context')); return; }

        const imageData = ctx.createImageData(width, height);
        const data      = imageData.data;
        const xStep     = (p_bounds.xMax - p_bounds.xMin) / width;
        const yStep     = (p_bounds.yMax - p_bounds.yMin) / height;

        const t0 = performance.now();
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const iter  = p_pixelFormula(p_bounds.xMin + x * xStep, p_bounds.yMin + y * yStep);
            const idx   = (y * width + x) * 4;
            const color = this._getFractalColorRGB(iter, p_maxIterations);
            data[idx]     = color.r;
            data[idx + 1] = color.g;
            data[idx + 2] = color.b;
            data[idx + 3] = 255;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        console.log(`[TS Engine] ${(performance.now() - t0).toFixed(2)}ms`);

        canvas.toBlob((blob) => {
          if (blob) { observer.next(blob); observer.complete(); }
          else        observer.error(new Error('Failed to assemble canvas image stream data'));
        }, 'image/png');
      } catch (e) { observer.error(e); }
    });
  }

  _OpenCv_GetFractal_Typescript_Advanced(params: {
    maxIterations : number;
    realPart      : number;
    imagPart      : number;
    width?        : number;
    height?       : number;
    zoom?         : number;
    centerX?      : number;
    centerY?      : number;
  }): Observable<Blob> {
    return new Observable<Blob>((observer) => {
      try {
        const width  = params.width  ?? 800;
        const height = params.height ?? 600;
        const zoom   = params.zoom   ?? 1.0;
        const cx     = params.centerX ?? 0.0;
        const cy     = params.centerY ?? 0.0;
        const rangeX = 3.0 / zoom, rangeY = 3.0 / zoom;
        const bounds = { xMin: cx - rangeX/2, xMax: cx + rangeX/2, yMin: cy - rangeY/2, yMax: cy + rangeY/2 };

        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { observer.error(new Error('Could not get canvas context')); return; }

        const imageData = ctx.createImageData(width, height);
        const data      = imageData.data;
        const xStep = (bounds.xMax - bounds.xMin) / width;
        const yStep = (bounds.yMax - bounds.yMin) / height;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            let zReal = bounds.xMin + x * xStep;
            let zImag = bounds.yMin + y * yStep;
            let iter  = 0;
            while (iter < params.maxIterations && zReal*zReal + zImag*zImag <= 4.0) {
              const nr = zReal*zReal - zImag*zImag + params.realPart;
              zImag    = 2*zReal*zImag + params.imagPart;
              zReal    = nr; iter++;
            }
            const idx   = (y * width + x) * 4;
            const color = this._getFractalColorRGB(iter, params.maxIterations);
            data[idx] = color.r; data[idx+1] = color.g; data[idx+2] = color.b; data[idx+3] = 255;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) { observer.next(blob); observer.complete(); }
          else        observer.error(new Error('Failed to convert canvas to blob'));
        }, 'image/png');
      } catch (e) { observer.error(e); }
    });
  }

  _OpenCv_GetFractal_Typescript_Batch(
    params: Array<{ maxIterations: number; realPart: number; imagPart: number }>
  ): Observable<Blob[]> {
    const requests = params.map(p =>
      this.GetFractal_Typescript_Julia(p.maxIterations, p.realPart, p.imagPart).toPromise()
    );
    return new Observable<Blob[]>((observer) => {
      Promise.all(requests)
        .then(blobs => { observer.next(blobs as Blob[]); observer.complete(); })
        .catch(e    => observer.error(e));
    });
  }

  //-------------------------------------------------------------------
  // J2SE
  //-------------------------------------------------------------------

  GetFractal_j2se(p_maxIterations: number, p_fractalType: number): Observable<Blob> {
    console.info(`selected fractal for j2se : ${p_fractalType}`);
    switch (p_fractalType) {
      case 2:  return this.GetFractal_Julia_j2se(p_maxIterations);
      case 3:  return this.GenerateFractal_Leaf_j2se(p_maxIterations);
      default:
        console.warn(`[J2SE Proxy] Unhandled fractal type: ${p_fractalType}. Falling back to Julia.`);
        return this.GetFractal_Julia_j2se(p_maxIterations);
    }
  }

  GetFractal_Julia_j2se(p_maxIterations: number): Observable<Blob> {
    const url = `${this._configService.getConfigValue('baseUrlSpringBootJava')}api/fractals/generate?kind=2&zoomInOut=false&zoomStep=1`;
    return this._renderJ2SECanvasPipeline(url, p_maxIterations);
  }

  GenerateFractal_Leaf_j2se(p_maxIterations: number): Observable<Blob> {
    const url = `${this._configService.getConfigValue('baseUrlSpringBootJava')}api/fractals/generate?kind=3&zoomInOut=false&zoomStep=1`;
    return this._renderJ2SECanvasPipeline(url, p_maxIterations);
  }

  private _renderJ2SECanvasPipeline(p_url: string, p_maxIterations: number): Observable<Blob> {
    return new Observable<Blob>((observer) => {
      const width = 800, height = 600;
      this.http.get<any[]>(p_url).subscribe({
        next: (points) => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { observer.error(new Error('Could not get canvas context')); return; }

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);
            const imageData = ctx.createImageData(width, height);
            const data      = imageData.data;
            for (let i = 3; i < data.length; i += 4) data[i] = 255;

            points.forEach(point => {
              if (point.x >= 0 && point.x < width && point.y >= 0 && point.y < height) {
                const calcIter  = Math.round((point.intensity * p_maxIterations) / 255);
                const finalIter = point.intensity === 0 ? p_maxIterations : calcIter;
                const color     = this._getFractalColorRGB(finalIter, p_maxIterations);
                const idx       = (point.y * width + point.x) * 4;
                data[idx] = color.r; data[idx+1] = color.g; data[idx+2] = color.b;
              }
            });
            ctx.putImageData(imageData, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) { observer.next(blob); observer.complete(); }
              else        observer.error(new Error('Failed to convert canvas to blob'));
            }, 'image/png');
          } catch (e) { observer.error(e); }
        },
        error: (e) => { console.error('[J2SE Pipeline] Fetching error:', e); observer.error(e); }
      });
    });
  }
}