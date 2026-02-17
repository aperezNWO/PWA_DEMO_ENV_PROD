import { Injectable, inject } from '@angular/core'; // [v21x] 'inject' is the modern standard for Functional DI
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfigService } from '../../__Utils/ConfigService/config.service';
import { BaseService } from '../../__baseService/base.service';

/** * [v21x] STRONGLY TYPED INTERFACES
 * While interfaces aren't new, modern Angular strictly enforces types in templates.
 * Defining this ensures 'Property message does not exist' errors never happen in HTML.
 */
export interface OCRResponse {
  message: string;
  status?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class OCRService extends BaseService {
  /**
   * [v21x] FUNCTIONAL DEPENDENCY INJECTION
   * Replacing 'constructor(private http: HttpClient)' with 'inject(HttpClient)'.
   * This allows the service to be used in functional providers and reduces 
   * boilerplate code significantly.
   */
  private readonly http = inject(HttpClient);
  private readonly _configService = inject(ConfigService);

  /**
   * [v21x] DECLARATIVE PROPERTY INITIALIZATION
   * Using 'readonly' with 'inject' ensures these values are immutable 
   * once the service is instantiated, improving thread safety and predictability.
   */
  private readonly __baseUrl = `${this._configService.getConfigValue('baseUrlNetCoreCPPEntry')}api/ocr/`;

  // --- GET METHODS (Return Observables for VersionCacheService compatibility) ---

  /**
   * [v21x] OBSERVABLE-SIGNAL INTEROP READY
   * By returning Observables here, these methods remain compatible with 
   * v21 features like 'rxResource' and 'toSignal' used in your components.
   */
  _GetTesseract_CPPSTDVersion(): Observable<string> {
    return this.http.get<string>(`${this.__baseUrl}GetCPPSTDVersion`, this.HTTPOptions_Text);
  }

  _GetTesseract_AppVersion(): Observable<string> {
    return this.http.get<string>(`${this.__baseUrl}GetAppVersion`, this.HTTPOptions_Text);
  }

  _GetTesseract_APIVersion(): Observable<string> {
    return this.http.get<string>(`${this.__baseUrl}GetAPIVersion`, this.HTTPOptions_Text);
  }

  // --- POST METHODS (Typed for Property Safety) ---

  /**
   * [v21x] TYPE-SAFE HTTP GENERICS
   * By passing <OCRResponse> to the .post call, the compiler now 'knows' 
   * the shape of the data before the server even responds. This is vital 
   * for v21 template type checking (Strict Mode).
   */
  uploadBase64ImageCPP(base64Image: string): Observable<OCRResponse> {
    return this.http.post<OCRResponse>(`${this.__baseUrl}upload`, { base64Image });
  }

  uploadBase64ImageNodeJs(base64Image: string): Observable<OCRResponse> {
    const nodeUrl = `${this._configService.getConfigValue('baseUrlNodeJsOcr')}upload`;
    return this.http.post<OCRResponse>(nodeUrl, { base64Image });
  }
}