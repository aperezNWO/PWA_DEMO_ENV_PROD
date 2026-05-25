import { Component                                                     } from '@angular/core';
import { Router                                                        } from '@angular/router';
import { _BaseModel                                                    } from 'src/app/_models/entity.model';
import { PAGE_ID, PAGE_SIZE,SEARCH_TERM                                } from 'src/app/_models/common';
import { _environment                                                  } from 'src/environments/environment';
import { ConfigService                                                 } from 'src/app/_services/__Utils/ConfigService/config.service';
import { SearchService                                                 } from 'src/app/_services/__Utils/SearchService/search.service';
import { SearchComponent                                               } from '../search/search.component';



@Component({
    selector: 'app-grid-param',
    templateUrl: './grid-param.component.html',
    styleUrl: './grid-param.component.css',
    providers: [
        ConfigService,
        SearchService,
        { provide: PAGE_ID,
            useFactory: (configService: ConfigService) => configService.queryUrlParams("pageName"),
            deps: [ConfigService]
        }, // Dependencies required by the factory function
        { provide: PAGE_SIZE, useValue: 8 },
        { provide: SEARCH_TERM,
            useFactory: (configService: ConfigService) => configService.queryUrlParams("searchTerm"),
            deps: [ConfigService], // Dependencies required by the factory function
        }
    ],
    standalone: false 
})
export class GridParamComponent extends SearchComponent  
{
      //
      toogleLisCaption: string = "[Ir a Referencia - <page_nanme>...]";
      //
      constructor(
                  public override searchService         : SearchService,
                  public          router                : Router,
      )
      {
          //
          super(searchService);
      }
      //
      toggleList() 
      {
          //
          this.router.navigateByUrl('/<pageName>'); // Redirects to '/target-route'
      }

} 
