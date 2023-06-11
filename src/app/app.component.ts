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
  title             : string = "[MCSD - CONSULTAS]"; 
  appName           : string = "[MCSD - CONSULTAS]";
  appVersion        : string = '1.0.0.2';
  runtimeVersion    : string = VERSION.full;
 }   
