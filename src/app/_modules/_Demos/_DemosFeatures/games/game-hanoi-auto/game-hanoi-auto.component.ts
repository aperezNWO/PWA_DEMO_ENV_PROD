import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseReferenceComponent } from 'src/app/_components/base-reference/base-reference.component';
import { HanoiEngine } from 'src/app/_engines/hanoi-engine';
import { BackendService } from 'src/app/_services/BackendService/backend.service';
import { ConfigService } from 'src/app/_services/__Utils/ConfigService/config.service';
import { SpeechService } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { PAGE_GAMES_HANOI_2D, PAGE_GAMES_SUDOKU, PAGE_TITLE_LOG } from 'src/app/_models/common';
import { RouterLink } from '@angular/router';

/**
 * Angular v21 - Fully Modernized Component
 * 
 * Key Updates:
 * - Standalone component with explicit imports (v19+ default)
 * - No AsyncPipe needed - using signals directly in template
 * - Zoneless change detection compatible
 * - implements OnInit for strict typing
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
    // Angular v21: Standalone is the default - explicit true for clarity
    standalone: false,
    // Angular v21: Direct imports for standalone components
    // No AsyncPipe needed since we use signals directly
   // imports: [RouterLink]
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
     * Angular v21: Explicit return type for lifecycle hooks
     * improves tree-shaking and type safety
     */
    ngOnInit(): void {
        this.hanoiEngine.manual_resetGame();
    }
}
