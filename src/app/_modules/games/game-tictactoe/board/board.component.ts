import { Component, OnInit, AfterViewInit , ViewChild } from '@angular/core';
import { ListItem                                     } from 'src/app/_models/log-info.model';
import { SquareComponent } from "../square/square.component";
import { CommonModule    } from '@angular/common';
//
@Component({
    selector: 'app-board',
    standalone: true,
    templateUrl: './board.component.html',
    styleUrls: ['./board.component.css'],
    imports: [SquareComponent, CommonModule]
})
export class BoardComponent implements OnInit, AfterViewInit {
  //
  private   readonly SIDE         : number = 3;
  private            board        : ('X' | 'O' | null)[][] = [];
  private   readonly COMPUTER     : number = 1;
  private   readonly HUMAN        : number = 2;
  private   readonly COMPUTERMOVE : ('X' | 'O' | null) = 'O';  // Computer will move with 'O'
  private   readonly HUMANMOVE    : ('X' | 'O' | null) = 'X';  // and human with 'X'
  //
  squares: ('X' | 'O' | null)[] = Array(9).fill(null);
  xIsNext = true;
  winner: 'X' | 'O' | null = null;
  //
  whoseTurn : number = this.HUMAN;
  moveIndex : number = 0;
  //
  protected tituloSource                   : string = '¿Quien Inicia?';
  //
  protected __SourceList                   : any;
  @ViewChild('_SourceList')   _sourceList  : any;
  protected message                        : string = '';
  //
  constructor() {
    //
  }
  //
  ngOnInit(): void {
    // INITIALIZE DATA
    console.log("[TIC-TAC-TOE - INICIAR VALORES");
    //
    this.__SourceList = new Array();
    this.__SourceList.push(new ListItem(0, '(SELECCIONE OPCION..)', false));
    this.__SourceList.push(new ListItem(1, '[INICIA JUGADOR]'     , true));
    this.__SourceList.push(new ListItem(2, '[INICIA MAQUINA]'     , false));
    //
    this.initialise();
  }
  //
  ngAfterViewInit() {
    // INITIALIZE VIEW
    this._sourceList.nativeElement.options.selectedIndex = 1;
  }
  //
  _tituloSourceChanged():void{
    //
  }
  //
  declareWinner(whoseTurn: number): void 
  {
    if (whoseTurn == this.COMPUTER) 
    {
        this.message = "COMPUTER has won";
        this.winner  = this.COMPUTERMOVE;
    }
    else {
        this.message = "HUMAN has won";
        this.winner  = this.HUMANMOVE;
    }
  }
  //
  rowCrossed(board : ('X' | 'O' | null)[][]) {
    for (let i = 0; i < this.SIDE; i++) {
      if (
        board[i][0] == board[i][1] &&
        board[i][1] == board[i][2] &&
        board[i][0] != null
      )
        return true;
    }
    return false;
  }
  //
  columnCrossed(board : ('X' | 'O' | null)[][]) {
    for (let i = 0; i < this.SIDE; i++) {
      if (
        board[0][i] == board[1][i] &&
        board[1][i] == board[2][i] &&
        board[0][i] != null
      )
        return true;
    }
    return false;
  }

  diagonalCrossed(board : ('X' | 'O' | null)[][]) {
    if (
      board[0][0] == board[1][1] &&
      board[1][1] == board[2][2] &&
      board[0][0] != null
    )
      return true;
    if (
      board[0][2] == board[1][1] &&
      board[1][1] == board[2][0] &&
      board[0][2] != null
    )
      return true;
    return false;
  }

