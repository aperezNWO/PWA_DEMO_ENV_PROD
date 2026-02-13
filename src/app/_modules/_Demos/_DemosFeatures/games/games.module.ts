import { NgModule        } from '@angular/core';
import { CommonModule    } from '@angular/common';
import { SharedModule              } from 'src/app/_modules/shared/shared.module';
import { SudokuComponent           } from './game-sudoku/game-sudoku.component';
import { BoardComponent            } from './game-tictactoe/board/board.component';
import { SquareComponent           } from './game-tictactoe/square/square.component';
import { GameHanoiAutoComponent    } from './game-hanoi-auto/game-hanoi-auto.component';
import { GameHanoi3dComponent      } from './game-hanoi3d/game-hanoi3d.component';
import { GameTetrisAIComponent     } from './game-tetris-ai/game-tetris-ai.component';
import { GameTetrisComponent       } from './game-tetris/game-tetris.component';
import { GameTictactoeComponent    } from './game-tictactoe/game-tictactoe.component';
import { TicTacToeBoardAiComponent } from './tic-tac-toe-board-ai/tic-tac-toe-board-ai.component';

@NgModule({
  declarations: [
    SudokuComponent,
    GameTictactoeComponent,
    TicTacToeBoardAiComponent,
    GameHanoiAutoComponent,
    GameHanoi3dComponent,
    GameTetrisComponent,
    GameTetrisAIComponent,
    
  ],
  imports: [
    CommonModule,
    SharedModule,
    BoardComponent,
    SquareComponent,
  ],
  exports : [
    SudokuComponent,
    GameTictactoeComponent,
    TicTacToeBoardAiComponent,
    GameHanoiAutoComponent,
    GameHanoi3dComponent,
    GameTetrisComponent,
    GameTetrisAIComponent,
  ]
})
export class GamesModule { 
  
}
