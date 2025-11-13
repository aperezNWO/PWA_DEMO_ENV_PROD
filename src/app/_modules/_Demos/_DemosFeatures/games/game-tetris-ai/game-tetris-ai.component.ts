import { ChangeDetectorRef, Component, ElementRef, OnInit, signal, ViewChild                         } from '@angular/core';
import { ActivatedRoute                            } from '@angular/router';
import { BaseComponent                             } from 'src/app/_components/base/base.component';
import { BackendService                            } from 'src/app/_services/BackendService/backend.service';
import { ConfigService                             } from 'src/app/_services/ConfigService/config.service';
import { SpeechService                             } from 'src/app/_services/speechService/speech.service';
import { PAGE_GAMES_TETRIS_AI                      } from 'src/app/_models/common';
import { HttpClient                                } from '@angular/common/http';
import { interval, Observable, Subscription        } from 'rxjs';

export interface TetrisState {
  board: number[];
  score: number;
  lines: number;
  level: number;
  nextPiece: number;
  gameOver: boolean;
}


@Component({
  selector: 'app-game-tetris-ai',
  templateUrl: './game-tetris-ai.component.html',
  styleUrl: './game-tetris-ai.component.css'
})
export class GameTetrisAIComponent  extends BaseComponent implements OnInit {
  
  private apiUrl = 'http://localhost:83/api/tetris';
  
  state: TetrisState | null = null;
  public autoPlaySub?: Subscription;

  constructor(    private http: HttpClient, 
                  private cd: ChangeDetectorRef,
                  public  override configService    : ConfigService,
                  public  override route            : ActivatedRoute,
                  public  override speechService    : SpeechService,
                  public  override backendService   : BackendService,) 
  { 
      //
      super(configService,
            backendService,
            route,
            speechService,
            PAGE_GAMES_TETRIS_AI
      )
  }
  
  ngOnInit() {
    this.loadState();
  }

  getState(): Observable<TetrisState> {
    return this.http.get<TetrisState>(`${this.apiUrl}/state`);
  }

  service_step(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/step`, {});
  }

  service_reset(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset`, {});
  }

  loadModel(filename: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/load-model`, filename);
  }
  

  ngOnDestroy() {
    this.autoPlaySub?.unsubscribe();
  }

  loadState() {
    this.getState().subscribe(data => this.state = data);
  }

  step() {
    this.service_step().subscribe(() => this.loadState());
  }

  reset() {
    this.service_reset().subscribe(() => this.loadState());
  }

  toggleAutoPlay() {
    if (this.autoPlaySub) {
      this.autoPlaySub.unsubscribe();
      this.autoPlaySub = undefined;
    } else {
      this.autoPlaySub = interval(300).subscribe(() => {
        if (this.state && !this.state.gameOver) {
          this.step();
        }
      });
    }
  }

  getBoardMatrix(): number[][] {
    if (!this.state) return [];
    const matrix: number[][] = [];
    for (let i = 0; i < 20; i++) {
      matrix.push(this.state.board.slice(i * 10, (i + 1) * 10));
    }
    return matrix;
  }

  getCellStyle(value: number): any {
    const colors = ['', '#00ffff', '#ffff00', '#ff00ff', '#00ff00', '#ff0000', '#0000ff', '#ff8800'];
    return value ? { 'background-color': colors[value] } : {};
  }
}  
