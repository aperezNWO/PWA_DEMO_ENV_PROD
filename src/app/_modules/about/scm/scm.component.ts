import { Component                                                      } from '@angular/core';
import { _environment                                                   } from 'src/environments/environment';
import { _BaseModel                                                     } from 'src/app/_models/entity.model';
import { PAGE_ABOUT_SCM, PAGE_ID, PAGE_SIZE, SEARCH_TERM                } from 'src/app/_models/common';
import { SearchCustomService                                                 } from 'src/app/_services/__Utils/SearchService/search-custom.service';
import { SearchCustomComponent                                               } from 'src/app/_components/search/search-custom.component ';

//
@Component({
    selector: 'app-scm',
    templateUrl: './scm.component.html',
    styleUrls: ['./scm.component.css'],
    providers: [
        SearchCustomService,
        { provide: PAGE_ID, useValue: PAGE_ABOUT_SCM }, // Unique ID for this component
        { provide: PAGE_SIZE, useValue: 8 },
        { provide: SEARCH_TERM, useValue: "" }
    ],
    standalone: false
})
export class SCMComponent extends SearchCustomComponent {
  //
  constructor(
              public override searchService         : SearchCustomService,
  )
  {
      //
      super(searchService);
  }
} 