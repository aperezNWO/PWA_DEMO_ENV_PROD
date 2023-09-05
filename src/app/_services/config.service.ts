import { Injectable } from '@angular/core';
//
@Injectable({
  providedIn: 'root'
})
// estructura archivo "./assets/config.json"
export class ConfigService {
  //
  public baseUrl    : string | undefined = '';
  public appName    : string | undefined = '';
  public appVersion : string | undefined = '';
  //
  constructor() { }
}
