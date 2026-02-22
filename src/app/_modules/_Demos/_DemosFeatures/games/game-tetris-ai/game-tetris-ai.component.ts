import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  inject,           // v21 work: functional inject() replaces constructor parameter injection
  signal,           // v21 work: signal() for reactive state primitives
  computed,         // v21 work: computed() for derived reactive state
  effect,           // v21 work: effect() for reactive side effects
  afterNextRender   // v21 work: afterNextRender() replaces ngAfterViewInit timing hacks
} from '@angular/core';
import { ActivatedRoute }         from '@angular/router';
import { BackendService }         from 'src/app/_services/BackendService/backend.service';
import { SpeechService }          from 'src/app/_services/__Utils/SpeechService/speech.service';
import { BaseReferenceComponent } from 'src/app/_components/base-reference/base-reference.component';
import { ConfigService }          from 'src/app/_services/__Utils/ConfigService/config.service';
import { PAGE_TITLE_NO_SOUND }    from 'src/app/_models/common';
import { TetrisService }          from 'src/app/_services/__Games/TetrisService/tetris.service';

// ============================================================
// INTERFACES
// ============================================================

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

// ============================================================
// CONSTANTS
// ============================================================

// Piece names indexed 1-7 to match cell colour classes
const PIECE_NAMES: Record<number, string> = {
  1: 'I', 2: 'O', 3: 'T', 4: 'S', 5: 'Z', 6: 'J', 7: 'L'
};

const BOARD_COLS = 10;
const BOARD_ROWS = 20;

// BUG FIX: heightWeight was 0 in the original — height was never penalised.
// This caused the AI to happily stack to the ceiling.  On lucky runs it scored
// millions (many clears before ceiling hit).  On unlucky runs it died in the
// first few pieces (ceiling hit immediately with no recovery).
// Setting it to -0.51 gives the AI a strong reason to keep the board flat.
const DEFAULT_AI_WEIGHTS: AIWeights = {
  linesWeight:     0.76,
  heightWeight:    -0.51,  // BUG FIX: was 0 → height never penalised
  holesWeight:     -0.36,
  bumpinessWeight: -0.18,
};

@Component({
  selector:    'app-game-tetris',
  templateUrl: './game-tetris-ai.component.html',
  styleUrl:    './game-tetris-ai.component.css',
  standalone:  false  // v21 work: standalone: false — belongs to an NgModule
})
export class GameTetrisAIComponent extends BaseReferenceComponent implements OnInit, OnDestroy {

  // v21 work: inject() functional DI replaces constructor parameter declarations
  readonly tetrisService = inject(TetrisService);

  // ============================================================
  // v21 work: REACTIVE STATE SIGNALS
  // All mutable UI-visible state is held in signals so the template
  // reacts automatically without manual markForCheck() calls.
  // ============================================================

  // v21 work: signal() — readiness gate; replaces a plain boolean field
  private readonly isReadySignal         = signal<boolean>(false);
  // v21 work: signal() — tracks user retry attempts for the error message
  readonly          initializationAttempted = signal<boolean>(false);

  // v21 work: computed() — readonly public view consumed by the template @if
  readonly isGameReady = computed(() => this.isReadySignal());

  // v21 work: signal() — entire game state as one immutable reactive snapshot.
  // Replacing ad-hoc mutation of a plain `state` property with a signal means
  // the template always sees a consistent object and Angular's change detection
  // is triggered on every logical frame rather than on every micro-mutation.
  private readonly stateSignal = signal<TetrisState>({
    boardMatrix: [],
    score:       0,
    lines:       0,
    level:       1,
    nextPiece:   0,
    gameOver:    false,
  });

  // v21 work: computed() signals — clean individual bindings for the template
  readonly boardMatrix = computed(() => this.stateSignal().boardMatrix);
  readonly score       = computed(() => this.stateSignal().score);
  readonly lines       = computed(() => this.stateSignal().lines);
  readonly level       = computed(() => this.stateSignal().level);
  readonly nextPiece   = computed(() => this.stateSignal().nextPiece);
  readonly gameOver    = computed(() => this.stateSignal().gameOver);

