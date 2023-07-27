import { NgModule                      } from '@angular/core';
import { FormsModule                   } from '@angular/forms';
import { MatListModule                 } from '@angular/material/list';
import { MatTableModule                } from '@angular/material/table';
import { MatPaginatorModule            } from '@angular/material/paginator';
import { MatTabsModule                 } from '@angular/material/tabs';
import { BrowserModule                 } from '@angular/platform-browser';
import { BrowserAnimationsModule       } from '@angular/platform-browser/animations';
import { ReactiveFormsModule           } from '@angular/forms';
import { HttpClientModule              } from '@angular/common/http';
import { RouterModule                  } from '@angular/router';
import { NgbModule                     } from '@ng-bootstrap/ng-bootstrap'
import { AppComponent                  } from './app.component';
import { HomeWebComponent              } from './home-web/home-web.component';
import { FilesGenerationWebComponent   } from './files-generation-web/files-generation-web.component';
import { FilesGenerationXLSComponent   } from './files-generation-xls/files-generation-xls.component';
import { FilesGenerationCSVComponent   } from './files-generation-csv/files-generation-csv.component';
import { FilesGenerationPDFComponent   } from './files-generation-pdf/files-generation-pdf.component';
import { FilesGenerationZIPComponent   } from './files-generation-zip/files-generation-zip.component';
import { AlgorithmWebComponent         } from './algorithm-web/algorithm-web.component';
import { AlgorithmRegExComponent       } from './algorithm-reg-ex/algorithm-reg-ex.component';
import { AlgorithmSortComponent        } from './algorithm-sort/algorithm-sort.component';
import { AlgorithmDijkstraComponent    } from './algorithm-dijkstra/algorithm-dijkstra.component';
import { AngularTutorialsnWebComponent } from './angular-tutorialsn-web/angular-tutorialsn-web.component';
import { AAboutWebComponent } from './a-about-web/a-about-web.component';
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
    AAboutWebComponent,
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
    RouterModule.forRoot([
      {  path: 'Home'                  /*, redirectTo: '/Home'                        */, component: HomeWebComponent                      },
      {  path: 'AlgorithmWeb'          /*, redirectTo: 'AlgorithmWebComponent'        */, component: AlgorithmWebComponent                 },
      {  path: 'AlgorithmRegEx'        /*, redirectTo: 'AlgorithmRegExComponent'      */, component: AlgorithmRegExComponent               },
      {  path: 'AlgorithmSort'         /*, redirectTo: 'AlgorithmSortComponent'       */, component: AlgorithmSortComponent                },
      {  path: 'AlgorithmDijkstra'     /*, redirectTo: 'AlgorithmDijkstraComponent'   */, component: AlgorithmDijkstraComponent            },
      {  path: 'FilesGenerationWeb'    /*, redirectTo: 'FilesGenerationWebComponent'  */, component: FilesGenerationWebComponent           },
      {  path: 'FilesGenerationXLS'    /*, redirectTo: 'FilesGenerationXLSComponent'  */, component: FilesGenerationXLSComponent           },
      {  path: 'FilesGenerationCSV'    /*, redirectTo: 'FilesGenerationCSVComponent'  */, component: FilesGenerationCSVComponent           },
      {  path: 'FilesGenerationPDF'    /*, redirectTo: 'FilesGenerationPDFComponent'  */, component: FilesGenerationPDFComponent           },
      {  path: 'FilesGenerationZIP'    /*, redirectTo: 'FilesGenerationZIPComponent'  */, component: FilesGenerationZIPComponent           },         
      {  path: 'AngularTutorialsnWeb'  /*, redirectTo: 'AngularTutorialsnWebComponet' */, component: AngularTutorialsnWebComponent         },
      {  path: 'AAboutWeb'             /*, redirectTo: 'AAboutWebComponent'           */, component: AAboutWebComponent                    },
      ]),
  ], 
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
