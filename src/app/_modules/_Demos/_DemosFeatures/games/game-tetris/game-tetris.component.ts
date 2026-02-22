import { HttpClient } from '@angular/common/http';
// v21 work: Importing signal-based primitives - signal, computed, effect are new Angular Signals API
import { Component, HostListener, OnInit, OnDestroy, signal, computed, effect, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { BaseReferenceComponent } from 'src/app/_components/base-reference/base-reference.component';
import { PAGE_GAMES_TETRIS, PAGE_TITLE_LOG, PAGE_TITLE_NO_SOUND } from 'src/app/_models/common';
import { TetrisService } from 'src/app/_services/__Games/TetrisService/tetris.service';
import { ConfigService } from 'src/app/_services/__Utils/ConfigService/config.service';
import { SpeechService } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { BackendService } from 'src/app/_services/BackendService/backend.service';

// Define interfaces
interface Position {
  x: number;
  y: number;
}

interface Tetromino {
  shape: number[][];
  color: string;
}

type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

@Component({
  selector: 'app-game-tetris',
  templateUrl: './game-tetris.component.html',
  styleUrl: './game-tetris.component.css',
  standalone : false, // v21 work: standalone: false is still supported but standalone: true is now the Angular default
  providers:   [{ provide: PAGE_TITLE_LOG, useValue: PAGE_GAMES_TETRIS }],
})
export class GameTetrisComponent extends BaseReferenceComponent implements OnInit, OnDestroy {
  // Constants
  private readonly BOARD_WIDTH = 10;
  private readonly BOARD_HEIGHT = 20;
  private readonly TICK_INTERVAL = 500;
  
  // v21 work: Using signal() to create reactive state primitives - replaces traditional class properties + manual change detection
  private board = signal<string[][]>([]);
  private currentPiece = signal<Position[]>([]);
  private currentColor = signal<string>('');
  private lockedScore = signal<number>(0);
  private lockedIsPlaying = signal<boolean>(false);
  private lockedGameOver = signal<boolean>(false);
  private lockedIsMobile = signal<boolean>(false);
  
  // v21 work: computed() automatically derives values from signals - recalculates only when dependent signals change
  // This replaces manual getter methods or ngOnChanges logic
  readonly displayBoard = computed(() => {
    const boardCopy = this.board().map(row => [...row]);
    
    // Add current piece to display
    // v21 work: Accessing signal values by calling them as functions e.g. this.board(), this.currentPiece()
    this.currentPiece().forEach(pos => {
      if (pos.y >= 0 && pos.y < this.BOARD_HEIGHT) {
        boardCopy[pos.y][pos.x] = this.currentColor();
      }
    });
    
    return boardCopy;
  });
  
  // v21 work: Exposing internal signals as readonly computed() signals to prevent external mutation
  readonly score = computed(() => this.lockedScore());
  readonly isPlaying = computed(() => this.lockedIsPlaying());
  readonly gameOver = computed(() => this.lockedGameOver());
  readonly isMobile = computed(() => this.lockedIsMobile());
  
  private gameLoop$?: Subscription;

  private readonly TETROMINOS: Record<TetrominoType, Tetromino> = {
    I: { shape: [[1, 1, 1, 1]], color: '#00f0f0' },
    O: { shape: [[1, 1], [1, 1]], color: '#f0f000' },
    T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#a000f0' },
    S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#00f000' },
    Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#f00000' },
    J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#0000f0' },
    L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#f0a000' }
  };

  constructor(    private http: HttpClient, 
                  private cd: ChangeDetectorRef,
                  public  override configService    : ConfigService,
                  public  override route            : ActivatedRoute,
                  public  override speechService    : SpeechService,
                  public  override backendService   : BackendService,
                  public  tetrisService: TetrisService) 
  { 
    super(configService,
          backendService,
          route,
          speechService,
          PAGE_TITLE_NO_SOUND,
    )
    
    // v21 work: effect() runs a side effect whenever its dependent signals change - replaces manual subscriptions
    // or ngDoCheck for reactive side effects. Automatically tracks signal dependencies.
    effect(() => {
      if (this.gameOver()) {
        console.log('Game Over! Final score:', this.score());
      }
    });
  }  
 
  ngOnInit() {
    // v21 work: signal.set() replaces direct property assignment - notifies all dependents automatically
    this.lockedIsMobile.set(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    this.startGame();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // v21 work: Reading signal values via function call syntax e.g. this.isPlaying(), this.gameOver()
    if (!this.isPlaying() || this.gameOver()) return;
    
    switch(event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.moveLeft();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.moveRight();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.rotate();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.moveDown();
        break;
      case ' ':
        event.preventDefault();
        this.drop();
        break;
    }
  }

  private initBoard() {
    const newBoard = Array(this.BOARD_HEIGHT).fill(null)
      .map(() => Array(this.BOARD_WIDTH).fill(''));
    // v21 work: signal.set() to replace the entire signal value immutably
    this.board.set(newBoard);
  }

  startGame() {
    if (this.gameLoop$) {
      this.gameLoop$.unsubscribe();
    }
    
    this.initBoard();
    // v21 work: signal.set() calls below replace what would previously be separate component properties
    // with manual change detection or Subject/BehaviorSubject observables
    this.lockedScore.set(0);
    this.lockedGameOver.set(false);
    this.lockedIsPlaying.set(true);
    this.currentPiece.set([]);
    this.currentColor.set('');
    
    this.spawnPiece();
    
    this.gameLoop$ = interval(this.TICK_INTERVAL).subscribe(() => {
      // v21 work: Reading gameOver signal value inside an RxJS subscription - signals and RxJS coexist
      if (!this.gameOver()) {
        this.moveDown();
      }
    });
  }

  resetGame() {
    if (this.gameLoop$) {
      this.gameLoop$.unsubscribe();
    }
    
    this.initBoard();
    this.lockedScore.set(0);
    this.lockedGameOver.set(false);
    this.lockedIsPlaying.set(true);
    this.currentPiece.set([]);
    this.currentColor.set('');
    
    this.spawnPiece();
    
    this.gameLoop$ = interval(this.TICK_INTERVAL).subscribe(() => {
      if (!this.gameOver()) {
        this.moveDown();
      }
    });
  }

  private spawnPiece() {
    const pieces = Object.keys(this.TETROMINOS) as TetrominoType[];
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    const piece = this.TETROMINOS[randomPiece];
    
    const newPiece = piece.shape.flatMap((row, y) => 
      row.map((cell, x) => cell ? { x: x + Math.floor(this.BOARD_WIDTH/2) - 1, y } : null)
    ).filter((pos): pos is Position => pos !== null);
    
    // v21 work: signal.set() to update currentPiece and currentColor signals
    this.currentPiece.set(newPiece);
    this.currentColor.set(piece.color);
    
    if (this.checkCollision()) {
      // v21 work: Multiple signal.set() calls - each triggers reactive updates downstream
      this.lockedGameOver.set(true);
      this.lockedIsPlaying.set(false);
      if (this.gameLoop$) {
        this.gameLoop$.unsubscribe();
      }
    }
  }

  moveLeft() {
    const newPositions = this.currentPiece().map(pos => ({ ...pos, x: pos.x - 1 }));
    if (this.isValidMove(newPositions)) {
      this.currentPiece.set(newPositions);
    }
  }

  moveRight() {
    const newPositions = this.currentPiece().map(pos => ({ ...pos, x: pos.x + 1 }));
    if (this.isValidMove(newPositions)) {
      this.currentPiece.set(newPositions);
    }
  }

  moveDown() {
    const newPositions = this.currentPiece().map(pos => ({ ...pos, y: pos.y + 1 }));
    if (this.isValidMove(newPositions)) {
      this.currentPiece.set(newPositions);
    } else {
      this.lockPiece();
      this.clearLines();
      this.spawnPiece();
    }
  }

  drop() {
    while (this.isValidMove(this.currentPiece().map(pos => ({ ...pos, y: pos.y + 1 })))) {
      // v21 work: signal.update() derives the new value from the current value - more efficient than set()
      // when the new value depends on the old one. Replaces read-then-write patterns.
      this.currentPiece.update(pieces => 
        pieces.map(pos => ({ ...pos, y: pos.y + 1 }))
      );
    }
    this.lockPiece();
    this.clearLines();
    this.spawnPiece();
  }

  rotate() {
    // v21 work: Reading signal value into a local variable for use in non-reactive context
    const currentPieces = this.currentPiece();
    if (!currentPieces.length) return;
    
    const center = currentPieces[1] || currentPieces[0];
    const newPositions = currentPieces.map(pos => ({
      x: center.x - (pos.y - center.y),
      y: center.y + (pos.x - center.x)
    }));
    
    if (this.isValidMove(newPositions)) {
      this.currentPiece.set(newPositions);
    }
  }

  private isValidMove(positions: Position[]): boolean {
    // v21 work: Reading board signal value - this.board() - in a regular (non-reactive) method
    const currentBoard = this.board();
    return positions.every(pos => 
      pos.x >= 0 && 
      pos.x < this.BOARD_WIDTH &&
      pos.y >= 0 && 
      pos.y < this.BOARD_HEIGHT &&
      !currentBoard[pos.y]?.[pos.x]
    );
  }

  private checkCollision(): boolean {
    return !this.isValidMove(this.currentPiece());
  }

  private lockPiece() {
    // v21 work: signal.update() used to immutably update complex state (2D array)
    // The callback receives current value and must return the new value
    this.board.update(currentBoard => {
      const newBoard = currentBoard.map(row => [...row]);
      this.currentPiece().forEach(pos => {
        if (pos.y >= 0 && pos.y < this.BOARD_HEIGHT) {
          newBoard[pos.y][pos.x] = this.currentColor();
        }
      });
      return newBoard;
    });
  }

  private clearLines() {
    let linesCleared = 0;
    
    // v21 work: signal.update() with complex board transformation logic
    // All computed() signals that depend on board() will automatically recalculate after this update
    this.board.update(currentBoard => {
      const newBoard = [...currentBoard];
      
      for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
        if (newBoard[y].every(cell => cell !== '')) {
          newBoard.splice(y, 1);
          newBoard.unshift(Array(this.BOARD_WIDTH).fill(''));
          linesCleared++;
          y++;
        }
      }
      
      return newBoard;
    });

    if (linesCleared > 0) {
      // v21 work: signal.update() to increment score based on lines cleared
      this.lockedScore.update(score => score + Math.pow(2, linesCleared - 1) * 100);
    }
  }

  ngOnDestroy() {
    if (this.gameLoop$) {
      this.gameLoop$.unsubscribe();
    }
  }
}