  // v21 work: signal() — AI weights as a single reactive config object
  readonly aiWeightsSignal = signal<AIWeights>({ ...DEFAULT_AI_WEIGHTS });

  // v21 work: computed() — individual accessors for the template weight inputs
  readonly linesWeight     = computed(() => this.aiWeightsSignal().linesWeight);
  readonly heightWeight    = computed(() => this.aiWeightsSignal().heightWeight);
  readonly holesWeight     = computed(() => this.aiWeightsSignal().holesWeight);
  readonly bumpinessWeight = computed(() => this.aiWeightsSignal().bumpinessWeight);

  // Plain copy of weights for the AI hot-path (avoids signal() call per frame)
  // v21 work: effect() keeps this in sync whenever aiWeightsSignal changes
  private _weights: AIWeights = { ...DEFAULT_AI_WEIGHTS };

  // ── Internal engine state — intentionally outside Angular reactivity ───────
  private board:         number[][] = [];
  private currentX:      number     = 0;
  private currentY:      number     = 0;
  private currentPiece:  number[][] = [];
  private currentType:   number     = 0;
  private nextPieceType: number     = 0;
  private score_:        number     = 0;
  private lines_:        number     = 0;
  private level_:        number     = 1;

  // BUG FIX: two separate interval handles so stopping auto-play doesn't
  // leave a rogue drop timer still running (original used a single interval
  // that both dropped and ran the AI — impossible to stop cleanly).
  private dropIntervalId: ReturnType<typeof setInterval> | null = null;
  private aiIntervalId:   ReturnType<typeof setInterval> | null = null;

  // BUG FIX: re-entrancy guard — prevents overlapping AI steps when the
  // AI interval fires while a previous step hasn't resolved yet.
  // This was a primary cause of the "million points" runaway bug.
  private aiStepInProgress = false;

  // ── Tetromino definitions ─────────────────────────────────────────────────
  // Stored as 2-D 0/1 matrices indexed 1-7.
  // BUG FIX: pieces now use proper matrix layout so _rotatePiece() (transpose
  // + reverse) always produces geometrically correct results for every shape.
  // The original rotation used a centre-point formula that gave wrong results
  // for I, S, Z pieces causing them to teleport to invalid positions.
  private readonly PIECES: number[][][] = [
    [],                           // 0 — unused
    [[1,1,1,1]],                  // 1 I
    [[1,1],[1,1]],                // 2 O
    [[0,1,0],[1,1,1]],            // 3 T
    [[0,1,1],[1,1,0]],            // 4 S
    [[1,1,0],[0,1,1]],            // 5 Z
    [[1,0,0],[1,1,1]],            // 6 J
    [[0,0,1],[1,1,1]],            // 7 L
  ];

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor() {
    // v21 work: inject() inside super() — all DI via functional inject()
    super(
      inject(ConfigService),
      inject(BackendService),
      inject(ActivatedRoute),
      inject(SpeechService),
      PAGE_TITLE_NO_SOUND
    );

    // v21 work: effect() — keeps the plain _weights copy in sync with the signal
    // so the AI evaluation hot-path reads a plain object (no signal() overhead)
    effect(() => {
      this._weights = { ...this.aiWeightsSignal() };
    });

    // v21 work: effect() — reacts to gameOver computed signal to auto-stop loops
    // Replaces an imperative check scattered through multiple methods
    effect(() => {
      if (this.gameOver()) {
        this._stopLoops();
      }
    });

    // v21 work: afterNextRender() — guaranteed to fire after the first DOM render;
    // replaces ngAfterViewInit + setTimeout(0) pattern; SSR-safe
    afterNextRender(() => {
      this.initializeGame();
    });
  }

  ngOnInit():    void {}
  ngOnDestroy(): void { this._stopLoops(); }

  // ============================================================
  // INITIALISATION
  // ============================================================