  gameOver(board : ('X' | 'O' | null)[][]) {
    return (
      this.rowCrossed(board) ||
      this.columnCrossed(board) ||
      this.diagonalCrossed(board)
    );
  }
  //
  minimax(board : ('X' | 'O' | null)[][], depth : number, isAI : boolean) : number | undefined {
    //
    let score     : number | undefined = 0;
    let bestScore : number | undefined = 0;
    //
    if (this.gameOver(board) == true) {
      //
      if (isAI == true) return -1;
      if (isAI == false) return +1;
    } 
    //
    if (depth < 9) {
      if (isAI == true) {
        //
        bestScore = -999;
        //
        for (let i = 0; i < this.SIDE; i++) {
          for (let j = 0; j < this.SIDE; j++) {
            //
            if (board[i][j] == null) {
              //
              board[i][j] = this.COMPUTERMOVE;
              score = this.minimax(board, depth + 1, false);
              //
              board[i][j] = null;
              if (score! > bestScore!) {
                bestScore = score;
              }
            }
          }
        }
        //
        return bestScore;
      } else {
        bestScore = 999;
        for (let i = 0; i < this.SIDE; i++) {
          for (let j = 0; j < this.SIDE; j++) {
            //
            if (board[i][j] == null) {
              board[i][j] = this.HUMANMOVE;
              score = this.minimax(board, depth + 1, true);
              //
              board[i][j] = null;
              if (score! < bestScore!) {
                bestScore = score;
              }
            }
          }
        }
        return bestScore;
      }
    } else {
      return 0;
    }
  }
  //
  bestMove(board : ('X' | 'O' | null)[][], moveIndex : number) : number{
    //
    let x         = -1;      
    let y         = -1;
    let score     : number | undefined = 0;      
    let bestScore : number | undefined = -999;
    //
    for (let i = 0; i < this.SIDE; i++) {
      for (let j = 0; j < this.SIDE; j++) {
        //
        if (board[i][j] == null) {
          board[i][j] = this.COMPUTERMOVE;
          score = this.minimax(board, moveIndex + 1, false);
          //
          board[i][j] = null;
          if (score! > bestScore!) {
            bestScore = score;
            x = i;
            y = j;
          }
        }
      }
    }
    return ((x * 3) + y);
  }
  //
  playComputer():void
  {
       //  
       this.whoseTurn = this.COMPUTER;
       //
       let n : number = Math.abs(this.bestMove(this.board, this.moveIndex));
       let x : number = Math.floor(n / this.SIDE);
       let y : number = Math.floor(n % this.SIDE);
       //
       this.board[x][y] = this.COMPUTERMOVE;
       this.squares[n]  = this.COMPUTERMOVE;
       this.moveIndex++;
  }
  //
  makeMove(n: number): void {
    //
    console.log(`[TIC-TAC-TOE] - [Click on cel : {${n}}] `);
    //
    if (this.squares[n] || this.winner) {
      return;
    }
    //
    let x         : number = 0;
    let y         : number = 0;

    //
    this.whoseTurn = this.HUMAN;
    //
    x = Math.floor(n / this.SIDE);
    y = Math.floor(n % this.SIDE);
    //
    this.board[x][y] = this.HUMANMOVE;
    this.squares[n]  = this.HUMANMOVE;
    this.moveIndex++;
    //
    this.playComputer();
    //
    if (((this.gameOver(this.board) == false) && (this.moveIndex != (this.SIDE*this.SIDE))) == false )
    {
      if (this.gameOver(this.board) == false && this.moveIndex == this.SIDE * this.SIDE)
		    	this.message = "It's a draw";
		  else
		  {
  			this.declareWinner(this.whoseTurn);
	  	}
    }
  }
  //
  initialise():void{
    //
    this.squares = [];
    this.squares = Array(9).fill(null);
    //
    this.board   = [];
    //
    for (let i = 0; i < this.SIDE; i++) {
      const row: ('X' | 'O' | null)[] = [];
      for (let j = 0; j < this.SIDE; j++) {
        row.push(null);
      }
      this.board.push(row);
    }
    //
    this.moveIndex = 0;
    this.winner    = null;
    this.message   = '';
  }
  //
  newGame():void{
    //
    console.log("[GAME - TIC-TAC-TOE] - [NEW GAME]")
    //
    this.initialise();
    //
    let selectedIndex : number = this._sourceList.nativeElement.options.selectedIndex;
    switch(selectedIndex) {
        case 2:
          this.playComputer();
        break
    }
  }
};
