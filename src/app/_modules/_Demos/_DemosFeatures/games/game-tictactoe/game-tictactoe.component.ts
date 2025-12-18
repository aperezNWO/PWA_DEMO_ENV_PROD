import { Component         } from '@angular/core';
import { ActivatedRoute    } from '@angular/router';
import { BaseComponent     } from 'src/app/_components/base/base.component';
import { BackendService    } from 'src/app/_services/BackendService/backend.service';
import { SpeechService     } from 'src/app/_services/SpeechService/speech.service';
import { ConfigService     } from 'src/app/_services/ConfigService/config.service';
import { PAGE_GAMES_TIC_TAC_TOE } from 'src/app/_models/common';

@Component({  
  selector: 'app-game-tictactoe',
  templateUrl: './game-tictactoe.component.html',
  styleUrls: ['./game-tictactoe.component.css']
})
export class GameTictactoeComponent extends BaseComponent {
  //
  constructor(
                  public  override configService    : ConfigService,
                  public  override route            : ActivatedRoute,
                  public  override speechService    : SpeechService,
                  public  override sudokuService   : BackendService) 
  { 
      //
      super(configService,
            sudokuService,
            route,
            speechService,
            PAGE_GAMES_TIC_TAC_TOE,
      )
  }
}
