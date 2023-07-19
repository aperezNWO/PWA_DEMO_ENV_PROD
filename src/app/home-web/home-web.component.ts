import { Component, ViewChild } from '@angular/core';
import { AppComponent         } from '../app.component';

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
  constructor()
  {
      //
      console.log(HomeWebComponent.PageTitle + " - [INGRESO]") ;
  }
}
