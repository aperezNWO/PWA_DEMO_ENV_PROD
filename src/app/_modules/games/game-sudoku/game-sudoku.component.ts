import { Component, OnInit, ViewChild  }  from '@angular/core';
import { Observable                    }  from 'rxjs';
import { MCSDService                   }  from '../../../_services/mcsd.service';
import { _languageName                 }  from '../../../_models/log-info.model';
//
@Component({
  selector: 'app-game-sudoku',
  templateUrl: './game-sudoku.component.html',
  styleUrls: ['./game-sudoku.component.css']
})
//
export class GamesSudokuComponent implements OnInit {
  //
  board: number[][] = [];
  /*    
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
  */
  //
  protected tituloListadoLenguajes                   : string = "Seleccione Lenguaje";
  protected btnGenerateCaption                       : string = "[GENERAR]";
  protected btnSolveCaption                          : string = "[RESOLVER]";
  //
  @ViewChild('_languajeList')    _languajeList       : any;
  //
  public __languajeList                              : any;
  //
  public _cppSourceDivHidden                         : boolean = true;
  //
  public sudokuSolved                                : boolean = false;
  //
  public _sudokuGenerated                            : string = "";
  //
  constructor(private mcsdService: MCSDService)
  {
      //
      console.log("[SUDOKU - INGRESO]");
  }
  //
  ngOnInit():void
  {
      //-----------------------------------------------------------------------------
      // LENGUAJES DE PROGRAMACION
      //-----------------------------------------------------------------------------
      this.__languajeList = new Array();
      //
      this.__languajeList.push( new _languageName(0,"(SELECCIONE OPCION..)",false));        
      this.__languajeList.push( new _languageName(1,"C++",true));  
      this.__languajeList.push( new _languageName(2,"C#",false));        
      this.__languajeList.push( new _languageName(3,"Typescript (Node.js)",false));     
      //
      this._cppSourceDivHidden = false; 
      //
      this._GetSudoku();  
   }
  //
  public _cppSourceDivHiddenChaged():void  
  {
    //
    console.log("SUDOKU - [DIV CPP SOURCE CHANGED]");
    //
    let _selectedIndex       : number  = this._languajeList.nativeElement.options.selectedIndex;
    this._cppSourceDivHidden = (_selectedIndex != 1) // item 2 = "c++"
  }
  //
  public _GetSudoku():void
  {
      // 
      console.log("[SUDOKU - GENERATE]");
      //
      if (this._cppSourceDivHidden == true)  // language = c++
          return;
      //
      this.sudokuSolved       = false;
      //
      this.btnGenerateCaption = "[...generando...]";
      //
      let generatedSudoku : Observable<string> = this.mcsdService._GetSudoku();
      //
      const generatedSudokuObserver = {
        next: (jsondata: string)     => { 
          //
          console.log('[SUDOKU - GENERATE] - (return): ' + jsondata);
          //
          this._sudokuGenerated = jsondata;
          //
          jsondata                        = jsondata.replaceAll("[","");
          jsondata                        = jsondata.replaceAll("]","");
          jsondata                        = jsondata.replaceAll("},","|");
          jsondata                        = jsondata.replaceAll("{","");
          jsondata                        = jsondata.replaceAll("}","");
          let jsonDataArray    : string[] = jsondata.split("|");
          //
          this.board = [];
          //
          for (let i = 0; i < 9; i++) {
            const row: number[] = [];
            console.log(jsonDataArray[i]);
            const   rowString : string[] = jsonDataArray[i].split(",");
            for (let j = 0; j < 9; j++) {
              //row.push(i * 3 + j);
              row.push(parseInt(rowString[j]));
            }
            this.board.push(row);
          }
        },
        error           : (err: Error)      => {
          //
          console.error('[SUDOKU - GENERATE] - (ERROR) : ' + JSON.stringify(err.message));
        },
        complete        : ()                => {
          //
          console.log('[SUDOKU - GENERATE] -  (COMPLETE)');
          //
          this.btnGenerateCaption = "[GENERAR]";
        },
      };
      //
      generatedSudoku.subscribe(generatedSudokuObserver);
  }
  //
  public _SolveSudoku():void
  {
     //
     console.log("[SUDOKU - SOLVE] \n" + this._sudokuGenerated);
     //
     if (this._cppSourceDivHidden == true)  // language = c++
        return;
     //
     this.sudokuSolved       = true;
     //
     this.btnSolveCaption = "[...resolviendo...]";
     //
     let solveSudoku : Observable<string> = this.mcsdService._SolveSudoku(this._sudokuGenerated );
     //
     const solveSudokuObserver = {
        next: (jsondata: string)     => { 
          //
          console.log('[SUDOKU - SOLVE] - (return): ' + jsondata);
          //
          this._sudokuGenerated           = jsondata;
          //
          jsondata                        = jsondata.replaceAll("[","");
          jsondata                        = jsondata.replaceAll("]","");
          jsondata                        = jsondata.replaceAll("},","|");
          jsondata                        = jsondata.replaceAll("{","");
          jsondata                        = jsondata.replaceAll("}","");
          let jsonDataArray    : string[] = jsondata.split("|");
          //
          this.board = [];
          //
          for (let i = 0; i < 9; i++) {
            const row: number[] = [];
            console.log(jsonDataArray[i]);
            const   rowString : string[] = jsonDataArray[i].split(",");
            for (let j = 0; j < 9; j++) {
              //row.push(i * 3 + j);
              row.push(parseInt(rowString[j]));
            }
            this.board.push(row);
          }
        },
        error           : (err: Error)      => {
          //
          console.error('[SUDOKU - SOLVE] - (ERROR) : ' + JSON.stringify(err.message));
        },
        complete        : ()                => {
          //
          console.log('[SUDOKU - SOLVE] -  (COMPLETE)');
          //
          this.btnSolveCaption = "[RESOLVER]";
        },
     };
     //
     solveSudoku.subscribe(solveSudokuObserver);
  }
  }
  
  /*
  {5, 3, 0, 0, 7, 0, 0, 0, 0},
  {6, 0, 0, 1, 9, 5, 0, 0, 0},
  {0, 9, 8, 0, 0, 0, 0, 6, 0},
  {8, 0, 0, 0, 6, 0, 0, 0, 3},
  {4, 0, 0, 8, 0, 3, 0, 0, 1},
  {7, 0, 0, 0, 2, 0, 0, 0, 6},
  {0, 6, 0, 0, 0, 0, 2, 8, 0},
  {0, 0, 0, 4, 1, 9, 0, 0, 5},
  {0, 0, 0, 0, 8, 0, 0, 7, 9}
  
  Sudoku solved:
  
  5 3 4 6 7 8 9 1 2 
  6 7 2 1 9 5 3 4 8 
  1 9 8 3 4 2 5 6 7 
  8 5 9 7 6 1 4 2 3 
  4 2 6 8 5 3 7 9 1 
  7 1 3 9 2 4 8 5 6 
  9 6 1 5 3 7 2 8 4 
  2 8 7 4 1 9 6 3 5 
  3 4 5 2 8 6 1 7 9
  
  */
  
  