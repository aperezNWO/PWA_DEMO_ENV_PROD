import { Component            } from '@angular/core';
import { CustomErrorHandler   } from '../app.module';
import { throwError           } from "rxjs";
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
  constructor(customErrorHandler : CustomErrorHandler)
  {
      //
      console.log(HomeWebComponent.PageTitle + " - [INGRESO]") ;
      //
  }
}
