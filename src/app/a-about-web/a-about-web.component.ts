import { Component          } from '@angular/core';
import { CustomErrorHandler } from '../app.module';
//
@Component({
  selector: 'app-a-about-web',
  templateUrl: './a-about-web.component.html',
  styleUrls: ['./a-about-web.component.css']
})
export class AAboutWebComponent {
  //
  public static get PageTitle()   : string {
    //
    return '[ACERCA DE]';
  }
  //
  readonly pageTitle : string = AAboutWebComponent.PageTitle;
  //
  constructor(private customErrorHandler: CustomErrorHandler)
  {
      //
      console.log(AAboutWebComponent + "- [INGRESO]");
  }
}
