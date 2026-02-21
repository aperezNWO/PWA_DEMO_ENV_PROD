// angular core
import { Injectable, OnInit, inject            } from '@angular/core'; // v21: 'inject' es ahora el estándar para DI
import { HttpClient, HttpHeaders               } from '@angular/common/http';

// global entities
import { _environment                          } from 'src/environments/environment';
import { LogEntry, LogType, SearchCriteria     } from '../../_models/entity.model';

// services
import { ConfigService } from '../__Utils/ConfigService/config.service';
import { BaseService   } from '../__baseService/base.service';

// third party
// v21: Se recomienda usar takeUntilDestroyed para suscripciones dentro de servicios
import { takeUntilDestroyed                    } from '@angular/core/rxjs-interop'; 
import { Observable                            } from 'rxjs';
//
@Injectable({
  providedIn: 'root'
})
//
export class BackendService extends BaseService implements OnInit {

  /** * v21 Feature: Inyección Funcional. 
   * Reemplaza la inyección por constructor. Es más limpia, facilita la herencia 
   * (no hay que pasar parámetros al super()) y funciona mejor con tipos.
   */
  public readonly http           = inject(HttpClient);
  public readonly _configService = inject(ConfigService);

  constructor() {
    // v21: Al usar inject(), ya no necesitamos declarar parámetros en el constructor.
    // Invocamos super() sin argumentos si BaseService no los requiere explícitamente.
    super();
  }

  ////////////////////////////////////////////////////////////////  
  // METODOS - [EVENT HANDLERS]
  ////////////////////////////////////////////////////////////////  
  //
  ngOnInit(): void {
     //
  }

  ////////////////////////////////////////////////////////////////  
  // METODOS - [COMUNES]
  ////////////////////////////////////////////////////////////////  
  //
  _GetWebApiAppVersion(): Observable<string>
  {
    //
    let p_url         : string  = `${this._configService.getConfigValue('baseUrlNetCore')}api/Demos/GetAppVersion`;
    //
    /**
     * v21 Note: Para nuevas implementaciones, Angular introduce 'rxResource',
     * una forma de manejar peticiones HTTP que expone el resultado como un Signal.
     */
    let appVersion    : Observable<string> =  this.http.get<string>(p_url, this.HTTPOptions_Text);
    //
    return appVersion;
  }
  //
  _GetASPNETCoreCppVersion(): Observable<string> {
    //
    let p_url         : string  = `${this._configService.getConfigValue('baseUrlNetCoreCPPEntry')}api/EntryPoint/GetAppVersion`;
    //
    let appVersion    : Observable<string> =  this.http.get<string>(p_url, this.HTTPOptions_Text);
    //
    return appVersion;
  }
  //
  public SetLog(p_PageTitle : string ,p_logMsg : string, logType : LogType = LogType.Info):void
  {
    //
    if ((p_PageTitle == '') || (p_logMsg == ''))
      return;
    //
    let logInfo!  : Observable<string>;
    //
    let p_url     = `${this._configService.getConfigValue('baseUrlNetCore')}api/Demos/SetLog?p_logMsg=${p_logMsg}&logType=${logType.toString()}`;
    //
    logInfo       = this.http.get<string>(p_url, this.HTTPOptions_Text);
    //
    const logInfoObserver   = {
          next: (logResult: string)     => { 
                // console.warn(p_PageTitle +  ' - [LOG] - [RESULT] : ' + logResult);
          },
          error: (err: Error) => {
                // console.error(p_PageTitle + ' - [LOG] - [ERROR]  : ' + err);
          },       
          complete: ()        => {
                // console.info(p_PageTitle  + ' - [LOG] - [COMPLETE]');
          },
      };
      //
      /** * v21 Best Practice: Si te suscribes dentro de un servicio, usa takeUntilDestroyed
       * para evitar fugas de memoria si el servicio es destruido (aunque sea root).
       */
      logInfo.pipe(takeUntilDestroyed()).subscribe(logInfoObserver);
  };

