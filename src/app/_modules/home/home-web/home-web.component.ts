import { Component            } from '@angular/core';
import { CustomErrorHandler   } from '../../../app.module';
import { MCSDService } from '../../../_services/mcsd.service';
import { ConfigService, SomeSharedService } from 'src/app/_services/config-service.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
//
@Component({
  selector    : 'app-home-web',
  templateUrl : './home-web.component.html',
  styleUrls   : ['./home-web.component.css']
})
export class HomeWebComponent {
  //
  public  static get PageTitle()   : string {
    return '[INDICE]';
  }
  //
  public readonly pageTitle        : string = HomeWebComponent.PageTitle;
  //
  constructor(mcsdService : MCSDService, customErrorHandler : CustomErrorHandler)
  {
      //
      console.log(HomeWebComponent.PageTitle + " - [INGRESO]") ;
      //
      //mcsdService.SetLog(this.pageTitle,"PAGE_ANGULAR_DEMO_INDEX");
  }
}
