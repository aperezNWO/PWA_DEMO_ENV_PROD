import { Component } from '@angular/core';
//
@Component({
  selector       : 'app-algorithm-dijkstra',
  templateUrl    : './algorithm-dijkstra.component.html',
  styleUrls      : ['./algorithm-dijkstra.component.css']
})
//
export class AlgorithmDijkstraComponent {
  //--------------------------------------------------------------------------
  // PROPIEDADES COMUNES
  //--------------------------------------------------------------------------
  pageTitle            : string = '[ALGORITMOS - DISTANCIA MAS CORTA]';
  //
  static pageTitle()   : string {
    return '[ALGORITMOS - DISTANCIA MAS CORTA]';
  }
}
