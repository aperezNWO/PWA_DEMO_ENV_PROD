import { Component                      } from '@angular/core';
import { ActivatedRoute                 } from '@angular/router';
import { BaseComponent                  } from 'src/app/_components/base/base.component';
import { PAGE_ABOUT_PROGRAM_DESCRIPTION } from 'src/app/_models/common';
import { ConfigService                  } from 'src/app/_services/__Utils/ConfigService/config.service';
import { SpeechService                  } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { BackendService                 } from 'src/app/_services/BackendService/backend.service';

@Component({
  selector: 'app-program-description',
  templateUrl: './program-description.component.html',
  styleUrl: './program-description.component.css',
  standalone : false
})
export class ProgramDescriptionComponent extends BaseComponent {

     
     constructor(
           public override configService      : ConfigService,
           public override backendService     : BackendService,
           public override route              : ActivatedRoute,
           public override speechService      : SpeechService,
     )
     {
      //
      super(configService,
            backendService,
            route,
            speechService,
            PAGE_ABOUT_PROGRAM_DESCRIPTION,
      );
      //     
  }
}