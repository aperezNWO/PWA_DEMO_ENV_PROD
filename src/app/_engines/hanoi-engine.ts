import { Injectable, signal, computed, ResourceRef, resource } from "@angular/core";
import { ListItem } from "../_models/entity.model";

/**
 * Angular v21 - Fully Signal-Based Engine
 * 
 * Key Updates:
 * - BehaviorSubject completely replaced with Signals
 * - No RxJS needed - pure signals for state management
 * - Computed signals for derived state (isWin)
 * - Resource API available for async operations (v21 preview)
 * - Zoneless change detection optimized
 */

export class DiskInfo {
    constructor(public value: number, public graph: string) {}
}

export class HanoiStep {
    constructor(public n: number, public from: string, public to: string) {}
}

export interface Disk {
    size: number;
}

@Injectable({
    providedIn: 'root',
})
export class HanoiEngine {
    //////////////////////////////////////////////////////////////////////
    // Angular v21: Pure Signal-Based State Management
    // No BehaviorSubject or Observables - signals only
    //////////////////////////////////////////////////////////////////////
    
    /** Signal holding current game state - three towers with disks */
    private readonly _gameState = signal<Disk[][]>([
        [{ size: 3 }, { size: 2 }, { size: 1 }],
        [],
        []
    ]);
    
    /** Public readonly signal for game state - use .towers() in templates */
    public readonly towers = this._gameState.asReadonly();
    
    /** Signal for move counter */
    private readonly _moves = signal<number>(0);
    
    /** Public readonly signal for moves - use .moves() in templates */
    public readonly moves = this._moves.asReadonly();
    
    /** 
     * Angular v21: Computed signal for win condition
     * Automatically recalculates when gameState changes
     * No manual subscription or change detection needed
     */
    public readonly isWin = computed(() => this._gameState()[2].length === 3);
    
    // Legacy tower Maps for auto-solver visualization
    public towerA: Map<number, (DiskInfo | undefined)> = new Map<number, (DiskInfo | undefined)>();
    public towerB: Map<number, (DiskInfo | undefined)> = new Map<number, (DiskInfo | undefined)>();
    public towerC: Map<number, (DiskInfo | undefined)> = new Map<number, (DiskInfo | undefined)>();
    
    // Auto-solver state
    public steps: string[] = [];
    public _steps: HanoiStep[] = [];
    public _stepsIndex: number = 0;
    public _startGame: boolean = true;
    public _delayInMilliseconds: number = 1500;
    public _stepsAmt: number = 0;
    
    // RESTORED: Missing property that was accidentally removed
    public _diskAmt: number = 0;
    
    public _timeoutId: any;
    public _diskAmtList: any;
    public tituloDiskAmtList: string = "Cantidad de Discos";
    public __diskAmtList: any;
    
    private selectedTower: (number | null) = null;

    //////////////////////////////////////////////////////////////////////
    // Angular v21: Resource API for async operations (Developer Preview)
    // Useful for loading/saving game state from backend
    //////////////////////////////////////////////////////////////////////
    
    /** Example: Resource for async game state loading */
    public gameResource: ResourceRef<Disk[][]> | undefined;

    constructor() {
        this._diskAmtList = new Array();
        this._diskAmtList.push(new ListItem(0, "(seleccione opcion...)", false));
        this._diskAmtList.push(new ListItem(3, "3", true));
        this._diskAmtList.push(new ListItem(4, "4", false));
        
        // Angular v21: Resource API example - uncomment if loading from backend
        /*
        this.gameResource = resource({
            loader: async () => {
                // Replace with actual API call
                const response = await fetch('/api/game-state');
                return await response.json();
            }
        });
        */
    }

    /**
     * Handle tower selection for manual play
     * First click selects source, second click selects destination
     */
    manual_selectTower(towerIndex: number) {
        if (this.selectedTower === null) {
            this.selectedTower = towerIndex;
        } else {
            this.manual_moveDisk(this.selectedTower, towerIndex);
            this.selectedTower = null;
        }
    }

    /**
     * Angular v21: Signal updates for state changes
     * Uses update() for immutable modifications
     * Zoneless change detection automatically notifies consumers
     */
    manual_moveDisk(fromTower: number, toTower: number) {
        // Get current state (readonly snapshot)
        const currentState = this._gameState();
        
        // Create deep copy for immutable update
        const newState = currentState.map(tower => [...tower]);
        const diskToMove = newState[fromTower].pop();

        if (diskToMove) {
            const targetTower = newState[toTower];
            if (targetTower.length === 0 || targetTower[targetTower.length - 1].size > diskToMove.size) {
                // Valid move - update target tower
                targetTower.push(diskToMove);
                
                // Angular v21: Signal update triggers change detection
                this._gameState.set(newState);
                this._moves.update(m => m + 1);
                
                // Win condition automatically updated via computed signal
            } else {
                // Invalid move - restore disk
                newState[fromTower].push(diskToMove);
            }
        }
    }

