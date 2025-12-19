import { Component, Inject, ViewChild   } from '@angular/core';
import { FormBuilder, Validators        } from '@angular/forms';
import { ActivatedRoute                 } from '@angular/router';
import { BehaviorSubject                } from 'rxjs';
import { BaseComponent                  } from 'src/app/_components/base/base.component';
import { PAGE_TITLE_LOG                 } from 'src/app/_models/common';
import { _languageName, SearchCriteria  } from 'src/app/_models/entity.model';
import { ConfigService                  } from 'src/app/_services/__Utils/ConfigService/config.service';
import { SpeechService                  } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { BackendService                 } from 'src/app/_services/BackendService/backend.service';

@Component({
  selector: 'app-files-generation-base',
  templateUrl: './files-generation-base.component.html',
  styleUrl: './files-generation-base.component.css'
})
export class FilesGenerationBaseComponent extends BaseComponent  {

    //
    public _loading                                     = new BehaviorSubject<boolean>(false);
    //
    public __languajeList                              : any;
    protected tituloListadoLenguajes                   : string = "[Backend] :";
    //
    rf_searchForm   = this.formBuilder.group({
      _P_ROW_NUM          : ["999"         , Validators.required],
      _P_FECHA_INICIO     : ["2023-01-01"  , Validators.required],
      _P_FECHA_FIN        : ["2022-12-31"  , Validators.required],
    });
    //
    _model                           = new SearchCriteria( 
      "1"
      ,"1"
      ,"999"
      ,"2022-09-01"
      ,"2022-09-30"
      ,""
      ,"");
    //
    @ViewChild('_languajeList')    _languajeList       : any;
    //
    constructor(  public formBuilder                                       : FormBuilder, 
                  public override configService                            : ConfigService,
                  public override backendService                           : BackendService, 
                  public override route                                    : ActivatedRoute,
                  public override speechService                            : SpeechService,
                  @Inject(PAGE_TITLE_LOG) public override PAGE_TITLE_LOG   : string
             ) 
  {
       //
       super(   configService,
                backendService,
                route,
                speechService,
                PAGE_TITLE_LOG
       )
    }

    //--------------------------------------------------------------------------
    // METODOS COMUNES 
    //--------------------------------------------------------------------------
    //
    queryParams():void{
      //
      this.route.queryParams.subscribe(params => {
        //-----------------------------------------------------------------------------
        // LENGUAJES DE PROGRAMACION
        //-----------------------------------------------------------------------------
        this.__languajeList = new Array();
        //
        this.__languajeList.push(
          new _languageName(0, '(SELECCIONE OPCION..)', false,""),
        );
        //
        this.__languajeList.push(new _languageName(1, '(.Net Core   / C#)'             , false ,"CS"   ));
        this.__languajeList.push(new _languageName(2, '(Node.js     / JavaScript)'     , false ,"JS"   ));
        this.__languajeList.push(new _languageName(3, '(SpringBoot  / Java)'           , false ,"JAVA" ));
        this.__languajeList.push(new _languageName(4, '(Django      / Pytnon)'         , false ,"PY"   ));
        //
        let langName = params['langName'] ? params['langName'] : "" ;
        //
        if (langName !== '')
        {   
            //
            for (var index = 1; index < this.__languajeList.length; index++) {
                //
                if (this.__languajeList[index]._shortName  == langName)
                  this.__languajeList[index]._selected = true;        
            }

        } else {
          //
          this.__languajeList[1]._selected = true; // C#
        }
      });
    }
    //
      GetFormattedDate(p_date : /*Date*/ string, order : number) {
        //
        var today = '';
        switch (order) {
            case 0:  // FECHA COMPLATIBLE CON RDBMS
                var p_dates = p_date.toString().split('-'); // P_DATE   = 2022-04-09
                var day     = p_dates[2];
                var month   = p_dates[1];
                var year    = p_dates[0];
                today       = day + "/" + month + "/" + year;
                //
                break;
        }
        //
        return today;
  }  
}