  initializeGame(): void {
    try {
      this._initBoard();
      this._spawnPiece();
      this._syncState();
      // v21 work: signal.set() — template @if reacts automatically
      this.isReadySignal.set(true);
    } catch (err) {
      console.error('Tetris init error:', err);
      // v21 work: signal.set() — triggers the error block in the template
      this.initializationAttempted.set(true);
    }
  }

  // ============================================================
  // BOARD HELPERS
  // ============================================================

  private _initBoard(): void {
    this.board   = Array.from({ length: BOARD_ROWS }, () => Array(BOARD_COLS).fill(0));
    this.score_  = 0;
    this.lines_  = 0;
    this.level_  = 1;
  }

  private _randomPieceType(): number {
    return Math.floor(Math.random() * 7) + 1;  // 1–7
  }

  private _spawnPiece(): void {
    this.currentType   = this.nextPieceType || this._randomPieceType();
    this.nextPieceType = this._randomPieceType();
    this.currentPiece  = this.PIECES[this.currentType].map(r => [...r]);

    // BUG FIX: spawn X is now clamped so wide pieces (I) never spawn partially
    // outside the board — the original spawn could create an out-of-bounds X
    // which immediately failed _canPlace() and triggered a false game-over.
    this.currentX = Math.floor((BOARD_COLS - this.currentPiece[0].length) / 2);
    this.currentY = 0;
  }

  // ============================================================
  // STATE SYNC
  // v21 work: _syncState() builds an immutable snapshot and calls signal.set()
  // instead of mutating a plain `state` object field in-place.
  // ============================================================
  private _syncState(): void {
    const visual = this._buildVisualBoard();
    // v21 work: signal.set() with a new object — immutable update pattern
    this.stateSignal.set({
      boardMatrix: visual,
      score:       this.score_,
      lines:       this.lines_,
      level:       this.level_,
      nextPiece:   this.nextPieceType,
      gameOver:    this._checkGameOver(),
    });
  }

  // Overlay the falling piece onto the locked board for rendering
  private _buildVisualBoard(): number[][] {
    const visual = this.board.map(r => [...r]);
    for (let py = 0; py < this.currentPiece.length; py++) {
      for (let px = 0; px < this.currentPiece[py].length; px++) {
        if (this.currentPiece[py][px]) {
          const bx = this.currentX + px;
          const by = this.currentY + py;
          if (by >= 0 && by < BOARD_ROWS && bx >= 0 && bx < BOARD_COLS) {
            visual[by][bx] = this.currentType;
          }
        }
      }
    }
    return visual;
  }

  private _checkGameOver(): boolean {
    // Game over when the freshly-spawned piece cannot be placed at row 0
    return !this._canPlace(this.currentPiece, this.currentX, this.currentY);
  }

  // ============================================================
  // COLLISION
  // ============================================================

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

  // ============================================================
  // MOVEMENT
  // ============================================================

  private _moveDown(): void {
    if (this._canPlace(this.currentPiece, this.currentX, this.currentY + 1)) {
      this.currentY++;
    } else {
      this._lockPiece();
    }
  }

  private _lockPiece(): void {
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
  }

  private _clearLines(): void {
    // BUG FIX: iterate bottom-to-top with y++ after splice so every row is
    // examined exactly once.  Original loop used a separate `linesCleared++`
    // inside a forward scan and then applied y++ correction, which caused some
    // full rows to be skipped on back-to-back clears (Tetris / triple).
    let cleared = 0;
    for (let y = BOARD_ROWS - 1; y >= 0; y--) {
      if (this.board[y].every(c => c !== 0)) {
        this.board.splice(y, 1);
        this.board.unshift(Array(BOARD_COLS).fill(0));
        cleared++;
        y++; // re-examine the same index after the splice
      }
    }
    if (cleared > 0) {
      // Standard Tetris scoring table (×level)
      const pts = [0, 100, 300, 500, 800][Math.min(cleared, 4)] * this.level_;
      this.score_ += pts;
      this.lines_ += cleared;
      this.level_  = Math.floor(this.lines_ / 10) + 1;
    }
  }

