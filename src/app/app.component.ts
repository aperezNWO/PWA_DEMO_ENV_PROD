import { Component, OnInit, VERSION    } from '@angular/core';
import { Router                        } from '@angular/router';
import { Title                         } from '@angular/platform-browser';
import { CustomErrorHandler            } from './app.module';
import { HomeWebComponent              } from './_modules/home/home-web/home-web.component';
import { AlgorithmWebComponent         } from './_modules/algorithm/algorithm-web/algorithm-web.component';
import { AngularTutorialsnWebComponent } from './_modules/topics/angular-tutorialsn-web/angular-tutorialsn-web.component';
import { FilesGenerationWebComponent   } from './_modules/files-generation/files-generation-web/files-generation-web.component';
import { AAboutWebComponent            } from './_modules/about/a-about-web/a-about-web.component';
import { MCSDService                   } from './_services/mcsd.service';
import { _ConfigService                } from './_services/-config.service';
//
@Component({
  selector    : 'app-root',
  templateUrl : './app.component.html',
  styleUrls   : ['./app.component.css']
})

//
export class AppComponent implements OnInit {
    // propiedades publicas
    public readonly _title                                       : string | undefined  = "";
    public readonly _appName                                     : string | undefined  = "";
    public readonly _appVersion                                  : string | undefined  = "";
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
    constructor(
                private router              : Router, 
                private _customErrorHandler : CustomErrorHandler, 
                private mcsdService         : MCSDService, 
                private _configService      : _ConfigService,
                private titleService        : Title
               ) 
    {
      //
      console.log("Loading AppComponent...");
      // IMPLEMENT AS MAP AND ITERATE
      let keyName  : string = '';
      let keyValue : string = '';
      //
      keyName  = 'appName';
      keyValue = this._configService.getConfigValue(keyName);
      //
      this._appName = keyValue;
      //
      keyName          = 'appVersion';
      keyValue         = this._configService.getConfigValue(keyName);
      this._appVersion = keyValue;
      //
      let __baseUrlNetCore = this._configService.getConfigValue('baseUrlNetCore');
      let __baseUrlNodeJs  = this._configService.getConfigValue('baseUrlNodeJs');
      //
      this.mcsdService._baseUrlNetCore = __baseUrlNetCore;
      this.mcsdService._baseUrlNodeJs  = __baseUrlNodeJs;
      //
      //////////////////////////////////////////////////////
      // CACHE PARA XML
      ///////////////////////////////////////////////////////
      //
      this.mcsdService._SetXmlDataToCache(__baseUrlNetCore);
      ///////////////////////////////////////////////////////
      // CACHE PARA PIE CHART
      ///////////////////////////////////////////////////////
      this.mcsdService._SetSTATPieCache(__baseUrlNetCore);
      ///////////////////////////////////////////////////////
      // CACHE PARA BARCHART
      ///////////////////////////////////////////////////////
      this.mcsdService._SetSTATBarCache(__baseUrlNetCore);
      //
      let title : string = `${this._appName} - ${this._appVersion}`;
      //
      console.log("Setting Title : " + title);
      //
      this._title = `${this._appName}`;
      //
      this.titleService.setTitle(title);
      //
      router.navigateByUrl("/Home");
    }   
    //-----------------------------------------------------------------------------------------------------
    ngOnInit() {
        //
    }
    //
    getValueFromConfig(key: string) {
      return this._configService.getConfigValue(key);
    }
  }   
//-----------------------------------------------------------------------------------------------------
export { CustomErrorHandler };
//-----------------------------------------------------------------------------------------------------
