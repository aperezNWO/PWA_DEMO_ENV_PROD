import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MCSDService } from '../mcsd.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-algorithm-sort',
  templateUrl: './algorithm-sort.component.html',
  styleUrls: ['./algorithm-sort.component.css']
})
export class AlgorithmSortComponent implements OnInit, AfterViewInit {
    pageTitle               : string = '[ALGORITMOS - ORDENAMIENTO]';
    //
    static pageTitle()      : string {
      return '[ALGORITMOS - ORDENAMIENTO]';
    }
    private   rectSize                      : number = 10;
    public    lblStatus                     : string = "[STATUS]";
    public    context                       : any;
    @ViewChild('c_canvas') c_canvas         : any;
    @ViewChild('mensajes') mensajes         : any;
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
        for (var x = 0.5; x < 501; x += this.rectSize) {
            this.context.moveTo(x, 0);
            this.context.lineTo(x, 381);
        }
        //
        for (var y = 0.5; y < 381; y += this.rectSize) {
            this.context.moveTo(0, y);
            this.context.lineTo(500, y);
        }
        //
        this.context.strokeStyle = "#cccccc";
        this.context.stroke();
        //
    }
    //
    public GetNewSort():void
    {
        //
        let randomVertexInfo!  : Observable<string>;
        //
        randomVertexInfo       = this.mcsdService.getNewSort();
        //
        const randomVertexObserver   = {
            //
            next: (sortInfo: string)     => { 
                //
                console.warn(this.pageTitle + ' - [GETTING NEW SORT]  - RETURN VALUE : ' + sortInfo);
                //
                //-------------------------------------------------------------
                // CONFIGURA CONTROLES
                //-------------------------------------------------------------
                //
                this.mensajes.nativeElement.innerHTML = sortInfo;
            },
            error: (err: Error) => {
                //
                console.error(this.pageTitle + ' - [GETTING NEW SORT] - [error] : ' + err.message);
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
}
/*
<script type="text/javascript">
    //------------------------------------------------------------------------------------------------
    // DECLARACION DE VARIABLES
    //------------------------------------------------------------------------------------------------
    var screenSize          = 250;
    var delayInMilliseconds = 1000;
    var stringMatrix        = "";
    var indexDraw           = 0;
    var sortedArrayDecoded  = "";
    //
    //
    function DrawRectangles(stringArray)
    {
        //
        context.fillStyle = "#ccc";
        //
        for (var index = 0; index < 25; index++)
        {
            //
            var x      = 0 + (rectSize * index);
            var y      = screenSize - (stringArray[index] * rectSize);
            var length = (rectSize);
            var height = stringArray[index] * rectSize;
            //
            context.fillRect(x, y, length, height);
        }
        //
    }
    //
    function DrawStep()
    {
        //
        console.log('SORT_BENCHMARK . DRAWING ARRAY : ' + indexDraw);
        //
        if (indexDraw >= stringMatrix.length)
        {
            //
            console.log('SORT_BENCHMARK . SORTED ARRAY : ' + sortedArrayDecoded);
            //
            $('#mensajes').html(sortedArrayDecoded);
            //
            alert('SE ORDENO CORRECTAMENTE EL LISTADO');
            //
            return;
        }
        //
        if ((stringMatrix[indexDraw] == null) || (stringMatrix[indexDraw] != ''))
        {
            //
            $('#lblstatus').text(' Paso ' + (indexDraw) + ' de ' + (stringMatrix.length-1));
            //
            var stringArray = stringMatrix[indexDraw];
            //
            var numberArray = stringArray.split(",");
            //
            console.log('NUMBER ARRAY : ' + numberArray);
            //
            DrawGrid();
            //
            DrawRectangles(numberArray);
            //
        }
        //
        indexDraw++;
        //
        setTimeout(DrawStep,500);
    };
    //
    function DrawStepMain()
    {
        //
        indexDraw = 0;
        //
        console.log('SORT_BENCHMARK . DRAWING ARRAY INITIAL. index: ' + indexDraw + ',matrix length : : ' + stringMatrix.length);
        //
        DrawStep();
        //
    }
    //
    function _ResetControls()
    {
        //
        var stringArray = $('#mensajes').html().split("<br>");
        //
        console.log('ARREGLO : ' + stringArray);
        //
        $('#SortAlgorithmList').val('0');
        //
        $('#SortAlgorithmList').prop('disabled', false);
        //
        $("#GetSort").prop('disabled', false);
        //
        $("#NewSort").prop('disabled', true);
        //
        DrawGrid();
        //
        DrawRectangles(stringArray);
        //
        $('#lblstatus').text('[STATUS]');
        //
    }
    //
    $("#GetSort").click(function ()
    {
        try
        {
            //
            var sortAlgoritm = $('#SortAlgorithmList').val();
            //
            if (sortAlgoritm == '0')
            {
                //
                alert('FAVOR SELECCIONE UN ALGORITMO');
                //
                return;
            }
            //
            var p_url = "_GetSort";
            //
            $.ajax(
                {
                    url: p_url,
                    data:
                    {
                        p_sortAlgoritm: sortAlgoritm
                    }
                })
                .done(function (data)
                {
                    //
                    console.log('SORT_BENCHMARK . GET SORT : ' + data);
                    //
                    //-----------------------------------------------------------------------
                    // CORREGIR DATOS DE MATRIZ PARA VISUALIZAR EN CANVAS
                    //-----------------------------------------------------------------------
                    //
                    stringMatrix = data.split("■");
                    //
                    for (var index = 0; index < stringMatrix.length; index++)
                    {
                        //
                        stringMatrix[index] = stringMatrix[index].replace("<br/>", "");
                        stringMatrix[index] = stringMatrix[index].replace("■"    , "");
                        //
                    }
                    //
                    sortedArrayDecoded = stringMatrix[stringMatrix.length - 1]
                    //
                    for (var index = 0; index < stringMatrix.length; index++)
                    {
                        //
                        while (stringMatrix[index].indexOf("<br/>") != -1)
                        {
                            //
                            stringMatrix[index] = stringMatrix[index].replace("<br/>", ",");
                        }
                        //
                        console.log('SORT_BENCHMARK . SORTED ARRAY : ' + index + ' : ' + stringMatrix[index]);
                    }
                    //-----------------------------------------------------------------------
                    // REINICIAR CONTROLES
                    //-----------------------------------------------------------------------
                    //
                    $('#SortAlgorithmList').prop('disabled', true);
                    //
                    $("#GetSort").prop('disabled', true);
                    //
                    $("#NewSort").prop('disabled', false);
                    //-----------------------------------------------------------------------
                    // DIBUJAR CUADRICULA
                    //-----------------------------------------------------------------------
                    //
                    DrawStepMain();
                    //
                    return true;
                    //
                }).fail(function (jqXHR, textStatus, errorThrown)
                {
                    //
                    _HideProgressBar();
                    //
                    console.log('ERROR EN GENERACION DE GRAFO : ' + textStatus);
                    //
                    console.log('ERROR EN GENERACION DE GRAFO : ' + errorThrown);
                    //
                    alert("ERROR EN GENERACÍON DE GRAFO");
                    //
                    return false;
                });
        }
        catch (error)
        {
            //
            alert("ERROR EN PROCEDIMIENTO");
            //
            console.error(error);
            //
            return false;
        }
        //
    });
    //
    $("#NewSort").click(function ()
    {
        try
        {
            //
            _ShowProgressBar();
            //
            var p_url = "_NewSort";
            //
            $.ajax(
                {
                    url: p_url
                })
                .done(function (msg)
                {
                    //
                    console.log('SORT_BENCHMARK . NEW SORT : ' + msg);
                    //
                    _HideProgressBar();
                    //
                    $('#mensajes').html(msg);
                    //
                    _ResetControls();
                    //
                    alert('REINICIO EXITOSO');
                    //
                    return true;
                })
                .fail(function (jqXHR, textStatus, errorThrown)
                {
                    //
                    _HideProgressBar();
                    //
                    console.log('ERROR EN GENERACION DE GRAFO : ' + textStatus);
                    //
                    console.log('ERROR EN GENERACION DE GRAFO : ' + errorThrown);
                    //
                    alert("ERROR EN GENERACÍON DE GRAFO");
                    //
                    return false;
                });
        }
        catch (error)
        {
            //
            alert("ERROR EN ARCHIVO ZIP");
            //
            console.error(error);
            //
            return false;
        }
        //
    });
    //
</script>
*/
