import { Component, VERSION            } from '@angular/core';
import { Router                        } from '@angular/router';
import { environment                   } from 'src/environments/environment';
import { CustomErrorHandler            } from './app.module';
import { HomeWebComponent              } from './_modules/home/home-web/home-web.component';
import { AlgorithmWebComponent         } from './_modules/algorithm/algorithm-web/algorithm-web.component';
import { AngularTutorialsnWebComponent } from './_modules/topics/angular-tutorialsn-web/angular-tutorialsn-web.component';
import { FilesGenerationWebComponent   } from './_modules/files-generation/files-generation-web/files-generation-web.component';
import { AAboutWebComponent            } from './_modules/about/a-about-web/a-about-web.component';
import { MCSDService                   } from './_services/mcsd.service';
import { ConfigService } from './_services/config.service';
//
@Component({
  selector    : 'app-root',
  templateUrl : './app.component.html',
  styleUrls   : ['./app.component.css']
})

//
export class AppComponent {
    // miembros
    public title                    : string = "[WEBAPI/ANGULAR - DEMO]"; 
    // propiedades internas
    public static appName           : string = "[WEBAPI/ANGULAR - DEMO]";
    public static appVersion        : string = '1.0.0.95';
    // propiedades publicas
    public readonly _appName                                     : string  = AppComponent.appName;
    public readonly _appVersion                                  : string  = AppComponent.appVersion;
    public readonly HomeWebComponent_pageTitle                   : string  = HomeWebComponent.PageTitle;
    public readonly AlgorithmWebComponent_pageTitle              : string  = AlgorithmWebComponent.PageTitle;
    public readonly FilesGenerationWebComponent_pageTitle        : string  = FilesGenerationWebComponent.PageTitle;
    public readonly AngularTutorialsnWebComponent_pageTitle      : string  = AngularTutorialsnWebComponent.PageTitle;
    public readonly AAboutWebComponent_pageTitle                 : string  = AAboutWebComponent.PageTitle
    //
    private  navbarCollapsed                                     : boolean = true;
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
    constructor(private router : Router, private _customErrorHandler : CustomErrorHandler, mcsdService : MCSDService, configService : ConfigService) {
      //
      console.log('[AppComponent] - ' + this.title + " - [INGRESO]") ;
      //
      console.log('[AppComponent] - ' + this.title + " - [ENV_NAME] : " + environment.serviceName) ;      
      //
      router.navigateByUrl("/Home");
    //-----------------------------------------------------------------------------------------------------
    }   
  }   
