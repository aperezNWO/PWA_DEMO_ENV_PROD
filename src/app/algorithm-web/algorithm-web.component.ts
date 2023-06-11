import { Component } from '@angular/core';

@Component({
  selector: 'app-algorithm-web',
  templateUrl: './algorithm-web.component.html',
  styleUrls: ['./algorithm-web.component.css']
})
//
export class AlgorithmWebComponent {
  //
  pageTitle            : string = '[ALGORITMOS]';
  //
  static pageTitle()   : string {
    //
    return '[ALGORITMOS]';
  }
}
