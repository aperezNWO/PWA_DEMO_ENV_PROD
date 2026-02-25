import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  inject,
  signal,
  computed,
  effect,
  afterNextRender
} from '@angular/core';
import { ActivatedRoute }         from '@angular/router';
import { RouterLink }             from '@angular/router';
import { BackendService }         from 'src/app/_services/BackendService/backend.service';
import { SpeechService }          from 'src/app/_services/__Utils/SpeechService/speech.service';
import { BaseReferenceComponent } from 'src/app/_components/base-reference/base-reference.component';
import { ConfigService          } from 'src/app/_services/__Utils/ConfigService/config.service';
import { PAGE_GAMES_TETRIS_AI, PAGE_TITLE_LOG, PAGE_TITLE_NO_SOUND } from 'src/app/_models/common';
import { TetrisService }          from 'src/app/_services/__Games/TetrisService/tetris.service';

export interface TetrisState {
  boardMatrix: number[][];
  score:       number;
  lines:       number;
  level:       number;
  nextPiece:   number;
  gameOver:    boolean;
}

export interface AIWeights {
  linesWeight:     number;
  heightWeight:    number;
  holesWeight:     number;
  bumpinessWeight: number;
}

const PIECE_NAMES: Record<number, string> = {
  1: 'I', 2: 'O', 3: 'T', 4: 'S', 5: 'Z', 6: 'J', 7: 'L'
};

const BOARD_COLS = 10;
const BOARD_ROWS = 20;

// ORIGINAL: Aggressive scoring (high risk, high reward)
const AGGRESSIVE_AI_WEIGHTS: AIWeights = {
  linesWeight:     0.76,
  heightWeight:    -0.51,
  holesWeight:     -0.36,
  bumpinessWeight: -0.18,
};

// NEW: Balanced survival (moderate score, longer games)
const BALANCED_AI_WEIGHTS: AIWeights = {
  linesWeight:     0.40,
  heightWeight:    -1.20,
  holesWeight:     -0.80,
  bumpinessWeight: -0.40,
};

// NEW: Ultra survival (boring but lasts forever)
const SURVIVAL_AI_WEIGHTS: AIWeights = {
  linesWeight:     0.20,
  heightWeight:    -2.00,
  holesWeight:     -1.50,
  bumpinessWeight: -0.60,
};

// Default to balanced for demo
const DEFAULT_AI_WEIGHTS: AIWeights = { ...BALANCED_AI_WEIGHTS };

@Component({
  selector:    'app-game-tetris',
  templateUrl: './game-tetris-ai.component.html',
  styleUrl:    './game-tetris-ai.component.css',
  standalone:  false,
  //imports:     [RouterLink],
  providers:   [{ provide: PAGE_TITLE_LOG, useValue: PAGE_GAMES_TETRIS_AI }],
})
export class GameTetrisAIComponent extends BaseReferenceComponent implements OnInit, OnDestroy {

  readonly BOARD_COLS = BOARD_COLS;
  readonly BOARD_ROWS = BOARD_ROWS;

  readonly tetrisService = inject(TetrisService);

  private readonly isReadySignal         = signal<boolean>(false);
  readonly          initializationAttempted = signal<boolean>(false);
  readonly isGameReady = computed(() => this.isReadySignal());

  private readonly _state = signal<TetrisState>({
    boardMatrix: [],
    score:       0,
    lines:       0,
    level:       1,
    nextPiece:   0,
    gameOver:    false,
  });

  readonly boardMatrix = computed(() => this._state().boardMatrix);
  readonly score       = computed(() => this._state().score);
  readonly lines       = computed(() => this._state().lines);
  readonly level       = computed(() => this._state().level);
  readonly nextPiece   = computed(() => this._state().nextPiece);
  readonly gameOver    = computed(() => this._state().gameOver);

  private readonly _aiWeights = signal<AIWeights>({ ...DEFAULT_AI_WEIGHTS });
  readonly aiWeights = this._aiWeights.asReadonly();
  readonly linesWeight     = computed(() => this._aiWeights().linesWeight);
  readonly heightWeight    = computed(() => this._aiWeights().heightWeight);
  readonly holesWeight     = computed(() => this._aiWeights().holesWeight);
  readonly bumpinessWeight = computed(() => this._aiWeights().bumpinessWeight);

  // NEW: Track current mode for UI
  private readonly _currentMode = signal<'aggressive' | 'balanced' | 'survival'>('balanced');
  readonly currentMode = computed(() => this._currentMode());

