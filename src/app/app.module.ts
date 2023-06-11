//
import { NgModule                      } from '@angular/core';
import { BrowserModule                 } from '@angular/platform-browser';
import { AppRoutingModule              } from './app-routing.module';
import { AppComponent                  } from './app.component';
import { HomeWebComponent              } from './home-web/home-web.component';
import { AlgorithmWebComponent         } from './algorithm-web/algorithm-web.component';
import { FilesGenerationWebComponent   } from './files-generation-web/files-generation-web.component';
import { AngularTutorialsnWebComponent } from './angular-tutorialsn-web/angular-tutorialsn-web.component';
import { RouterModule                  } from '@angular/router';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
//
@NgModule({
  declarations: [
    AppComponent,
    HomeWebComponent,
    AlgorithmWebComponent,
    FilesGenerationWebComponent,
    AngularTutorialsnWebComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    RouterModule.forRoot([
      {  path: 'HomeWebComponent'                 , component: HomeWebComponent                     },
      {  path: 'AlgorithmWebComponent'            , component: AlgorithmWebComponent                },
      {  path: 'FilesGenerationWebComponent'      , component: FilesGenerationWebComponent          },
      {  path: 'AngularTutorialsnWebComponent'    , component: AngularTutorialsnWebComponent        },
    ]),
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
