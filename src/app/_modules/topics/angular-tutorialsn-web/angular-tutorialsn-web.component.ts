import { Component               } from '@angular/core';
import { CustomErrorHandler      } from '../../../app.module';
import { MCSDService             } from '../../../_services/mcsd.service';
import { Observable,  throwError } from 'rxjs';
//
@Component({
  selector   : 'app-angular-tutorialsn-web',
  templateUrl: './angular-tutorialsn-web.component.html',
  styleUrls  : ['./angular-tutorialsn-web.component.css']
})
//
export class AngularTutorialsnWebComponent {
  //
  public static get PageTitle()   : string {
    //
    return '[TEMAS]';
  }
  //
  readonly pageTitle : string = AngularTutorialsnWebComponent.PageTitle;
  //
  constructor(private mcsdService : MCSDService, private customErrorHandler : CustomErrorHandler)
  {
      //
      console.log(AngularTutorialsnWebComponent.PageTitle + " - [INGRESO]") ;
      //
      mcsdService.SetLog(this.pageTitle,"PAGE_TOPIC_INDEX");
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

