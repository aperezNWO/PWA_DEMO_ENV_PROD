import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  public baseUrl : string | undefined;
  //
  constructor() { }
}

@Injectable({
  providedIn: 'root'
})
export class SomeSharedService {
  public globalVar : string | undefined = '';
}
