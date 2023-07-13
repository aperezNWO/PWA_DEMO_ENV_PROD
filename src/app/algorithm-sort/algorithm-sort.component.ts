import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MCSDService } from '../mcsd.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-algorithm-sort',
  templateUrl: './algorithm-sort.component.html',
  styleUrls: ['./algorithm-sort.component.css']
})
export class AlgorithmSortComponent implements OnInit, AfterViewInit {
    ////////////////////////////////////////////////////////////////////////
    // PROPIEDADES
    ////////////////////////////////////////////////////////////////////////
    pageTitle               : string = '[ALGORITMOS - ORDENAMIENTO]';
    //
    static pageTitle()      : string {
      return '[ALGORITMOS - ORDENAMIENTO]';
    }
    ////////////////////////////////////////////////////////////////////////
    // VARIABLES
    ////////////////////////////////////////////////////////////////////////
    private   rectSize                      : number = 10;
    public    lblStatus                     : string = "[STATUS]";
    public    context                       : any;
    @ViewChild('c_canvas') c_canvas         : any;
    @ViewChild('mensajes') mensajes         : any;
    //
    private screenSize          : number   = 250;
    private delayInMilliseconds : number   = 1000;
    private stringMatrix        : string[] = [];
    private indexDraw           : number   = 0;
    private sortedArrayDecoded  : string   = "";
    //
    constructor(public mcsdService: MCSDService)
    {
        //
    }
    //
    ngOnInit(): void {
        //
        console.info(this.pageTitle + " - [INGRESO]");
    }
    //
    ngAfterViewInit(): void {
        //
        this.context = this.c_canvas.nativeElement.getContext("2d");
        //
        this.DrawGrid();
        //
        this.GetNewSort();
    }
    //
    DrawGrid():void
    {
        //
        this.context.clearRect(0, 0, this.c_canvas.nativeElement.width, this.c_canvas.nativeElement.height);
        //
        for (let x = 0.5; x < 501; x += this.rectSize) {
            this.context.moveTo(x, 0);
            this.context.lineTo(x, 381);
        }
        //
        for (let y = 0.5; y < 381; y += this.rectSize) {
            this.context.moveTo(0, y);
            this.context.lineTo(500, y);
        }
        //
        this.context.strokeStyle = "#cccccc";
        this.context.stroke();
        //
    }
    //
    public GetSort()
    {
        //
        console.log(this.pageTitle + " - [GET SORT]" );
        //
        let p_sortAlgorith    : number = 1;
        //
        //var sortAlgoritm = $('#SortAlgorithmList').val();
        //
        if (p_sortAlgorith = 0)
        {
            //
            this.lblStatus = ('FAVOR SELECCIONE UN ALGORITMO');
            //
            return;
        }
        //
        let GetSortInfo!      : Observable<string>;
        //
        GetSortInfo           = this.mcsdService.getSort(p_sortAlgorith);
        //
        const GetSortInfoObserver   = {
            //
            next: (data: string)     => { 
                //
                console.info(this.pageTitle + ' - [GETTING SORT]  - RETURN VALUE : ' + data);
                //
                //-----------------------------------------------------------------------
                // CORREGIR DATOS DE MATRIZ PARA VISUALIZAR EN CANVAS
                //-----------------------------------------------------------------------
                //
                this.stringMatrix = data.split("■");
                //
                for (let index = 0; index < this.stringMatrix.length; index++)
                {
                    //
                    this.stringMatrix[index] = this.stringMatrix[index].replace("<br/>", "");
                    this.stringMatrix[index] = this.stringMatrix[index].replace("■"    , "");
                    //
                }
                //
                this.sortedArrayDecoded = this.stringMatrix[this.stringMatrix.length - 1]
                //
                for (let index = 0; index < this.stringMatrix.length; index++)
                {
                    //
                    while (this.stringMatrix[index].indexOf("<br/>") != -1)
                    {
                        //
                        this.stringMatrix[index] = this.stringMatrix[index].replace("<br/>", ",");
                    }
                    //
                    console.log('SORT_BENCHMARK . SORTED ARRAY : ' + index + ' : ' + this.stringMatrix[index]);
                }
                //-----------------------------------------------------------------------
                // REINICIAR CONTROLES
                //-----------------------------------------------------------------------
                //
                //$('#SortAlgorithmList').prop('disabled', true);
                //
                //$("#GetSort").prop('disabled', true);
                //
                //$("#NewSort").prop('disabled', false);
                //-----------------------------------------------------------------------
                // DIBUJAR CUADRICULA
                //-----------------------------------------------------------------------
                //
                this.DrawStepMain();
                //
                return true;
                //
            },
            error: (err: Error) => {
                //
                console.error(this.pageTitle + ' - [GETTING SORT] - [error] : ' + err.message);
                //
                this.lblStatus  = "[ha ocurrido un error]";
            },       
            complete: ()        => {
                //
                console.warn(this.pageTitle  + ' - [GETTING SORT] - [Observer got a complete notification]');
                //
            },
        };
        //
        GetSortInfo.subscribe(GetSortInfoObserver);
    }    
    //
    public GetNewSort():void
    {
        //
        console.log(this.pageTitle + " - [NEW SORT]" );   
        //
        let randomVertexInfo!          : Observable<string>;
        //
        randomVertexInfo               = this.mcsdService.getNewSort();
        //
        const randomVertexObserver     = {
            //
            next: (sortInfo: string)     => { 
                //
                console.info(this.pageTitle + ' - [GETTING NEW SORT]  - RETURN VALUE : ' + sortInfo);
                //
                //-------------------------------------------------------------
                // CONFIGURA CONTROLES
                //-------------------------------------------------------------
                //
                this.mensajes.nativeElement.innerHTML = sortInfo;
                //
                this._ResetControls();
                //
                this.lblStatus  = "[REINICIO EXITOSO]";
            },
            error: (err: Error) => {
                //
                console.error(this.pageTitle + ' - [GETTING NEW SORT] - [error] : ' + err.message);
                //
                this.lblStatus  = "[ha ocurrido un error]";
            },       
            complete: ()        => {
                //
                console.warn(this.pageTitle  + ' - [GETTING NEW SORT] - [Observer got a complete notification]');
                //
            },
        };
        //
        randomVertexInfo.subscribe(randomVertexObserver);
    }
    //
    _ResetControls():void
    {
        //
        let stringArray =  this.mensajes.nativeElement.innerHTML.split("<br>");
        //
        console.log('ARREGLO : ' + stringArray);
        //
        //$('#SortAlgorithmList').val('0');
        //
        //$('#SortAlgorithmList').prop('disabled', false);
        //
        //$("#GetSort").prop('disabled', false);
        //
        //$("#NewSort").prop('disabled', true);
        //
        this.DrawGrid();
        //
        this.DrawRectangles(stringArray);
        //
        this.lblStatus = '[STATUS]';
    }
    //
    DrawRectangles(stringArray : string[]):void
    {
        //
        this.context.fillStyle = "#ccc";
        //
        for (let index = 0; index < 25; index++)
        {
            //
            let x      : number = 0 + (this.rectSize * index);
            let y      : number = this.screenSize - (Number.parseInt(stringArray[index]) * this.rectSize);
            let length : number = (this.rectSize);
            let height : number = Number.parseInt(stringArray[index]) * this.rectSize;
            //
            this.context.fillRect(x, y, length, height);
        }
        //
    }
    //
    DrawStep():void
    {
        //
        console.log('SORT_BENCHMARK . DRAWING ARRAY : ' + this.indexDraw);
        //
        if (this.indexDraw >= this.stringMatrix.length)
        {
            //
            console.log('SORT_BENCHMARK . SORTED ARRAY : ' + this.sortedArrayDecoded);
            //
            this.mensajes.nativeElement.innerHTML = this.sortedArrayDecoded;
            //
            this.lblStatus                        = "[SE ORDENO CORRECTAMENTE EL LISTADO]";
            //
            return;
        }
        //
        if ((this.stringMatrix[this.indexDraw] == null) || (this.stringMatrix[this.indexDraw] != ''))
        {
            //
            this.lblStatus  = `Paso ${this.indexDraw} de ${this.stringMatrix.length-1}`;
            //
            let stringArray = this.stringMatrix[this.indexDraw];
            //
            let numberArray = stringArray.split(",");
            //
            console.log('NUMBER ARRAY : ' + numberArray);
            //
            this.DrawGrid();
            //
            this.DrawRectangles(numberArray);
            //
        }
        //
        this.indexDraw++;
        //
        setTimeout(this.DrawStep,500);
    };
    //
    DrawStepMain():void
    {
        //
        this.indexDraw = 0;
        //
        console.log('SORT_BENCHMARK . DRAWING ARRAY INITIAL. index: ' + this.indexDraw + ',matrix length : : ' + this.stringMatrix.length);
        //
        this.DrawStep();
        //
    }
}
