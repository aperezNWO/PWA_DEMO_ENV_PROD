import { Component, OnInit, ViewChild, signal, effect  } from '@angular/core';
import { FormBuilder, Validators                       } from '@angular/forms';
import { ActivatedRoute                                } from '@angular/router';
import { MatTableDataSource                            } from '@angular/material/table';
import { MatPaginator                                  } from '@angular/material/paginator';
import { Observable                                    } from 'rxjs';
import { UtilManager                                   } from 'src/app/_engines/util.engine';
import { LogEntry, SearchCriteria, _languageName       } from 'src/app/_models/entity.model';
import { BackendService                                } from 'src/app/_services/BackendService/backend.service';
import { SpeechService                                 } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { ConfigService                                 } from 'src/app/_services/__Utils/ConfigService/config.service';
import { PAGE_FILE_GENERATION_XLS                      } from 'src/app/_models/common';
import { CustomErrorHandler                            } from 'src/app/app.component';
import { FilesGenerationBaseComponent                  } from '../files-generation-base/files-generation-base/files-generation-base.component';
//
@Component({
  selector     : 'app-files-generation-xls',
  templateUrl  : './files-generation-xls.component.html',
  styleUrls    : ['./files-generation-xls.component.css']
})
//
export class FilesGenerationXLSComponent extends FilesGenerationBaseComponent implements OnInit {
    //--------------------------------------------------------------------------
    // PROPIEADES - TEMPLATE FORMS
    //--------------------------------------------------------------------------
    //
    td_formSubmit                      : boolean = false;
    //
    td_buttonCaption                   : string  = "[Buscar]";
    //
    td_buttonCaption_xls               : string  = "[Generar Excel]";
    //
    td_textStatus_xls                  : string  = "";
    //
    td_ExcelDownloadLink               : string  = "#";
    //
    td_dataSource                      = new MatTableDataSource<LogEntry>();
    // 
    rf_displayedColumns                : string[] = ['id_Column', 'pageName', 'accessDate', 'ipValue'];
    //
    @ViewChild("td_paginator" ,{read:MatPaginator}) td_paginator!:  MatPaginator;
    //--------------------------------------------------------------------------
    // EVENT HANDLERS FORMIULARIO 
    //--------------------------------------------------------------------------
    //
    constructor(
                   public override formBuilder          : FormBuilder, 
                   public customErrorHandler            : CustomErrorHandler,
                   public override configService        : ConfigService,
                   public override backendService       : BackendService, 
                   public override route                : ActivatedRoute,
                   public override speechService        : SpeechService) 
    {
             super(formBuilder,
                   configService,
                   backendService,
                   route,
                   speechService,
                   PAGE_FILE_GENERATION_XLS
             )
    }
    //
    ngOnInit(): void {
        //
        this.speechService.speakTextCustom(this.pageTitle); 
        //
        this.queryParams();
        //
        //this.rf_newSearch();
        this.td_newSearch();
    }
    //--------------------------------------------------------------------------
    // METODOS TEMÑLEATE BASED FORMS 
    //--------------------------------------------------------------------------
    //
    td_newSearch() : void {
      //
      console.warn("(NEW SEARCH TD)");
      //
      this.td_dataSource           = new MatTableDataSource<LogEntry>();
      this.td_dataSource.paginator = this.td_paginator;
      //
      this._model                  = new SearchCriteria( 
          "1"
         ,"1"
         ,"999"
         ,"2022-09-01"
         ,"2022-09-30"
         ,""
         ,"");
      //
      this.td_buttonCaption     = "[Buscar]";
      //
      this.td_formSubmit        = false;
      //
      this.status_message.set("");
      //
      this.td_buttonCaption_xls               = "[Generar Excel]";
      //
      this.td_textStatus_xls                  = "";
      //
      this.td_ExcelDownloadLink               = "#";
    }
    //
    td_valid_form() : boolean {
      return (     
             ( ( this._model.P_ROW_NUM        != "" ) && (this._model.P_ROW_NUM       !=  null) && (this._model.P_ROW_NUM      != "0") ) 
          && ( ( this._model.P_FECHA_INICIO   != "" ) && (this._model.P_FECHA_INICIO  !=  null) ) 
          && ( ( this._model.P_FECHA_FIN      != "" ) && (this._model.P_FECHA_FIN     !=  null) ) 
      );  
    }
    //
    td_onSubmit() 
    { 
        //
        console.warn("TEMPLATE DRIVEN - (SUBMIT)");
        //
        console.warn("TEMPLATE DRIVEN - FORM VALID : " + this.td_valid_form());
        //
        this.td_formSubmit    = true;
        //
        if (this.td_valid_form())
            this.td_update(this._model);
    }
    //
    td_update(td_searchCriteria : SearchCriteria):void {
      //
      td_searchCriteria.P_FECHA_INICIO_STR = this.GetFormattedDate(td_searchCriteria.P_FECHA_INICIO,0);
      td_searchCriteria.P_FECHA_FIN_STR    = this.GetFormattedDate(td_searchCriteria.P_FECHA_FIN   ,0); 
      //
      let selectedIndex: number = this._languajeList.nativeElement.options.selectedIndex; // c++ by default
      //
      switch (selectedIndex) {
        case 1: // C#
              //
              this.td_buttonCaption = "[Favor espere...]";
              //
              this.status_message.set("Favor espere...");
              // 
              let td_informeLogRemoto!                 : Observable<LogEntry[]>;
              //      
              td_informeLogRemoto                      = this.backendService.getLogRemoto(td_searchCriteria);
              //
              const td_observer = {
                next: (td_logEntry: LogEntry[])     => { 
                  //
                  this.td_dataSource           = new MatTableDataSource<LogEntry>(td_logEntry);
                  this.td_dataSource.paginator = this.td_paginator;
                  //
                  this.status_message.set("Se encontraron [" + td_logEntry.length + "] registros ");
                  this.td_formSubmit           = false;
                },
                error           : (err: Error)      => {
                  //
                  console.error('TEMPLATE DRIVEN - (ERROR) : ' + JSON.stringify(err.message));
                  //
                  this.status_message.set("Ha ocurrido un error. Favor intente de nuevo");
                  this.td_formSubmit           = false;
                  this.td_buttonCaption        = "[Buscar]";
                },
                complete        : ()                => {
                  //
                  this.td_formSubmit           = false;
                  this.td_buttonCaption        = "[Buscar]";
                },
              }; 
              //
              td_informeLogRemoto
              .subscribe(td_observer);
          break;
        case 2: // NODE.JS
              //
              this.td_buttonCaption = "[Favor espere...]";
              //
              this.status_message.set("Favor espere");
              // 
              let td_informeLogRemoto_NodeJs!   : Observable<string>;
              // 
              td_informeLogRemoto_NodeJs        = this.backendService.getLogRemotoNodeJS(td_searchCriteria);
              //
              const td_observer_node_js = {
                next: (td_logEntry_node_js: string)     => { 
                  //
                  let td_logEntry_node_js_json = JSON.parse(td_logEntry_node_js)['recordsets'][0];
                  //
                  this.td_dataSource           = new MatTableDataSource<LogEntry>(td_logEntry_node_js_json);
                  this.td_dataSource.paginator = this.td_paginator;
                  //
                  this.status_message.set("Se encontraron [" + td_logEntry_node_js_json.length + "] registros ");
                  this.td_formSubmit           = false;
                },
                error           : (err: Error)      => {
                  //
                  console.error('TEMPLATE DRIVEN - NODE.JS - (ERROR) : ' + JSON.stringify(err.message));
                  //
                  this.status_message.set("Ha ocurrido un error. Favor intente de nuevo");
                  this.td_formSubmit           = false;
                  this.td_buttonCaption        = "[Buscar]";
                },
                complete        : ()                => {
                  //
                  this.td_formSubmit           = false;
                  this.td_buttonCaption        = "[Buscar]";
                },
              }; 
              //
              td_informeLogRemoto_NodeJs
              .subscribe(td_observer_node_js);
          break;
        case 3: // SPRINGBOOT / JAVA
              //
              this.td_buttonCaption = "[Favor espere...]";
              //
              this.status_message.set("Favor espere");
              // 
              let td_informeLogRemoto_SprinbBootJava!   : Observable<string>;
              // 
              td_informeLogRemoto_SprinbBootJava        = this.backendService.getLogRemotoSprinbBootJava(td_searchCriteria);
              //
              const td_observer_sprinbbootjava = {
                next: (td_logEntry_sprinbboot_java: string)     => { 
                  //
                  //console.log('TEMPLATE DRIVEN - SPRINGBOOT / JAVA - RETURN VALUES  : ' + td_logEntry_sprinbboot_java);
                  //
                  let td_logEntry_springboot_java_json   = JSON.parse(td_logEntry_sprinbboot_java);
                  //
                  this.td_dataSource           = new MatTableDataSource<LogEntry>(td_logEntry_springboot_java_json);
                  this.td_dataSource.paginator = this.td_paginator;
                  //
                  this.status_message.set("Se encontraron [" + td_logEntry_springboot_java_json.length + "] registros ");
                  this.td_formSubmit           = false;
                },
                error           : (err: Error)      => {
                  //
                  console.error('TEMPLATE DRIVEN - sprigboot/Java - (ERROR) : ' + JSON.stringify(err.message));
                  //
                  this.status_message.set("Ha ocurrido un error. Favor intente de nuevo");
                  this.td_formSubmit           = false;
                  this.td_buttonCaption        = "[Buscar]";
                },
                complete        : ()                => {
                  //
                  this.td_formSubmit           = false;
                  this.td_buttonCaption        = "[Buscar]";
                },
              }; 
              //
              td_informeLogRemoto_SprinbBootJava
              .subscribe(td_observer_sprinbbootjava);
          break;
        case 4: // DJANGO     / PYTHON
          //
          this.td_buttonCaption = "[Favor espere...]";
          //
          this.status_message.set("Favor espere");
          // 
          let td_informeLogRemoto_PythonDjango!   : Observable<string>;
          // 
          td_informeLogRemoto_PythonDjango        = this.backendService.getLogRemotoDjangoPython(td_searchCriteria);
          //
          const td_observer_pythondjango = {
            next: (td_logEntry_python_django: string)     => { 
              //
              let td_logEntry_python_django_json   = JSON.parse(td_logEntry_python_django);
              //
              this.td_dataSource           = new MatTableDataSource<LogEntry>(td_logEntry_python_django_json);
              this.td_dataSource.paginator = this.td_paginator;
              //
              this.status_message.set("Se encontraron [" + td_logEntry_python_django_json.length + "] registros ");
              this.td_formSubmit           = false;
            },
            error           : (err: Error)      => {
              //
              console.error('TEMPLATE DRIVEN - python/django - (ERROR) : ' + JSON.stringify(err.message));
              //
              this.status_message.set("Ha ocurrido un error. Favor intente de nuevo");
              this.td_formSubmit           = false;
              this.td_buttonCaption        = "[Buscar]";
            },
            complete        : ()                => {
              //
              this.td_formSubmit           = false;
              this.td_buttonCaption        = "[Buscar]";
            },
          }; 
          //
          td_informeLogRemoto_PythonDjango
          .subscribe(td_observer_pythondjango);
      break;
        default:
          return;
      }
    };
    //
    td_GenerarInformeXLSValidate():void
    {
        this.td_GenerarInformeXLS(this._model);
    }
    //
    td_GenerarInformeXLS(_searchCriteria : SearchCriteria)
    {
      //
      let td_excelFileName!                   : Observable<string>;
      //
      td_excelFileName                        = this.backendService.getInformeExcel(this._model);
      //
      this.td_ExcelDownloadLink               = "#";
      //
      this.td_buttonCaption_xls               = "[Generando por favor espere...]";
      //
      this.status_message.set("Generando por favor espere.");
      //
      const xlsObserver                       = {
        //
        next: (_excelFileName: string) => { 
          //
          let urlFile                = UtilManager.DebugHostingContent(_excelFileName); 
          //
          this.td_ExcelDownloadLink  = `${this.configService.getConfigValue('baseUrlNetCore')}/wwwroot/xlsx/${urlFile}`;
          //
          this.status_message.set("Se generó el archivo XLS correctamente");
          //
          this.td_textStatus_xls = "[Descargar Excel]";
        },
        error   : (err: Error)  => {
          //
          console.error('Observer got an error: ' + err.cause);
          //
          console.error('Observer got an error: ' + err.message);
          //
          this.td_buttonCaption_xls  = "[Ha ocurrido un error]";
          //
          this.td_textStatus_xls = "[Ha ocurrido un error]";
          //
          this.status_message.set("Ha ocurrido un error")
        },
        complete: () => {
          //
          this.td_buttonCaption_xls  = "[Generar Excel]";
        },
      };
      //
      td_excelFileName
      .subscribe(xlsObserver);
    }
}


