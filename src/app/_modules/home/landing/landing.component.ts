import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute                   } from '@angular/router';
import { BaseReferenceComponent           } from 'src/app/_components/base-reference/base-reference.component';
import { ConfigService                    } from 'src/app/_services/__Utils/ConfigService/config.service';
import { SpeechService                    } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { BackendService                   } from 'src/app/_services/BackendService/backend.service';
import { PAGE_ANGULAR_DEMO_LANDING, PAGE_TITLE_LOG, PAGE_TITLE_NO_SOUND        } from 'src/app/_models/common';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
  providers   : [
    { 
      provide : PAGE_TITLE_LOG, 
      useValue: PAGE_ANGULAR_DEMO_LANDING 
    },
  ]
})
export class LandingComponent extends BaseReferenceComponent implements OnInit, AfterViewInit {
  //
  public get _appBrand()            : string
  {
      return `Welcome to ${this.configService.getConfigValue('appBrand')}`;
  }
  //
  constructor(public  override configService  : ConfigService, 
              public  override backendService : BackendService,
              public  override route          : ActivatedRoute, 
              public  override speechService  : SpeechService)
  {
    //
    super(
      configService,
      backendService,
      route,
      speechService,
      PAGE_ANGULAR_DEMO_LANDING,
    );
  }
  //
  ngOnInit(): void {
      //
  }
  //
  ngAfterViewInit():void
  {  
      //
  }
}
