import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Observable                                  } from 'rxjs';
import html2canvas                                     from 'html2canvas';
import jsPDF                                           from 'jspdf';
import { MCSDService                                 } from '../../../_services/mcsd.service';
import { CustomErrorHandler                          } from '../../../app.module';
import { _languageName, _vertexSize                  } from '../../../_models/entityInfo.model';
import { DrawEngine } from 'src/app/_models/draw-engine.model';
import { UtilManager } from 'src/app/_models/util-manager.model';
import { PdfEngine } from 'src/app/_models/pdf-engine.model';
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
  //
  public static get PageTitle()      : string {
    return '[ALGORITMOS - DISTANCIA MAS CORTA]';
  }
  ////////////////////////////////////////////////////////////////
  // VARIABLES ///////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  readonly  pageTitle        : string = AlgorithmDijkstraComponent.PageTitle;
  protected vertexMax        : number = 9;
  protected rectSize         : number = 10;
  protected screenSize       : number = 250;
  protected strokeStyleCafe  : string = "#654321";
  protected strokeStyleVerde : string = "#006400";
  protected strokeStyleRed   : string = "#ff0000";
  protected tituloListadoDistancias: string = "";
  protected tituloListadoLenguajes : string = "Seleccione Backend";
  //
  @ViewChild('c_canvas')      c_canvas      : any;
  @ViewChild('divCanvas_Pdf') divCanvas_Pdf : any;
  protected _context                        : any;
  @ViewChild('_vertexSizeList')  _vertexSizeList     : any;
  @ViewChild('_sourcePointList') _sourcePointList    : any;
  @ViewChild('_distanceList')    _distanceList       : any;
  @ViewChild('_languajeList')    _languajeList       : any;
  //
  protected PointListHidden   : string = "";
  protected MatrixListHidden  : string = "";
  //
  public __vertexSizeList  : any;
  public __sourcePointList : any;
  public __distanceList    : any;
  public __languajeList    : any;
  // 
  public selectedIndex          : number  = 0;
  public selectedIndexLanguage  : number  = 0;
  //
  drawEngine: any;
  ////////////////////////////////////////////////////////////////
  // EVENT HANDLERS //////////////////////////////////////////////  
  ////////////////////////////////////////////////////////////////
  constructor(public mcsdService: MCSDService, private customErrorHandler: CustomErrorHandler)
  {
     //
     mcsdService.SetLog(this.pageTitle,"PAGE_DIJKSTRA_DEMO");
  }
  //
  ngOnInit(): void {
    //
    console.log(AlgorithmDijkstraComponent.PageTitle + " - [INGRESO]");
    //
    this.DrawListItems();
    //
    this.DrawDistanceList(true, "");
  }
  //
  ngAfterViewInit():void { 
    //
    console.log(AlgorithmDijkstraComponent.PageTitle + " - [INICIO VISUAL]");
    //
    this._context = this.c_canvas.nativeElement.getContext('2d');
    //
    this.drawEngine = new DrawEngine(this._context,this.c_canvas,this.rectSize, this.screenSize)
    //
    this.drawEngine.DrawGrid();
    //    
    this._ResetControls();
  };
  //
  public _vertexSizeListChange():void
  {
      //
      console.log(AlgorithmDijkstraComponent.PageTitle + " - [VERTEX SIZE LIST CHANGE]");
  };
  //
  public _distanceListChange():void 
  {
    //
    console.log(AlgorithmDijkstraComponent.PageTitle + " - [DISTANCE LIST CHANGE]");
    //
    this.selectedIndex           = this._distanceList.nativeElement.options.selectedIndex;
    let distanceListVal : string = this._distanceList.nativeElement.options[this.selectedIndex].text;
    //
    console.log(AlgorithmDijkstraComponent.PageTitle + " - [DISTANCE LIST CHANGE] - [Selected Index]: [" + this.selectedIndex + "]");
    //
    console.log(AlgorithmDijkstraComponent.PageTitle + " - [DISTANCE LIST CHANGE] - [Selected Text]: [" + distanceListVal + "]");
    //
    if (distanceListVal != "0")
    {
        //
        var pointList         = this.PointListHidden.split("|");
        var matrixList        = this.MatrixListHidden.split("|");
        //
        this.drawEngine.DrawGrid();
        //
        this.drawEngine.DrawPoints(pointList, this.strokeStyleCafe);
        //
        this.drawEngine.DrawLines(pointList, matrixList, this.strokeStyleVerde, false);
        //
        let distenceListItems = distanceListVal.split("-");
        let path              = distenceListItems[2];
        //
        if (path != "")
        { 
            //
            while (path.indexOf(";") != -1)
            {
                path = path.replace(";", ",");
            }
            //
            let selectedPoints  : string[]  = path.split("≡");
            let emptyPoints     : string[]  = new Array(pointList.length);
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
                    let selectedPointsVal : string[] = selectedPoints[index_y].replace("[", "").replace("]", "").split(",");

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
            this.drawEngine.DrawLines(emptyPoints, matrixList, this.strokeStyleRed   , true);
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
      console.log(AlgorithmDijkstraComponent.PageTitle + " - [Resetting controls]");
      //
      this.tituloListadoDistancias = "";
      //[x]
      this.DrawListItems();
      //[x]
      this.DrawDistanceList(true, "");
      //[x]
      this.PointListHidden  = "";
      //[x]
      this.MatrixListHidden = "";
      //[X]
      this.drawEngine.DrawGrid();
  };
  // 
  _GetGraph():void
  {
        //
        console.log(AlgorithmDijkstraComponent.PageTitle + " - [getting graph]");
        //
        let _vertexSize         : number = Number.parseInt(this._vertexSizeList.nativeElement.value);
        let _sourcePoint        : number = Number.parseInt(this._sourcePointList.nativeElement.value);
        //
        console.log(AlgorithmDijkstraComponent.PageTitle + " - [vertex size : " + _vertexSize  + "]");
        //
        console.log(AlgorithmDijkstraComponent.PageTitle + " - [source point: " + _sourcePoint + "]");
        //
        let randomVertexInfo!  : Observable<string>;
        //
        let _progLangId        : number = Number.parseInt(this._languajeList.nativeElement.value);
        //
        switch(_progLangId)    
        {
            case 0:   // (SELECT LANGUAGE...)
                  return;
            break;
            case 1 :  // c#
              randomVertexInfo       = this.mcsdService.getRandomVertex(_vertexSize,_sourcePoint);
            break;
            case 2:   // c++
              randomVertexInfo       = this.mcsdService.getRandomVertexCpp(_vertexSize,_sourcePoint);
            break;
        }
        //
        let data               : any;
        //
        const randomVertexObserver   = {
            //
            next: (randomVertexInfo: string)     => { 
                //
                console.warn(AlgorithmDijkstraComponent.PageTitle + ' - [GETTING VERTEX VALUES]  - RETURN VALUE : ' + randomVertexInfo);
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
                //console.log('POINTS : ' + pointsString);
                //
                let pointArray      : string[] = pointsString.split('|');
                //
                this.drawEngine.DrawPoints(pointArray, this.strokeStyleCafe);
                //
                //-------------------------------------------------------------
                // OBTENER MATRIZ - DIBUJAR LINEAS
                //-------------------------------------------------------------
                //
                let matrixString = dataArray[1];
                //
                //console.log('MATRIX : ' + matrixString);
                //
                let matrixArray  = matrixString.split('|');
                //
                this.MatrixListHidden = matrixString;
                //
                this.drawEngine.DrawLines(pointArray, matrixArray, this.strokeStyleVerde, new Boolean(false), this.PointListHidden);
                //            
                //-------------------------------------------------------------
                // OBTENER VERTICES DE DISTANCIAS
                //-------------------------------------------------------------
                var vertexString = dataArray[2];
                //
                // console.log('VERTEX : ' + vertexString);
                //-------------------------------------------------------------
                // CONFIGURA CONTROLES
                //-------------------------------------------------------------
                //
                let _sourcePoint        : number = Number.parseInt(this._sourcePointList.nativeElement.value);
                this.tituloListadoDistancias = "Listado de Distancies desde [" + _sourcePoint.toString() + "]";
                //
                this.DrawDistanceList(false,vertexString);
            },
            error: (err: Error) => {
                //
                console.error(AlgorithmDijkstraComponent.PageTitle + ' - [GETTING VERTEX VALUES] - [error] : ' + err.message);
            },       
            complete: ()        => {
                //
                console.warn(AlgorithmDijkstraComponent.PageTitle + ' - [GETTING VERTEX VALUES] - [Observer got a complete notification]');
                //
            },
        };
        //
        randomVertexInfo.subscribe(randomVertexObserver);
  }
  ////////////////////////////////////////////////////////////////
  // METODOS GRAFICOS/////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
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
            stringItem              = UtilManager.DebugHostingContent(stringItem);
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
    //-----------------------------------------------------------------------------
    // LENGUAJES DE PROGRAMACION
    //-----------------------------------------------------------------------------
    this.__languajeList = new Array();
    //
    this.__languajeList.push( new _languageName(0,"(SELECCIONE OPCION..)",false));        
    this.__languajeList.push( new _languageName(1,"(.NET CORE/C#)",false));        
    this.__languajeList.push( new _languageName(2,"(.NET CORE/C++)",true));        
  }
  // 
  ////////////////////////////////////////////////////////////////
  // METODOS COMUNES /////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  //
  _GetPDF():void
  {
      //
      let pdfEngine = new PdfEngine(
        AlgorithmDijkstraComponent.PageTitle,
        this.c_canvas,
        this.divCanvas_Pdf,
      )
      //  
      pdfEngine._GetPDF();
  }
};