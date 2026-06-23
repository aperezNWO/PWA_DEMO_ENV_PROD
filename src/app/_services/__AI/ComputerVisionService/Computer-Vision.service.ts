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
  // OPEN CV -- FRACTALS -- Typescript (Using OpenCV.js)
  ///////////////////////////////////////////////////////////////////

  /**
   * Local TypeScript implementation of fractal generation (runs entirely in browser)
   * Generates a Julia set fractal directly in the browser and returns it as a Blob
   * This is a drop-in replacement for the Node.js version but runs locally
   * @param p_maxIterations - Maximum iterations for the Julia set calculation
   * @param p_realPart - Real part of the complex constant
   * @param p_imagPart - Imaginary part of the complex constant
   * @returns Observable<Blob> - Blob containing the PNG image
   */
  _OpenCv_GetFractal_Typescript(p_maxIterations: number, p_realPart: number, p_imagPart: number): Observable<Blob> {
    // Create an observable that generates the fractal locally
    return new Observable<Blob>((observer) => {
      try {
        // Set canvas dimensions (matching typical fractal size)
        const width = 800;
        const height = 600;
        
        // Create an offscreen canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          observer.error(new Error('Could not get canvas context'));
          return;
        }
        
        // Get image data for direct pixel manipulation
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        
        // Define the complex plane bounds
        const xMin = -1.5;
        const xMax = 1.5;
        const yMin = -1.5;
        const yMax = 1.5;
        
        // Pre-calculate step sizes for better performance
        const xStep = (xMax - xMin) / width;
        const yStep = (yMax - yMin) / height;
        
        // Use the parameters passed to the function
        const maxIterations = p_maxIterations;
        const cReal = p_realPart;
        const cImag = p_imagPart;
        
        console.log(`[TypeScript] Generating fractal locally: ${width}x${height}, maxIterations: ${maxIterations}, c: ${cReal} + ${cImag}i`);
        
        const startTime = performance.now();
        
        // Iterate over each pixel
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            // Map pixel position to a point in the complex plane
            const zx = xMin + x * xStep;
            const zy = yMin + y * yStep;
            
            let zReal = zx;
            let zImag = zy;
            let iteration = 0;
            
            // Iterate the Julia set formula: z = z^2 + c
            while (iteration < maxIterations) {
              // Check if point has escaped (magnitude > 2)
              if ((zReal * zReal + zImag * zImag) > 4.0) {
                break;
              }
              
              // Calculate z^2 + c
              const newReal = zReal * zReal - zImag * zImag + cReal;
              const newImag = 2 * zReal * zImag + cImag;
              
              zReal = newReal;
              zImag = newImag;
              iteration++;
            }
            
            // Get color based on iteration count
            const pixelIndex = (y * width + x) * 4;
            const color = this._getFractalColorRGB(iteration, maxIterations);
            
            data[pixelIndex] = color.r;     // Red
            data[pixelIndex + 1] = color.g; // Green
            data[pixelIndex + 2] = color.b; // Blue
            data[pixelIndex + 3] = 255;     // Alpha
          }
        }
        
        // Put the image data onto the canvas
        ctx.putImageData(imageData, 0, 0);
        
        const endTime = performance.now();
        console.log(`[TypeScript] Fractal generated in ${(endTime - startTime).toFixed(2)}ms`);
        
        // Convert canvas to Blob (PNG format)
        canvas.toBlob((blob) => {
          if (blob) {
            console.log(`[TypeScript] Fractal blob created, size: ${(blob.size / 1024).toFixed(2)} KB`);
            observer.next(blob);
            observer.complete();
          } else {
            observer.error(new Error('Failed to convert canvas to blob'));
          }
        }, 'image/png');
        
      } catch (error) {
        console.error('[TypeScript] Error generating fractal:', error);
        observer.error(error);
      }
    });
  }
  
  /**
   * Promise-based version of the TypeScript fractal generator
   * @param p_maxIterations - Maximum iterations
   * @param p_realPart - Real part of constant
   * @param p_imagPart - Imaginary part of constant
   * @returns Promise<Blob>
   */
  async _OpenCv_GetFractal_Typescript_Promise(
    p_maxIterations: number, 
    p_realPart: number, 
    p_imagPart: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this._OpenCv_GetFractal_Typescript(p_maxIterations, p_realPart, p_imagPart).subscribe({
        next: (blob) => resolve(blob),
        error: (error) => reject(error)
      });
    });
  }
  
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
        const width = params.width || 800;
        const height = params.height || 600;
        const maxIterations = params.maxIterations;
        const cReal = params.realPart;
        const cImag = params.imagPart;
        const zoom = params.zoom || 1.0;
        const centerX = params.centerX || 0.0;
        const centerY = params.centerY || 0.0;
        
        // Calculate complex plane bounds with zoom and pan
        const rangeX = 3.0 / zoom;
        const rangeY = 3.0 / zoom;
        const xMin = centerX - rangeX / 2;
        const xMax = centerX + rangeX / 2;
        const yMin = centerY - rangeY / 2;
        const yMax = centerY + rangeY / 2;
        
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
        const xStep = (xMax - xMin) / width;
        const yStep = (yMax - yMin) / height;
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const zx = xMin + x * xStep;
            const zy = yMin + y * yStep;
            
            let zReal = zx;
            let zImag = zy;
            let iteration = 0;
            
            while (iteration < maxIterations && (zReal * zReal + zImag * zImag) <= 4.0) {
              const newReal = zReal * zReal - zImag * zImag + cReal;
              const newImag = 2 * zReal * zImag + cImag;
              zReal = newReal;
              zImag = newImag;
              iteration++;
            }
            
            const pixelIndex = (y * width + x) * 4;
            const color = this._getFractalColorRGB(iteration, maxIterations);
            
            data[pixelIndex] = color.r;
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
      this._OpenCv_GetFractal_Typescript(param.maxIterations, param.realPart, param.imagPart).toPromise()
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
  // --- NUEVO FLUJO EXCLUSIVO PARA J2SE (SPRING BOOT) ---
  /*
    if (this.selectedImplementation === 'j2se') {
      const url = `https://9cdspc-8081.csb.app/api/fractals/generate?kind=2&zoomInOut=false&zoomStep=1`;
      
      this.http.get<any[]>(url).subscribe({
        next: (points) => {
          const endTime = performance.now();
          this.generationTime = endTime - startTime;
          this.lastImplementationUsed = this.selectedImplementation;

          // Renderiza la matriz JSON en un Canvas bidimensional
          this.renderPointsToImageUrl(points);

          const implLabel = this.implementationOptions.find(opt => opt.value === this.selectedImplementation)?.label;
          this.status_message.set(`[✓ Image generated correctly using ${implLabel} in ${this.generationTime.toFixed(2)}ms]`);
          localStorage.setItem('fractal_implementation', this.selectedImplementation);
        },
        error: (error) => {
          console.error('Error fetching fractal points from Spring Boot:', error);
          this.imageUrl = null;
          this.status_message.set(`[✗ Error occurred with Java J2SE. Please verify port 8081]`);
        }
      });
      return; 
    }
  */
  _OpenCv_GetFractal_j2se(p_maxIterations: number, p_realPart: number, p_imagPart: number): Observable<Blob> {
    // Create an observable that generates the fractal locally
    return new Observable<Blob>((observer) => {
      try {
        // Set canvas dimensions (matching typical fractal size)
        const width = 800;
        const height = 600;
        
        // Create an offscreen canvas
        const canvas  = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          observer.error(new Error('Could not get canvas context'));
          return;
        }
        
        // Get image data for direct pixel manipulation
        const imageData = ctx.createImageData(width, height);
        const data      = imageData.data;
        
        // Define the complex plane bounds
        const xMin = -1.5;
        const xMax = 1.5;
        const yMin = -1.5;
        const yMax = 1.5;
        
        // Pre-calculate step sizes for better performance
        const xStep = (xMax - xMin) / width;
        const yStep = (yMax - yMin) / height;
        
        // Use the parameters passed to the function
        const maxIterations = p_maxIterations;
        const cReal = p_realPart;
        const cImag = p_imagPart;
        
        console.log(`[TypeScript] Generating fractal locally: ${width}x${height}, maxIterations: ${maxIterations}, c: ${cReal} + ${cImag}i`);
        
        const startTime = performance.now();
        
        // Iterate over each pixel
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            // Map pixel position to a point in the complex plane
            const zx = xMin + x * xStep;
            const zy = yMin + y * yStep;
            
            let zReal = zx;
            let zImag = zy;
            let iteration = 0;
            
            // Iterate the Julia set formula: z = z^2 + c
            while (iteration < maxIterations) {
              // Check if point has escaped (magnitude > 2)
              if ((zReal * zReal + zImag * zImag) > 4.0) {
                break;
              }
              
              // Calculate z^2 + c
              const newReal = zReal * zReal - zImag * zImag + cReal;
              const newImag = 2 * zReal * zImag + cImag;
              
              zReal = newReal;
              zImag = newImag;
              iteration++;
            }
            
            // Get color based on iteration count
            const pixelIndex = (y * width + x) * 4;
            const color = this._getFractalColorRGB(iteration, maxIterations);
            
            data[pixelIndex] = color.r;     // Red
            data[pixelIndex + 1] = color.g; // Green
            data[pixelIndex + 2] = color.b; // Blue
            data[pixelIndex + 3] = 255;     // Alpha
          }
        }
        
        // Put the image data onto the canvas
        ctx.putImageData(imageData, 0, 0);
        
        const endTime = performance.now();
        console.log(`[TypeScript] Fractal generated in ${(endTime - startTime).toFixed(2)}ms`);
        
        // Convert canvas to Blob (PNG format)
        canvas.toBlob((blob) => {
          if (blob) {
            console.log(`[TypeScript] Fractal blob created, size: ${(blob.size / 1024).toFixed(2)} KB`);
            observer.next(blob);
            observer.complete();
          } else {
            observer.error(new Error('Failed to convert canvas to blob'));
          }
        }, 'image/png');
        
      } catch (error) {
        console.error('[TypeScript] Error generating fractal:', error);
        observer.error(error);
      }
    });
  }
  
}