  private readonly _showAiPanel = signal<boolean>(false);
  readonly showAiPanel = computed(() => this._showAiPanel());

  private _weights: AIWeights = { ...DEFAULT_AI_WEIGHTS };

  // ── Internal engine state ─────────────────────────────────────────────────
  private board:         number[][] = [];
  private currentX:      number     = 0;
  private currentY:      number     = 0;
  private currentPiece:  number[][] = [];
  private visualPiece:   number[][] = [];
  private currentType:   number     = 0;
  private nextPieceType: number     = 0;
  private score_:        number     = 0;
  private lines_:        number     = 0;
  private level_:        number     = 1;

  // ── Animation state ───────────────────────────────────────────────────────
  private visualY:       number     = 0;
  private visualRotation: number     = 0;
  private targetRotation: number     = 0;
  private isAnimating:   boolean    = false;
  private animationFrameId: number | null = null;
  private animationStartTime: number = 0;
  private animationStartY: number = 0;
  private animationTargetY: number = 0;
  private animationOnComplete: (() => void) | null = null;
  private pendingRotation: number = 0;

  private dropIntervalId: ReturnType<typeof setInterval> | null = null;
  private aiIntervalId:   ReturnType<typeof setInterval> | null = null;
  private aiStepInProgress = false;

  readonly PIECES: number[][][] = [
    [],
    [[1,1,1,1]],
    [[1,1],[1,1]],
    [[0,1,0],[1,1,1]],
    [[0,1,1],[1,1,0]],
    [[1,1,0],[0,1,1]],
    [[1,0,0],[1,1,1]],
    [[0,0,1],[1,1,1]],
  ];

  constructor() {
    super(
      inject(ConfigService),
      inject(BackendService),
      inject(ActivatedRoute),
      inject(SpeechService),
      PAGE_TITLE_NO_SOUND
    );

    effect(() => {
      this._weights = { ...this._aiWeights() };
    });

    effect(() => {
      if (this.gameOver()) {
        this._stopLoops();
        this._stopAnimation();
      }
    });

    afterNextRender(() => {
      this.initializeGame();
    });
  }

  ngOnInit():    void {}
  ngOnDestroy(): void { 
    this._stopLoops(); 
    this._stopAnimation();
  }

  initializeGame(): void {
    try {
      this._initBoard();
      this._spawnPiece();
      this._syncState();
      this.isReadySignal.set(true);
    } catch (err) {
      console.error('Tetris init error:', err);
      this.initializationAttempted.set(true);
    }
  }

