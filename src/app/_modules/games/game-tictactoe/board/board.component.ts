import { Component, OnInit, AfterViewInit , ViewChild } from '@angular/core';
import { SquareComponent } from "../square/square.component";
import { CommonModule    } from '@angular/common';
import { ListItem        } from 'src/app/_models/log-info.model';
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
  private   boardSurface          : number  = (this.SIDE*this.SIDE);
  private            board        : ('X' | 'O' | null)[][] = [];
  private   readonly COMPUTER     : number = 1;
  private   readonly HUMAN        : number = 2;
  private   readonly COMPUTERMOVE : ('X' | 'O' | null) = 'O';  // Computer will move with 'O'
  private   readonly HUMANMOVE    : ('X' | 'O' | null) = 'X';  // and human with 'X'
  //
  squares: ('X' | 'O' | null)[] = Array(9).fill(null);
  winner:  ('X' | 'O' | null)   = null;
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
  protected IsNewGame                      : boolean = false;
  protected showBoard                      : boolean = false;
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
  //
  gameOver(board : ('X' | 'O' | null)[][]) {
    return (
      this.rowCrossed(board)      ||
      this.columnCrossed(board)   ||
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
  doPlay(p_whoseTurn : number, p_Move : ('X' | 'O' | null), p_n : number):void
  {
       //  
       this.whoseTurn = p_whoseTurn; 
       //
       let n : number = 0;
       switch(p_whoseTurn)
       {
        case this.COMPUTER :
          n = Math.abs(this.bestMove(this.board, this.moveIndex));
        break;
        case this.HUMAN    :
          n = p_n;
        break;
       }
       //
       let x : number = Math.floor(n / this.SIDE);
       let y : number = Math.floor(n % this.SIDE);
       //
       this.board[x][y] = p_Move;
       this.squares[n]  = p_Move;
       this.moveIndex++;
  }
  //
  _declareWinner():boolean
  {
    let gameRunning  : boolean = (this.gameOver(this.board) == false); 
    //
    console.log(`[TIC-TAC-TOE] - [Declare Winner] `);
    //
    if ((gameRunning && (this.moveIndex != this.boardSurface)) == false )
    {
      //
      if (gameRunning && this.moveIndex == this.boardSurface){
          //
          this.message = "It's a draw";
          this.winner  = null;
      }
		  else
		  {
  			this.declareWinner(this.whoseTurn);
	  	}
      //
      return true;
    } 
    else 
    {
      //
      return false;
    }
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
    this.doPlay(this.HUMAN   ,this.HUMANMOVE   ,n);
    //
    if (this._declareWinner()==false)
    {
      //
      this.doPlay(this.COMPUTER,this.COMPUTERMOVE,0);  
      //
      this._declareWinner()
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
    this.IsNewGame = true;
    //
    this.showBoard = false;
  }
  //
  startGame():void {
    //
    let selectedIndex : number = this._sourceList.nativeElement.options.selectedIndex;
    //
    switch(selectedIndex) {
        case 2:
          this.doPlay(this.COMPUTER,this.COMPUTERMOVE,0);
        break
    }
    //
    this.IsNewGame = false;
    //
    this.showBoard = true;
  }
};
