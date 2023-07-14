import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MCSDService                                 } from '../mcsd.service';
import { Observable                                  } from 'rxjs';
//
@Component({
  selector: 'app-algorithm-reg-ex',
  templateUrl: './algorithm-reg-ex.component.html',
  styleUrls: ['./algorithm-reg-ex.component.css']
})
//
export class AlgorithmRegExComponent implements OnInit, AfterViewInit {
    ////////////////////////////////////////////////////////////////
    // PROPERTIES //////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////
    pageTitle               : string = '[ALGORITMOS - EXPRESIONES REGULARES]';
    //
    static pageTitle()      : string {
      return '[ALGORITMOS - EXPRESIONES REGULARES]';
    }
    //
    protected xmlData               : string = "";
    //
    @ViewChild('mensajes') mensajes : any;
    //
    constructor(private mcsdService:MCSDService)
    {
        //
    }
    //
    ngOnInit(): void {
        //
        console.log(this.pageTitle + " - [INGRESANDO]");
        //
    }
    //
    ngAfterViewInit(): void {
      //
      console.log(this.pageTitle + " - [INICIO VISUAL]");
      //
      this._GetXMLData();
    }
    ////////////////////////////////////////////////////////////////
    // METODOS    //////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////
    _GetXMLData():void {
        //
        console.log(this.pageTitle + " - [GET XML DATA]");
        //
        let xmlInfo!  : Observable<string>;
        //
        xmlInfo       = this.mcsdService._GetXmlData();
        //
        let data      : any;
        //
        const xmlInfoObserver   = {
            //
            next: (_xmlData: string)     => { 
                //------------------------------------------------------------
                // OBTENER DATA
                //------------------------------------------------------------
                //
                console.warn(this.pageTitle + ' - [GET XML DATA] - RETURN VALUE : ' + _xmlData);
                //
                this.xmlData = _xmlData;
                //-------------------------------------------------------------
                // CONFIGURAR CONTROLES
                //-------------------------------------------------------------
                //
                this.mensajes.nativeElement.innerHTML = this.xmlData;
            },
            error: (err: Error) => {
                //
                console.error(this.pageTitle + ' - [GET XML DATA]- [error] : ' + err.message);
            },       
            complete: ()        => {
                //
                console.info(this.pageTitle + ' - [GET XML DATA]- [Observer got a complete notification]');
                //
            },
        };
        //
        xmlInfo.subscribe(xmlInfoObserver);
    }
}
