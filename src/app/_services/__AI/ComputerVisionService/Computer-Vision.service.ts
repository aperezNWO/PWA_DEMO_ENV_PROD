import { Injectable, inject } from '@angular/core';
import { HttpClient         } from '@angular/common/http';
import { Observable         } from 'rxjs';
import { ConfigService      } from '../../__Utils/ConfigService/config.service';
import { BaseService        } from '../../__baseService/base.service';
import { OCRResponse        } from '../OCRService/ocr.service';

@Injectable({ providedIn: 'root' })
export class ComputerVisionService extends BaseService {

  //
  private readonly http                  = inject(HttpClient);
  private readonly _configService        = inject(ConfigService);
  private readonly __baseUrlCPP          = `${this._configService.getConfigValue('baseUrlNetCoreCPPEntry')}api/computervision/`;
  private readonly __baseUrlNodeJsOpenCv = `${this._configService.getConfigValue('baseUrlNodeJsOcr')}api/OpenCv/`;
  
  //////////////////////////////////////////////////////////////
  // --- OPENCV -- SHAPES -- CPP LOGIC ---
  //////////////////////////////////////////////////////////////
  //
  _OpenCv_GetAppVersion(): Observable<string> {
    return this.http.get<string>(`${this.__baseUrlCPP}GetAppVersion`, this.HTTPOptions_Text);
  }
  //
  _OpenCv_GetAPIVersion(): Observable<string> {
    return this.http.get<string>(`${this.__baseUrlCPP}GetAPIVersion`, this.HTTPOptions_Text);
  }
  //
  _OpenCv_GetCPPSTDVersion(): Observable<string> {
    return this.http.get<string>(`${this.__baseUrlCPP}GetCPPSTDVersion`, this.HTTPOptions_Text);
  }
  //
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

