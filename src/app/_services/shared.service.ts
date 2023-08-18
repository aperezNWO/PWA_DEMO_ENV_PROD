import { Injectable } from '@angular/core';
//
@Injectable({
  providedIn: 'root'
})
//
export class SharedService {
  //
  public baseUrl : string | undefined = '';
  //
  constructor() { }
}
//
@Injectable({
  providedIn: 'root'
})
// estructura archivo "./assets/config.json"
export class ConfigService {
  //
  public baseUrl : string | undefined = '';
  //
  constructor() { }
}
