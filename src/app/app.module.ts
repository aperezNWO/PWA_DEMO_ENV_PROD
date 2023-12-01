import { Injectable, NgModule          } from '@angular/core';
import { APP_INITIALIZER,ErrorHandler  } from '@angular/core';
import { FormsModule                   } from '@angular/forms';
import { MatListModule                 } from '@angular/material/list';
import { MatTableModule                } from '@angular/material/table';
import { MatPaginatorModule            } from '@angular/material/paginator';
import { MatTabsModule                 } from '@angular/material/tabs';
import { BrowserModule                 } from '@angular/platform-browser';
import { BrowserAnimationsModule       } from '@angular/platform-browser/animations';
import { ReactiveFormsModule           } from '@angular/forms';
import { HttpClient, HttpClientModule  } from '@angular/common/http';
import { HttpHandler, HttpInterceptor  } from '@angular/common/http';
import { HttpRequest, HttpResponse     } from '@angular/common/http';
import { HTTP_INTERCEPTORS             } from '@angular/common/http';
import { RouterModule                  } from '@angular/router';
import { HashLocationStrategy          } from '@angular/common';
import { LocationStrategy              } from '@angular/common';
import { NgbModule                     } from '@ng-bootstrap/ng-bootstrap'
import { AppComponent                  } from './app.component';
import { HomeWebComponent              } from './_modules/home/home-web/home-web.component';
import { ContactComponent              } from './_modules/about/contact/contact.component';
import { AAboutWebComponent            } from './_modules/about/a-about-web/a-about-web.component';
import { TechnicalSpecsComponent       } from './_modules/about/technicalspecs/technical-specs/technical-specs.component';
import { AngularTutorialsnWebComponent } from './_modules/topics/angular-tutorialsn-web/angular-tutorialsn-web.component';
import { FilesGenerationWebComponent   } from './_modules/files-generation/files-generation-web/files-generation-web.component';
import { FilesGenerationXLSComponent   } from './_modules/files-generation/files-generation-xls/files-generation-xls.component';
import { FilesGenerationCSVComponent   } from './_modules/files-generation/files-generation-csv/files-generation-csv.component';
import { FilesGenerationPDFComponent   } from './_modules/files-generation/files-generation-pdf/files-generation-pdf.component';
import { FilesGenerationZIPComponent   } from './_modules/files-generation/files-generation-zip/files-generation-zip.component';
import { AlgorithmDijkstraComponent    } from './_modules/algorithm/algorithm-dijkstra/algorithm-dijkstra.component';
import { AlgorithmWebComponent         } from './_modules/algorithm/algorithm-web/algorithm-web.component';
import { AlgorithmRegExComponent       } from './_modules/algorithm/algorithm-reg-ex/algorithm-reg-ex.component';
import { AlgorithmSortComponent        } from './_modules/algorithm/algorithm-sort/algorithm-sort.component';
import { ConfigService                 } from './_services/config.service';
import { MCSDService                   } from './_services/mcsd.service';
import { Observable, finalize, tap     } from 'rxjs';
import { LogType                       } from './_models/log-info.model';
import { UnitTestingComponent          } from './unit-testing/unit-testing.component';
import { GamesSudokuComponent          } from './_modules/games/game-sudoku/game-sudoku.component';

