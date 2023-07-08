import { Injectable                                      } from '@angular/core';
import { LogEntry, SearchCriteria                        } from './log-info.model';
import { HttpClient, HttpRequest, HttpEvent, HttpHeaders } from '@angular/common/http';
import { Observable                                      } from 'rxjs';
//
@Injectable({
  providedIn: 'root'
})
//
export class MCSDService {
    //
    public prefix        : string = 'https://mcsd.somee.com/';
    //public prefix      : string = 'http://localhost:81/';
    //
    constructor(private http: HttpClient) { 
        //
    }
    //
    getInformeRemotoCSV() {
        //
        let p_url    = this.prefix + 'demos/GenerarInformeCSVJson';
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
          let p_url    = this.prefix + 'demos/GenerarInformeCSVJsonSTAT';
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
    getLogRemoto(_searchCriteria : SearchCriteria) {
        //
        let url    = this.prefix + 'demos/generarinformejson';
        //
        console.warn(" REQUESTING URL : " + url);
        //    
        return this.http.get<LogEntry[]>(url);
    }
    //
    getInformeExcel(_searchCriteria : SearchCriteria){
        //
        let p_url  = this.prefix + 'demos/generarinformexls';
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
      let url    = 'https://mcsd.somee.com/demos/GetConsultaLogStatPost';
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
    //-------------------------------------------------------------
    // FILE UPLODAD METHODS
    //-------------------------------------------------------------
    upload(file: File) : Observable<HttpEvent<any>> {
      //
      const formData: FormData = new FormData();
      //
      formData.append('file', file);
      //
      let url    = `${this.prefix}demos/_ZipDemoGetFileName`;
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
        let p_url   = `${this.prefix}demos/_SetZip?p_fileName=${p_fileName}`;
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
    GetPDF(subjectName: string | undefined):Observable<string> {
        //
        let p_url   = `${this.prefix}demos/_GetPdf?subjectName=${subjectName}`;
        //
        console.log("[GENERATE PDF FILE] - [GETTING ZIP] - subjectName  : " + subjectName);
        //
        console.log("[GENERATE PDF FILE] - [GETTING ZIP] - url          : " + p_url);
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

}
