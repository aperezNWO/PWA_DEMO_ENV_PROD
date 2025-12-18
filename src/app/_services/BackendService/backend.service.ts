import { Injectable, OnInit                                      } from '@angular/core';
import { HttpClient, HttpEvent, HttpHeaders                      } from '@angular/common/http';
import { HttpRequest                                             } from '@angular/common/http';
import { Observable                                              } from 'rxjs';
import { LogEntry, LogType, SearchCriteria                       } from '../../_models/entity.model';
import { ConfigService                                           } from '../ConfigService/config.service';
import { BaseService                                             } from '../__baseService/base.service';
import { _environment                                            } from 'src/environments/environment';

//
@Injectable({
  providedIn: 'root'
})
//
export class BackendService extends BaseService implements OnInit  {
 
    constructor(public http: HttpClient, public _configService : ConfigService) {
      //
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
      let p_url         : string  = `${this._configService.getConfigValue('baseUrlNetCore')}demos/_GetAppVersion`;
      //
      let appVersion    : Observable<string> =  this.http.get<string>(p_url,this.HTTPOptions_Text);
      //
      return appVersion;
    }
    //
    _GetAlgothmAppVersion(): Observable<string> {
      //
      let p_url         : string  = `${this._configService.getConfigValue('baseUrlNetCoreCPPEntry')}GetDLLVersion`;
      //
      let appVersion    : Observable<string> =  this.http.get<string>(p_url,this.HTTPOptions_Text);
      //
      return appVersion;
    }
    //
    _GetASPNETCoreCppVersion(): Observable<string> {
      //
      let p_url         : string  = `${this._configService.getConfigValue('baseUrlNetCoreCPPEntry')}_GetAppVersion`;
      //
      let appVersion    : Observable<string> =  this.http.get<string>(p_url,this.HTTPOptions_Text);
      //
      return appVersion;
    }
    // 
    _Algorithm_GetCPPSTDVersion(): Observable<string> {
      //
      let p_url         : string  = `${this._configService.getConfigValue('baseUrlNetCoreCPPEntry')}Algorithm_GetCPPSTDVersion`;
      //
      let appVersion    : Observable<string> =  this.http.get<string>(p_url,this.HTTPOptions_Text);
      //
      return appVersion;
    }
    ////////////////////////////////////////////////////////////////  
    // METODOS - [GENERAR ARCHIVO CSV]
    ////////////////////////////////////////////////////////////////  
    getCSVLinkGET(): Observable<string> {
      //
      let p_url    = `${this._configService.getConfigValue('baseUrlNetCore')}demos/_GetCSVLinkJsonGET`;
      //
      let csvLink : Observable<string> =  this.http.get<string>(p_url);
      //
      return csvLink; 
    }
    //
    getCSVLink(): Observable<string> {
      //
      let p_url    = `${this._configService.getConfigValue('baseUrlNetCore')}demos/_GetCSVLinkJson`;
      //
      let csvLink : Observable<string> =  this.http.post<string>(p_url,this.HTTPOptions_Text);
      //
      return csvLink; 
    }
    //    
    getInformeRemotoCSV(): Observable<string> {
      //
      let p_url    = `${this._configService.getConfigValue('baseUrlNetCore')}demos/GenerarInformeCSVJson`;
      //
      let jsonCSVData : Observable<string> =  this.http.get<string>(p_url,this.HTTPOptions_Text);
      //
      return jsonCSVData; 
    }
    //
    getInformeRemotoCSV_STAT():Observable<string> {
        //
        let p_url    = `${this._configService.getConfigValue('baseUrlNetCore')}demos/GenerarInformeCSVJsonSTAT`;
        //
        let jsonCSVData : Observable<string> =  this.http.get<string>(p_url,this.HTTPOptions_Text);
        //
        return jsonCSVData; 
    }
    //
    _SetSTATPieCache(_prefix : string | undefined):void{
      //
      let p_url    =  `${_prefix}demos/_SetSTATPieCache`;
      //
      let jsonCSVData : Observable<string> =  this.http.get<string>(p_url,this.HTTPOptions_Text);
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
      jsonCSVData.subscribe(jsonCSVDataObserver); 
    }
  //    
  getInformeRemotoCSV_NodeJS(): Observable<string> {
    //
    let p_url: string = `${this._configService.getConfigValue('baseUrlNodeJs')}GenerarInformeCSVJson`;
    //
    console.warn(" REQUESTING URL : " + p_url);
    //
    var HTTPOptions = {
      headers: new HttpHeaders({
        'Accept':'application/text'
      }),
      'responseType': 'text' as 'json'
    };
    //
    let jsonCSVData : Observable<string> =  this.http.get<string>(p_url,HTTPOptions);
    //
    return jsonCSVData; 
  }
    ////////////////////////////////////////////////////////////////  
    // METODOS - [GENERAR ARCHIVO XLS]
    ////////////////////////////////////////////////////////////////  
    //
    getLogRemoto(_searchCriteria : SearchCriteria) {
          //
          let url    = `${this._configService.getConfigValue('baseUrlNetCore')}demos/generarinformejson`;
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
          let p_url  = `${this._configService.getConfigValue('baseUrlNetCore')}demos/generarinformexls`;
          //
          let excelFileName : Observable<string> =  this.http.get<string>(p_url,this.HTTPOptions_Text);
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
    getLogStatPOST() {
      //
      let url    = `${this._configService.getConfigValue('baseUrlNetCore')}demos/GetConsultaLogStatPost`;
      //
      return this.http.post<string>(url,this.HTTPOptions_JSON);   
    }    
    //
    getLogStatGET() {
      //
      let url    = `${this._configService.getConfigValue('baseUrlNetCore')}demos/GetConsultaLogStatGet`;
      //
      return this.http.get<LogEntry[]>(url);   
    } 
    //
    _SetSTATBarCache(_prefix : string | undefined) : void {
      //
      let p_url    = `${_prefix}demos/_SetSTATBarCache`;
      //
      let jsonDataObservable : Observable<string> = this.http.get<string>(p_url,this.HTTPOptions_Text);   
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
      jsonDataObservable.subscribe(jsonDataOberver);
    } 
    ////////////////////////////////////////////////////////////////  
    // METODOS - [GENERAR ARCHIVOS  - PDF]
    ////////////////////////////////////////////////////////////////
    public GetPDF(subjectName: string | undefined): Observable<HttpEvent<any>> {
        //
        let p_url   = `${this._configService.getConfigValue('baseUrlNetCore')}demos/_GetPdf?subjectName=${subjectName}`;
        //
        // USAR REQUEST PARA OBTENER PORCENTAJE DE STATUS
        const req = new HttpRequest('GET', p_url, {
          reportProgress: true,
          responseType  : 'text',
        });
        //
        return this.http.request<HttpEvent<any>>(req);
    }
    ////////////////////////////////////////////////////////////////  
    // METODOS - [ALGORITMOS - DISTANCIA MAS CORTA]
    ////////////////////////////////////////////////////////////////  
    //    
    getRandomVertex(vertexSize : Number,sourcePoint : Number): Observable<string> {
      //
      let p_url    = `${this._configService.getConfigValue('baseUrlNetCore')}demos/GenerateRandomVertex?p_vertexSize=${vertexSize}&p_sourcePoint=${sourcePoint}`;
      //
      let dijkstraData : Observable<string> =  this.http.get<string>(p_url,this.HTTPOptions_Text);
      //
      return dijkstraData; 
    }
    //
    getRandomVertexCpp(vertexSize : Number,sourcePoint : Number): Observable<string> {
      //
      let p_url    = `${this._configService.getConfigValue('baseUrlNetCoreCPPEntry')}GenerateRandomVertex_CPP?p_vertexSize=${vertexSize}&p_sourcePoint=${sourcePoint}`;
      //
      let dijkstraData : Observable<string> =  this.http.get<string>(p_url,this.HTTPOptions_Text);
      //
      return dijkstraData; 
    }
    //
    getRandomVertexSpringBoot(vertexSize : Number,sourcePoint : Number): Observable<string> {
       //
      let p_url    = `${this._configService.getConfigValue('baseUrlSpringBootJava')}GenerateRandomVertex_SpringBoot`;
      //
      let dijkstraData : Observable<string> =  this.http.get<string>(p_url,this.HTTPOptions_Text_Plain);
      //
      return dijkstraData; 
    }
    
    ////////////////////////////////////////////////////////////////  
    // METODOS - [ALGORITMOS - ORDENAMIENTO]
    ////////////////////////////////////////////////////////////////     
    getNewSort():Observable<string>
    {
      //
      let p_url    = `${this._configService.getConfigValue('baseUrlNetCore')}demos/_NewSort`;
      //
      let newSortData : Observable<string> =  this.http.get<string>(p_url,this.HTTPOptions_Text);
      //
      return newSortData; 
    }
    //    
    getSort(p_sortAlgoritm: number, p_unsortedList: string):Observable<string>
    {
      //
      let p_url    = `${this._configService.getConfigValue('baseUrlNetCore')}demos/_GetSort?p_sortAlgoritm=${p_sortAlgoritm}&p_unsortedList=${p_unsortedList}`;
      //
      let newSortData : Observable<string> =  this.http.get<string>(p_url,this.HTTPOptions_Text);
      //
      return newSortData; 
    }
    //    
    getSort_CPP(p_sortAlgoritm: number, p_unsortedList: string):Observable<string>
    {
      //
      let p_url    = `${this._configService.getConfigValue('baseUrlNetCoreCPPEntry')}_GetSort_CPP?p_sortAlgoritm=${p_sortAlgoritm}&p_unsortedList=${p_unsortedList}`;
      //
      let newSortData : Observable<string> =  this.http.get<string>(p_url,this.HTTPOptions_Text);
      //
      return newSortData; 
    }
    ////////////////////////////////////////////////////////////////  
    // METODOS - [ALGORITMOS - EXPRESIONES REGULARES]
    ////////////////////////////////////////////////////////////////  
    //    
    _GetXmlData():Observable<string>
    {
      //
      let p_url  : string  = `${this._configService.getConfigValue('baseUrlNetCore')}demos/_GetXmlData`;
      //
      let xmlData : Observable<string> =  this.http.get<string>(p_url,this.HTTPOptions_Text);
      //
      return xmlData; 
    }
    //
    _SetXmlDataToCache(_prefix : string | undefined):void
    {
      //
      let p_url   : string  = `${_prefix}demos/_SetXmlDataToCache`;
      //
      ////console.log("Setting XML data to cache :  " + p_url)
      //
      let xmlData : Observable<string> =  this.http.get<string>(p_url,this.HTTPOptions_Text);
      //
      const td_observer = {
        next: (jsondata: string)     => { 
          //
          ////console.log('_SetXmlDataToCache - (return): ' + jsondata);
        },
        error           : (err: Error)      => {
          //
          console.error('_SetXmlDataToCache- (ERROR) : ' + JSON.stringify(err.message));
          //
        },
        complete        : ()                => {
          //
          ////console.log('_SetXmlDataToCache -  (COMPLETE)');
        },
      };
      //
      xmlData.subscribe(td_observer);
    }
    //
    public _RegExEval(tagSearchIndex: number, textSearchValue: string): Observable<string>
    {
      //
      let p_url    : string = `${this._configService.getConfigValue('baseUrlNetCore')}demos/_RegExEval?p_tagSearch=${tagSearchIndex}&p_textSearch=${textSearchValue}`;
      //
      let regExData : Observable<string> =  this.http.get<string>(p_url,this.HTTPOptions_Text);
      //
      return regExData; 
    }
    //
    public _RegExEval_CPP(tagSearchIndex: number, textSearchValue: string): Observable<string>
    {
      //
      let p_url    : string = `${this._configService.getConfigValue('baseUrlNetCoreCPPEntry')}_RegExEval_CPP?p_tagSearch=${tagSearchIndex}&p_textSearch=${textSearchValue}`;
      //
      let regExData : Observable<string> =  this.http.get<string>(p_url,this.HTTPOptions_Text);
      //
      return regExData; 
    }
    ////////////////////////////////////////////////////////////////  
    // METODOS - [LOG]
    ////////////////////////////////////////////////////////////////  
    //
    public SetLog(p_PageTitle : string ,p_logMsg : string, logType : LogType = LogType.Info):void
    {
      //
      if ((p_PageTitle == '') || (p_logMsg == ''))
        return;
      //
      let logInfo!  : Observable<string>;
      //
      let p_url     = `${this._configService.getConfigValue('baseUrlNetCore')}demos/_SetLog?p_logMsg=${p_logMsg}&logType=${logType.toString()}`;
      //
      logInfo       = this.http.get<string>(p_url, this.HTTPOptions_Text);
      //
      const logInfoObserver   = {
            //
            next: (logResult: string)     => { 
                  //
                  //console.warn(p_PageTitle +  ' - [LOG] - [RESULT] : ' + logResult);
            },
            error: (err: Error) => {
                  //
                  //console.error(p_PageTitle + ' - [LOG] - [ERROR]  : ' + err);
            },       
            complete: ()        => {
                  //
                  //console.info(p_PageTitle  + ' - [LOG] - [COMPLETE]');
            },
        };
        //
        logInfo.subscribe(logInfoObserver);
    };
  ///////////////////////////////////////////////////////////////
}
  