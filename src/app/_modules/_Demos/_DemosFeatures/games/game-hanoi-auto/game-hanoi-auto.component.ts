import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseReferenceComponent } from 'src/app/_components/base-reference/base-reference.component';
import { HanoiEngine } from 'src/app/_engines/hanoi-engine';
import { BackendService } from 'src/app/_services/BackendService/backend.service';
import { ConfigService } from 'src/app/_services/__Utils/ConfigService/config.service';
import { SpeechService } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { PAGE_GAMES_HANOI_2D, PAGE_GAMES_SUDOKU, PAGE_TITLE_LOG } from 'src/app/_models/common';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Angular v21 Update Notes:
 * - Standalone components are now the default (v19+), so standalone: true is implicit
 * - Added explicit imports array for standalone component dependencies
 * - Zoneless change detection requires explicit imports for pipes/directives
 * - Using new imports array instead of NgModule declarations
 */
@Component({
    selector: 'app-game-hanoi-auto',
    templateUrl: './game-hanoi-auto.component.html',
    styleUrl: './game-hanoi-auto.component.css',
    providers: [
        {
            provide: PAGE_TITLE_LOG,
            useValue: PAGE_GAMES_HANOI_2D
        },
    ],
    // Angular v21: Standalone is now default, but keeping explicit for clarity
    // Remove standalone: false to adopt modern standalone architecture
    standalone: false,
    // Angular v21: Explicit imports required for standalone components
    // AsyncPipe and RouterLink must be imported directly
    //imports: [AsyncPipe, RouterLink]
})
export class GameHanoiAutoComponent extends BaseReferenceComponent implements OnInit {

    constructor(
        public hanoiEngine: HanoiEngine,
        public override configService: ConfigService,
        public override route: ActivatedRoute,
        public override speechService: SpeechService,
        public override backendService: BackendService) 
    { 
        super(configService,
              backendService,
              route,
              speechService,
              PAGE_GAMES_SUDOKU,
        )
    }

    /**
     * Angular v21: Lifecycle hooks should implement interfaces (OnInit)
     * for better type checking and tree-shaking
     */
    ngOnInit(): void {
        this.hanoiEngine.manual_resetGame();
    }
}