import { Component, ElementRef, OnInit, ViewChild                         } from '@angular/core';
import { ActivatedRoute                            } from '@angular/router';
import { BaseComponent                             } from 'src/app/_components/base/base.component';
import { BackendService                            } from 'src/app/_services/BackendService/backend.service';
import { ConfigService                             } from 'src/app/_services/ConfigService/config.service';
import { SpeechService                             } from 'src/app/_services/speechService/speech.service';
import { AIMove, TetrisService                     } from 'src/app/_services/tetris.service';
import { PAGE_GAMES_TETRIS_AI                      } from 'src/app/_models/common';


@Component({
  selector: 'app-game-tetris-ai',
  templateUrl: './game-tetris-ai.component.html',
  styleUrl: './game-tetris-ai.component.css'
})
export class GameTetrisAIComponent  extends BaseComponent implements OnInit {
  //
  BOARD_HEIGHT = 20;
  BOARD_WIDTH = 10;

  board: number[][] = [];
  gameOver = false;
  score = 0;
  isAutoPlaying = false;
  autoPlayInterval: any = null;

  aiSuggestion: AIMove | null = null;
  aiLoading = false;

  readonly ACTIONS = ['← Izquierda', '→ Derecha', '↻ Rotar', '↓ Bajar', 'No hacer nada'];

  @ViewChild('gameCanvas', { static: true }) canvasRef!: ElementRef<HTMLDivElement>;
  //
  constructor(
                  private tetrisService             : TetrisService,
                  public  override configService    : ConfigService,
                  public  override route            : ActivatedRoute,
                  public  override speechService    : SpeechService,
                  public  override backendService   : BackendService) 
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
    this.initBoard();
    this.setupKeyboardControls();
  }

  initBoard(): void {
    this.board = Array(this.BOARD_HEIGHT).fill(0).map(() => Array(this.BOARD_WIDTH).fill(0));
  }

  setupKeyboardControls(): void {
    document.addEventListener('keydown', (e) => {
      if (this.isAutoPlaying) return;

      switch (e.key) {
        case 'ArrowLeft':  this.moveLeft();  break;
        case 'ArrowRight': this.moveRight(); break;
        case 'ArrowUp':    this.rotate();    break;
        case 'ArrowDown':  this.hardDrop();  break;
        case ' ':          this.getAISuggestion(); break;
      }
    });
  }

  // === Simulaciones básicas (en versión real, tendrías lógica de piezas)
  moveLeft(): void  { this.applyAction(0); }
  moveRight(): void { this.applyAction(1); }
  rotate(): void    { this.applyAction(2); }
  hardDrop(): void  { this.applyAction(3); }
  noAction(): void  { this.applyAction(4); }

  applyAction(action: number): void {
    console.log('Aplicando:', this.ACTIONS[action]);
    // Aquí iría la lógica real del motor de juego
    this.redrawBoard();
  }

  // === Sugerencia manual ===
  getAISuggestion(): void {
    this.aiLoading = true;
    this.aiSuggestion = null;

    this.tetrisService.getAIMove(this.board).subscribe({
      next: (response) => {
        this.aiSuggestion = response;
        this.aiLoading = false;
        console.log('IA sugiere:', this.ACTIONS[response.action]);
      },
      error: () => {
        this.aiLoading = false;
        alert('Error al contactar con la IA');
      }
    });
  }

  // === Autoplay: juega solo ===
  startAutoPlay(): void {
    if (this.isAutoPlaying) return;

    this.isAutoPlaying = true;
    this.autoPlayInterval = setInterval(() => {
      this.getAISuggestionForAutoPlay();
    }, 800);
  }

  getAISuggestionForAutoPlay(): void {
    this.tetrisService.getAIMove(this.board).subscribe({
      next: (response) => {
        this.aiSuggestion = response;
        this.applyAction(response.action); // Aplica automáticamente
      },
      error: (err) => {
        console.error('Error en autoplay:', err);
        this.stopAutoPlay();
      }
    });
  }

  stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
    this.isAutoPlaying = false;
  }

  // === Renderizado visual ===
  redrawBoard(): void {
    // En una versión avanzada usarías Canvas
    console.table(this.board);
  }

  resetGame(): void {
    this.stopAutoPlay();
    this.initBoard();
    this.score = 0;
    this.gameOver = false;
    this.aiSuggestion = null;
  }
  // ✅ Propiedad segura para mostrar Q-values
  get qValuesFormatted(): string {
    const q = this.aiSuggestion?.q_values;
    if (!Array.isArray(q)) return '---';
    try {
      return q.map(v => v.toFixed(2)).join(', ');
    } catch (e) {
      return '---';
    }
  }
}
