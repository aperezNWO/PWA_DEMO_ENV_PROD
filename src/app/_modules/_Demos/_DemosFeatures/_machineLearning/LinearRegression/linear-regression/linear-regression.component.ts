import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseComponent } from 'src/app/_components/base/base.component';
import { PAGE_MACHINE_LEARNING_LINEAR_REGRESSION } from 'src/app/_models/common';
import { BackendService } from 'src/app/_services/BackendService/backend.service';
import { ConfigService } from 'src/app/_services/ConfigService/config.service';
import { ApolloApiService } from 'src/app/_services/LinearRegressionService/linear-regression.service';
import { SpeechService } from 'src/app/_services/speechService/speech.service';

@Component({
  selector: 'app-linear-regression',
  templateUrl: './linear-regression.component.html',
  styleUrl: './linear-regression.component.css'
})
export class LinearRegressionComponent  extends BaseComponent implements OnInit {

    constructor(      private http: HttpClient, 
                      private cd: ChangeDetectorRef,
                      public  override configService    : ConfigService,
                      public  override route            : ActivatedRoute,
                      public  override speechService    : SpeechService,
                      public  override backendService   : BackendService,
                      public  predictService            : ApolloApiService 
               ) 
    { 
          //
          super(configService,
                backendService,
                route,
                speechService,
                PAGE_MACHINE_LEARNING_LINEAR_REGRESSION
          )
    }

    //
    ngOnInit(): void {
      //throw new Error('Method not implemented.');
    }
}
