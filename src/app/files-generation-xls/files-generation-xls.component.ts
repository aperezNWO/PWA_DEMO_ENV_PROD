import { AfterViewInit, Component, OnInit, ViewChild   } from '@angular/core';
import { FormBuilder, Validators                       } from '@angular/forms';
import { MatTableDataSource                            } from '@angular/material/table';
import { MatPaginator                                  } from '@angular/material/paginator';
import { Observable                                    } from 'rxjs';
import { LogEntry,SearchCriteria                       } from '../log-info.model';
import { MCSDService                                   } from '../mcsd.service';
//
@Component({
  selector: 'app-files-generation-xls',
  templateUrl: './files-generation-xls.component.html',
  styleUrls: ['./files-generation-xls.component.css']
})
//
export class FilesGenerationXLSComponent implements OnInit, AfterViewInit {
    //--------------------------------------------------------------------------
    // PROPIEDADES COMUNES
    //--------------------------------------------------------------------------
    pageTitle            : string = '[GENERAR ARCHIVO XLS]';
    //
    static pageTitle()   : string {
      return '[GENERAR ARCHIVOS XLS]';
    }
    //--------------------------------------------------------------------------
    // PROPIEADES - REACTIVE FORMS
    //--------------------------------------------------------------------------
    //
    rf_informeLogRemoto!               : Observable<LogEntry[]>;
    //
    rf_excelFileName!                  : Observable<string>;
    //
    rf_textStatus                      : string = "";
    //
    rf_buttonCaption                   : string = "[Buscar]";
    //
    rf_formSubmit                      : boolean = false;
    //
    rf_ExcelDownloadLink               : string  = "";
    //
    rf_buttonCaption_xls               : string  = "";
    //
    rf_textStatus_xls                  : string  = "";
    //
    rf_dataSource                      = new MatTableDataSource<LogEntry>();
    // 
    rf_displayedColumns                : string[] = ['id_Column', 'pageName', 'accessDate', 'ipValue'];
    //
    rf_model                           = new SearchCriteria( "0"
                                            ,"0"
                                            ,"999"
                                            ,"2023-01-01"
                                            ,"2023-12-31"
                                            ,""
                                            ,"");
    //
    @ViewChild("paginator" ,{read:MatPaginator}) rf_paginator!:  MatPaginator;
    //
    rf_searchForm   = this.formBuilder.group({
      _P_ROW_NUM          : ["999"         , Validators.required],
      _P_FECHA_INICIO     : ["2023-01-01"  , Validators.required],
      _P_FECHA_FIN        : ["2022-12-31"  , Validators.required],
    });
    //--------------------------------------------------------------------------
    // PROPIEADES - TEMPLATE FORMS
    //--------------------------------------------------------------------------
    //
    //--------------------------------------------------------------------------
    // EVENT HANDLERS FORMIULARIO 
    //--------------------------------------------------------------------------
    constructor(private mcsdService: MCSDService, private formBuilder: FormBuilder) {
      //
    }
    //
    ngOnInit(): void {
        //
        this.newSearch();
    }
    //
    ngAfterViewInit() {
      //
    }
    //--------------------------------------------------------------------------
    // METODOS REACTIVE FORMS 
    //--------------------------------------------------------------------------
    //
    newSearch()
    {
        //
        console.warn("(NEW SEARCH 2)");
        //
        this.rf_dataSource           = new MatTableDataSource<LogEntry>();
        this.rf_dataSource.paginator = this.rf_paginator;
        //
        this.rf_searchForm   = this.formBuilder.group({
          _P_ROW_NUM          : ["999"         , Validators.required],
          _P_FECHA_INICIO     : ["2023-01-01"  , Validators.required],
          _P_FECHA_FIN        : ["2023-12-31"  , Validators.required],
        });
        //
        console.log("(DEFAULT VALUES - INIT)");
        console.log("P_ROW_NUM         : " + (this.rf_searchForm.value["_P_ROW_NUM"]        || ""));
        console.log("P_FECHA_INICIO    : " + (this.rf_searchForm.value["_P_FECHA_INICIO"]   || ""));      
        console.log("P_FECHA_FIN       : " + (this.rf_searchForm.value["_P_FECHA_FIN"]      || "")); 
        console.log("(DEFAULT VALUES - END)");
        //
        this.rf_buttonCaption     = "[Buscar]";
        //
        this.rf_formSubmit        = false;
        //
        this.rf_textStatus        = "";
        //
        this.rf_buttonCaption_xls               = "[Generar Excel]";
        //
        this.rf_textStatus_xls                  = "";
        //
        this.rf_ExcelDownloadLink               = "#";
    }
    //
    onSubmit() 
    {
        //
        console.warn("(SUBMIT 1)");
        //
        let _P_DATA_SOURCE_ID  : string = ""/*this.searchForm.value["_P_DATA_SOURCE_ID"] || ""*/;
        let _P_ID_TIPO_LOG     : string = ""/*this.searchForm.value["_P_ID_TIPO_LOG"]    || ""*/;
        let _P_ROW_NUM         : string = this.rf_searchForm.value["_P_ROW_NUM"]        || "";
        let _P_FECHA_INICIO    : string = this.rf_searchForm.value["_P_FECHA_INICIO"]   || "";      
        let _P_FECHA_FIN       : string = this.rf_searchForm.value["_P_FECHA_FIN"]      || "";

        //
        let _model  = new SearchCriteria( 
                                _P_DATA_SOURCE_ID
                              , _P_ID_TIPO_LOG
                              , _P_ROW_NUM
                              , _P_FECHA_INICIO
                              , _P_FECHA_FIN
                              , "","");
        //
        this.rf_formSubmit        = true;
        //
        this.rf_textStatus        = "";
        //
        if ((this.rf_searchForm.valid == true))
            this.update(_model);
    }
    //
    update(_searchCriteria : SearchCriteria):void {
      //
      this.rf_buttonCaption     = "[Buscando por favor espere]";
      //
      this.rf_formSubmit        = true;
      //
      this.rf_informeLogRemoto     = this.mcsdService.getLogRemoto();
      //
      const logSearchObserver   = {
        //
        next: (p_logEntry: LogEntry[])     => { 
          //
          console.log('Observer got a next value: ' + JSON.stringify(p_logEntry));
          //
          let recordCount : number  = p_logEntry.length;
          //
          this.rf_textStatus        = "Se encontraton [" + recordCount  + "] registros";
          //
          this.rf_dataSource           = new MatTableDataSource<LogEntry>(p_logEntry);
          this.rf_dataSource.paginator = this.rf_paginator;
          //
          // los botones se configuran en el evento "complete()".
        },
        error: (err: Error) => {
          //
          console.error('Observer got an error: ' + err);
          //
          this.rf_textStatus        = "Ha ocurrido un error";
          //
          this.rf_buttonCaption     = "[Buscar]";
          //
          this.rf_formSubmit        = false;
        },       
        complete: ()        => {
          //
          console.log('Observer got a complete notification');
          //
          this.rf_buttonCaption     = "[Buscar]";
          //
          this.rf_formSubmit        = false;
        },
      };
      //
      this.rf_informeLogRemoto.subscribe(logSearchObserver);
    }
    //
    GenerarInformeXLSValidate():void{
      //
      this.GenerarInformeXLSPost();
    };
    //
    GenerarInformeXLSPost():void  {
      //
      console.log("GENERAR EXCEL - POST");
      //
      this.rf_ExcelDownloadLink               = "#";
      //
      this.rf_buttonCaption_xls               = "[Generando por favor espere...]";
      //
      this.rf_textStatus_xls                  = "[Generando por favor espere...]";
      //
      this.rf_excelFileName                      = this.mcsdService.getInformeExcel();
      //
      const xlsObserver                       = {
        //
        next: (_excelFileName: string) => { 
          //
          console.log('Observer got a next value: ' + _excelFileName);
          //
          let urlFile               = 'https://mcsd.somee.com/xlsx/' + _excelFileName;
          this.rf_ExcelDownloadLink = this. DebugHostingContent(urlFile);
          //
          this.rf_textStatus_xls     = "[Descargar Excel]";
        },
        error   : (err: Error)  => {
          //
          console.error('Observer got an error: ' + err.cause);
          //
          console.error('Observer got an error: ' + err.message);
          //
          this.rf_buttonCaption_xls  = "[Ha ocurrido un error]";
          //
          this.rf_textStatus_xls     = "[Ha ocurrido un error]";
        },
        complete: () => {
          //
          console.log('Observer got a complete notification')
          //
          this.rf_buttonCaption_xls  = "[Generar Excel]";
        },
      };
      //
      this.rf_excelFileName.subscribe(xlsObserver);
    }
    //
    DebugHostingContent(msg : string) : string {
      //
      console.log("cadena a evaular : " + msg);
      //
      let regEx   = /(.*)(<!--SCRIPT GENERATED BY SERVER! PLEASE REMOVE-->)(.*\w+.*)(<!--SCRIPT GENERATED BY SERVER! PLEASE REMOVE-->)(.*)/;
      //
      var strMsg  = msg.replace(/(\r\n|\n|\r)/gm, "");
      //
      var matches = strMsg.match(regEx);
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
    //--------------------------------------------------------------------------
    // METODOS REACTIVE FORMS 
    //--------------------------------------------------------------------------
    _td_onSubmit():void
    {
        //    
    }    
}