//
const routes = [
  {  path: 'Home'                  , component: HomeWebComponent                      },
  {  path: 'AAboutWeb'             , component: AAboutWebComponent                    },
  {  path: 'Contact'               , component: ContactComponent                      },
  {  path: 'TechnicalSpecs'        , component: TechnicalSpecsComponent               },
  {  path: 'AngularTutorialsnWeb'  , component: AngularTutorialsnWebComponent         },
  {  path: 'AlgorithmWeb'          , component: AlgorithmWebComponent                 },
  {  path: 'AlgorithmRegEx'        , component: AlgorithmRegExComponent               },
  {  path: 'AlgorithmSort'         , component: AlgorithmSortComponent                },
  {  path: 'AlgorithmDijkstra'     , component: AlgorithmDijkstraComponent            },
  {  path: 'FilesGenerationWeb'    , component: FilesGenerationWebComponent           },
  {  path: 'FilesGenerationXLS'    , component: FilesGenerationXLSComponent           },
  {  path: 'FilesGenerationCSV'    , component: FilesGenerationCSVComponent           },
  {  path: 'FilesGenerationPDF'    , component: FilesGenerationPDFComponent           },
  {  path: 'FilesGenerationZIP'    , component: FilesGenerationZIPComponent           },         
  {  path: 'GamesSudoku'           , component: GamesSudokuComponent                  },
  {  path: '**'                    , component: AppComponent                          },
];
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
          console.warn(' [REQUESTIN URL (INTERCEPT)] : ' + msg);
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
    constructor(public mcsdService : MCSDService) { } 
    //
    handleError(_error: Error): void 
    { 
      // 
      console.warn("[CUSTOM ERROR HANDLING]:\n" + _error); 
      //
      let logType : LogType = LogType.Error
      //
      this.mcsdService.SetLog("[CUSTOM ERROR HANDLING]",_error.message,logType);
    } 
}
//
function ReadConfigFile(http : HttpClient, globalConfigService : ConfigService, mcsdService : MCSDService)
{
  let configInfo!  : Observable<ConfigService>;
  //
  let p_url        : string = "./assets/config.json";
  //
  configInfo    = http.get<ConfigService>(p_url);
  //
  const configInfoObserver   = {
        //
        next: (localConfigService: ConfigService)     => { 
              //
              console.warn('[AppModule] -  [CONFIG_SERVICE] - [RESULT] : ' + localConfigService );
              //
              globalConfigService.baseUrl    = localConfigService.baseUrl;
              globalConfigService.appName    = localConfigService.appName;
              globalConfigService.appVersion = localConfigService.appVersion;
              //
              console.warn('[AppModule] -  [CONFIG_SERVICE] - [RESULT] : ' + globalConfigService );
              //
              AppComponent.appName    = globalConfigService.appName;
              AppComponent.appVersion = globalConfigService.appVersion;
              AppComponent.title      = globalConfigService.appName;
              //////////////////////////////////////////////////////
              // CACHE PARA XML
              ///////////////////////////////////////////////////////
              mcsdService._SetXmlDataToCache(globalConfigService.baseUrl);
              ///////////////////////////////////////////////////////
              // CACHE PARA PIE CHART
              ///////////////////////////////////////////////////////
              mcsdService._SetSTATPieCache(globalConfigService.baseUrl);
              ///////////////////////////////////////////////////////
              // CACHE PARA BARCHART
              ///////////////////////////////////////////////////////
              mcsdService._SetSTATBarCache(globalConfigService.baseUrl);

        },
        error: (err: Error) => {
              //
              console.error('[AppModule] - [CONFIG_SERVICE] - [ERROR]  : ' + err);
        },       
        complete: ()        => {
              //
              console.info('[AppModule] -  [CONFIG INFO] - [COMPLETE]');
        },
  };
  //
  configInfo.subscribe(configInfoObserver);
}
//
function initialize(http: HttpClient, globalConfigService: ConfigService, mcsdService : MCSDService): (() => Promise<boolean>) {
  return (): Promise<boolean> => {
    return new Promise<boolean>((resolve: (a: boolean) => void): void => 
    {
          ///////////////////////////////////////////////////////
          // LEER ARCHIVO CONFIG
          ///////////////////////////////////////////////////////
          ReadConfigFile(http, globalConfigService, mcsdService);
          //
          resolve(true);
    });
  };
}
//
@NgModule({
  declarations: [
    AppComponent,
    HomeWebComponent,  
    ContactComponent,
    AAboutWebComponent,
    AngularTutorialsnWebComponent,
    AlgorithmWebComponent,
    AlgorithmRegExComponent,
    AlgorithmSortComponent,
    AlgorithmDijkstraComponent,
    FilesGenerationWebComponent,
    FilesGenerationXLSComponent,
    FilesGenerationCSVComponent,
    FilesGenerationPDFComponent,
    FilesGenerationZIPComponent,
    TechnicalSpecsComponent,
    UnitTestingComponent,
    GamesSudokuComponent,
  ],
  imports: [
    HttpClientModule,
    FormsModule,
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatListModule,
    MatTableModule,
    MatPaginatorModule,
    MatTabsModule,
    NgbModule,
    RouterModule,
    RouterModule.forRoot( routes, { useHash: true }),
  ], 
  exports  : [RouterModule],
  providers: [
                { provide : HTTP_INTERCEPTORS  , useClass   :  LoggingInterceptor   , multi: true    },
                { provide : LocationStrategy   , useClass   :  HashLocationStrategy                  },
                { provide : ErrorHandler       , useClass   :  CustomErrorHandler                    },
                { provide : APP_INITIALIZER    , useFactory :  initialize, deps:
                 [
                   HttpClient,
                   ConfigService,
                   MCSDService,
                 ], multi: true   },
             ],
  bootstrap: [AppComponent]
})
//
export class AppModule { 
    //-----------------------------------------------------------------------------------------------------
    constructor(public customErrorHandler : CustomErrorHandler, public loggingInterceptor : LoggingInterceptor) 
    {
        //
        console.log("[AppModule] - [appName]" + AppComponent.appName);
    }
}



