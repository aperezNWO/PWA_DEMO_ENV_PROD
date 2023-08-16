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
import { FilesGenerationWebComponent   } from './_modules/files-generation/files-generation-web/files-generation-web.component';
import { FilesGenerationXLSComponent   } from './_modules/files-generation/files-generation-xls/files-generation-xls.component';
import { FilesGenerationCSVComponent   } from './_modules/files-generation/files-generation-csv/files-generation-csv.component';
import { FilesGenerationPDFComponent   } from './_modules/files-generation/files-generation-pdf/files-generation-pdf.component';
import { FilesGenerationZIPComponent   } from './_modules/files-generation/files-generation-zip/files-generation-zip.component';
import { AlgorithmWebComponent         } from './_modules/algorithm/algorithm-web/algorithm-web.component';
import { AlgorithmRegExComponent       } from './_modules/algorithm/algorithm-reg-ex/algorithm-reg-ex.component';
import { AlgorithmSortComponent        } from './_modules/algorithm/algorithm-sort/algorithm-sort.component';
import { AlgorithmDijkstraComponent    } from './_modules/algorithm/algorithm-dijkstra/algorithm-dijkstra.component';
import { TopicsModule                  } from './_modules/topics/topics.module';
import { AngularTutorialsnWebComponent } from './_modules/topics/angular-tutorialsn-web/angular-tutorialsn-web.component';
import { AboutModule                   } from './_modules/about/about.module';
import { AAboutWebComponent            } from './_modules/about/a-about-web/a-about-web.component';
import { ContactComponent              } from './_modules/about/contact/contact.component';
import { ConfigService, SomeSharedService } from './_services/config-service.service';
import { Observable                       } from 'rxjs';

//
const routes = [
  {  path: 'Home'                  , component: HomeWebComponent                      },
  {  path: 'AlgorithmWeb'          , component: AlgorithmWebComponent                 },
  {  path: 'AlgorithmRegEx'        , component: AlgorithmRegExComponent               },
  {  path: 'AlgorithmSort'         , component: AlgorithmSortComponent                },
  {  path: 'AlgorithmDijkstra'     , component: AlgorithmDijkstraComponent            },
  {  path: 'FilesGenerationWeb'    , component: FilesGenerationWebComponent           },
  {  path: 'FilesGenerationXLS'    , component: FilesGenerationXLSComponent           },
  {  path: 'FilesGenerationCSV'    , component: FilesGenerationCSVComponent           },
  {  path: 'FilesGenerationPDF'    , component: FilesGenerationPDFComponent           },
  {  path: 'FilesGenerationZIP'    , component: FilesGenerationZIPComponent           },         
  {  path: 'AngularTutorialsnWeb'  , component: AngularTutorialsnWebComponent  },
  {  path: 'AAboutWeb'             , component: AAboutWebComponent             },
  {  path: 'Contact'               , component: ContactComponent               },
  {  path: '**'                    , component: AppComponent                                             }, 
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
      console.warn("[CUSTOM ERROR HANDLING]:\n"); 
    } 
}
//
function initialize(http: HttpClient, _config: ConfigService, someSharedService: SomeSharedService): (() => Promise<boolean>) {
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
                next: (configService: ConfigService)     => { 
                      //
                      console.warn(' -  [CONFIG INFO] - [RESULT] : ' + configService.baseUrl);
                      //
                      someSharedService.globalVar = configService.baseUrl;
                      //
                      console.warn(' -  [CONFIG INFO] - [RESULT] : ' + someSharedService.globalVar );
                },
                error: (err: Error) => {
                      //
                      console.error(' - [CONFIG INFO] - [ERROR]  : ' + err);
                },       
                complete: ()        => {
                      //
                      console.info(' -  [CONFIG INFO] - [COMPLETE]');
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
    AlgorithmWebComponent,
    AlgorithmRegExComponent,
    AlgorithmSortComponent,
    AlgorithmDijkstraComponent,
    FilesGenerationWebComponent,
    FilesGenerationXLSComponent,
    FilesGenerationCSVComponent,
    FilesGenerationPDFComponent,
    FilesGenerationZIPComponent,
    AAboutWebComponent,
    ContactComponent,
    AngularTutorialsnWebComponent,
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
                { provide: APP_INITIALIZER    , useFactory :  initialize, deps: [
                   HttpClient,
                   ConfigService,
                   SomeSharedService 
                 ],multi: true   },
             ],
  bootstrap: [AppComponent]
})
//
export class AppModule { 
    //-----------------------------------------------------------------------------------------------------
    constructor(private customErrorHandler : CustomErrorHandler) 
    {
        //
        console.log("AppModule");
    }
}

