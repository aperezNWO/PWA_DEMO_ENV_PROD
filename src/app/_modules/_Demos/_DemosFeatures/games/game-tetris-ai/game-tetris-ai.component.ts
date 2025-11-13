import { ChangeDetectorRef, Component, OnInit, } from '@angular/core';
import { ActivatedRoute                            } from '@angular/router';
import { BaseComponent                             } from 'src/app/_components/base/base.component';
import { BackendService                            } from 'src/app/_services/BackendService/backend.service';
import { ConfigService                             } from 'src/app/_services/ConfigService/config.service';
import { SpeechService                             } from 'src/app/_services/speechService/speech.service';
import { PAGE_GAMES_TETRIS_AI                      } from 'src/app/_models/common';
import { HttpClient                                } from '@angular/common/http';
import { interval,  Subscription                   } from 'rxjs';
import { TetrisState,  AIWeights                   } from "src/app/_models/entity.model";
import { TetrisService                             } from "src/app/_services/TetrisService/tetris.service";
import { catchError, tap                           } from 'rxjs/operators';
@Component({
  selector: 'app-game-tetris-ai',
  templateUrl: './game-tetris-ai.component.html',
  styleUrl: './game-tetris-ai.component.css'
})
export class GameTetrisAIComponent  extends BaseComponent implements OnInit {
  
 state: TetrisState = {
    score: 0,
    lines: 0,
    level: 1,
    nextPiece: 0,
    gameOver: false,
    boardMatrix: Array(20).fill(null).map(() => Array(10).fill(0))
  };

  aiWeights: AIWeights = { linesWeight: 0, heightWeight: 0, holesWeight: 0, bumpinessWeight: 0 };
  private statePolling: Subscription | null = null;
  public  initializationAttempted = false;

  constructor(    private http: HttpClient, 
                  private cd: ChangeDetectorRef,
                  public  override configService    : ConfigService,
                  public  override route            : ActivatedRoute,
                  public  override speechService    : SpeechService,
                  public  override backendService   : BackendService,
                  public  tetrisService: TetrisService) 
  { 
      //
      super(configService,
            backendService,
            route,
            speechService,
            PAGE_GAMES_TETRIS_AI
      )
  }
  //
  ngOnInit(): void {
    this.initializeGame();
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.tetrisService.stopAutoPlay();
    if (this.tetrisService.isGameCreated()) {
      this.tetrisService.destroyGame().subscribe();
    }
  }

  initializeGame(): void {
    if (this.initializationAttempted) return;
    this.initializationAttempted = true;

    console.log('🎮 Initializing Tetris game...');
    
    this.tetrisService.createGame().pipe(
      tap(() => {
        console.log('✅ Game created, starting state polling');
        this.startPolling();
        this.loadAIWeights();
      }),
      catchError(err => {
        console.error('❌ Failed to create game:', err);
        alert(`Failed to initialize game: ${err.message}. Check console (F12) and ensure DLL is in the API directory.`);
        return [];
      })
    ).subscribe();
  }

  private startPolling(): void {
    if (this.statePolling) return;
    
    this.statePolling = interval(100).subscribe(() => {
      this.tetrisService.getState().pipe(
        tap(state => {
          // Debug log
          if (state) {
            console.log('📊 State received:', {
              score: state.score,
              lines: state.lines,
              boardHeight: state.boardMatrix.length,
              boardWidth: state.boardMatrix[0]?.length,
              sampleValue: state.boardMatrix[0]?.[0],
              nextPiece: state.nextPiece
            });
          }
        })
      ).subscribe(state => {
        if (state && state.boardMatrix && state.boardMatrix.length > 0) {
          this.state = state;
        }
      });
    });
  }

  private stopPolling(): void {
    if (this.statePolling) {
      this.statePolling.unsubscribe();
      this.statePolling = null;
    }
  }

  // UI Actions
  step(): void {
    this.tetrisService.step().subscribe({ error: err => console.error('Step failed:', err) });
  }

  reset(): void {
    this.tetrisService.reset().subscribe({ error: err => console.error('Reset failed:', err) });
  }

  toggleAutoPlay(): void {
    if (!this.tetrisService.isGameCreated()) {
      alert('Game not initialized. Please wait...');
      return;
    }
    if (this.tetrisService.isAutoPlaying()) {
      this.tetrisService.stopAutoPlay();
    } else {
      this.tetrisService.startAutoPlay();
    }
  }

  trainAI(): void {
    console.log('🤖 Starting AI training...');
    this.tetrisService.trainAI().subscribe(() => {
      alert('✅ AI training completed!');
      this.loadAIWeights();
    });
  }

  loadAIWeights(): void {
    this.tetrisService.getAIWeights().subscribe(weights => {
      this.aiWeights = weights;
      console.log('📊 AI weights loaded:', weights);
    });
  }

  updateAIWeights(): void {
    this.tetrisService.setAIWeights(this.aiWeights).subscribe(() => {
      console.log('✅ Weights updated');
    });
  }

  getCellClass(value: number): string {
    if (value === 0) return 'empty';
    return `occupied piece-${value}`;
  }

  getPieceName(id: number): string {
    const names = ['', 'I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    return names[id] || '?';
  }

  isGameReady(): boolean {
    return this.tetrisService.isGameCreated() && this.state.boardMatrix.length > 0;
  }
}  
