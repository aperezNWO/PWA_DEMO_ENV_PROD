import { Injectable, inject } from '@angular/core';
import { HttpClient         } from '@angular/common/http';
import { Observable         } from 'rxjs';
import { ConfigService      } from '../../__Utils/ConfigService/config.service';
import { BaseService        } from '../../__baseService/base.service';
import { OCRResponse        } from '../OCRService/ocr.service';

@Injectable({ providedIn: 'root' })
export class ComputerVisionService extends BaseService {

  //
  private readonly http            = inject(HttpClient);
  private readonly _configService  = inject(ConfigService);
  private readonly __baseUrlCPP    = `${this._configService.getConfigValue('baseUrlNetCoreCPPEntry')}api/computervision/`;
  private readonly __baseUrlNodeJs = `${this._configService.getConfigValue('baseUrlNodeJs')}api/fractals/`;


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
  // --- OPENCV -- SHAPES -- TYPESCRIPT LOCAL LOGIC ---
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
    const nodeUrl = `${this._configService.getConfigValue('baseUrlNodeJsOcr')}uploadCV`;
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
    const url = `${this.__baseUrlNodeJs}generatejuliaparams/?maxIterations=${p_maxIterations}&realPart=${p_realPart}&imagPart=${p_imagPart}`;
    return this.http.get(url, { responseType: 'blob' });
  }
}