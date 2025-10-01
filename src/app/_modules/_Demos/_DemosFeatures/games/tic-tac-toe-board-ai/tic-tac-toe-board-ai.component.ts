import { Component, OnInit         } from '@angular/core';
import { ActivatedRoute            } from '@angular/router';
import { BaseComponent             } from 'src/app/_components/base/base.component';
import { PAGE_GAMES_TIC_TAC_TOE_AI } from 'src/app/_models/common';
import { BackendService            } from 'src/app/_services/BackendService/backend.service';
import { ConfigService             } from 'src/app/_services/ConfigService/config.service';
import { SpeechService             } from 'src/app/_services/speechService/speech.service';
import { TicTacToeResult, TicTacToeService          } from 'src/app/_services/tictactoe/services/tic-tac-toe.service';

@Component({
  selector: 'app-tic-tac-toe-board-ai',
  templateUrl: './tic-tac-toe-board-ai.component.html',
  styleUrl: './tic-tac-toe-board-ai.component.css'
})
export class TicTacToeBoardAiComponent extends BaseComponent implements OnInit {
  //
  board: number[] = Array(9).fill(0);
  winner: number | null = null;
  isAnimating = false;
  //
  constructor(
                  public  override configService    : ConfigService,
                  public  override route            : ActivatedRoute,
                  public  override speechService    : SpeechService,
                  public  override backendService   : BackendService,
                  private          gameService      : TicTacToeService) 
  {  
      //
      super(configService,
            backendService,
            route,
            speechService,
            PAGE_GAMES_TIC_TAC_TOE_AI,
      )

      
  }
  //
  ngOnInit(): void {
    this.playGame();
  }
  //
  get playButtonLabel(): string {
    if (this.isAnimating) return 'AI is thinking...';
    return this.board.every(cell => cell === 0) ? 'Play' : 'Play Again';
  }
  //
  playGame(): void {
    this.isAnimating = true;
    this.winner = null;
    this.board = Array(9).fill(0); // Reset board

    this.gameService.playGame().subscribe({
      next: (result: TicTacToeResult) => {
        this.animateGame(result.history, result.winner);
      },
      error: (err) => {
        console.error('Failed to load game', err);
        alert('Error: Could not fetch game from server.');
        this.isAnimating = false;
      }
    });
  }

  private animateGame(history: number[][], winner: number): void {
    this.board = [...history[0]]; // Start with empty board

    const delayMs = 600; // Animation speed

    history.forEach((state, index) => {
      setTimeout(() => {
        this.board = [...state];
        if (index === history.length - 1) {
          this.winner = winner;
          this.isAnimating = false;
        }
      }, index * delayMs);
    });
  }

  getCellSymbol(cell: number): string {
    return cell === 1 ? 'X' : cell === -1 ? 'O' : '';
  }

  getWinnerText(): string {
    if (this.winner === 1) return '🎉 X wins!';
    if (this.winner === -1) return '🎉 O wins!';
    return '🤝 It\'s a draw!';
  }
}

