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
    private prefix  : string = 'https://mcsd.somee.com/demos/';
    //
    constructor(private http: HttpClient) { 
        //
    }
    //
    getInformeRemotoCSV() {
        //
        let p_url    = this.prefix + 'GenerarInformeCSVJson';
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
          let p_url    = this.prefix + 'GenerarInformeCSVJsonSTAT';
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
        let url    = this.prefix + 'generarinformejson';
        //
        console.warn(" REQUESTING URL : " + url);
        //    
        return this.http.get<LogEntry[]>(url);
    }
    //
    getInformeExcel(_searchCriteria : SearchCriteria){
        //
        let p_url  = this.prefix + 'generarinformexls';
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
        //
        var HTTPOptions = {
          headers: new HttpHeaders({
               'Content-Type' : 'application/json'
          }),
          'responseType': 'text' as 'json'
        }; 
        //
        return this.http.post<string>(url,HTTPOptions);   
    }     
    //-------------------------------------------------------------
    // FILE UPLODAD METHODS
    //-------------------------------------------------------------
    upload(file: File): Observable<HttpEvent<any>> {
      //
      const formData: FormData = new FormData();
      //
      formData.append('file', file);
      //
      const req = new HttpRequest('POST', `${this.prefix}_ZipDemo`, formData, {
        reportProgress: true,
        responseType  : 'text' as 'json'
      });
      //
      return this.http.request(req);
    }
    //
    getFiles(): Observable<any> {
      return this.http.get(`${this.prefix}/files`);
    }
}
