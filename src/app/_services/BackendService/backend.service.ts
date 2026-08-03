// ANGULAR CORE
import { Injectable, OnInit, inject, DestroyRef } from '@angular/core';
import { HttpClient, HttpHeaders                } from '@angular/common/http';

// GLOBAL
import { LogEntry, LogType, SearchCriteria } from '../../_models/entity.model';

// SERVICES
import { ConfigService } from '../__Utils/ConfigService/config.service';
import { BaseService   } from '../__baseService/base.service';

// THIRD PARTY
import { Observable               } from 'rxjs';
import { takeUntilDestroyed       } from '@angular/core/rxjs-interop';


/**
 * v21 Update: Se utiliza la inyección de dependencias funcional y DestroyRef
 * para manejar la limpieza de suscripciones sin errores de contexto.
 */
@Injectable({
  providedIn: 'root'
})
export class BackendService extends BaseService implements OnInit {

  // v21: Inyección funcional (Reemplaza al constructor)
  public readonly http           = inject(HttpClient);
  public readonly _configService = inject(ConfigService);
  
  /**
   * v21 Feature: DestroyRef. 
   * Inyectarlo aquí captura el 'Injection Context' necesario para takeUntilDestroyed.
   */
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    // Ya no pasamos parámetros a super() porque usamos inject() en esta clase
    super();
  }

  ngOnInit(): void {
    // Inicialización si fuera necesaria
  }

  ////////////////////////////////////////////////////////////////  
  // METODOS - [COMUNES]
  ////////////////////////////////////////////////////////////////  

  _GetWebApiAppVersion(): Observable<string> {
    const p_url = `${this._configService.getConfigValue('baseUrlNetCore')}api/Demos/GetAppVersion`;
    return this.http.get<string>(p_url, this.HTTPOptions_Text);
  }

  _GetASPNETCoreCppVersion(): Observable<string> {
    const p_url = `${this._configService.getConfigValue('baseUrlNetCoreCPPEntry')}api/EntryPoint/GetAppVersion`;
    return this.http.get<string>(p_url, this.HTTPOptions_Text);
  }

  /**
   * v21 Fix: Pasamos 'this.destroyRef' a takeUntilDestroyed para evitar el error NG0203
   * ya que este método se llama asíncronamente (fuera del constructor).
   */
  public SetLog(p_PageTitle: string, p_logMsg: string, logType: LogType = LogType.Info): void {
    if (p_PageTitle === '' || p_logMsg === '') return;

    const p_url = `${this._configService.getConfigValue('baseUrlNetCore')}api/Demos/SetLog?p_logMsg=${p_logMsg}&logType=${logType.toString()}`;
    
    this.http.get<string>(p_url, this.HTTPOptions_Text)
      .pipe(takeUntilDestroyed(this.destroyRef)) 
      .subscribe({
        next: (logResult) => { /* Silently handle success */ },
        error: (err) => { /* Silently handle error to avoid infinite loops */ }
      });
  }

  ////////////////////////////////////////////////////////////////  
  // METODOS - [GENERAR ARCHIVO CSV] / CHARTS 
  ////////////////////////////////////////////////////////////////  

  getCSVLink(): Observable<string> {
    const p_url = `${this._configService.getConfigValue('baseUrlNetCore')}api/CSVManager/GetCSVLinkJson`;
    return this.http.post<string>(p_url, this.HTTPOptions_Text); 
  }
    
  getInformeRemotoCSV(): Observable<string> {
    const p_url = `${this._configService.getConfigValue('baseUrlNetCore')}api/CSVManager/GenerarInformeCSVJson`;
    return this.http.get<string>(p_url, this.HTTPOptions_Text); 
  }

  getInformeRemotoCSV_STAT(): Observable<string> {
    const p_url = `${this._configService.getConfigValue('baseUrlNetCore')}api/CacheManager/GenerarInformeCSVJsonSTAT`;
    return this.http.get<string>(p_url, this.HTTPOptions_Text); 
  }

  _SetSTATPieCache(_prefix: string | undefined): void {
    const p_url = `${_prefix}api/CacheManager/SetSTATPieCache`;
    
    this.http.get<string>(p_url, this.HTTPOptions_Text)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (jsondata) => { },
        error: (err) => { }
      }); 
  }
    
  getInformeRemotoCSV_NodeJS(): Observable<string> {
    const p_url = `${this._configService.getConfigValue('baseUrlNodeJs')}GenerarInformeCSVJson`;
    const HTTPOptions = {
      headers: new HttpHeaders({ 'Accept': 'application/text' }),
      'responseType': 'text' as 'json'
    };
    return this.http.get<string>(p_url, HTTPOptions); 
  }

  ////////////////////////////////////////////////////////////////  
  // METODOS - [GENERAR ARCHIVO XLS] / CHARTS
  ////////////////////////////////////////////////////////////////  

  getLogRemoto(_searchCriteria: SearchCriteria): Observable<LogEntry[]> {
    const url = `${this._configService.getConfigValue('baseUrlNetCore')}api/XLSManager/generarinformejson`;
    return this.http.get<LogEntry[]>(url);
  }

  getLogRemotoNodeJS(_searchCriteria: SearchCriteria): Observable<string> {
    const p_url = `${this._configService.getConfigValue('baseUrlNodeJs')}generarinformejson`;
    return this.http.get<string>(p_url, this.HTTPOptions_JSON);
  }

  getLogRemotoSprinbBootJava(_searchCriteria: SearchCriteria): Observable<string> {
    const p_url = `${this._configService.getConfigValue('baseUrlSpringBootJava')}getAllLogs`;
    return this.http.get<string>(p_url, this.HTTPOptions_JSON);
  }

  getPersonsSprinbBootJava(): Observable<string> {
    const p_url = `${this._configService.getConfigValue('baseUrlSpringBootJava')}getAllPersons`;
    return this.http.get<string>(p_url, this.HTTPOptions_JSON);
  }

  getPersonsSprinbBootKotlin(): Observable<string> {
    const p_url = `${this._configService.getConfigValue('baseUrlSpringBoot_Kotlin')}api/data/getAllPersons`;
    console.log('getPersonsSprinbBootKotlin URL: ', p_url);
    return this.http.get<string>(p_url, this.HTTPOptions_JSON);
  }

  getLogRemotoDjangoPython(_searchCriteria: SearchCriteria): Observable<string> {
    const p_url = `${this._configService.getConfigValue('baseUrlDjangoPython')}getAllLogs?format=json`;
    return this.http.get<string>(p_url, this.HTTPOptions_JSON);
  }

  getInformeExcel(_searchCriteria: SearchCriteria): Observable<string> {
    const p_url = `${this._configService.getConfigValue('baseUrlNetCore')}api/XLSManager/generarinformexls`;
    return this.http.get<string>(p_url, this.HTTPOptions_Text); 
  }

  getPersonsDjangoPython(): Observable<string> {
    const p_url = `${this._configService.getConfigValue('baseUrlDjangoPython')}getAllPersons?format=json`;
    return this.http.get<string>(p_url, this.HTTPOptions_JSON);
  }

  getLogStatGET(): Observable<string> {
    const p_url = `${this._configService.getConfigValue('baseUrlNetCore')}api/CacheManager/GetConsultaLogStatGet`;
    return this.http.get<string>(p_url, this.HTTPOptions_JSON);   
  } 

  _SetSTATBarCache(_prefix: string | undefined): void {
    const p_url = `${_prefix}api/CacheManager/SetSTATBarCache`;
    
    this.http.get<string>(p_url, this.HTTPOptions_Text)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (jsondata) => { },
        error: (err) => console.error('_SetSTATBarCache ERROR: ', err.message)
      });
  } 

  ////////////////////////////////////////////////////////////////  
  // BACKEND VERSIONS 
  ////////////////////////////////////////////////////////////////  
  // J2SE / JAVA SPRING BOOT
  getJavaVersion(): Observable<string> {
    const p_url = `${this._configService.getConfigValue('baseUrlSpringBootJava')}getJavaVersion`;
    return this.http.get<string>(p_url, this.HTTPOptions_JSON);
  }
  // NODE.JS 
  getNodeVersion(): Observable<string>{
    const p_url = `${this._configService.getConfigValue('baseUrlNodeJs')}getNodeVersion`;
    return this.http.get<string>(p_url, this.HTTPOptions_JSON);
  }
  // NODE.JS - OCR
  getNodeVersionOcr(): Observable<string>{
    const p_url = `${this._configService.getConfigValue('baseUrlNodeJsOcr')}getNodeVersion`;
    return this.http.get<string>(p_url, this.HTTPOptions_JSON);
  }
  // PYTHON
  getPythonVersion(): Observable<string> {
    const p_url = `${this._configService.getConfigValue('baseUrlDjangoPython')}getPythonVersion`;
    return this.http.get<string>(p_url, this.HTTPOptions_JSON);
  }
  ////////////////////////////////////////////////////////////////  
}
