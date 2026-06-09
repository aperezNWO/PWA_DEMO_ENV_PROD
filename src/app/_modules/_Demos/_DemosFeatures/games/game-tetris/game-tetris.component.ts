// ANGULAR CORE
import { HttpClient              } from '@angular/common/http';
import { ActivatedRoute          } from '@angular/router';
import {  Component              
        , HostListener
        , OnInit
        , OnDestroy
        , signal                 
        , computed
        , effect
        , ChangeDetectorRef      } from '@angular/core';
import { toObservable            } from '@angular/core/rxjs-interop'; // v21 work: Essential interop for plain property tracking

// SERVICES
import { TetrisService           } from 'src/app/_services/__Games/TetrisService/tetris.service';
import { ConfigService           } from 'src/app/_services/__Utils/ConfigService/config.service';
import { SpeechService           } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { BackendService          } from 'src/app/_services/BackendService/backend.service';

// GLOBAL
import { PAGE_GAMES_TETRIS, PAGE_TITLE_LOG, PAGE_TITLE_NO_SOUND } from 'src/app/_models/common';

// THIRD PARTY
import { interval, Subscription  } from 'rxjs';

// COMPONENTS
import { BaseReferenceComponent  } from 'src/app/_components/base-reference/base-reference.component';

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
type ControlMode = 'MANUAL' | 'VOICE';

@Component({
  selector: 'app-game-tetris',
  templateUrl: './game-tetris.component.html',
  styleUrl: './game-tetris.component.css',
  standalone : false, 
  providers:   [{ provide: PAGE_TITLE_LOG, useValue: PAGE_GAMES_TETRIS }],
})
export class GameTetrisComponent extends BaseReferenceComponent implements OnInit, OnDestroy {
  // Constants
  private readonly BOARD_WIDTH = 10;
  private readonly BOARD_HEIGHT = 20;
  private readonly TICK_INTERVAL = 500;
  
  // --- Signals ---
  private board = signal<string[][]>([]);
  private currentPiece = signal<Position[]>([]);
  private currentColor = signal<string>('');
  private lockedScore = signal<number>(0);
  private lockedIsPlaying = signal<boolean>(false);
  private lockedGameOver = signal<boolean>(false);
  private lockedIsMobile = signal<boolean>(false);
  
  // Input strategies and match status management primitives
  readonly controlMode = signal<ControlMode>('MANUAL'); 
  readonly hasStarted = signal<boolean>(false); 
  
  // --- State Indicators ---
  private isListening = false; // Guard flag to prevent duplicate WebSpeech recognition instances
  private gameLoop$?: Subscription;
  private voiceSpeechSub$?: Subscription; // Explicit stream subscription for processing spoken commands

  // --- Computed States ---
  readonly displayBoard = computed(() => {
    const boardCopy = this.board().map(row => [...row]);
    this.currentPiece().forEach(pos => {
      if (pos.y >= 0 && pos.y < this.BOARD_HEIGHT) {
        boardCopy[pos.y][pos.x] = this.currentColor();
      }
    });
    return boardCopy;
  });
  
  readonly score     = computed(() => this.lockedScore());
  readonly isPlaying = computed(() => this.lockedIsPlaying());
  readonly gameOver  = computed(() => this.lockedGameOver());
  readonly isMobile  = computed(() => this.lockedIsMobile());

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
    super(configService, backendService, route, speechService, PAGE_TITLE_NO_SOUND);
    
    effect(() => {
      if (this.gameOver()) {
        console.log('Game Over! Final score:', this.score());
        this.stopVoiceRecognition(); 
      }
    });

    /**
     * Effect 1: Hardware Stream Toggle
     * Handles hardware mic activation or teardown explicitly tracking dependencies.
     */
    effect(() => {
      const isVoiceMode = this.controlMode() === 'VOICE';
      const isGameActive = this.isPlaying();

      if (isVoiceMode && isGameActive) {
        this.startVoiceRecognition();
      } else {
        this.stopVoiceRecognition();
      }
    });

    /**
     * Interop Stream Bridge:
     * Converts the static SpeechService property changes into a running observable stream.
     * This registers data transitions flawlessly inside the component lifecycle.
     */
    const transcript$ = toObservable(computed(() => this.speechService.transcript));

