import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MCSDService                                 } from '../../../_services/mcsd.service';
import { CustomErrorHandler                          } from '../../../app.module';
import { Observable                                  } from 'rxjs';
//
@Component({
  selector: 'app-algorithm-sort',
  templateUrl: './algorithm-sort.component.html',
  styleUrls: ['./algorithm-sort.component.css']
})
//
export class AlgorithmSortComponent implements OnInit, AfterViewInit {
    ////////////////////////////////////////////////////////////////////////
    // PROPIEDADES
    ////////////////////////////////////////////////////////////////////////
    public static get PageTitle()      : string {
      return '[ALGORITMOS - ORDENAMIENTO]';
    }
    ////////////////////////////////////////////////////////////////////////
    // VARIABLES
    ////////////////////////////////////////////////////////////////////////
    private   rectSize                                    : number = 10;
    readonly  pageTitle                                   : string = AlgorithmSortComponent.PageTitle;
    public    lblStatus                                   : string = "[STATUS]";
    public    context                                     : any;
    @ViewChild('c_canvas') c_canvas                       : any;
    @ViewChild('mensajes') mensajes                       : any;
    @ViewChild('mensajes_1') mensajes_1                   : any;
    @ViewChild('SortAlgorithmList') SortAlgorithmList     : any;
    //
    private screenSize          : number   = 250;
    private delayInMilliseconds : number   = 500;
    private stringMatrix        : string[] = [];
    private indexDraw           : number   = 0;
    private sortedArrayDecoded  : string   = "";
    private arraySeparator      : string   = "|";
    //
    constructor(private mcsdService: MCSDService, private customErrorHandler: CustomErrorHandler)
    {
        //
        mcsdService.SetLog(this.pageTitle,"PAGE_SORT_BENCHAMRK_DEMO");
    }
    //
    ngOnInit(): void {
        //
        console.info(AlgorithmSortComponent.PageTitle + " - [INGRESO]");
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
        console.log(AlgorithmSortComponent.PageTitle + " - [GET SORT]" );
        //
        let selectedIndex   : number = this.SortAlgorithmList.nativeElement.options.selectedIndex;
        let p_sortAlgorith  : number = this.SortAlgorithmList.nativeElement.options[selectedIndex].value;
        //
        if (p_sortAlgorith == 0)
        {
            //
            this.lblStatus = ('FAVOR SELECCIONE UN ALGORITMO');
            //
            return;
        }
        //
        let _p_unsortedList   : string = this.mensajes.nativeElement.innerHTML;
        //
        while (_p_unsortedList.indexOf("<br>") != -1)
        {
            _p_unsortedList = _p_unsortedList.replace("<br>","|");
        }
        let p_unsortedList    : string = _p_unsortedList;
        //
        let GetSortInfo!      : Observable<string>;
        //
        GetSortInfo           = this.mcsdService.getSort(p_sortAlgorith, p_unsortedList);
        //
        const GetSortInfoObserver   = {
            //
            next: (data: string)     => { 
                //
                console.info(AlgorithmSortComponent.PageTitle + ' - [GETTING SORT]  - RETURN VALUE : ' + data);
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
            },
            error: (err: Error) => {
                //
                console.error(AlgorithmSortComponent.PageTitle + ' - [GETTING SORT] - [error] : ' + err.message);
                //
                this.lblStatus  = "[ha ocurrido un error]";
                //
                return false;
            },       
            complete: ()        => {
                //
                console.warn(AlgorithmSortComponent.PageTitle  + ' - [GETTING SORT] - [Observer got a complete notification]');
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
        console.log(AlgorithmSortComponent.PageTitle + " - [NEW SORT]" );   
        //
        let randomVertexInfo!          : Observable<string>;
        //
        randomVertexInfo               = this.mcsdService.getNewSort();
        //
        const randomVertexObserver     = {
            //
            next: (sortInfo: string)     => { 
                //
                console.info(AlgorithmSortComponent.PageTitle + ' - [GETTING NEW SORT]  - RETURN VALUE : ' + sortInfo);
                //
                //-------------------------------------------------------------
                // CONFIGURA CONTROLES
                //-------------------------------------------------------------
                //
                this.mensajes.nativeElement.innerHTML   = sortInfo;
                //
                let sortInfo_1 : string = sortInfo;
                //
                while (sortInfo_1.indexOf("<br/>") != -1)
                {
                    //
                    sortInfo_1= sortInfo_1.replace("<br/>", this.arraySeparator);
                }
                //
                this.mensajes_1.nativeElement.innerHTML = sortInfo_1.trim();
                //
                this._ResetControls();
                //
                this.lblStatus  = "[REINICIO EXITOSO]";
            },
            error: (err: Error) => {
                //
                console.error(AlgorithmSortComponent.PageTitle + ' - [GETTING NEW SORT] - [error] : ' + err.message);
                //
                this.lblStatus  = "[ha ocurrido un error]";
            },       
            complete: ()        => {
                //
                console.warn(AlgorithmSortComponent.PageTitle  + ' - [GETTING NEW SORT] - [Observer got a complete notification]');
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
            let _sortedArrayDecoded : string = this.sortedArrayDecoded;
            //
            while (_sortedArrayDecoded.indexOf("<br/>") != -1)
            {
                //
                _sortedArrayDecoded= _sortedArrayDecoded.replace("<br/>", this.arraySeparator);
            }
            //
            this.mensajes_1.nativeElement.innerHTML = _sortedArrayDecoded.trim();
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
            let _sortedArrayDecoded : string = this.stringMatrix[this.indexDraw];
            //
            console.log('NUMBER ARRAY [MATRIX] : ' + this.stringMatrix[this.indexDraw]);
            //
            while (_sortedArrayDecoded.indexOf(",") != -1)
            {
                //
                _sortedArrayDecoded= _sortedArrayDecoded.replace(",", this.arraySeparator);
            }
            //
            this.mensajes_1.nativeElement.innerHTML = _sortedArrayDecoded.trim();
        }
        //
        this.indexDraw++;
        //
        setTimeout( () => {  this.DrawStep()   }, this.delayInMilliseconds);
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
