import { Component, VERSION                } from '@angular/core';
import { CustomErrorHandler                } from 'src/app/app.module';
import { Observable,  throwError           } from 'rxjs';
import { MCSDService                       } from '../../../../_services/mcsd.service';
import { AppComponent                      } from '../../../../app.component';
//
@Component({
  selector: 'app-technical-specs',
  templateUrl: './technical-specs.component.html',
  styleUrls: ['./technical-specs.component.css']
})
//
export class TechnicalSpecsComponent {
  //
  appName           : string | undefined = AppComponent.appName;
  appVersion        : string | undefined = AppComponent.appVersion;
  runtimeVersion    : string = VERSION.full;
  webApiAppVersion  : string = "";
  //
  public static get PageTitle()   : string {
    //
    return '[ESPECIFICACIONES TÉCNICAS]';
  }
  //
  readonly pageTitle : string = TechnicalSpecsComponent.PageTitle;
  //
  constructor(private mcsdService: MCSDService, private customErrorHandler: CustomErrorHandler)
  {
      //
      console.log(this.pageTitle + "- [INGRESO]");
      //
      mcsdService.SetLog(this.pageTitle,"PAGE_TECH_SPECS");
      //
      this._GetWebApiAppVersion();
  }
  //
  private _GetWebApiAppVersion() {
    //
    let appVersion : Observable<string> = this.mcsdService._GetWebApiAppVersion();
    //
    const appVersionObserver = {
      next: (jsondata: string)     => { 
        //
        console.log('_GetAppVersion - (return): ' + jsondata);
        //
        this.webApiAppVersion = jsondata;
        //
        console.log(this.pageTitle + "- [webApiVersion] - " + this.webApiAppVersion);
      },
      error           : (err: Error)      => {
        //
        console.error('_GetAppVersion- (ERROR) : ' + JSON.stringify(err.message));
      },
      complete        : ()                => {
        //
        console.log('_GetAppVersion -  (COMPLETE)');
      },
    };
    //
    appVersion.subscribe(appVersionObserver);
  }
  //
  TestError():void
  {
      //
      let obs! : Observable<any>;
      obs      = throwError("[ERROR THROWN TEST]");
      //
      obs.subscribe(
        (        el: string) => {
          console.log("Value Received :" + el);
        },
        (        err: string) => {
          console.log("[ERROR CAUGTH TEST ] : " + err);
        },
        () => console.log("Processing Complete")
      );
      // CAUSAR ERROR
      // @ts-ignore 
      test = test+1;  
  }
}