    /**
     * Reset game to initial state
     * Uses signal set() for complete replacement
     */
    manual_resetGame() {
        this._gameState.set([
            [{ size: 3 }, { size: 2 }, { size: 1 }],
            [],
            []
        ]);
        this._moves.set(0);
        this.selectedTower = null;

        this.auto_newGame();
    }

    /**
     * Check win condition - maintained for template compatibility
     * Prefer using isWin computed signal in new code
     */
    public _checkWinCondition(): boolean {
        return this.isWin(); // Delegate to computed signal
    }

    //////////////////////////////////////////////////////////////////////
    // Auto-solver methods (unchanged logic, signal integration)
    //////////////////////////////////////////////////////////////////////

    auto_printSteps() {
        if (this._stepsIndex > this._stepsAmt) {
            clearTimeout(this._timeoutId);
            return;
        }

        if (this._stepsIndex == 0) {
            this.steps.push("[BEGIN STEPS]");
        }

        if (this._steps[this._stepsIndex]) {
            let scrollableElement = document.querySelector('.steps-container');
            if (scrollableElement)
                scrollableElement.scrollTop = scrollableElement.scrollHeight;

            let hanoiStep: HanoiStep = this._steps[this._stepsIndex];
            let n: number = hanoiStep.n;
            let from: string = hanoiStep.from;
            let to: string = hanoiStep.to;

            let message: string = `Step ${(this._stepsIndex + 1)} of ${this._stepsAmt}. Move disk ${n} from Tower ${from} to Tower ${to}`;
            this.steps.push(message);
            this.auto_makeMove(hanoiStep);

            let n_from: number = hanoiStep.from.charCodeAt(0) - 65;
            let n_to: number = hanoiStep.to.charCodeAt(0) - 65;

            this.manual_moveDisk(n_from, n_to);
        }

        this._stepsIndex++;

        if ((this._stepsIndex) == this._stepsAmt) {
            this.steps.push("[END STEPS]");
        }

        this._timeoutId = setTimeout(() => {
            this.auto_printSteps();
        }, this._delayInMilliseconds);
    }

    auto_makeMove(hanoiStep: HanoiStep) {
        let _n: number = hanoiStep.n;
        let _from: string = hanoiStep.from;
        let _to: string = hanoiStep.to;

        let diskInfo: DiskInfo | undefined = undefined;

        switch (_from) {
            case 'A':
                diskInfo = this.towerA.get(_n);
                this.towerA.set(_n, new DiskInfo(_n, "-"));
                break;
            case 'B':
                diskInfo = this.towerB.get(_n);
                this.towerB.set(_n, new DiskInfo(_n, "-"));
                break;
            case 'C':
                diskInfo = this.towerC.get(_n);
                this.towerC.set(_n, new DiskInfo(_n, "-"));
                break;
        }

        switch (_to) {
            case 'A':
                this.towerA.set(_n, diskInfo);
                break;
            case 'B':
                this.towerB.set(_n, diskInfo);
                break;
            case 'C':
                this.towerC.set(_n, diskInfo);
                break;
        };
    }

    auto_saveStep(n: number, from: string, to: string) {
        let hanoiStep: HanoiStep = new HanoiStep(n, from, to);
        this._steps.push(hanoiStep);
        this._stepsAmt++;
    }

    auto_towerOfHanoi(n: number, from_rod: string, to_rod: string, aux_rod: string): void {
        if (n === 0) {
            return;
        }
        this.auto_towerOfHanoi(n - 1, from_rod, aux_rod, to_rod);
        this.auto_saveStep(n, from_rod, to_rod);
        this.auto_towerOfHanoi(n - 1, aux_rod, to_rod, from_rod);
    }

    auto_newGame(): void {
        this._diskAmt = 3;

        if (this._diskAmt === 0)
            return;

        this.towerA = new Map<number, (DiskInfo | undefined)>();
        let graph: string = "";
        for (let i = 1; i <= this._diskAmt; i++) {
            graph = graph + "*";
            this.towerA.set(i, new DiskInfo(i, graph));
        }

        this.towerB = new Map<number, (DiskInfo | undefined)>();
        for (let i = 1; i <= this._diskAmt; i++) {
            this.towerB.set(i, new DiskInfo(i, "-"));
        }

        this.towerC = new Map<number, (DiskInfo | undefined)>();
        for (let i = 1; i <= this._diskAmt; i++) {
            this.towerC.set(i, new DiskInfo(i, "-"));
        }

        this.steps = [];
        this._steps = [];
        this._stepsIndex = 0;
        this._stepsAmt = 0;

        this._startGame = false;
    }

    auto_startGame(): void {
        this.auto_newGame();

        if (this._diskAmt === 0)
            return;

        this._startGame = true;
        this.auto_towerOfHanoi(this._diskAmt, 'A', 'C', 'B');
        this.auto_printSteps();
    }
}