  private _initBoard(): void {
    this.board   = Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(0));
    this.score_  = 0;
    this.lines_  = 0;
    this.level_  = 1;
  }

  private _randomPieceType(): number {
    return Math.floor(Math.random() * 7) + 1;
  }

  private _spawnPiece(): void {
    this.currentType   = this.nextPieceType || this._randomPieceType();
    this.nextPieceType = this._randomPieceType();
    const newPiece = this.PIECES[this.currentType].map(r => [...r]);
    this.currentPiece = newPiece;
    this.visualPiece = newPiece;
    this.currentX = Math.floor((BOARD_COLS - this.currentPiece[0].length) / 2);
    this.currentY = 0;
    this.visualY = 0;
    this.visualRotation = 0;
    this.targetRotation = 0;
    this.pendingRotation = 0;
    this.isAnimating = false;
  }

  // ── Public getters for template ───────────────────────────────────────────

  getPieceMatrix(type: number): number[][] {
    if (type === this.currentType && this.isAnimating && this.visualPiece) {
      return this.visualPiece;
    }
    if (type < 1 || type >= this.PIECES.length) return [];
    return this.PIECES[type] || [];
  }

  getCellSizePx(): number {
    return 22;
  }

  get currentPieceX(): number { return this.currentX; }
  get currentPieceY(): number { return this.isAnimating ? this.visualY : this.currentY; }
  get currentPieceType(): number { return this.currentType; }
  get currentPieceRotation(): number { return this.visualRotation; }
  get animating(): boolean { return this.isAnimating; }

  getRotationOrigin(): string {
    const piece = this.getPieceMatrix(this.currentPieceType);
    if (!piece.length) return 'center';
    
    const centerX = (piece[0].length * 22) / 2;
    const centerY = (piece.length * 22) / 2;
    return `${centerX}px ${centerY}px`;
  }

    // Helper methods for piece positioning
  getPieceTopPx(): number {
    const previewOffset = (!this.gameOver() && this.boardMatrix().length > 0) ? 26 : 8;
    return (this.currentPieceY * 22) + previewOffset;
  }

  getPieceLeftPx(): number {
    return (this.currentPieceX * 22) + 8;
  }
  
  // ── Animation system ─────────────────────────────────────────────────────

  private _startAnimation(fromY: number, toY: number, rotationSteps: number, onComplete: () => void): void {
    this._stopAnimation();
    
    this.animationStartY = fromY;
    this.animationTargetY = toY;
    this.animationStartTime = performance.now();
    this.animationOnComplete = onComplete;
    this.isAnimating = true;
    this.pendingRotation = rotationSteps;

    if (rotationSteps > 0) {
      this.targetRotation = this.visualRotation + (rotationSteps * 90);
    }

    const animate = (currentTime: number) => {
      const elapsed = currentTime - this.animationStartTime;
      const duration = 150;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * (2 - progress);
      
      this.visualY = this.animationStartY + (this.animationTargetY - this.animationStartY) * eased;
      
      if (this.pendingRotation > 0) {
        const rotationProgress = Math.min(progress * 1.5, 1);
        const rotationEased = rotationProgress * (2 - rotationProgress);
        const startRot = this.targetRotation - (this.pendingRotation * 90);
        this.visualRotation = startRot + (this.pendingRotation * 90 * rotationEased);
      }

      this._syncState();

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.animationFrameId = null;
        this.isAnimating = false;
        this.visualY = toY;
        this.visualRotation = this.targetRotation;
        this.pendingRotation = 0;
        this._syncState();
        this.animationOnComplete?.();
        this.animationOnComplete = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  private _stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isAnimating = false;
    this.animationOnComplete = null;
  }

  // ── Game logic ────────────────────────────────────────────────────────────

  private _syncState(): void {
    const visual = this.board.map(r => [...r]);
    
    this._state.set({
      boardMatrix: visual,
      score:       this.score_,
      lines:       this.lines_,
      level:       this.level_,
      nextPiece:   this.nextPieceType,
      gameOver:    this._checkGameOver(),
    });
  }

  private _checkGameOver(): boolean {
    return !this._canPlace(this.currentPiece, this.currentX, this.currentY);
  }

  private _canPlace(piece: number[][], x: number, y: number): boolean {
    for (let py = 0; py < piece.length; py++) {
      for (let px = 0; px < piece[py].length; px++) {
        if (!piece[py][px]) continue;
        const bx = x + px;
        const by = y + py;
        if (bx < 0 || bx >= BOARD_COLS || by >= BOARD_ROWS) return false;
        if (by >= 0 && this.board[by][bx])                   return false;
      }
    }
    return true;
  }

  private _tryMoveDown(): void {
    if (this.isAnimating) return;

    if (this._canPlace(this.currentPiece, this.currentX, this.currentY + 1)) {
      const fromY = this.currentY;
      const toY = this.currentY + 1;
      
      this._startAnimation(fromY, toY, 0, () => {
        this.currentY = toY;
        this._syncState();
      });
    } else {
      this._lockPiece();
    }
  }

  private _lockPiece(): void {
    while (this.pendingRotation > 0) {
      this.currentPiece = this._rotatePiece(this.currentPiece);
      this.pendingRotation--;
    }
    this.visualPiece = this.currentPiece.map(r => [...r]);
    this.visualRotation = 0;
    this.targetRotation = 0;

    for (let py = 0; py < this.currentPiece.length; py++) {
      for (let px = 0; px < this.currentPiece[py].length; px++) {
        if (this.currentPiece[py][px]) {
          const bx = this.currentX + px;
          const by = this.currentY + py;
          if (by >= 0 && by < BOARD_ROWS && bx >= 0 && bx < BOARD_COLS) {
            this.board[by][bx] = this.currentType;
          }
        }
      }
    }
    this._clearLines();
    this._spawnPiece();
    this._syncState();
  }

  private _clearLines(): void {
    let cleared = 0;
    for (let y = BOARD_ROWS - 1; y >= 0; y--) {
      if (this.board[y].every(c => c !== 0)) {
        this.board.splice(y, 1);
        this.board.unshift(Array(BOARD_COLS).fill(0));
        cleared++;
        y++;
      }
    }
    if (cleared > 0) {
      const pts = [0, 100, 300, 500, 800][Math.min(cleared, 4)] * this.level_;
      this.score_ += pts;
      this.lines_ += cleared;
      this.level_  = Math.floor(this.lines_ / 10) + 1;
    }
  }

  private _rotatePiece(piece: number[][]): number[][] {
    const rows    = piece.length;
    const cols    = piece[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        rotated[c][rows - 1 - r] = piece[r][c];
      }
    }
    return rotated;
  }

  private _tryRotate(): void {
    if (this.isAnimating) {
      this.pendingRotation++;
      return;
    }

    const rotated = this._rotatePiece(this.currentPiece);
    
    for (const dx of [0, -1, 1, -2, 2]) {
      if (this._canPlace(rotated, this.currentX + dx, this.currentY)) {
        this.currentPiece = rotated;
        this.visualPiece = rotated.map(r => [...r]);
        
        this._startAnimation(this.currentY, this.currentY, 1, () => {
          this.currentX += dx;
          this.visualRotation = 0;
          this.targetRotation = 0;
          this._syncState();
        });
        return;
      }
    }
  }

  private _hardDrop(): void {
    if (this.isAnimating) return;

    let targetY = this.currentY;
    while (this._canPlace(this.currentPiece, this.currentX, targetY + 1)) {
      targetY++;
    }
    
    if (targetY === this.currentY) {
      this._lockPiece();
      return;
    }

    this._startAnimation(this.currentY, targetY, this.pendingRotation, () => {
      while (this.pendingRotation > 0) {
        this.currentPiece = this._rotatePiece(this.currentPiece);
        this.pendingRotation--;
      }
      this.visualPiece = this.currentPiece.map(r => [...r]);
      this.currentY = targetY;
      this.visualRotation = 0;
      this._lockPiece();
    });
  }

  // ── Input handling ────────────────────────────────────────────────────────

  @HostListener('window:keydown', ['$event'])
  handleKey(e: KeyboardEvent): void {
    if (!this.isGameReady() || this.gameOver()) return;
    if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(e.key)) {
      e.preventDefault();
    }
    
    if (this.isAnimating && e.key !== 'ArrowUp') return;

    switch (e.key) {
      case 'ArrowLeft':
        if (this._canPlace(this.currentPiece, this.currentX - 1, this.currentY)) {
          this.currentX--; this._syncState();
        }
        break;
      case 'ArrowRight':
        if (this._canPlace(this.currentPiece, this.currentX + 1, this.currentY)) {
          this.currentX++; this._syncState();
        }
        break;
      case 'ArrowDown':
        this._tryMoveDown();
        break;
      case 'ArrowUp':
        this._tryRotate();
        break;
      case ' ':
        this._hardDrop();
        break;
    }
  }

  // ── Public actions ────────────────────────────────────────────────────────

  reset(): void {
    this._stopLoops();
    this._stopAnimation();
    this._initBoard();
    this._spawnPiece();
    this._syncState();
  }

  toggleAutoPlay(): void {
    if (this.tetrisService.isAutoPlaying()) {
      this._stopLoops();
      this.tetrisService.stopAutoPlay();
    } else {
      if (this.gameOver()) this.reset();
      this.tetrisService.startAutoPlay();
      this._startLoops();
    }
  }

  step(): void {
    if (this.gameOver() || this.isAnimating) return;
    this._runAIStep();
    this._syncState();
  }

  getPieceName(type: number): string {
    return PIECE_NAMES[type] ?? '?';
  }

  // ── Weight setters ─────────────────────────────────────────────────────────

  setLinesWeight(v: number):     void { this._aiWeights.update(w => ({ ...w, linesWeight:     v })); }
  setHeightWeight(v: number):    void { this._aiWeights.update(w => ({ ...w, heightWeight:    v })); }
  setHolesWeight(v: number):     void { this._aiWeights.update(w => ({ ...w, holesWeight:     v })); }
  setBumpinessWeight(v: number): void { this._aiWeights.update(w => ({ ...w, bumpinessWeight: v })); }

  // NEW: Mode switching methods
  loadAggressiveWeights(): void {
    this._aiWeights.set({ ...AGGRESSIVE_AI_WEIGHTS });
    this._currentMode.set('aggressive');
    console.log('Mode: AGGRESSIVE - High score, high risk');
  }

  loadBalancedWeights(): void {
    this._aiWeights.set({ ...BALANCED_AI_WEIGHTS });
    this._currentMode.set('balanced');
    console.log('Mode: BALANCED - Moderate survival');
  }

  loadSurvivalWeights(): void {
    this._aiWeights.set({ ...SURVIVAL_AI_WEIGHTS });
    this._currentMode.set('survival');
    console.log('Mode: SURVIVAL - Maximum longevity');
  }

  updateAIWeights(): void {
    console.log('AI weights active:', this._weights);
  }

  loadAIWeights(): void {
    this._aiWeights.set({ ...DEFAULT_AI_WEIGHTS });
    this._currentMode.set('balanced');
  }

  trainAI(): void {
    console.log('Training not implemented in this build.');
  }

  // ── Game loops ────────────────────────────────────────────────────────────

  private _startLoops(): void {
    this._stopLoops();

    const dropMs = Math.max(80, 800 - (this.level_ - 1) * 70);
    this.dropIntervalId = setInterval(() => {
      if (this.gameOver()) return;
      this._tryMoveDown();
    }, dropMs);

    this.aiIntervalId = setInterval(() => {
      if (this.gameOver() || this.aiStepInProgress || this.isAnimating) return;
      this.aiStepInProgress = true;
      try {
        this._runAIStep();
      } finally {
        this.aiStepInProgress = false;
      }
    }, 120);
  }

  private _stopLoops(): void {
    if (this.dropIntervalId !== null) {
      clearInterval(this.dropIntervalId);
      this.dropIntervalId = null;
    }
    if (this.aiIntervalId !== null) {
      clearInterval(this.aiIntervalId);
      this.aiIntervalId = null;
    }
    this.aiStepInProgress = false;
  }

  private _runAIStep(): void {
    const best = this._findBestPlacement();
    if (!best) return;

    if (this.currentX < best.targetX) {
      if (this._canPlace(this.currentPiece, this.currentX + 1, this.currentY)) this.currentX++;
    } else if (this.currentX > best.targetX) {
      if (this._canPlace(this.currentPiece, this.currentX - 1, this.currentY)) this.currentX--;
    }

    if (best.rotationsLeft > 0) {
      this._tryRotate();
      best.rotationsLeft--;
    }

    if (this.currentX === best.targetX && best.rotationsLeft === 0) {
      this._hardDrop();
    }
    
    this._syncState();
  }

  private _findBestPlacement(): { targetX: number; rotationsLeft: number } | null {
    let bestScore      = -Infinity;
    let bestX          = this.currentX;
    let bestRotations  = 0;

    let piece = this.currentPiece.map(r => [...r]);

    for (let rot = 0; rot < 4; rot++) {
      const cols = piece[0].length;
      for (let x = -1; x <= BOARD_COLS - cols + 1; x++) {
        let y = 0;
        while (this._canPlace(piece, x, y + 1)) y++;
        if (!this._canPlace(piece, x, y)) continue;

        const simBoard = this.board.map(r => [...r]);
        for (let py = 0; py < piece.length; py++) {
          for (let px = 0; px < piece[py].length; px++) {
            if (piece[py][px]) {
              const bx = x + px;
              const by = y + py;
              if (by >= 0 && by < BOARD_ROWS && bx >= 0 && bx < BOARD_COLS) {
                simBoard[by][bx] = 1;
              }
            }
          }
        }

        const s = this._evaluateBoard(simBoard);
        if (s > bestScore) {
          bestScore    = s;
          bestX        = x;
          bestRotations = rot;
        }
      }
      piece = this._rotatePiece(piece);
    }

    return { targetX: bestX, rotationsLeft: bestRotations };
  }

  private _evaluateBoard(board: number[][]): number {
    const w = this._weights;

    let linesCleared = 0;
    for (const row of board) {
      if (row.every(c => c !== 0)) linesCleared++;
    }

    const heights = Array(BOARD_COLS).fill(0);
    for (let x = 0; x < BOARD_COLS; x++) {
      for (let y = 0; y < BOARD_ROWS; y++) {
        if (board[y][x]) { heights[x] = BOARD_ROWS - y; break; }
      }
    }
    const aggregateHeight = heights.reduce((a, b) => a + b, 0);

    let holes = 0;
    for (let x = 0; x < BOARD_COLS; x++) {
      let filled = false;
      for (let y = 0; y < BOARD_ROWS; y++) {
        if (board[y][x])  filled = true;
        else if (filled)  holes++;
      }
    }

    let bumpiness = 0;
    for (let x = 0; x < BOARD_COLS - 1; x++) {
      bumpiness += Math.abs(heights[x] - heights[x + 1]);
    }

    return (
      w.linesWeight     * linesCleared   +
      w.heightWeight    * aggregateHeight +
      w.holesWeight     * holes           +
      w.bumpinessWeight * bumpiness
    );
  }

  toggleAiPanel(): void {
    this._showAiPanel.update(v => !v);
  }
}