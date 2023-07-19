import { Component } from '@angular/core';
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
}
