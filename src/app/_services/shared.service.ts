import { Injectable } from '@angular/core';
//
@Injectable({
  providedIn: 'root'
})
//
export class SharedService {
  //
  public globalVar : string | undefined = '';
  //
  constructor() { }
}
//
@Injectable({
  providedIn: 'root'
})
//
export class ConfigService {
  //
  public baseUrl : string | undefined;
  //
  constructor() { }
}
