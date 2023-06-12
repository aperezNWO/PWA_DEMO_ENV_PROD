//
import { NgModule                      } from '@angular/core';
import { BrowserModule                 } from '@angular/platform-browser';
import { RouterModule                  } from '@angular/router';
import { BrowserAnimationsModule       } from '@angular/platform-browser/animations';
import { AppRoutingModule              } from './app-routing.module';
import { AppComponent                  } from './app.component';
import { HomeWebComponent              } from './home-web/home-web.component';
import { AngularTutorialsnWebComponent } from './angular-tutorialsn-web/angular-tutorialsn-web.component';
import { FilesGenerationWebComponent   } from './files-generation-web/files-generation-web.component';
import { FilesGenerationXLSComponent   } from './files-generation-xls/files-generation-xls.component';
import { FilesGenerationCSVComponent   } from './files-generation-csv/files-generation-csv.component';
import { FilesGenerationPDFComponent   } from './files-generation-pdf/files-generation-pdf.component';
import { FilesGenerationZIPComponent   } from './files-generation-zip/files-generation-zip.component';
import { AlgorithmWebComponent         } from './algorithm-web/algorithm-web.component';
import { AlgorithmRegExComponent       } from './algorithm-reg-ex/algorithm-reg-ex.component';
import { AlgorithmSortComponent } from './algorithm-sort/algorithm-sort.component';
import { AlgorithmDijkstraComponent } from './algorithm-dijkstra/algorithm-dijkstra.component';
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
    AngularTutorialsnWebComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule.forRoot([
      {  path: 'HomeWebComponent'                 , component: HomeWebComponent                     },
      {  path: 'AlgorithmWebComponent'            , component: AlgorithmWebComponent                },
      {  path: 'AlgorithmRegExComponent'          , component: AlgorithmRegExComponent              },
      {  path: 'AlgorithmSortComponent'           , component: AlgorithmSortComponent               },
      {  path: 'AlgorithmDijkstraComponent'       , component: AlgorithmDijkstraComponent           },
      {  path: 'FilesGenerationWebComponent'      , component: FilesGenerationWebComponent          },
      {  path: 'FilesGenerationXLSComponent'      , component: FilesGenerationXLSComponent          },
      {  path: 'FilesGenerationCSVComponent'      , component: FilesGenerationCSVComponent          },
      {  path: 'FilesGenerationPDFComponent'      , component: FilesGenerationPDFComponent          },
      {  path: 'FilesGenerationZIPComponent'      , component: FilesGenerationZIPComponent          },         
      {  path: 'AngularTutorialsnWebComponent'    , component: AngularTutorialsnWebComponent        },
    ]),
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
