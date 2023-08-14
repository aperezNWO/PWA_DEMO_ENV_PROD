import { Injectable, OnInit                                      } from '@angular/core';
import { HttpClient, HttpRequest, HttpEvent, HttpHeaders } from '@angular/common/http';
import { LogEntry, SearchCriteria                        } from '../_models/log-info.model';
import { Observable                                      } from 'rxjs';
import { environment                                     } from 'src/environments/environment';
import { ConfigService, SomeSharedService } from './config-service.service';
//
@Injectable({
  providedIn: 'root'
})
//
export class MCSDService implements OnInit {
    ////////////////////////////////////////////////////////////////  
    // CAMPOS
    ////////////////////////////////////////////////////////////////  
    //
    public get _prefix()   : string | undefined {
      //
      console.warn("AppModule : globalVar : " + this.someSharedService.globalVar );      
      //            
      return environment.baseUrl;
      //return this.someSharedService.globalVar;
    }
    ////////////////////////////////////////////////////////////////  
    // METODOS - [EVENT HANDLERS]
    ////////////////////////////////////////////////////////////////  
    //
    ngOnInit(): void {
      //
    }
    //
    constructor(public http: HttpClient,public someSharedService : SomeSharedService) { 
    }
    ////////////////////////////////////////////////////////////////  
    // METODOS - [COMUNES]
    ////////////////////////////////////////////////////////////////  
    //
    public DebugHostingContent(msg : string) : string {
      //
      console.log("cadena a evaular : " + msg);
      //
      let regEx   = /(.*)(<!--SCRIPT GENERATED BY SERVER! PLEASE REMOVE-->)(.*\w+.*)(<!--SCRIPT GENERATED BY SERVER! PLEASE REMOVE-->)(.*)/;
      //
      let strMsg  = msg.replace(/(\r\n|\n|\r)/gm, "");
      //
      let matches = strMsg.match(regEx);
      //
      if (matches != null) {
          //
          for (var index = 1; index < matches.length; index++) {
              //
              var matchValue = matches[index];
              //        
              console.log("coincidencia : " + matchValue);
              //
              if ((matchValue.indexOf("<!--SCRIPT GENERATED BY SERVER! PLEASE REMOVE-->") != -1) && (matchValue.trim() != "")) {
                  //
                  strMsg = strMsg.replace(matchValue, "");
                  //
                  console.log("REEMPLAZANDO. NUEVA CADENA : " + strMsg);
              }
              //
              if ((matchValue.indexOf("<center>") != -1) && (matchValue.trim() != "")) {
                  //
                  strMsg = strMsg.replace(matchValue, "");
                  //
                  console.log("REEMPLAZANDO. NUEVA CADENA : " + strMsg);
              }
          }
        }
        else
            console.log("NO_HAY_COINCIDENCIAS");
        //
        console.log("CADENA DEPURADA : " + strMsg);
        //
        strMsg = strMsg.replace("unsafe:", "");
        //
        return strMsg;
    };
    ////////////////////////////////////////////////////////////////  
    // METODOS - [GENERAR ARCHIVO CSV]
    ////////////////////////////////////////////////////////////////  
    getCSVLinkGET(): Observable<string> {
      //
      let p_url    = this._prefix + 'demos/_GetCSVLinkJsonGET';
      //
      console.warn(" REQUESTING URL : " + p_url);
      //
      let csvLink : Observable<string> =  this.http.get<string>(p_url);
      //
      return csvLink; 
    }
    //
    getCSVLink(): Observable<string> {
      //
      let p_url    = this._prefix + 'demos/_GetCSVLinkJson';
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
      let csvLink : Observable<string> =  this.http.post<string>(p_url,HTTPOptions);
      //
      return csvLink; 
    }
    //    
    getInformeRemotoCSV(): Observable<string> {
      //
      let p_url    = this._prefix + 'demos/GenerarInformeCSVJson';
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
    //
    getInformeRemotoCSV_STAT():Observable<string> {
          //
          let p_url    = this._prefix + 'demos/GenerarInformeCSVJsonSTAT';
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
        let url    = this._prefix + 'demos/generarinformejson';
        //
        console.warn(" REQUESTING URL : " + url);
        //    
        return this.http.get<LogEntry[]>(url);
    }
    //
    getInformeExcel(_searchCriteria : SearchCriteria){
        //
        let p_url  = this._prefix + 'demos/generarinformexls';
        //
        var HTTPOptions = {
          headers: new HttpHeaders({
            'Accept':'application/text'
          }),
          'responseType': 'text' as 'json'
        };
        //
        let excelFileName : Observable<string> =  this.http.get<string>(p_url,HTTPOptions);
        //
        return excelFileName; 
    }
    //
    getLogStatPOST() {
      //
      let url    = `${this._prefix}demos/GetConsultaLogStatPost`;
      //
      console.warn(" REQUESTING URL : " + url);
      //    
      var HTTPOptions = {
        headers: new HttpHeaders({
              'Content-Type' : 'application/json'
        })
        ,'responseType' : 'text' as 'json'
      }; 
      //
      return this.http.post<string>(url,HTTPOptions);   
    }    
    //
    getLogStatGET() {
      //
      let url    = `${this._prefix}demos/GetConsultaLogStatGet`;
      //
      console.warn(" REQUESTING URL : " + url);
      //
      return this.http.get<LogEntry[]>(url);   
    }     
    //-------------------------------------------------------------
    // FILE UPLODAD METHODS
    //-------------------------------------------------------------
    upload(file: File) : Observable<HttpEvent<any>> {
      //
      const formData: FormData = new FormData();
      //
      formData.append('file', file);
      //
      let url    = `${this._prefix}demos/_ZipDemoGetFileName`;
      //
      console.log("[GENERATE ZIP FILE] - (UPLOADING FILE) url: " + url);
      //
      const req = new HttpRequest('POST', url, formData, {
        reportProgress: true,
        responseType  : 'text',
      });
      //
      return this.http.request<HttpEvent<any>>(req);
    }
    //------------------------------------------------------------
    // GET ZIP - METHODS
    //------------------------------------------------------------
    SetZip(p_fileName : string | undefined):Observable<string> {
        //
        let p_url   = `${this._prefix}demos/_SetZip?p_fileName=${p_fileName}`;
        //
        console.log("[GENERATE ZIP FILE] - [GETTING ZIP] - fileName: " + p_fileName);
        //
        console.log("[GENERATE ZIP FILE] - [GETTING ZIP] - url     : " + p_url);
        //
        var HTTPOptions = {
          headers: new HttpHeaders({
              'Content-Type' : 'application/text'
          })
          ,'responseType' : 'text' as 'json'
        }; 
        //
        let returnUrl     : Observable<string> = this.http.get<string>(p_url,HTTPOptions); 
        //
        return returnUrl;   
    }
    //------------------------------------------------------------
    // GET PDF - METHODS
    //------------------------------------------------------------
    public GetPDF(subjectName: string | undefined): Observable<HttpEvent<any>> {
        //
        let p_url   = `${this._prefix}demos/_GetPdf?subjectName=${subjectName}`;
        //
        console.log("[GENERATE PDF FILE] - [GETTING ZIP] - subjectName  : " + subjectName);
        //
        console.log("[GENERATE PDF FILE] - [GETTING ZIP] - url          : " + p_url);
        //
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
      let p_url    = `${this._prefix}demos/GenerateRandomVertex?p_vertexSize=${vertexSize}&p_sourcePoint=${sourcePoint}`;
      //
      console.info(" REQUESTING URL : " + p_url);
      //
      var HTTPOptions = {
        headers: new HttpHeaders({
          'Accept':'application/text'
        }),
        'responseType': 'text' as 'json'
      };
      //
      let dijkstraData : Observable<string> =  this.http.get<string>(p_url,HTTPOptions);
      //
      return dijkstraData; 
    }
    ////////////////////////////////////////////////////////////////  
    // METODOS - [ALGORITMOS - DISTANCIA MAS CORTA]
    ////////////////////////////////////////////////////////////////  
    //    
    getNewSort():Observable<string>
    {
      //
      let p_url    = `${this._prefix}demos/_NewSort`;
      //
      console.info(" REQUESTING URL : " + p_url);
      //
      var HTTPOptions = {
        headers: new HttpHeaders({
          'Accept':'application/text'
        }),
        'responseType': 'text' as 'json'
      };
      //
      let newSortData : Observable<string> =  this.http.get<string>(p_url,HTTPOptions);
      //
      return newSortData; 
    }
    //    
    getSort(p_sortAlgoritm: number, p_unsortedList: string):Observable<string>
    {
      //
      let p_url    = `${this._prefix}demos/_GetSort?p_sortAlgoritm=${p_sortAlgoritm}&p_unsortedList=${p_unsortedList}`;
      //
      console.info(" REQUESTING URL : " + p_url);
      //
      var HTTPOptions = {
        headers: new HttpHeaders({
          'Accept':'application/text'
        }),
        'responseType': 'text' as 'json'
      };
      //
      let newSortData : Observable<string> =  this.http.get<string>(p_url,HTTPOptions);
      //
      return newSortData; 
    }
    ////////////////////////////////////////////////////////////////  
    // METODOS - [ALGORITMOS - ORDENAMIENTO]
    ////////////////////////////////////////////////////////////////  
    //    
    _GetXmlData():Observable<string>
    {
      //
      let p_url  : string  = `${this._prefix}demos/_GetXmlData`;
      //
      console.info(" REQUESTING URL : " + p_url);
      //
      var HTTPOptions = {
        headers: new HttpHeaders({
          'Accept':'application/text'
        }),
        'responseType': 'text' as 'json'
      };
      //
      let xmlData : Observable<string> =  this.http.get<string>(p_url,HTTPOptions);
      //
      return xmlData; 
    }
    //
    public _RegExEval(tagSearchIndex: number, textSearchValue: string): Observable<string>
    {
      //
      let p_url    : string = `${this._prefix}demos/_RegExEval?p_tagSearch=${tagSearchIndex}&p_textSearch=${textSearchValue}`;
      //
      console.info(" REQUESTING URL : " + p_url);
      //
      var HTTPOptions = {
        headers: new HttpHeaders({
          'Accept':'application/text'
        }),
        'responseType': 'text' as 'json'
      };
      //
      let regExData : Observable<string> =  this.http.get<string>(p_url,HTTPOptions);
      //
      return regExData; 
    }
    ////////////////////////////////////////////////////////////////  
    // METODOS - [LOG]
    ////////////////////////////////////////////////////////////////  
    //
    public  SetLog(p_PageTitle : string ,p_logMsg : string):void
    {
      //
      let logInfo!  : Observable<string>;
      //
      let p_url    = `${this._prefix}demos/_SetLog?p_logMsg=${p_logMsg}`;
      //
      let HTTPOptions = {
        headers: new HttpHeaders({
            'Content-Type' : 'application/text'
        })
        ,'responseType' : 'text' as 'json'
      }; 
      //
      console.info(" REQUESTING URL : " + p_url);
      //
      logInfo       = this.http.get<string>(p_url,HTTPOptions);
      //
      const logInfoObserver   = {
            //
            next: (logResult: string)     => { 
                  //
                  console.warn(p_PageTitle +  ' - [LOG] - [RESULT] : ' + logResult);
            },
            error: (err: Error) => {
                  //
                  console.error(p_PageTitle + ' - [LOG] - [ERROR]  : ' + err);
            },       
            complete: ()        => {
                  //
                  console.info(p_PageTitle  + ' - [LOG] - [COMPLETE]');
            },
        };
        //
        logInfo.subscribe(logInfoObserver);
    };
}