import { Component } from '@angular/core';
//
@Component({
  selector       : 'app-algorithm-dijkstra',
  templateUrl    : './algorithm-dijkstra.component.html',
  styleUrls      : ['./algorithm-dijkstra.component.css']
})
//
export class AlgorithmDijkstraComponent {
  ////////////////////////////////////////////////////////////////
  // PROPERTIES //////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  pageTitle            : string = '[ALGORITMOS - DISTANCIA MAS CORTA]';
  //
  static pageTitle()   : string {
    return '[ALGORITMOS - DISTANCIA MAS CORTA]';
  }
  /*
    //------------------------------------------------------------------------------------------------
    // DECLARACION DE VARIABLES
    //------------------------------------------------------------------------------------------------
    var vertexMax        = 9;
    var rectSize         = 10;
    var screenSize       = 250;
    var c_canvas         = document.getElementById("c");
    var context          = c_canvas.getContext("2d");
    var strokeStyleCafe  = "#654321";
    var strokeStyleVerde = "#006400";
    var strokeStyleRed   = "#ff0000";
  */
  ////////////////////////////////////////////////////////////////
  // EVENT HANDLERS //////////////////////////////////////////////  
  ////////////////////////////////////////////////////////////////
  constructor()
  {
    //
  }
  ////////////////////////////////////////////////////////////////
  // METODOS BOTONES /////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  //
  _ResetControls():void
  {
      //
      console.log(this.pageTitle + " - Resetting controls");
      //
      //[x]
      //_ShowProgressBar();
      //[_]
      //$('#tituloListadoDistancias').text('');
      //[_]
      //$('#DistanceList').attr('style', 'width:250px;display:none;');
      //[_]
      //DrawListItems();
      //[_]
      //DrawDistanceList(true, "");
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
      //[_]
      //$('#PointListHidden').val('');
      //[_]
      //$('#MatrixListHidden').val('');
      //[_]
      //DrawGrid();
      //[_]
      //_HideProgressBar();
  }
  // 
  //$("#GetGraph").click(function ()
  _GetGraph():void
  {
      //
      console.log(this.pageTitle + " - getting graph");
      //[]
      //var vertexSize  = $('#vertexSizeList').val();
      //var sourcePoint = $('#sourcePointList').val();
      //[]
      var p_url       = "GenerateRandomVertex";
      //
      //_ShowProgressBar();
      //
/*      
      $.ajax({
              url: p_url
              ,data:
              {
                  p_vertexSize  : vertexSize
                 ,p_sourcePoint : sourcePoint
              }
            })
        .done(function (data) {
            //
            console.log('DIJKSTRA_DEMO. GET RANDOM VERTEX : ' + data);
            //

            //------------------------------------------------------------
            // OBTENER PUNTOS
            //------------------------------------------------------------
            var dataArray = data.split("■");
            //
            var pointsString = dataArray[0];
            //
            console.log('POINTS : ' + pointsString);
            //
            var pointArray = pointsString.split('|');
            //
            DrawGrid();
            //
            DrawPoints(pointArray, strokeStyleCafe);

            //-------------------------------------------------------------
            // OBTENER MATRIZ - DIBUJAR LINEAS
            //-------------------------------------------------------------

            var matrixString = dataArray[1];
            //
            console.log('MATRIX : ' + matrixString);
            //
            var matrixArray = matrixString.split('|');
            //
            DrawLines(pointArray, matrixArray, strokeStyleVerde, new Boolean(false));

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
            $('#tituloListadoDistancias').text('Listado de Distancies desde (' + sourcePoint + ')');
            //
            $('#DistanceList').attr('style', 'width:250px;display:inline');
            //
            $("#vertexSizeList").attr('disabled', true);
            //
            $('#sourcePointList').attr('disabled', true);
            //
            DrawDistanceList(false,vertexString);
            //
            $('#NewGraph').attr('disabled', false);
            //
            $('#GetGraph').attr('disabled', true);
            //
            $('#PointListHidden').val(pointsString);
            //
            $('#MatrixListHidden').val(matrixString);
            //
            _HideProgressBar();
        });
  */
  }
  // 
  ////////////////////////////////////////////////////////////////
  // METODOS COMUNES /////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////
  //
  GetPDF():void
  {
    //
    console.log(this.pageTitle + " - getting pdf");
    //
    /*
    html2canvas(this.canvas_xls .nativeElement).then((_canvas) => {
        //
        let w = this.divPieChart_xls.nativeElement.offsetWidth;
        let h = this.divPieChart_xls.nativeElement.offsetHeight;
        //
        let imgData = _canvas.toDataURL('image/jpeg');
        //
        let pdfDoc  = new jsPDF("landscape", "px", [w, h]);
        //
        pdfDoc.addImage(imgData, 0, 0, w, h);
        //
        pdfDoc.save('sample-file.pdf');
    });
    */
  }
  //
  private DebugHostingContent(msg : string) : string {
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
}

/**

<script type="text/javascript">
    
    function DrawGrid()
    {
        //
        context.clearRect(0, 0, c_canvas.width, c_canvas.height);
        context.beginPath();
        //
        for (var x = 0.5; x < 501; x += rectSize) {
            context.moveTo(x, 0);
            context.lineTo(x, 381);
        }
        //
        for (var y = 0.5; y < 381; y += rectSize) {
            context.moveTo(0, y);
            context.lineTo(500, y);
        }
        //
        context.strokeStyle = "#cccccc";
        context.stroke();
        //
    }
    //
    function pythagorean(sideA, sideB) {
        return Math.sqrt(Math.pow(sideA, 2) + Math.pow(sideB, 2)).toFixed(2);
    }
    //
    function DrawLine(x1, y1, x2, y2) {
        //--------------------------
        // Escalar coordenadas
        //--------------------------
        x1 = x1 * rectSize;
        x2 = x2 * rectSize;
        y1 = y1 * rectSize;
        y2 = y2 * rectSize;

        //--------------------------
        // Ajustar coordenada y
        //--------------------------
        var _y1 = (screenSize - y1);
        var _y2 = (screenSize - y2);


        //--------------------------
        // Dibujar Linea
        //--------------------------
        context.moveTo(x1, _y1);
        context.lineTo(x2, _y2);

    }
    //
    function DrawLines(pointArray, matrixArray,strokeStyle,drawingSubSet) {
        //
        console.log("DRAWING_LINES");

        //--------------------------------------------------------------------------
        // CREAR MATRIZ
        //--------------------------------------------------------------------------
        //
        // MATRIX : {0,16,0,0,0,0,0,0,0}|{16,0,21,0,0,12,0,18,0}|{0,21,0,0,18,0,10,0,19}|{0,0,0,0,20,2,5,0,0}|{0,0,18,20,0,19,0,4,0}|{0,12,0,2,19,0,5,17,0}|{0,0,10,5,0,5,0,0,0}|{0,18,0,0,4,17,0,0,2}|{0,0,19,0,0,0,0,2,0}
        //
        var pointArrayMaster = $("#PointListHidden").val().split("|");
        var matrix           = new Array(matrixArray.length);
        //
        for (index = 0; index < matrixArray.length; index++) {
            //
            matrix[index] = new Array(matrixArray.length);
        }
        //
        for (index_x = 0; index_x < matrixArray.length; index_x++) {
            //
            var matrixLine = matrixArray[index_x].replace("{", "").replace("}", "").split(",");
            //
            console.log("MATRIX ROW " + matrixLine);
            //
            for (index_y = 0; index_y < matrixLine.length; index_y++) {
                //
                var pointValue = matrixLine[index_y];
                //
                matrix[index_x][index_y] = pointValue;
                //
            }
        }

        //--------------------------------------------------------------------------
        // RECORRER MATRIZ
        //--------------------------------------------------------------------------
        //
        context.setLineDash([]);//*linea continua*
        context.beginPath();
        //
        for (index_x = 0; index_x < matrixArray.length; index_x++) {
            //
            for (index_y = (index_x + 1); index_y < matrixArray.length; index_y++) {
                //
                var pointValue = matrix[index_x][index_y];
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
                        DrawLine(x1, y1, x2, y2);
                }
            }
        }
        //
        context.strokeStyle = strokeStyle;
        context.stroke();

    }
    //
    function DrawPoint(pointName, x, y, strokeStyle) {
        //--------------------------
        // Escalar coordenadas
        //--------------------------
        x = x * rectSize;
        y = y * rectSize;

        //-------------------
        // Linea vertical
        //-------------------
        context.setLineDash([]);//*linea continua*
        context.beginPath();
        context.moveTo(x, (screenSize - y) - (rectSize / 2));
        context.lineTo(x, (screenSize - y) + (rectSize / 2));
        context.strokeStyle = strokeStyle;
        context.stroke();
        //-------------------
        // Linea horizontal
        //-------------------
        context.setLineDash([]);//*linea continua*
        context.beginPath();
        context.moveTo(x - (rectSize / 2), (screenSize - y));
        context.lineTo(x + (rectSize / 2), (screenSize - y));
        context.strokeStyle = strokeStyle;
        context.stroke();
        //-------------------
        // Nombre del Punto
        //-------------------
        var fullPointName = pointName + "(" + (x / rectSize) + "," + (y / rectSize) + ")";
        context.font      = "x-small Arial";
        context.fillText(fullPointName, (x + (rectSize / 2)), (screenSize - y));
        //
    }
    //
    function DrawPoints(points, strokeStyle) {
        //
        for (index = 0; index < points.length; index++) {
            //
            var coordinates = '';
            coordinates = points[index];
            coordinates = coordinates.replace('[', '');
            coordinates = coordinates.replace(']', '');
            //
            var coordinateArray = coordinates.split(',');
            var coordinate_x = coordinateArray[0];
            var coordinate_y = coordinateArray[1];
            //
            console.log("coordinate [" + index + "] : " + points[index] + " ");
            //
            DrawPoint(index, coordinate_x, coordinate_y, strokeStyle);
        }
    }
    //
    function DrawListItems()
    {
        //-----------------------------------------------------------------------------
        // TAMAÑO DE VERTICE
        //-----------------------------------------------------------------------------
        var vertexMaxString = new String(vertexMax);
        //
        $('#vertexSizeList').children().remove().end();
        //
        for (var index = vertexMax; index >= 1; index--) {
            $('#vertexSizeList').append($('<option>', { value: (index), text: (new String(index)) }));
        }
        //
        $('#vertexSizeList').val(vertexMaxString);

        //-----------------------------------------------------------------------------
        // PUNTO DE ORIGEN
        //-----------------------------------------------------------------------------
        $('#sourcePointList').children().remove().end();
        //
        for (var index = 0; index < vertexMax; index++) {
            $('#sourcePointList').append($('<option>', { value: (index), text: (new String(index)) }));
        }
        //        
        $('#sourcePointList').val("0");
    }
    //
    function DrawDistanceList(clearItems, Items)
    {
        //
        $('#DistanceList').children().remove().end();

        //
        if (clearItems == false)
        {
            //
            var stringItems = Items.split("<br/>");

            //
            $('#DistanceList').append($('<option>', { value: 0, text:"(SELECCIONE_DISTANCIA)"}));
            //
            for (var index = 0; index < stringItems.length; index++)
            {
                // EJEMPLO
                // 01&lt;[14;2]&gt;-26-(0; 7)(7; 6)(6; 1)
                // 01<[14;2]>;-26-(0; 7)(7; 6)(6; 1)

                //
                var stringItem = "";
                //
                stringItem = stringItems[index].replace("&lt;", "<").replace("&gt;", ">");
                stringItem = DebugHostingContent(stringItem);
                
                //
                $('#DistanceList').append($('<option>', { value: (index + 1), text: (stringItem) }));
            }
        }
    }
    //
    $("#vertexSizeList").change(function ()
    {
        var vertexSizeVal = $("#vertexSizeList").val();

        $('#sourcePointList').children().remove().end();
        //
        for (var index = 0; index < vertexSizeVal; index++)
        {
            $('#sourcePointList').append($('<option>', { value: (index), text: (new String(index)) }));
        }
        //        
        $('#sourcePointList').val("0");
    });
    //
    $("#DistanceList").change(function () {

        //
        var distanceListVal = $("#DistanceList option:selected").text();

        //
        if (distanceListVal != 0)
        {
            //
            var pointList         = $('#PointListHidden').val().split("|");
            var matrixList        = $('#MatrixListHidden').val().split("|");

            //
            DrawGrid();
            //
            DrawPoints(pointList, strokeStyleCafe);
            //
            DrawLines(pointList, matrixList, strokeStyleVerde, false);

            //
            var distenceListItems = distanceListVal.split("-");
            var path              = distenceListItems[2];

            //
            if (path != "")
            { 
                while (path.indexOf(";") != -1)
                {
                    path = path.replace(";", ",");
                }
                var selectedPoints  = path.split("≡");
                var emptyPoints     = new Array(pointList.length);

                //
                for (index = 0; index < pointList.length; index++)
                {
                    emptyPoints[index] = "[0,0]";
                }
                //
                for (index_y = 0; index_y < selectedPoints.length; index_y++)
                { 
                    if  (selectedPointsVal != "")
                    {
                        //
                        var selectedPointsVal = selectedPoints[index_y].replace("[", "").replace("]", "").split(",");
                        var coordSource       = selectedPointsVal[0];
                        var coordDest         = selectedPointsVal[1];

                        //
                        emptyPoints[coordSource] = pointList[coordSource];
                        emptyPoints[coordDest] = pointList[coordDest];

                    }
                }

                //
                DrawLines(emptyPoints, matrixList, strokeStyleRed   , true);
            }
        }
    });
*/
