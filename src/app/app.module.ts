//
import { NgModule                      } from '@angular/core';
import { RouterModule                  } from '@angular/router';
import { FormsModule                   } from '@angular/forms';
import { MatListModule                 } from '@angular/material/list';
import { MatTableModule                } from '@angular/material/table';
import { MatPaginatorModule            } from '@angular/material/paginator';
import { MatTabsModule                 } from '@angular/material/tabs';
import { BrowserModule                 } from '@angular/platform-browser';
import { BrowserAnimationsModule       } from '@angular/platform-browser/animations';
import { ReactiveFormsModule           } from '@angular/forms';
import { HttpClientModule              } from '@angular/common/http';
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
import { AlgorithmSortComponent        } from './algorithm-sort/algorithm-sort.component';
import { AlgorithmDijkstraComponent    } from './algorithm-dijkstra/algorithm-dijkstra.component';
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
    FormsModule,
    BrowserModule,
    AppRoutingModule,
    MatListModule,
    MatTableModule,
    MatPaginatorModule,
    MatTabsModule,
    ReactiveFormsModule,
    RouterModule,
    HttpClientModule,
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
