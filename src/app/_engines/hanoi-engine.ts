import { Injectable, signal, computed, inject, resource, ResourceRef } from "@angular/core";
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from "rxjs";
import { ListItem } from "src/app/_models/entity.model";

/**
 * Angular v21 Update Notes:
 * - Replaced BehaviorSubject with Signals for better zoneless compatibility
 * - Added rxjs-interop imports for Observable compatibility
 * - Using computed() for derived state
 * - Resource API available for async operations (experimental in v21)
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
    // Angular v21: Migrated from BehaviorSubject to Signals
    // Signals provide better performance in zoneless change detection
    //////////////////////////////////////////////////////////////////////
    
    // Using signals for state management (v21 best practice)
    private readonly _gameState = signal<Disk[][]>([
        [{ size: 3 }, { size: 2 }, { size: 1 }],
        [],
        []
    ]);
    
    // Angular v21: Expose as Observable via rxjs-interop for backward compatibility
    // toObservable() converts signal to Observable for components using async pipe
    public readonly towers$: Observable<Disk[][]> = toObservable(this._gameState);
    
    // Angular v21: Also expose as readonly signal for modern signal-based components
    public readonly towers = this._gameState.asReadonly();
    
    // Moves counter using signal
    private readonly _moves = signal<number>(0);
    public readonly moves$ = toObservable(this._moves);
    public readonly moves = this._moves.asReadonly();
    
    // Angular v21: Computed signal for win condition (derived state)
    public readonly isWin = computed(() => this._gameState()[2].length === 3);
    
    // Legacy properties maintained for compatibility
    public towerA: Map<number, (DiskInfo | undefined)> = new Map<number, (DiskInfo | undefined)>();
    public towerB: Map<number, (DiskInfo | undefined)> = new Map<number, (DiskInfo | undefined)>();
    public towerC: Map<number, (DiskInfo | undefined)> = new Map<number, (DiskInfo | undefined)>();
    public steps: string[] = [];
    public _steps: HanoiStep[] = [];
    public _stepsIndex: number = 0;
    public _startGame: boolean = true;
    public _delayInMilliseconds: number = 1500;
    public _stepsAmt: number = 0;
    public _diskAmt: number = 0;
    public _timeoutId: any;
    public _diskAmtList: any;
    public tituloDiskAmtList: string = "Cantidad de Discos";
    
    // Angular v21: ViewChild replaced with viewChild() signal query (if needed)
    // Keeping as any for backward compatibility
    public __diskAmtList: any;
    
    private selectedTower: (number | null) = null;

    //////////////////////////////////////////////////////////////////////
    // Angular v21: Resource API for async operations (Developer Preview)
    // Useful for HTTP requests or async game state loading
    //////////////////////////////////////////////////////////////////////
    public gameResource: ResourceRef<Disk[][]> | undefined;

    constructor() {
        this._diskAmtList = new Array();
        this._diskAmtList.push(new ListItem(0, "(seleccione opcion...)", false));
        this._diskAmtList.push(new ListItem(3, "3", true));
        this._diskAmtList.push(new ListItem(4, "4", false));
        
        // Angular v21: Example of Resource API usage (optional)
        // Useful if loading game state from backend
        /*
        this.gameResource = resource({
            loader: async () => {
                // Async loading logic here
                return this._gameState();
            }
        });
        */
    }

    manual_selectTower(towerIndex: number) {
        if (this.selectedTower === null) {
            this.selectedTower = towerIndex;
        } else {
            this.manual_moveDisk(this.selectedTower, towerIndex);
            this.selectedTower = null;
        }
    }

    /**
     * Angular v21: Using signal update methods for immutable state changes
     * update() creates new state reference triggering change detection
     */
    manual_moveDisk(fromTower: number, toTower: number) {
        const currentState = this._gameState();
        const diskToMove = currentState[fromTower].pop();

        if (diskToMove) {
            const targetTower = currentState[toTower];
            if (targetTower.length === 0 || targetTower[targetTower.length - 1].size > diskToMove.size) {
                targetTower.push(diskToMove);
                
                // Angular v21: Signal update - creates new array reference
                this._gameState.set([...currentState]);
                this._moves.update(m => m + 1);
                
                // Win condition now handled by computed signal
            } else {
                currentState[fromTower].push(diskToMove);
            }
        }
    }

    manual_resetGame() {
        // Angular v21: Signal set for complete state replacement
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
     * Angular v21: Win check maintained for template compatibility
     * Consider using the computed isWin signal in templates instead
     */
    public _checkWinCondition(): boolean {
        // Using signal value access via ()
        return this._gameState()[2].length === 3;
    }

    //////////////////////////////////////////////////////////////////////
    // Auto-play methods remain largely unchanged
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

            let n_from: number = hanoiStep.from.charCodeAt(0) - 65
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