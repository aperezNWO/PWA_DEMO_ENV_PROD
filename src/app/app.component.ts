import { Component, VERSION            } from '@angular/core';
import { HomeWebComponent              } from './home-web/home-web.component';
import { AlgorithmWebComponent         } from './algorithm-web/algorithm-web.component';
import { AngularTutorialsnWebComponent } from './angular-tutorialsn-web/angular-tutorialsn-web.component';
import { FilesGenerationWebComponent   } from './files-generation-web/files-generation-web.component';
//
@Component({
  selector    : 'app-root',
  templateUrl : './app.component.html',
  styleUrls   : ['./app.component.css']
})
//
export class AppComponent {
    //
    title             : string = "[MCSD - CONSULTAS]"; 
    appName           : string = "[MCSD - CONSULTAS]";
    appVersion        : string = '1.0.0.47';
    runtimeVersion    : string = VERSION.full;
    //
    readonly HomeWebComponent_pageTitle                   : string = HomeWebComponent.pageTitle();
    readonly AlgorithmWebComponent_pageTitle              : string = AlgorithmWebComponent.pageTitle();
    readonly FilesGenerationWebComponent_pageTitle        : string = FilesGenerationWebComponent.pageTitle();
    readonly AngularTutorialsnWebComponent_pageTitle      : string = AngularTutorialsnWebComponent.pageTitle();
    //-----------------------------------------------------------------------------------------------------
    constructor() {
      //
      console.log('AppComponent') ;
    }
    //-----------------------------------------------------------------------------------------------------
 }   