    this.voiceSpeechSub$ = transcript$.subscribe((rawText) => {
      const mode = this.controlMode();
      const playing = this.isPlaying();
      const isOver = this.gameOver();

      if (mode === 'VOICE' && playing && !isOver && rawText) {

        //
        const command = rawText.toLowerCase().trim();

        //
        console.log('command : ' + command);
        
        //
        if (command.includes('left') || command.includes('izquierda')) {
          this.moveLeft();
        } else if (command.includes('right') || command.includes('derecha')) {
          this.moveRight();
        } else if (command.includes('rotate') || command.includes('girar') || command.includes('up')) {
          this.rotate();
        } else if (command.includes('down') || command.includes('abajo')) {
          this.moveDown();
        } else if (command.includes('drop') || command.includes('caer') || command.includes('space')) {
          this.drop();
        }
      }
    });
  }  
 
  ngOnInit() {
    this.lockedIsMobile.set(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    this.initBoard(); 
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (!this.isPlaying() || this.gameOver() || this.controlMode() === 'VOICE') return;

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

  onControlModeChange(event: Event) {
    const selectedMode = (event.target as HTMLSelectElement).value as ControlMode;
    this.controlMode.set(selectedMode);
  }

  private startVoiceRecognition() {
    if (this.isListening) return; // Safeguard against redundant start requests

    if (this.speechService.startListening) {
      try {
        this.speechService.startListening();
        this.isListening = true;
      } catch (err) {
        console.warn("Speech engine initialization conflict handled securely:", err);
      }
    }
  }

  private stopVoiceRecognition() {
    if (this.speechService.stopListening) {
      this.speechService.stopListening();
    }
    this.isListening = false;
  }

  private initBoard() {
    const newBoard = Array(this.BOARD_HEIGHT).fill(null).map(() => Array(this.BOARD_WIDTH).fill(''));
    this.board.set(newBoard);
  }

  startGame() {
    if (this.gameLoop$) this.gameLoop$.unsubscribe();
    
    this.initBoard();
    this.lockedScore.set(0);
    this.lockedGameOver.set(false);
    this.lockedIsPlaying.set(true);
    this.hasStarted.set(true); 
    this.currentPiece.set([]);
    this.currentColor.set('');
    
    this.spawnPiece();

    this.gameLoop$ = interval(this.TICK_INTERVAL).subscribe(() => {
      if (!this.gameOver()) {
        this.moveDown();
      }
    });
  }

  resetGame() {
    this.hasStarted.set(false);
    this.lockedIsPlaying.set(false);
    this.lockedGameOver.set(false);
    if (this.gameLoop$) this.gameLoop$.unsubscribe();
    this.stopVoiceRecognition();
    this.initBoard();
  }

  private spawnPiece() {
    const pieces = Object.keys(this.TETROMINOS) as TetrominoType[];
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
    const piece = this.TETROMINOS[randomPiece];
    
    const newPiece = piece.shape.flatMap((row, y) => 
      row.map((cell, x) => cell ? { x: x + Math.floor(this.BOARD_WIDTH/2) - 1, y } : null)
    ).filter((pos): pos is Position => pos !== null);
    
    this.currentPiece.set(newPiece);
    this.currentColor.set(piece.color);
    
    if (this.checkCollision()) {
      this.lockedGameOver.set(true);
      this.lockedIsPlaying.set(false);
      if (this.gameLoop$) this.gameLoop$.unsubscribe();
      this.stopVoiceRecognition();
    }
  }

  moveLeft() {
    const newPositions = this.currentPiece().map(pos => ({ ...pos, x: pos.x - 1 }));
    if (this.isValidMove(newPositions)) this.currentPiece.set(newPositions);
  }

  moveRight() {
    const newPositions = this.currentPiece().map(pos => ({ ...pos, x: pos.x + 1 }));
    if (this.isValidMove(newPositions)) this.currentPiece.set(newPositions);
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
      this.currentPiece.update(pieces => pieces.map(pos => ({ ...pos, y: pos.y + 1 })));
    }
    this.lockPiece();
    this.clearLines();
    this.spawnPiece();
  }

  rotate() {
    const currentPieces = this.currentPiece();
    if (!currentPieces.length) return;
    
    const center = currentPieces[1] || currentPieces[0];
    const newPositions = currentPieces.map(pos => ({
      x: center.x - (pos.y - center.y),
      y: center.y + (pos.x - center.x)
    }));
    
    if (this.isValidMove(newPositions)) this.currentPiece.set(newPositions);
  }

  private isValidMove(positions: Position[]): boolean {
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
      this.lockedScore.update(score => score + Math.pow(2, linesCleared - 1) * 100);
    }
  }

  ngOnDestroy() {
    if (this.gameLoop$) this.gameLoop$.unsubscribe();
    if (this.voiceSpeechSub$) this.voiceSpeechSub$.unsubscribe();
    this.stopVoiceRecognition();
  }
}