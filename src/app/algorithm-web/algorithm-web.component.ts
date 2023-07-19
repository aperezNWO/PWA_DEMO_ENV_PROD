import { Component } from '@angular/core';
//
@Component({
  selector: 'app-algorithm-web',
  templateUrl: './algorithm-web.component.html',
  styleUrls: ['./algorithm-web.component.css']
})
//
export class AlgorithmWebComponent {
  //
  public static get PageTitle(): string
  {
     return '[ALGORITMOS]'; 
  }
  //
  readonly pageTitle : string =  AlgorithmWebComponent.PageTitle;
  //
}
