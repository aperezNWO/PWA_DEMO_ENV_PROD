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
    // PROPIEDADES - ESTADISTICA
    //--------------------------------------------------------------------------
    //
    @ViewChild('canvas_csv') canvas_csv             : any;
    //
    @ViewChild('divPieChart_CSV') divPieChart_CSV   : any;
    //
    public pieChartVar                              : any;
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
        //
        let csv_informeLogRemoto!                 : Observable<string>;
        csv_informeLogRemoto                      = this.mcsdService.getInformeRemotoCSV();
        //
        const csv_observer = {
          next: (csv_data: string)     => { 
            //
            console.log(this.pageTitle + " - [SET CSV DATA] - Return Values : [" + csv_data + "]");
          },
          error           : (err: Error)      => {
            //
            console.log(this.pageTitle + " - [SET CSV DATA] - Error : [" + err.message + "]");
          },
          complete        : ()                => {
            //
            console.log(this.pageTitle + " - [SET CSV DATA] - [Search end]");
          },
        }
        //
        csv_informeLogRemoto.subscribe(csv_observer);
    }  
    SetChart():void
    {
          //
          console.log(this.pageTitle + " - [SET CHART]");
          //
          const statLabels          : string[]          = [];
          const statData            : Number[]          = [];
          const statBackgroundColor : string[]          = [];
          //
          let csv_informeLogRemoto!                 : Observable<string>;
          csv_informeLogRemoto                      = this.mcsdService.getInformeRemotoCSV();
          //
          const csv_observer = {
            next: (csv_data: string)     => { 
              //
              console.log(this.pageTitle + " - [SET CSV DATA] - Return Values : [" + csv_data + "]");
              //
              let jsondata     = JSON.parse(csv_data);
              //
              let recordNumber = jsondata.length;
              //
              console.log('ESTADISTICA - (return): ' + recordNumber);
              //
              jsondata.forEach((element: JSON, index : number) => {
                //
                console.log(index + " " + JSON.stringify(element));
                //
                console.log("[CSV DEMO] - SET CHART - RESULT : index [" + index + "] value={"
                      + jsondata[index]["id_Column"]
                + "-" + jsondata[index]["ciudad"] + "}");
                //
                statLabels.push(jsondata[index]["ciudad"]);
                statData.push(Number(jsondata[index]["id_Column"]));
                //
                let randomNumber_1 = Math.floor(Math.random() * 100);
                let randomNumber_2 = Math.floor(Math.random() * 100);
                let randomNumber_3 = Math.floor(Math.random() * 100);
                //
                console.log('RANDOM NUMBERS : [' + randomNumber_1 + ',' + randomNumber_2 + ',' + randomNumber_3 + ']')
                //
                let rgbStr = 'rgb('
                    + (Number(jsondata[index]["id_Column"]) + randomNumber_1) + ','
                    + (Number(jsondata[index]["id_Column"]) + randomNumber_2) + ','
                    + (Number(jsondata[index]["id_Column"]) + randomNumber_3) + ')';
                //
                console.log('RGB : ' + rgbStr);
                //
                statBackgroundColor.push(rgbStr);
              });      
            },
            error           : (err: Error)      => {
              //
              console.log(this.pageTitle + " - [SET CSV DATA] - Error : [" + err.message + "]");
            },
            complete        : ()                => {
              //
              console.log(this.pageTitle + " - [SET CSV DATA] - [Search end]");
              //
              const data = {
                labels              : statLabels,
                datasets            : [{
                    label           : 'CONTEO DE SESIONES',
                    data            : statData,
                    backgroundColor : statBackgroundColor,
                    hoverOffset     : 4
                }]
              };
              //
              let context = this.canvas_csv.nativeElement.getContext('2d');
              //
              this.pieChartVar = new Chart(context, {
                    type: 'pie',
                    data: data,
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'bottom',
                            },
                            title: {
                                display: true,
                                text: 'CIUDADES'
                            }
                        }
                    }
                });
             },
        };
        //
        csv_informeLogRemoto.subscribe(csv_observer);
    }   
        //--------------------------------------------------------------------------
    // METODOS - PDF
    //--------------------------------------------------------------------------
    //
    GetPDF():void
    {
      //
      console.log("getting pdf");
      //
      html2canvas(this.canvas_csv.nativeElement).then((_canvas) => {
          //
          let w = this.divPieChart_CSV.nativeElement.offsetWidth;
          let h = this.divPieChart_CSV.nativeElement.offsetHeight;
          //
          let imgData = _canvas.toDataURL('image/jpeg');
          //
          let pdfDoc  = new jsPDF("landscape", "px", [w, h]);
          //
          pdfDoc.addImage(imgData, 0, 0, w, h);
          //
          pdfDoc.save('sample-file.pdf');
      });
    }
}