  ////////////////////////////////////////////////////////////////  
  // METODOS - [GENERAR ARCHIVO CSV] / CHARTS 
  ////////////////////////////////////////////////////////////////  
  //
  getCSVLink(): Observable<string> {
    //
    let p_url    = `${this._configService.getConfigValue('baseUrlNetCore')}api/CSVManager/GetCSVLinkJson`;
    //
    let csvLink : Observable<string> =  this.http.post<string>(p_url, this.HTTPOptions_Text);
    //
    return csvLink; 
  }
  //    
  getInformeRemotoCSV(): Observable<string> {
    //
    let p_url    = `${this._configService.getConfigValue('baseUrlNetCore')}api/CSVManager/GenerarInformeCSVJson`;
    //
    let jsonCSVData : Observable<string> =  this.http.get<string>(p_url, this.HTTPOptions_Text);
    //
    return jsonCSVData; 
  }
  //
  getInformeRemotoCSV_STAT():Observable<string> {
      //
      let p_url    = `${this._configService.getConfigValue('baseUrlNetCore')}api/CacheManager/GenerarInformeCSVJsonSTAT`;
      //
      let jsonCSVData : Observable<string> =  this.http.get<string>(p_url, this.HTTPOptions_Text);
      //
      return jsonCSVData; 
  }
  //
  _SetSTATPieCache(_prefix : string | undefined):void{
    //
    let p_url    =  `${_prefix}api/CacheManager/SetSTATPieCache`;
    //
    let jsonCSVData : Observable<string> =  this.http.get<string>(p_url, this.HTTPOptions_Text);
    //
    const jsonCSVDataObserver = {
      next: (jsondata: string)            => { 
        //
      },
      error           : (err: Error)      => {
        //
      },
      complete        : ()                => {
        //
      },
    };
    //
    jsonCSVData.pipe(takeUntilDestroyed()).subscribe(jsonCSVDataObserver); 
  }
//    
getInformeRemotoCSV_NodeJS(): Observable<string> {
  //
  let p_url: string = `${this._configService.getConfigValue('baseUrlNodeJs')}GenerarInformeCSVJson`;
  //
  console.warn(" REQUESTING URL : " + p_url);
  //
  /** * v21 Tip: En lugar de 'text' as 'json', Angular ahora tiene un mejor tipado 
   * para responseType en las sobrecargas de HttpClient.
   */
  const HTTPOptions = {
    headers: new HttpHeaders({
      'Accept':'application/text'
    }),
    'responseType': 'text' as 'json'
  };
  //
  let jsonCSVData : Observable<string> =  this.http.get<string>(p_url, HTTPOptions);
  //
  return jsonCSVData; 
}

  ////////////////////////////////////////////////////////////////  
  // METODOS - [GENERAR ARCHIVO XLS] / CHARTS
  ////////////////////////////////////////////////////////////////  
  //
  getLogRemoto(_searchCriteria : SearchCriteria) {
        //
        let url    = `${this._configService.getConfigValue('baseUrlNetCore')}api/XLSManager/generarinformejson`;
        //    
        return this.http.get<LogEntry[]>(url);
    }
  //
  getLogRemotoNodeJS(_searchCriteria : SearchCriteria) : Observable<string>{
      //
      let p_url       : string = `${this._configService.getConfigValue('baseUrlNodeJs')}generarinformejson`;
      //
      let nodeJsOutput: Observable<string> = this.http.get<string>(
        p_url,
        this.HTTPOptions_JSON,
      );
      //
      return nodeJsOutput;
    }
  //
  getLogRemotoSprinbBootJava(_searchCriteria : SearchCriteria) : Observable<string>{
      //
      let p_url       : string = `${this._configService.getConfigValue('baseUrlSpringBootJava')}getAllLogs`;
      //
      let nodeJsOutput: Observable<string> = this.http.get<string>(
        p_url,
        this.HTTPOptions_JSON,
      );

      //
      return nodeJsOutput;
    }
  //
  getPersonsSprinbBootJava() : Observable<string>{
      //
      let p_url       : string = `${this._configService.getConfigValue('baseUrlSpringBootJava')}getAllPersons`;
      //
      let nodeJsOutput: Observable<string> = this.http.get<string>(
        p_url,
        this.HTTPOptions_JSON,
      );
      //
      return nodeJsOutput;
  }
  //
  getLogRemotoDjangoPython(_searchCriteria : SearchCriteria) : Observable<string>{
      //
      let p_url       : string = `${this._configService.getConfigValue('baseUrlDjangoPython')}getAllLogs?format=json`;
      //
      let djantoPythonOutput: Observable<string> = this.http.get<string>(
        p_url,
        this.HTTPOptions_JSON,
      );
      //
      return djantoPythonOutput;
    }
  //
  getInformeExcel(_searchCriteria : SearchCriteria){
        //
        let p_url  = `${this._configService.getConfigValue('baseUrlNetCore')}api/XLSManager/generarinformexls`;
        //
        let excelFileName : Observable<string> =  this.http.get<string>(p_url, this.HTTPOptions_Text);
        //
        return excelFileName; 
    }
  //
  getPersonsDjangoPython() : Observable<string>{
    //
    let p_url       : string = `${this._configService.getConfigValue('baseUrlDjangoPython')}getAllPersons?format=json`;
    //
    let djantoPythonOutput: Observable<string> = this.http.get<string>(
      p_url,
      this.HTTPOptions_JSON,
    );
    //
    return djantoPythonOutput;
  }
  //
  getLogStatGET() {
    //
    let p_url    = `${this._configService.getConfigValue('baseUrlNetCore')}api/CacheManager/GetConsultaLogStatGet`;
    //
    return this.http.get<string>(p_url, this.HTTPOptions_JSON);   
  } 
  //
  _SetSTATBarCache(_prefix : string | undefined) : void {
    //
    let p_url    = `${_prefix}api/CacheManager/SetSTATBarCache`;
    //
    let jsonDataObservable : Observable<string> = this.http.get<string>(p_url, this.HTTPOptions_Text);   
    //
    const jsonDataOberver = {
      next: (jsondata: string)     => { 
        //
      },
      error           : (err: Error)      => {
        //
        console.error('_SetSTATBarCache- (ERROR) : ' + JSON.stringify(err.message));
        //
      },
      complete        : ()                => {
        //
      },
    };
    //
    jsonDataObservable.pipe(takeUntilDestroyed()).subscribe(jsonDataOberver);
  } 
  ////////////////////////////////////////////////////////////////////
}