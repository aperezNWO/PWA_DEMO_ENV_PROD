import { Component } from '@angular/core';

@Component({
  selector: 'app-home-web',
  templateUrl: './home-web.component.html',
  styleUrls: ['./home-web.component.css']
})
export class HomeWebComponent {
  //
  pageTitle            : string = '[DEMOS - PROGRAMACION]';
  //
  static pageTitle()   : string {
    return '[DEMOS - PROGRAMACION]';
  }
}
