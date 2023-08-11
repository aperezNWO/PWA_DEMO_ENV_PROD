import { Component, VERSION            } from '@angular/core';
import { Router                        } from '@angular/router';
import { CustomErrorHandler            } from './app.module';
import { HomeWebComponent              } from './home/home-web/home-web.component';
import { AlgorithmWebComponent         } from './algorithm/algorithm-web/algorithm-web.component';
import { AngularTutorialsnWebComponent } from './topics/angular-tutorialsn-web/angular-tutorialsn-web.component';
import { FilesGenerationWebComponent   } from './files-generation/files-generation-web/files-generation-web.component';
import { AAboutWebComponent            } from './contact/a-about-web/a-about-web.component';
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
    appVersion        : string = '1.0.0.75';
    runtimeVersion    : string = VERSION.full;
    //
    readonly HomeWebComponent_pageTitle                   : string  = HomeWebComponent.PageTitle;
    readonly AlgorithmWebComponent_pageTitle              : string  = AlgorithmWebComponent.PageTitle;
    readonly FilesGenerationWebComponent_pageTitle        : string  = FilesGenerationWebComponent.PageTitle;
    readonly AngularTutorialsnWebComponent_pageTitle      : string  = AngularTutorialsnWebComponent.PageTitle;
    readonly AAboutWebComponent_pageTitle                 : string  = AAboutWebComponent.PageTitle
    //
    private  navbarCollapsed                              : boolean = true;
    //
    public get NavbarCollapsed() : boolean {
      //
      return this.navbarCollapsed;
    }
    //
    public set NavbarCollapsed(p_navbarCollapsed: boolean) {
        //
        this.navbarCollapsed = p_navbarCollapsed;
    }
    //-----------------------------------------------------------------------------------------------------
    constructor(private router : Router, private _customErrorHandler : CustomErrorHandler) {
      //
      console.log(this.title + "- [INGRESO]") ;
      //
      router.navigateByUrl("/Home");
    }
    //-----------------------------------------------------------------------------------------------------
 }   

