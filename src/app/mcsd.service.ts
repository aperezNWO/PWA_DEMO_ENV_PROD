import { Injectable                        } from '@angular/core';
import { LogEntry, SearchCriteria                          } from './log-info.model';
import { HttpClient, HttpHeaders           } from '@angular/common/http';
import { Observable                        } from 'rxjs';
//
@Injectable({
  providedIn: 'root'
})
//
export class MCSDService {
    //
    private prefix : string = 'https://mcsd.somee.com/demos/';
    //
    constructor(private http: HttpClient) { 
        //
    }
    //
    getInformeRemotoCSV(_searchCriteria : SearchCriteria) {
        //
        let url    = this.prefix + 'GenerarInformeCSVJson';
        //
        console.warn(" REQUESTING URL : " + url);
        //    
        return this.http.get<LogEntry[]>(url);
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
}
