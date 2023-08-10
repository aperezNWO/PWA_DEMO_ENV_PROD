import { Component          } from '@angular/core';
import { CustomErrorHandler } from '../app.module';
import { MCSDService } from '../mcsd.service';
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
  constructor(private mcsdService : MCSDService, private customErrorHandler : CustomErrorHandler)
  {
      //
      console.log(AlgorithmWebComponent.PageTitle + " - [INGRESO]");
      //
      mcsdService.SetLog(this.pageTitle,"PAGE_ALGORITHM_INDEX");
  }
}
