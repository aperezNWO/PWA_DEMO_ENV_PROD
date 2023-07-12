import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MCSDService                                 } from '../mcsd.service';
import { Observable                                  } from 'rxjs';
import html2canvas                                     from 'html2canvas';
import jsPDF                                           from 'jspdf';
import { _vertexSize }                                 from '../log-info.model';
//
@Component({
  selector       : 'app-algorithm-dijkstra',
  templateUrl    : './algorithm-dijkstra.component.html',
  styleUrls      : ['./algorithm-dijkstra.component.css']
})
//
export class AlgorithmDijkstraComponent implements OnInit, AfterViewInit {
  ////////////////////////////////////////////////////////////////
  // PROPERTIES //////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  pageTitle               : string = '[ALGORITMOS - DISTANCIA MAS CORTA]';
  //
  static pageTitle()      : string {
    return '[ALGORITMOS - DISTANCIA MAS CORTA]';
  }
  ////////////////////////////////////////////////////////////////
  // VARIABLES ///////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  protected vertexMax        : number = 9;
  protected rectSize         : number = 10;
  protected screenSize       : number = 250;
  protected strokeStyleCafe  : string = "#654321";
  protected strokeStyleVerde : string = "#006400";
  protected strokeStyleRed   : string = "#ff0000";
  //
  @ViewChild('c_canvas')      c_canvas      : any;
  @ViewChild('divCanvas_Pdf') divCanvas_Pdf : any;
  protected _context                        : any;
  @ViewChild('_vertexSizeList')  _vertexSizeList     : any;
  @ViewChild('_sourcePointList') _sourcePointList    : any;
  @ViewChild('_distanceList')    _distanceList       : any;
  //
  protected PointListHidden   : string = "";
  protected MatrixListHidden  : string = "";
  //
  public __vertexSizeList  : any;
  public __sourcePointList : any;
  public __distanceList    : any;
  ////////////////////////////////////////////////////////////////
  // EVENT HANDLERS //////////////////////////////////////////////  
  ////////////////////////////////////////////////////////////////
  constructor(public mcsdService: MCSDService)
  {
    //
  }
  //
  ngOnInit(): void {
    //
    console.log(this.pageTitle + " - [INGRESO]");
    //
    this.DrawListItems();
    //
    this.DrawDistanceList(true, "");
  }
  //
  ngAfterViewInit():void { 
    //
    console.log(this.pageTitle + " - [INICIO VISUAL]");
    //
    this._context = this.c_canvas.nativeElement.getContext('2d');
    //    
    this._ResetControls();
  };
  //
  public _vertexSizeListChange():void
  {
      //
      console.log(this.pageTitle + " - [VERTEX SIZE LIST CHANGE]");
      //
      /*    
      var vertexSizeVal = $("#vertexSizeList").val();

      $('#sourcePointList').children().remove().end();
      //
      for (var index = 0; index < vertexSizeVal; index++)
      {
          $('#sourcePointList').append($('<option>', { value: (index), text: (new String(index)) }));
      }
      //        
      $('#sourcePointList').val("0");
      */
  };
  //
  public _distanceListChange():void 
  {
    //
    console.log(this.pageTitle + " - [DISTANCE LIST CHANGE]");
    //
    //var distanceListVal = $("#DistanceList option:selected").text();
    let selectedIndex   : number = this._distanceList.nativeElement.options.selectedIndex;
    let distanceListVal : string = this._distanceList.nativeElement.options[selectedIndex].text;
    //
    console.log(this.pageTitle + " - [DISTANCE LIST CHANGE] - [Selected Text]: [" + distanceListVal + "]");
    //
    if (distanceListVal != "0")
    {
        //
        var pointList         = this.PointListHidden.split("|");
        var matrixList        = this.MatrixListHidden.split("|");

        //
        this.DrawGrid();
        //
        this.DrawPoints(pointList, this.strokeStyleCafe);
        //
        this.DrawLines(pointList, matrixList, this.strokeStyleVerde, false);

        //
        let distenceListItems = distanceListVal.split("-");
        let path              = distenceListItems[2];

        //
        if (path != "")
        { 
            while (path.indexOf(";") != -1)
            {
                path = path.replace(";", ",");
            }
            let selectedPoints  = path.split("≡");
            let emptyPoints     = new Array(pointList.length);

            //
            for (let index = 0; index < pointList.length; index++)
            {
                emptyPoints[index] = "[0,0]";
            }
            //
            for (let index_y = 0; index_y < selectedPoints.length; index_y++)
            { 
                if  (selectedPoints.length > 0)
                {
                    //
                    let selectedPointsVal = selectedPoints[index_y].replace("[", "").replace("]", "").split(",");

                    if  (selectedPointsVal.length > 0)
                    { 
                      //
                      let coordSource    : number   = Number.parseInt(selectedPointsVal[0]);
                      var coordDest      : number   = Number.parseInt(selectedPointsVal[1]);
                      //
                      emptyPoints[coordSource] = pointList[coordSource];
                      emptyPoints[coordDest]   = pointList[coordDest];
                    }
                }
            }
            // DRAW SHORTEST PATH
            this.DrawLines(emptyPoints, matrixList, this.strokeStyleRed   , true);
        }
    }
  };
  ////////////////////////////////////////////////////////////////
  // METODOS BOTONES /////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  //
  public _ResetControls():void
  {
      //
      console.log(this.pageTitle + " - [Resetting controls]");
      //
      //[_]
      //$('#tituloListadoDistancias').text('');
      //[_]
      //$('#DistanceList').attr('style', 'width:250px;display:none;');
      //[?]
      this.DrawListItems();
      //[?]
      this.DrawDistanceList(true, "");
      //[_]
      //$("#vertexSizeList").attr('disabled', false);
      //[_]
      //$('#sourcePointList').attr('disabled', false);
      //[_]
      //$('#mensajes').html('[PENDIENTE_GENERAR]');
      //[_]
      //$('#NewGraph').attr('disabled', true);
      //[_]
      //$('#GetGraph').attr('disabled', false);
      //[x]
      this.PointListHidden  = "";
      //[x]
      this.MatrixListHidden = "";
      //[X]
      this.DrawGrid();
  };
  // 
  _GetGraph():void
  {
        //
        console.log(this.pageTitle + " - [getting graph]");
        //
        let _vertexSize         : number = Number.parseInt(this._vertexSizeList.nativeElement.value);
        let _sourcePoint        : number = Number.parseInt(this._sourcePointList.nativeElement.value);
        //
        console.log(this.pageTitle + " - [vertex size : " + _vertexSize  + "]");
        //
        console.log(this.pageTitle + " - [source point: " + _sourcePoint + "]");
        //
        let randomVertexInfo!  : Observable<string>;
        //
        randomVertexInfo       = this.mcsdService.getRandomVertex(_vertexSize,_sourcePoint);
        //
        let data               : any;
        //
        const randomVertexObserver   = {
            //
            next: (randomVertexInfo: string)     => { 
                //
                console.warn(this.pageTitle + ' - [GETTING VERTEX VALUES]  - RETURN VALUE : ' + randomVertexInfo);
                //
                data = randomVertexInfo;
                //------------------------------------------------------------
                // OBTENER PUNTOS
                //------------------------------------------------------------
                let dataArray = data.split("■");
                //
                var pointsString = dataArray[0];
                //
                this.PointListHidden    = pointsString;
                //
                console.log('POINTS : ' + pointsString);
                //
                let pointArray      : string[] = pointsString.split('|');
                //
                //this.DrawGrid();
                //
                this.DrawPoints(pointArray, this.strokeStyleCafe);
                //
                //-------------------------------------------------------------
                // OBTENER MATRIZ - DIBUJAR LINEAS
                //-------------------------------------------------------------
                //
                let matrixString = dataArray[1];
                //
                console.log('MATRIX : ' + matrixString);
                //
                let matrixArray  = matrixString.split('|');
                //
                this.MatrixListHidden = matrixString;
                //
                this.DrawLines(pointArray, matrixArray, this.strokeStyleVerde, new Boolean(false));
                //            
                //-------------------------------------------------------------
                // OBTENER VERTICES DE DISTANCIAS
                //-------------------------------------------------------------
                var vertexString = dataArray[2];
                //
                console.log('VERTEX : ' + vertexString);
                //-------------------------------------------------------------
                // CONFIGURA CONTROLES
                //-------------------------------------------------------------
                //
                //$('#tituloListadoDistancias').text('Listado de Distancies desde (' + sourcePoint + ')');
                //
                //$('#DistanceList').attr('style', 'width:250px;display:inline');
                //
                //$("#vertexSizeList").attr('disabled', true);
                //
                //$('#sourcePointList').attr('disabled', true);
                //
                this.DrawDistanceList(false,vertexString);
                //
                //$('#NewGraph').attr('disabled', false);
                //
                //$('#GetGraph').attr('disabled', true);
            },
            error: (err: Error) => {
                //
                console.error(this.pageTitle + ' - [GETTING VERTEX VALUES] - [error] : ' + err.message);
            },       
            complete: ()        => {
                //
                console.warn(this.pageTitle + ' - [GETTING VERTEX VALUES] - [Observer got a complete notification]');
                //
            },
        };
        //
        randomVertexInfo.subscribe(randomVertexObserver);
  }
  ////////////////////////////////////////////////////////////////
  // METODOS GRAFICOS/////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  DrawGrid():void
  {
      //
      console.log(this.pageTitle + ' - [DRAWING GRID]');
      //
      this._context.clearRect(0, 0, this.c_canvas.nativeElement.width, this.c_canvas.nativeElement.height);
      this._context.beginPath();
      //
      for (var x = 0.5; x < 501; x += this.rectSize) {
        this._context.moveTo(x, 0);
        this._context.lineTo(x, 381);
      }
      //
      for (var y = 0.5; y < 381; y += this.rectSize) {
        this._context.moveTo(0, y);
        this._context.lineTo(500, y);
      }
      //
      this._context.strokeStyle = "#cccccc";
      this._context.stroke();
      //
  }
  //
  DrawPoint(pointName : string, x : number, y : number, strokeStyle : string) : void {
    //--------------------------
    // Escalar coordenadas
    //--------------------------
    x = x * this.rectSize;
    y = y * this.rectSize;
    //-------------------
    // Linea vertical
    //-------------------
    this._context.setLineDash([]);//*linea continua*
    this._context.beginPath();
    this._context.moveTo(x, (this.screenSize - y) - (this.rectSize / 2));
    this._context.lineTo(x, (this.screenSize - y) + (this.rectSize / 2));
    this._context.strokeStyle = strokeStyle;
    this._context.stroke();
    //-------------------
    // Linea horizontal
    //-------------------
    this._context.setLineDash([]);//*linea continua*
    this._context.beginPath();
    this._context.moveTo(x - (this.rectSize / 2), (this.screenSize - y));
    this._context.lineTo(x + (this.rectSize / 2), (this.screenSize - y));
    this._context.strokeStyle = strokeStyle;
    this._context.stroke();
    //-------------------
    // Nombre del Punto
    //-------------------
    var fullPointName = pointName + "(" + (x / this.rectSize) + "," + (y / this.rectSize) + ")";
    this._context.font      = "x-small Arial";
    this._context.fillText(fullPointName, (x + (this.rectSize / 2)), (this.screenSize - y));
    //
  }
  //
  DrawPoints(points : string [], strokeStyle : string) : void {
    //
    let index  : number;
    //
    for (index = 0; index < points.length; index++) {
        //
        let coordinates    : string = "";
        coordinates        = points[index];
        coordinates        = coordinates.replace('[', '');
        coordinates        = coordinates.replace(']', '');
        //
        let coordinateArray = coordinates.split(',');
        let coordinate_x    : number = Number.parseInt(coordinateArray[0]);
        let coordinate_y    : number = Number.parseInt(coordinateArray[1]);
        //
        console.log("coordinate [" + index + "] : " + points[index] + " ");
        //
        this.DrawPoint(index.toString(), coordinate_x, coordinate_y, strokeStyle);
    }
  }
  //
  DrawLine(x1 : number, y1 : number, x2 : number, y2 : number):void {
    //--------------------------
    // Escalar coordenadas
    //--------------------------
    x1 = x1 * this.rectSize;
    x2 = x2 * this.rectSize;
    y1 = y1 * this.rectSize;
    y2 = y2 * this.rectSize;
    //--------------------------
    // Ajustar coordenada y
    //--------------------------
    var _y1 = (this.screenSize - y1);
    var _y2 = (this.screenSize - y2);
    //--------------------------
    // Dibujar Linea
    //--------------------------
    this._context.moveTo(x1, _y1);
    this._context.lineTo(x2, _y2);
  }
  //
  DrawLines(pointArray : string[], matrixArray : string[], strokeStyle : string, drawingSubSet : Boolean) : void {
    //
    console.log("DRAWING_LINES");
    //--------------------------------------------------------------------------
    // CREAR MATRIZ
    //--------------------------------------------------------------------------
    //
    // MATRIX : {0,16,0,0,0,0,0,0,0}|{16,0,21,0,0,12,0,18,0}|{0,21,0,0,18,0,10,0,19}|{0,0,0,0,20,2,5,0,0}|{0,0,18,20,0,19,0,4,0}|{0,12,0,2,19,0,5,17,0}|{0,0,10,5,0,5,0,0,0}|{0,18,0,0,4,17,0,0,2}|{0,0,19,0,0,0,0,2,0}
    //
    let pointArrayMaster : string [] = this.PointListHidden.split("|");
    let matrix           = new Array(matrixArray.length);
    let index            : number; 
    //
    for (index = 0; index < matrixArray.length; index++) {
        //
        matrix[index] = new Array(matrixArray.length);
    }
    //
    let _index_x : number;
    let _index_y : number;
    //
    for (_index_x = 0; _index_x < matrixArray.length; _index_x++) {
        //
        var matrixLine = matrixArray[_index_x].replace("{", "").replace("}", "").split(",");
        //
        console.log("MATRIX ROW " + matrixLine);
        //
        for (_index_y = 0; _index_y < matrixLine.length; _index_y++) {
            //
            var pointValue = matrixLine[_index_y];
            //
            matrix[_index_x][_index_y] = pointValue;
            //
        }
    }
    //--------------------------------------------------------------------------
    // RECORRER MATRIZ
    //--------------------------------------------------------------------------
    //
    this._context.setLineDash([]);// *linea continua*
    this._context.beginPath();
    //
    let index_x : number;
    let index_y : number;
    //
    for (index_x = 0; index_x < matrixArray.length; index_x++) {
        //
        for (index_y = (index_x + 1); index_y < matrixArray.length; index_y++) {
            //
            let pointValue = matrix[index_x][index_y];
            //
            console.log("_MATRIX (" + index_x + "," + index_y + ") = " + pointValue);
            //
            // POINTS  : [11,7]|[3,21]|[22,11]|[13,19]|[8,0]|[15,18]|[12,14]|[6,3]|[4,4]
            //
            if (pointValue != "0") {
                //
                var pointSource = pointArray[index_x].replace("[", "").replace("]", "").split(",");
                var pointDest   = pointArray[index_y].replace("[", "").replace("]", "").split(",");;
                //
                console.log("_DRAWING LINE FOR (" + pointValue + " )");
                //
                var x1 = parseInt(pointSource[0]);
                var y1 = parseInt(pointSource[1]);
                var x2 = parseInt(pointDest[0]);
                var y2 = parseInt(pointDest[1]);
                //-----------------------------------------------------------------
                // SI ES UN SUBCONJUNTO DE LINEAS, COMPARAR ARREGLO CON MAESTRO
                //-----------------------------------------------------------------
                //
                var drawLine = true;
                //
                if (drawingSubSet == true)
                {
                    if (pointArray[index_x] != pointArrayMaster[index_x])
                        drawLine = false;

                    if (pointArray[index_y] != pointArrayMaster[index_y])
                        drawLine = false;    
                }    

                //
                if (drawLine == true)
                    this.DrawLine(x1, y1, x2, y2);
            }
        }
    }
    //
    this._context.strokeStyle = strokeStyle;
    this._context.stroke();
  }
  //
  DrawDistanceList(clearItems : boolean, Items : string) : void {
    //
    //$('#DistanceList').children().remove().end();
    this.__distanceList = new Array();
    //
    if (clearItems == false)
    {
        //
        let _vertexSizeInitial : _vertexSize = new _vertexSize(0,"(SELECCIONE DISTANCIA)");
        this.__distanceList.push(_vertexSizeInitial);
        //
        //$('#DistanceList').append($('<option>', { value: 0, text:"(SELECCIONE_DISTANCIA)"}));
        //
        let stringItems : string[] = Items.split("<br/>");
        //
        for (var index = 0; index < stringItems.length; index++)
        {
            // EJEMPLO
            // 01&lt;[14;2]&gt;-26-(0; 7)(7; 6)(6; 1)
            // 01<[14;2]>;-26-(0; 7)(7; 6)(6; 1)
            //
            let stringItem : string = "";
            //
            stringItem              = stringItems[index].replace("&lt;", "<").replace("&gt;", ">");
            stringItem              = this.mcsdService.DebugHostingContent(stringItem);
            //
            //$('#DistanceList').append($('<option>', { value: (index + 1), text: (stringItem) }));
            //
            let _vertexBody : _vertexSize = new _vertexSize((index + 1),stringItem);
            this.__distanceList.push(_vertexBody);
        }
    }
  }
  //
  DrawListItems():void
  {
    //-----------------------------------------------------------------------------
    // TAMAÑO DE VERTICE
    //-----------------------------------------------------------------------------
    var vertexMaxString = new String(this.vertexMax);
    //
    //$('#vertexSizeList').val(vertexMaxString);
    //
    this.__vertexSizeList = new Array();
    //
    for (var index = this.vertexMax; index >= 1; index--) {
        //
        //$('#vertexSizeList').append($('<option>', { value: (index), text: (new String(index)) }));
        //
        let vertexSize : _vertexSize = new _vertexSize(index,index.toString());
        //
        this.__vertexSizeList.push(vertexSize);
    }
    //-----------------------------------------------------------------------------
    // PUNTO DE ORIGEN
    //-----------------------------------------------------------------------------
    this.__sourcePointList = new Array();
    //
    for (var index = 0; index < this.vertexMax; index++) {
        //
        let vertexSize : _vertexSize = new _vertexSize(index,index.toString());
        //
        this.__sourcePointList.push(vertexSize);        
    }
    //        
    //$('#sourcePointList').val("0");
  }
  // 
  ////////////////////////////////////////////////////////////////
  // METODOS COMUNES /////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  //
  public _GetPDF():void
  {
    //
    console.log(this.pageTitle + " - [getting pdf]");
    //
    html2canvas(this.c_canvas.nativeElement).then((_canvas) => {
        //
        let w       : number  = this.divCanvas_Pdf.nativeElement.offsetWidth;
        let h       : number  = this.divCanvas_Pdf.nativeElement.offsetHeight;
        //
        let imgData : string  = _canvas.toDataURL('image/jpeg');
        //
        let pdfDoc     = new jsPDF("landscape", "px", [w, h]);
        //
        pdfDoc.addImage(imgData, 0, 0, w, h);
        //
        pdfDoc.save('sample-file.pdf');
    });
  }
};