  // BUG FIX: rotation now uses the standard 2-D matrix transpose + column
  // reverse algorithm, which is geometrically correct for every piece shape.
  // The original used a centre-point formula (rotate around pieces[1]) that
  // produced wrong coordinates for asymmetric pieces (J, L, S, Z, I),
  // occasionally placing them outside the board and confusing the AI.
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

  // Wall-kick: try the rotation, then nudge ±1, ±2 columns if blocked
  private _tryRotate(): void {
    const rotated = this._rotatePiece(this.currentPiece);
    for (const dx of [0, -1, 1, -2, 2]) {
      if (this._canPlace(rotated, this.currentX + dx, this.currentY)) {
        this.currentPiece = rotated;
        this.currentX    += dx;
        return;
      }
    }
    // Rotation blocked — do nothing (no state change)
  }

  private _hardDrop(): void {
    while (this._canPlace(this.currentPiece, this.currentX, this.currentY + 1)) {
      this.currentY++;
    }
    this._lockPiece();
  }

  // ============================================================
  // KEYBOARD SUPPORT
  // ============================================================

  @HostListener('window:keydown', ['$event'])
  handleKey(e: KeyboardEvent): void {
    if (!this.isGameReady() || this.gameOver()) return;
    if (['ArrowLeft','ArrowRight','ArrowDown','ArrowUp',' '].includes(e.key)) {
      e.preventDefault();
    }
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
        this._moveDown(); this._syncState();
        break;
      case 'ArrowUp':
        this._tryRotate(); this._syncState();
        break;
      case ' ':
        this._hardDrop(); this._syncState();
        break;
    }
  }

  // ============================================================
  // PUBLIC TEMPLATE ACTIONS
  // ============================================================

  reset(): void {
    this._stopLoops();
    this._initBoard();
    this._spawnPiece();
    this._syncState();
  }

  toggleAutoPlay(): void {
    if (this.tetrisService.isAutoPlaying()) {
      this._stopLoops();
      this.tetrisService.stopAutoPlay();
    } else {
      // BUG FIX: always reset if the board is in a game-over state before
      // starting — original could start loops on a dead board
      if (this.gameOver()) this.reset();
      this.tetrisService.startAutoPlay();
      this._startLoops();
    }
  }

  step(): void {
    if (this.gameOver()) return;
    this._runAIStep();
    this._syncState();
  }

  getPieceName(type: number): string {
    return PIECE_NAMES[type] ?? '?';
  }

  // ============================================================
  // AI WEIGHT CONTROLS
  // v21 work: each setter uses signal.update() with spread — immutable patch
  // ============================================================

  setLinesWeight(v: number):     void { this.aiWeightsSignal.update(w => ({ ...w, linesWeight:     v })); }
  setHeightWeight(v: number):    void { this.aiWeightsSignal.update(w => ({ ...w, heightWeight:    v })); }
  setHolesWeight(v: number):     void { this.aiWeightsSignal.update(w => ({ ...w, holesWeight:     v })); }
  setBumpinessWeight(v: number): void { this.aiWeightsSignal.update(w => ({ ...w, bumpinessWeight: v })); }

  updateAIWeights(): void {
    // _weights is already live via effect() — log for confirmation
    console.log('AI weights active:', this._weights);
  }

  loadAIWeights(): void {
    // v21 work: signal.set() resets weights to defaults
    this.aiWeightsSignal.set({ ...DEFAULT_AI_WEIGHTS });
  }

  trainAI(): void {
    console.log('Training not implemented in this build.');
  }

  // ============================================================
  // GAME LOOPS
  // ============================================================

  private _startLoops(): void {
    this._stopLoops();

    // BUG FIX: gravity and AI are now on SEPARATE intervals.
    // Original had a single interval that both dropped the piece AND ran the AI.
    // When pieces settled rapidly (high level / AI hard-drops), the combined
    // interval fired multiple full AI evaluations per piece, causing:
    //   (a) correct runs: AI placed pieces perfectly → million-point scores
    //   (b) bad runs: AI evaluated stale state mid-drop → misplaced pieces → early death

    // Gravity — speeds up with level
    const dropMs = Math.max(80, 800 - (this.level_ - 1) * 70);
    this.dropIntervalId = setInterval(() => {
      if (this.gameOver()) return;
      this._moveDown();
      this._syncState();
    }, dropMs);

    // AI decision tick — independent of gravity speed
    // BUG FIX: aiStepInProgress prevents re-entrant calls
    this.aiIntervalId = setInterval(() => {
      if (this.gameOver() || this.aiStepInProgress) return;
      this.aiStepInProgress = true;
      try {
        this._runAIStep();
        this._syncState();
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

  // ============================================================
  // AI ENGINE
  // ============================================================

  // BUG FIX: _runAIStep() no longer tries to move just one column per tick.
  // The original greedy one-step approach meant the AI couldn't reach the
  // target column before the piece naturally dropped, leading it to lock
  // pieces in suboptimal positions → holes → early game over.
  // Now: find best placement globally, move toward it, hard-drop when aligned.
  private _runAIStep(): void {
    const best = this._findBestPlacement();
    if (!best) return;

    // Move one column toward target per AI tick (keeps animation smooth)
    if (this.currentX < best.targetX) {
      if (this._canPlace(this.currentPiece, this.currentX + 1, this.currentY)) this.currentX++;
    } else if (this.currentX > best.targetX) {
      if (this._canPlace(this.currentPiece, this.currentX - 1, this.currentY)) this.currentX--;
    }

    // Apply one rotation step per AI tick
    if (best.rotationsLeft > 0) {
      this._tryRotate();
      best.rotationsLeft--;
    }

    // Once aligned in both column and rotation → hard-drop
    if (this.currentX === best.targetX && best.rotationsLeft === 0) {
      this._hardDrop();
    }
  }

  // Evaluates all rotations × all columns and returns the globally best placement
  private _findBestPlacement(): { targetX: number; rotationsLeft: number } | null {
    let bestScore      = -Infinity;
    let bestX          = this.currentX;
    let bestRotations  = 0;

    let piece = this.currentPiece.map(r => [...r]);

    for (let rot = 0; rot < 4; rot++) {
      const cols = piece[0].length;
      for (let x = -1; x <= BOARD_COLS - cols + 1; x++) {
        // Simulate gravity: find the lowest Y this piece can occupy
        let y = 0;
        while (this._canPlace(piece, x, y + 1)) y++;
        if (!this._canPlace(piece, x, y)) continue;

        // Build a simulated board with this piece locked in
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

  // Heuristic board evaluation used by _findBestPlacement()
  private _evaluateBoard(board: number[][]): number {
    const w = this._weights;

    // Count complete lines in the simulated board
    let linesCleared = 0;
    for (const row of board) {
      if (row.every(c => c !== 0)) linesCleared++;
    }

    // Per-column heights
    const heights = Array(BOARD_COLS).fill(0);
    for (let x = 0; x < BOARD_COLS; x++) {
      for (let y = 0; y < BOARD_ROWS; y++) {
        if (board[y][x]) { heights[x] = BOARD_ROWS - y; break; }
      }
    }
    const aggregateHeight = heights.reduce((a, b) => a + b, 0);

    // Holes: empty cells with at least one filled cell above them
    let holes = 0;
    for (let x = 0; x < BOARD_COLS; x++) {
      let filled = false;
      for (let y = 0; y < BOARD_ROWS; y++) {
        if (board[y][x])  filled = true;
        else if (filled)  holes++;
      }
    }

    // Bumpiness: sum of absolute height differences between adjacent columns
    let bumpiness = 0;
    for (let x = 0; x < BOARD_COLS - 1; x++) {
      bumpiness += Math.abs(heights[x] - heights[x + 1]);
    }

    // BUG FIX: heightWeight is now -0.51 (not 0), so this term actually
    // penalises a tall board.  Without this penalty the AI ignored height
    // entirely and could build a 20-row stack before the first clear.
    return (
      w.linesWeight     * linesCleared   +
      w.heightWeight    * aggregateHeight +
      w.holesWeight     * holes           +
      w.bumpinessWeight * bumpiness
    );
  }
}