    const src = cv.imread(imageElement);
    const gray = new cv.Mat();
    const edges = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
    cv.Canny(gray, edges, 50, 150, 3, false);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    for (let i = 0; i < contours.size(); i++) {
      const approx = new cv.Mat();
      cv.approxPolyDP(contours.get(i), approx, 0.04 * cv.arcLength(contours.get(i), true), true);
      if (approx.rows === 3) shapes.push('[Triangle]');
      else if (approx.rows === 4) shapes.push('[Rectangle/Square]');
      else if (approx.rows > 4) shapes.push('[Circle]');
      approx.delete();
    }
    src.delete(); gray.delete(); edges.delete(); contours.delete(); hierarchy.delete();
    return shapes;
  }

  uploadBase64ImageNodeJs(base64Image: string): Observable<OCRResponse> {
    const nodeUrl     = `${this.__baseUrlNodeJsOpenCv}uploadCV`;
    return this.http.post<OCRResponse>(nodeUrl, { base64Image });
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
  // FRACTALS -- Typescript (Using pure math)
  ///////////////////////////////////////////////////////////////////
   /**
   * Helper method to get RGB color for fractal (same algorithm as C++ code)
   * @param iteration - Current iteration count
   * @param maxIterations - Maximum iterations
   * @returns RGB color object
   */
  public _getFractalColorRGB(iteration: number, maxIterations: number): { r: number; g: number; b: number } {
    if (iteration === maxIterations) {
      return { r: 0, g: 0, b: 0 }; // Black for points inside the set
    }
    
    // Map iteration count to RGB (same algorithm as C++ code)
    const t = iteration / maxIterations;
    const r = Math.floor(9 * (1 - t) * t * t * t * 255);
    const g = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255);
    const b = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255);
    
    return { r, g, b };
  }
  
  /**
   * Router/Proxy Method for Local Browser TypeScript Engine.
   */
  GetFractal_Typescript(
    p_maxIterations: number, 
    p_realPart: number, 
    p_imagPart: number, 
    p_fractalType: number,
    p_bounds?: { xMin: number, xMax: number, yMin: number, yMax: number }
  ): Observable<Blob> {
    switch (p_fractalType) {
      case 1: // Mandelbrot Set
        return this.GetFractal_Typescript_Manderblot(p_maxIterations, p_bounds);
      case 2: // Julia Set
        return this.GetFractal_Typescript_Julia(p_maxIterations, p_realPart, p_imagPart);
      default:
        return this.GetFractal_Typescript_Julia(p_maxIterations, p_realPart, p_imagPart);
    }
  }

  /**
   * Specialized Loop Engine for the Mandelbrot Fractal Formula
   */
  GetFractal_Typescript_Manderblot(
    p_maxIterations: number,
    p_bounds?: { xMin: number, xMax: number, yMin: number, yMax: number }
  ): Observable<Blob> {
    const defaultBounds = { xMin: -2.0, xMax: 1.0, yMin: -1.2, yMax: 1.2 };
    const activeBounds = p_bounds || defaultBounds;

    return this._renderTSCanvasPipeline(p_maxIterations, (cx, cy) => {
      let zReal = 0.0;
      let zImag = 0.0;
      let iteration = 0;

      while (iteration < p_maxIterations) {
        if ((zReal * zReal + zImag * zImag) > 4.0) break;

        const newReal = zReal * zReal - zImag * zImag + cx;
        const newImag = 2 * zReal * zImag + cy;

        zReal = newReal;
        zImag = newImag;
        iteration++;
      }
      return iteration;
    }, activeBounds);
  }

  /**
   * Specialized Loop Engine for the Julia Fractal Formula
   */
  GetFractal_Typescript_Julia(p_maxIterations: number, p_realPart: number, p_imagPart: number): Observable<Blob> {
    return this._renderTSCanvasPipeline(p_maxIterations, (zx, zy) => {
      let zReal = zx;
      let zImag = zy;
      let iteration = 0;

      while (iteration < p_maxIterations) {
        if ((zReal * zReal + zImag * zImag) > 4.0) break;

        const newReal = zReal * zReal - zImag * zImag + p_realPart;
        const newImag = 2 * zReal * zImag + p_imagPart;

        zReal = newReal;
        zImag = newImag;
        iteration++;
      }
      return iteration;
    });
  }

  /**
   * Private Shared Web-Canvas Buffer Pipeline.
   */
  private _renderTSCanvasPipeline(
    p_maxIterations: number,
    p_pixelFormula: (xCoord: number, yCoord: number) => number,
    p_bounds = { xMin: -1.5, xMax: 1.5, yMin: -1.5, yMax: 1.5 }
  ): Observable<Blob> {
    return new Observable<Blob>((observer) => {
      try {
        const width = 800;
        const height = 600;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          observer.error(new Error('Could not get canvas context'));
          return;
        }

        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        const xStep = (p_bounds.xMax - p_bounds.xMin) / width;
        const yStep = (p_bounds.yMax - p_bounds.yMin) / height;

        const startTime = performance.now();

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const compX = p_bounds.xMin + x * xStep;
            const compY = p_bounds.yMin + y * yStep;

            const iterationsExecuted = p_pixelFormula(compX, compY);

            const pixelIndex = (y * width + x) * 4;
            const color = this._getFractalColorRGB(iterationsExecuted, p_maxIterations);

            data[pixelIndex]     = color.r;
            data[pixelIndex + 1] = color.g;
            data[pixelIndex + 2] = color.b;
            data[pixelIndex + 3] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const endTime = performance.now();
        console.log(`[TS Engine] Execution cycle completed in ${(endTime - startTime).toFixed(2)}ms`);

        canvas.toBlob((blob) => {
          if (blob) {
            observer.next(blob);
            observer.complete();
          } else {
            observer.error(new Error('Failed to assemble canvas image stream data'));
          }
        }, 'image/png');

      } catch (error) {
        observer.error(error);
      }
    });
  }
  
  /**
   * TypeScript version with advanced parameters (zoom, pan, custom dimensions)
   * @param params - Advanced parameters
   * @returns Observable<Blob>
   */
  _OpenCv_GetFractal_Typescript_Advanced(params: {
    maxIterations: number;
    realPart: number;
    imagPart: number;
    width?: number;
    height?: number;
    zoom?: number;
    centerX?: number;
    centerY?: number;
  }): Observable<Blob> {
    return new Observable<Blob>((observer) => {
      try {
        const width         = params.width || 800;
        const height        = params.height || 600;
        const maxIterations = params.maxIterations;
        const cReal         = params.realPart;
        const cImag         = params.imagPart;
        const zoom          = params.zoom || 1.0;
        const centerX       = params.centerX || 0.0;
        const centerY       = params.centerY || 0.0;
        
        // Calculate complex plane bounds with zoom and pan
        const rangeX = 3.0 / zoom;
        const rangeY = 3.0 / zoom;
        const xMin = centerX - rangeX / 2;
        const xMax = centerX + rangeX / 2;
        const yMin = centerY - rangeY / 2;
        const yMax = centerY + rangeY / 2;
        
        const canvas  = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          observer.error(new Error('Could not get canvas context'));
          return;
        }
        
        const imageData = ctx.createImageData(width, height);
        const data      = imageData.data;
        const xStep     = (xMax - xMin) / width;
        const yStep     = (yMax - yMin) / height;
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {

            //
            const zx = xMin + x * xStep;
            const zy = yMin + y * yStep;
            
            //
            let zReal = zx;
            let zImag = zy;
            let iteration = 0;
            
            //
            while (iteration < maxIterations && (zReal * zReal + zImag * zImag) <= 4.0) {
              const newReal = zReal * zReal - zImag * zImag + cReal;
              const newImag = 2 * zReal * zImag + cImag;
              zReal         = newReal;
              zImag         = newImag;
              iteration++;
            }
            
            //
            const pixelIndex = (y * width + x) * 4;
            const color      = this._getFractalColorRGB(iteration, maxIterations);
            
            //
            data[pixelIndex]     = color.r;
            data[pixelIndex + 1] = color.g;
            data[pixelIndex + 2] = color.b;
            data[pixelIndex + 3] = 255;
          }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            observer.next(blob);
            observer.complete();
          } else {
            observer.error(new Error('Failed to convert canvas to blob'));
          }
        }, 'image/png');
        
      } catch (error) {
        observer.error(error);
      }
    });
  }
  
  /**
   * Batch generate multiple fractals using TypeScript implementation
   * @param params - Array of parameters for each fractal
   * @returns Observable<Blob[]>
   */
  _OpenCv_GetFractal_Typescript_Batch(
    params: Array<{maxIterations: number, realPart: number, imagPart: number}>
  ): Observable<Blob[]> {
    const requests = params.map(param => 
      this.GetFractal_Typescript_Julia(param.maxIterations, param.realPart, param.imagPart).toPromise()
    );
    
    return new Observable<Blob[]>((observer) => {
      Promise.all(requests)
        .then(blobs => {
          observer.next(blobs as Blob[]);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }
  //-------------------------------------------------------------------
  // J2SE
  //-------------------------------------------------------------------
  //
  /**
   * Router/Proxy Method for J2SE Spring Boot Engine.
   * Dispatches the request to the specific renderer based on the selected fractal type.
   * @param p_maxIterations - Maximum execution iterations for color scaling
   * @param p_fractalType - The active type selection from the form (Enum matching FractalType)
   */
  GetFractal_j2se(p_maxIterations: number, p_fractalType: number): Observable<Blob> {
    console.info(`selected fractal for j2se : ${p_fractalType}`)
    switch (p_fractalType) {
      case 2: // Julia Set
        return this.GetFractal_Julia_j2se(p_maxIterations);
      case 3: // Barnsley Leaf Set
        return this.GenerateFractal_Leaf_j2se(p_maxIterations);
      default:
        console.warn(`[J2SE Proxy] Unhandled fractal type: ${p_fractalType}. Falling back to Julia.`);
        return this.GetFractal_Julia_j2se(p_maxIterations);
    }
  }

  /**
   * Specialized Renderer for the Julia Fractal Engine (kind=2)
   */
  GetFractal_Julia_j2se(p_maxIterations: number): Observable<Blob> {
    const url = `${this._configService.getConfigValue('baseUrlSpringBootJava')}api/fractals/generate?kind=2&zoomInOut=false&zoomStep=1`;
    return this._renderJ2SECanvasPipeline(url, p_maxIterations);
  }

  /**
   * Specialized Renderer for the Iterated Function System Leaf Fractal Engine (kind=3)
   */
  GenerateFractal_Leaf_j2se(p_maxIterations: number): Observable<Blob> {
    const url = `${this._configService.getConfigValue('baseUrlSpringBootJava')}api/fractals/generate?kind=3&zoomInOut=false&zoomStep=1`;
    return this._renderJ2SECanvasPipeline(url, p_maxIterations);
  }

  /**
   * Private Shared Pipeline Utility
   * Prevents code duplication by handling the uniform canvas rendering loop and Blob creation.
   */
  private _renderJ2SECanvasPipeline(p_url: string, p_maxIterations: number): Observable<Blob> {
    return new Observable<Blob>((observer) => {
      const width = 800;
      const height = 600;

      this.http.get<any[]>(p_url).subscribe({
        next: (points) => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              observer.error(new Error('Could not get canvas context'));
              return;
            }

            // Fill background
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, width, height);

            const imageData = ctx.createImageData(width, height);
            const data = imageData.data;

            // Fill Alpha
            for (let i = 3; i < data.length; i += 4) {
              data[i] = 255;
            }

            // Process coordinates
            points.forEach(point => {
              if (point.x >= 0 && point.x < width && point.y >= 0 && point.y < height) {
                const calculatedIteration = Math.round((point.intensity * p_maxIterations) / 255);
                const finalIteration = point.intensity === 0 ? p_maxIterations : calculatedIteration;

                const color = this._getFractalColorRGB(finalIteration, p_maxIterations);
                const pixelIndex = (point.y * width + point.x) * 4;

                data[pixelIndex]     = color.r;
                data[pixelIndex + 1] = color.g;
                data[pixelIndex + 2] = color.b;
              }
            });

            ctx.putImageData(imageData, 0, 0);

            canvas.toBlob((blob) => {
              if (blob) {
                observer.next(blob);
                observer.complete();
              } else {
                observer.error(new Error('Failed to convert canvas to blob'));
              }
            }, 'image/png');

          } catch (innerError) {
            observer.error(innerError);
          }
        },
        error: (networkError) => {
          console.error('[J2SE Pipeline] Fetching error:', networkError);
          observer.error(networkError);
        }
      });
    });
  }
}