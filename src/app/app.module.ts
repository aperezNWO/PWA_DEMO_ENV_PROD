// ANGULAR MODULES
import { Injectable, NgModule, inject, provideAppInitializer } from '@angular/core';
import { ErrorHandler, isDevMode                             } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, DecimalPipe                 } from '@angular/common';
import { ServiceWorkerModule             } from '@angular/service-worker';
import { FormsModule                     } from '@angular/forms';
import { BrowserModule                   } from '@angular/platform-browser';
import { BrowserAnimationsModule         } from '@angular/platform-browser/animations';
import { ReactiveFormsModule             } from '@angular/forms';
import { HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpHandler, HttpInterceptor    } from '@angular/common/http';
import { HttpRequest, HttpResponse       } from '@angular/common/http';
import { HTTP_INTERCEPTORS               } from '@angular/common/http';
import { RouterModule                    } from '@angular/router';
import { HashLocationStrategy            } from '@angular/common';
import { LocationStrategy                } from '@angular/common';
// CUSTOM MODULES
import { AppRoutingModule                } from './app-routing.module';
import { SharedModule                    } from './_modules/shared/shared.module';
import { FileGenerationModule            } from './_modules/_Demos/_DemosFeatures/files-generation/file-generation.module';
import { GamesModule                     } from './_modules/_Demos/_DemosFeatures/games/games.module';
import { AlgorithmModule                 } from './_modules/_Demos/_DemosFeatures/algorithm/algorithm.module';
import { MiscelaneousModule              } from './_modules/_Demos/_DemosFeatures/miscelaneous/miscelaneous.module';
import { AboutModule                     } from './_modules/about/about.module';
// COMPONENTS 
import { HomeWebComponent                } from './_modules/home/home-web/home-web.component';
import { PageNotFoundComponent           } from './_modules/home/page-not-found/page-not-found.component';
import { NavComponent                    } from './_modules/home/nav/nav.component';
import { LogType                         } from './_models/entity.model';
import { CurriculumAngularComponent      } from './_modules/_Demos/_DemosCurriculum/curriculumAngular/curriculumAngular.component';
import { LinearRegressionComponent       } from './_modules/_Demos/_DemosFeatures/_machineLearning/LinearRegression/linear-regression/linear-regression.component';
// COMPONENTS
import { AppComponent                } from './app.component';
import { LandingComponent            } from './_components/landing/landing.component';
import { BaseComponent               } from './_components/base/base.component';
import { _BaseComponent              } from './_components/base/_base.component';
import { GridParamComponent          } from './_components/grid-param/grid-param.component';
import { PageUrlListComponent        } from './_components/page-url-list/page-url-list.component';
import { SpeechPanelComponent        } from 'src/app/_components/speech-panel/speech-panel.component';
// SERVICES
import { ConfigService               } from './_services/__Utils/ConfigService/config.service';
import { BackendService              } from './_services/BackendService/backend.service';
// THIRD-PARTY
import { finalize, tap                                } from 'rxjs';
import { NgbModule                                    } from '@ng-bootstrap/ng-bootstrap';
import { NgChartsModule                               } from 'ng2-charts'
import { BaseSortableHeader } from './_directives/sortable.directive';


//
export function initialize(_configService: ConfigService) 
// 
{
      //  
      return () => _configService.loadConfig();
}
//
@Injectable({
  providedIn: 'root'
})
export class LoggingInterceptor implements HttpInterceptor {
  constructor() {}
  
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const started = Date.now();
    let ok: string;

    // extend server response observable with logging
    return next.handle(req)
      .pipe(
        tap({
          // Succeeds when there is a response; ignore other events
          next: (event) => (ok = event instanceof HttpResponse ? 'succeeded' : ''),
          // Operation failed; error is an HttpErrorResponse
          error: (error) => (ok = 'failed')
        }),
        // Log when response observable either completes or errors
        finalize(() => {
          const elapsed = Date.now() - started;
          const msg = `${req.method} "${req.urlWithParams}" ${ok} in ${elapsed} ms.`;
          console.warn(' [REQUESTING URL (INTERCEPT)] : ' + msg);
        })
      );
  }
}
//  
@Injectable({
  providedIn: 'root'
})
//
export class CustomErrorHandler implements ErrorHandler {
    //
    constructor(public backendService : BackendService) { } 
    //
    handleError(_error: Error): void 
    { 
      // 
      console.error("[CUSTOM ERROR HANDLING]:\n" + _error); 
      //
      let logType : LogType = LogType.Error
      //
      this.backendService.SetLog("[CUSTOM ERROR HANDLING]",_error.message,logType);
    } 
}
//
@NgModule({ 
     declarations: [AppComponent,
        //HomeWebComponent,
        //LandingComponent,
        //CurriculumAngularComponent,
        NavComponent,
        PageNotFoundComponent,
        GridParamComponent,    // curriculuums
        PageUrlListComponent   // edu resources, llm list
    ],
    exports  : [RouterModule],
    bootstrap: [AppComponent], 
    imports  : [CommonModule,
        SharedModule,
        FileGenerationModule,
        GamesModule,
        AlgorithmModule,
        MiscelaneousModule,
        AboutModule,
        SpeechPanelComponent,  // used by gridparams, index and scm
        BaseSortableHeader,    // used by gridparsms, index and scm
        NgbModule,             // used by  nav module
        ReactiveFormsModule,  
        FormsModule,
        BrowserModule,
        AppRoutingModule,
        HttpClientModule,
        BrowserAnimationsModule,
        ServiceWorkerModule.register('ngsw-worker.js', {
            enabled: !isDevMode(),
            // Register the ServiceWorker as soon as the application is stable
            // or after 30 seconds (whichever comes first).
            registrationStrategy: 'registerWhenStable:30000'
        })], 
     providers: [
        ConfigService,
        DecimalPipe,
        DatePipe,
        CurrencyPipe,
        { provide: HTTP_INTERCEPTORS, useClass: LoggingInterceptor, multi: true },
        { provide: LocationStrategy, useClass: HashLocationStrategy },
        { provide: ErrorHandler, useClass: CustomErrorHandler },
        [
            provideAppInitializer(() => {
                const configService = inject(ConfigService);
                return configService.loadConfig();
            }),
        ],
        provideHttpClient(withInterceptorsFromDi()),
    ] })
//
export class AppModule { 
    //-----------------------------------------------------------------------------------------------------
    constructor(public customErrorHandler : CustomErrorHandler, 
                public loggingInterceptor : LoggingInterceptor,
                public backendService     : BackendService,
               ) 
    {

    }
}



