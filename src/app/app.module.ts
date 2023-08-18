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
import { Observable                    } from 'rxjs';
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
];
//  
@Injectable({
  providedIn: 'root'
})
//
export class CustomErrorHandler implements ErrorHandler {
    //
    constructor() { } 
    //
    handleError(_error: any): void 
    { 
      // 
      console.warn("[CUSTOM ERROR HANDLING]:\n" + _error); 
    } 
}
//
function initialize(http: HttpClient, globalConfigService: ConfigService): (() => Promise<boolean>) {
  return (): Promise<boolean> => {
    return new Promise<boolean>((resolve: (a: boolean) => void): void => 
    {
          //
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
                      console.warn('[AppModule] -  [CONFIG_SERVICE] - [RESULT] : ' + localConfigService.baseUrl);
                      //
                      globalConfigService.baseUrl = localConfigService.baseUrl;
                      //
                      console.warn('[AppModule] -  [CONFIG_SERVICE] - [RESULT] : ' + globalConfigService.baseUrl );
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
  ],
  imports: [
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
                { provide: LocationStrategy   , useClass   :  HashLocationStrategy     },
                { provide: ErrorHandler       , useClass   :  CustomErrorHandler       },
                { provide: APP_INITIALIZER    , useFactory :  initialize, deps:
                 [
                   HttpClient,
                   ConfigService,
                 ], multi: true   },
             ],
  bootstrap: [AppComponent]
})
//
export class AppModule { 
    //-----------------------------------------------------------------------------------------------------
    constructor(private customErrorHandler : CustomErrorHandler) 
    {
        //
        console.log("[AppModule]");
    }
}

