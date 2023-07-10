import { Component } from '@angular/core';

@Component({
  selector    : 'app-home-web',
  templateUrl : './home-web.component.html',
  styleUrls   : ['./home-web.component.css']
})
export class HomeWebComponent {
  //
  pageTitle            : string = '[INDICE]';
  //
  static pageTitle()   : string {
    return '[INDICE]';
  }
}
