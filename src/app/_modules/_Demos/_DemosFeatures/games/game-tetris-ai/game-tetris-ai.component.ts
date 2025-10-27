import { ChangeDetectorRef, Component, ElementRef, OnInit, signal, ViewChild                         } from '@angular/core';
import { ActivatedRoute                            } from '@angular/router';
import { BaseComponent                             } from 'src/app/_components/base/base.component';
import { BackendService                            } from 'src/app/_services/BackendService/backend.service';
import { ConfigService                             } from 'src/app/_services/ConfigService/config.service';
import { SpeechService                             } from 'src/app/_services/speechService/speech.service';
import { PAGE_GAMES_TETRIS_AI                      } from 'src/app/_models/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

// Global variables provided by the Canvas environment for authentication and app configuration
declare const __app_id: string;
declare const __firebase_config: string;
declare const __initial_auth_token: string;

/**
 * Interface representing the expected response structure from the Python backend API.
 * Assuming the backend returns the full grid, the current score, and the game over status.
 */
interface TetrisState {
  board: number[][]; // 20 rows x 10 columns. 0 for empty, >0 for block type/color.
  score: number;
  game_over: boolean;
}

@Component({
  selector: 'app-game-tetris-ai',
  templateUrl: './game-tetris-ai.component.html',
  styleUrl: './game-tetris-ai.component.css'
})
export class GameTetrisAIComponent  extends BaseComponent implements OnInit {
   board: number[][] = [];
  score = 0;
  gameOver = false;
  currentPiece: { shape: number[][], position: [number, number] } | null = null;

  private apiUrl = 'https://nkg7t7-8000.csb.app/api/tetris/move/';
  private lastActionWasDown = false;
  private gravityCounter = 0;
  private readonly MAX_GRAVITY = 3; // Force down every 3 AI steps

  // For debugging
  actionStats: number[] = [0, 0, 0, 0, 0]; // Index 0-4 for actions 0-4

  private stuckCounter = 0;
  private lastPosition: [number, number] | null = null;

  constructor(    private http: HttpClient, 
                  private cd: ChangeDetectorRef,
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
  
  ngOnInit(): void {
    this.resetGame();
  }

  resetGame() {
    this.board = Array.from({ length: 20 }, () => Array(10).fill(0));
    this.score = 0;
    this.gameOver = false;
    this.currentPiece = this.generateRandomPiece();
    this.drawPieceOnBoard();
    this.gravityCounter = 0;
    this.lastActionWasDown = false;
    this.actionStats = [0, 0, 0, 0, 0];
    this.gameLoop();
  }

  gameLoop() {
    if (this.gameOver) return;

    // Check if piece is stuck (same position for too long)
    if (this.currentPiece) {
      const [x, y] = this.currentPiece.position;
      if (this.lastPosition && this.lastPosition[0] === x && this.lastPosition[1] === y) {
        this.stuckCounter++;
        if (this.stuckCounter > 5) {
          console.log('Stuck detected! Forcing lock...');
          this.stuckCounter = 0;
          this.lockPiece();
          return;
        }
      } else {
        this.stuckCounter = 0;
        this.lastPosition = [x, y];
      }
    }
    
    const body = { board: this.board };
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    this.http.post<{ action: number }>(this.apiUrl, body, { headers }).subscribe({
      next: (response) => {
        let action = response.action;

        // Log action stats
        if (action >= 0 && action <= 4) {
          this.actionStats[action]++;
        }
        console.log('Action:', action, 'Stats:', this.actionStats);

        // Apply move
        this.applyMove(action);

        // 🔻 AUTOMATIC GRAVITY
        this.gravityCounter++;
        if (!this.lastActionWasDown && this.gravityCounter >= this.MAX_GRAVITY) {
          this.applyMove(3); // Force down
          this.gravityCounter = 0;
        }

        this.checkGameOver();
        this.clearLines();

        setTimeout(() => this.gameLoop(), 400);
      },
      error: (err) => {
        console.error('API Error:', err);
        // Fallback to mock AI
        const mockAction = this.getMockAction();
        console.log('Using mock action:', mockAction);
        this.applyMove(mockAction);
        this.gravityCounter++;
        if (!this.lastActionWasDown && this.gravityCounter >= this.MAX_GRAVITY) {
          this.applyMove(3);
          this.gravityCounter = 0;
        }
        this.checkGameOver();
        this.clearLines();
        setTimeout(() => this.gameLoop(), 400);
      }
    });
  }

  generateRandomPiece() {
    const pieces = [
      [[1, 1, 1, 1]],           // I
      [[1, 1], [1, 1]],         // O
      [[0, 1, 0], [1, 1, 1]],   // T
      [[0, 1, 1], [1, 1, 0]],   // S
      [[1, 1, 0], [0, 1, 1]],   // Z
      [[1, 0, 0], [1, 1, 1]],   // J
      [[0, 0, 1], [1, 1, 1]]    // L
    ];
    const shape = pieces[Math.floor(Math.random() * pieces.length)];
    const x = Math.floor((10 - shape[0].length) / 2);
    return { shape, position: [x, 0] as [number, number] };
  }

  applyMove(action: number) {
  if (!this.currentPiece) return;

  let { shape, position } = this.currentPiece;
  let [x, y] = position;

  // Clear current piece from board (immutable)
  this.clearPieceFromBoard(shape, x, y);

  let newX = x;
  let newY = y;
  let newShape = shape;
  let moved = false;

  switch (action) {
    case 0: // left
      if (!this.checkCollision(shape, x - 1, y)) {
        newX = x - 1;
        moved = true;
      }
      break;
    case 1: // right
      if (!this.checkCollision(shape, x + 1, y)) {
        newX = x + 1;
        moved = true;
      }
      break;
    case 2: // rotate
      const rotated = this.rotatePiece(shape);
      if (!this.checkCollision(rotated, x, y)) {
        newShape = rotated;
        moved = true;
      }
      break;
    case 3: // down
      if (!this.checkCollision(shape, x, y + 1)) {
        newY = y + 1;
        moved = true;
      }
      break;
    case 4: // no_action
      // 🔥 TREAT THIS AS A SIGNAL TO LOCK THE PIECE
      console.log('Action 4: Locking piece...');
      this.currentPiece = { shape: newShape, position: [newX, newY] };
      this.lockPiece(); // This will clear lines and spawn new piece
      return;
    default:
      console.warn('Unknown action:', action);
      this.drawPieceOnBoard(); // Redraw original
      return;
  }

  // If no movement occurred, lock the piece
  if (!moved) {
    console.log('Piece stuck! Locking piece...');
    this.currentPiece = { shape: newShape, position: [newX, newY] };
    this.lockPiece(); // This will clear lines and spawn new piece
    return;
  }

  // Update piece position
  this.currentPiece = { shape: newShape, position: [newX, newY] };
  this.drawPieceOnBoard();
  this.lastActionWasDown = (action === 3);
 }
 
 drawPieceOnBoard() {
  if (!this.currentPiece) return;

  const { shape, position } = this.currentPiece;
  let newBoard = [...this.board.map(row => [...row])]; // Deep clone

  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[i].length; j++) {
      if (shape[i][j]) {
        const row = position[1] + i;
        const col = position[0] + j;
        if (row >= 0 && row < 20 && col >= 0 && col < 10) {
          newBoard[row][col] = 1;
        }
      }
    }
  }

