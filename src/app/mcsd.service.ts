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
    private prefix : string = 'http://vivantopruebas.unidadvictimas.gov.co/spae/';
    //
    constructor(private http: HttpClient) { 
        //
    }
    //
    getLogRemoto(_searchCriteria : SearchCriteria) {
        //
        // let url= 'http://vivantopruebas.unidadvictimas.gov.co/spae/home/getconsultalogget?P_ID_DATA_SOURCE=1&P_ID_TIPO_LOG=1&P_ID_LOG=0&P_FECHA_INICIO=01/01/2023&P_FECHA_FIN=31/12/2023&P_ROW_NUM=9999'
        // let url=  this.prefix + 'home/getconsultalogget?P_ID_DATA_SOURCE=' + _searchCriteria.P_DATA_SOURCE_ID + '&P_ID_TIPO_LOG=' + _searchCriteria.P_ID_TIPO_LOG + '&P_ID_LOG=0&P_FECHA_INICIO=' + _searchCriteria.P_FECHA_INICIO_STR +'&P_FECHA_FIN='+ _searchCriteria.P_FECHA_FIN_STR + '&P_ROW_NUM='+_searchCriteria.P_ROW_NUM
        //
        let url    = 'https://mcsd.somee.com/demos/generarinformejson';
        //
        console.warn(" REQUESTING URL : " + url);
        //    
        return this.http.get<LogEntry[]>(url);
    }
    //
    getInformeExcel(_searchCriteria : SearchCriteria){
        //
        let p_url  = 'https://mcsd.somee.com/demos/generarinformexls';
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
