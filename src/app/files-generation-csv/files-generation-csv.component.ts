import { AfterViewInit, Component, ElementRef, OnInit, ViewChild   } from '@angular/core';
import { FormBuilder, Validators                       } from '@angular/forms';
import { MatTableDataSource                            } from '@angular/material/table';
import { MatPaginator                                  } from '@angular/material/paginator';
import { Observable                                    } from 'rxjs';
import { Chart, registerables                          } from 'chart.js';
import jsPDF                                             from 'jspdf';
import html2canvas                                       from 'html2canvas';
import { LogEntry,SearchCriteria                       } from '../log-info.model';
import { MCSDService                                   } from '../mcsd.service';
//
@Component({
  selector: 'app-files-generation-csv',
  templateUrl: './files-generation-csv.component.html',
  styleUrls: ['./files-generation-csv.component.css']
})
//
export class FilesGenerationCSVComponent implements OnInit, AfterViewInit {
    //--------------------------------------------------------------------------
    // PROPIEDADES COMUNES
    //--------------------------------------------------------------------------
    pageTitle            : string = '[GENERAR ARCHIVO CSV]';
    //
    static pageTitle()   : string {
      return '[GENERAR ARCHIVOS CSV]';
    }
    //--------------------------------------------------------------------------
    // EVENT HANDLERS FORMIULARIO 
    //--------------------------------------------------------------------------
    //
    constructor(private mcsdService: MCSDService, private formBuilder: FormBuilder) {
      //
      Chart.register(...registerables);
      //
    }
    //
    ngOnInit(): void {
        //
        this.SetCSVData();
        //¡
        this.SetChart();
        //
        console.log(this.pageTitle);
    }
    //
    ngAfterViewInit():void {
        //
    }
    //
    SetCSVData():void
    {
        //
        console.log(this.pageTitle + " - [SET CSV DATA]");
    }
    //
    SetChart():void
    {
        //
        console.log(this.pageTitle + " - [SET CHART]");
    }
}
