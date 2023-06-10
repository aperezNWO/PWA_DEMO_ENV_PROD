import { Component, VERSION } from '@angular/core';
//
@Component({
  selector    : 'app-root',
  templateUrl : './app.component.html',
  styleUrls   : ['./app.component.css']
})
//
export class AppComponent {
  //
  title             : string = "[MCSD - ALGORITMO - DIJKSTRA]"; 
  appName           : string = "[MCSD - ALGORITMO - DIJKSTRA]";
  appVersion        : string = '1.0.0.1';
  runtimeVersion    : string = VERSION.full;
 }   
