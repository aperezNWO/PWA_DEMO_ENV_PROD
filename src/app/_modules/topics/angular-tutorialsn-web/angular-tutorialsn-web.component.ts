import { Component               } from '@angular/core';
import { CustomErrorHandler      } from '../../../app.module';
import { MCSDService             } from '../../../_services/mcsd.service';
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
}

