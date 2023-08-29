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
  appName           : string = AppComponent.appName;
  appVersion        : string = AppComponent.appVersion;
  runtimeVersion    : string = VERSION.full;
  //
  public static get PageTitle()   : string {
    //
    return '[ESPECIFICACIONES TÉCNICAS]';
  }
  //
  readonly pageTitle : string = TechnicalSpecsComponent.PageTitle;
  //
  constructor(private mcsdServiCe: MCSDService, private customErrorHandler: CustomErrorHandler)
  {
      //
      console.log(this.pageTitle + "- [INGRESO]");
      //
      mcsdServiCe.SetLog(this.pageTitle,"PAGE_TECH_SPECS");
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