  this.board = newBoard; // Replace entire board → triggers change detection
  }

 clearPieceFromBoard(shape: number[][], x: number, y: number) {
  let newBoard = [...this.board.map(row => [...row])]; // Deep clone

  for (let i = 0; i < shape.length; i++) {
    for (let j = 0; j < shape[i].length; j++) {
      if (shape[i][j]) {
        const row = y + i;
        const col = x + j;
        if (row >= 0 && row < 20 && col >= 0 && col < 10) {
          newBoard[row][col] = 0;
        }
      }
    }
  }

  this.board = newBoard; // Replace entire board → triggers change detection
}

checkCollision(piece: number[][], x: number, y: number): boolean {
    for (let i = 0; i < piece.length; i++) {
      for (let j = 0; j < piece[i].length; j++) {
        if (piece[i][j]) {
          const newX = x + j;
          const newY = y + i;
          if (
            newX < 0 ||
            newX >= 10 ||
            newY >= 20 ||
            (newY >= 0 && this.board[newY][newX])
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  rotatePiece(piece: number[][]): number[][] {
    return piece[0].map((_, i) => piece.map(row => row[i]).reverse());
  }

  checkGameOver() {
    // Only game over if top two rows are significantly filled
    const topRows = [...this.board[0], ...this.board[1]];
    const filledCount = topRows.filter(cell => cell === 1).length;
    if (filledCount > 3) {
      this.gameOver = true;
    }
  }

  clearLines() {
    let linesCleared = 0;
    for (let i = 0; i < this.board.length; i++) {
      if (this.board[i].every(cell => cell === 1)) {
        this.board.splice(i, 1);
        this.board.unshift(Array(10).fill(0));
        linesCleared++;
        i--;
      }
    }
    this.score += linesCleared * 10;
  }

  lockPiece() {
  // Place the current piece permanently on the board
  this.drawPieceOnBoard();

  // Check for completed lines
  this.clearLines();

  // Spawn a new piece
  this.currentPiece = this.generateRandomPiece();
  
  // ✅ FORCE RE-RENDER by creating a new board instance
  this.board = [...this.board.map(row => [...row])];

  // Check for game over after locking
  this.checkGameOver();
}

  // 🎯 Mock AI: Simple rule-based logic
  getMockAction(): number {
    if (!this.currentPiece) return 3; // Default to "down"

    const [x, y] = this.currentPiece.position;

    // If piece is near right edge, move left
    if (x > 5) return 0;

    // If piece is near left edge, move right
    if (x < 2) return 1;

    // Rotate every 5 steps
    if (Math.random() < 0.2) return 2;

    // Otherwise, move down
    return 3;
  } 
}
  
