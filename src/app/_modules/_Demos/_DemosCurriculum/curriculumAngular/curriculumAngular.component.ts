import { Component, ErrorHandler                                               } from '@angular/core';
import { Router                                                  } from '@angular/router';
import { PAGE_CURRICULUM_ANGULAR, PAGE_ID, PAGE_SIZE,SEARCH_TERM } from 'src/app/_models/common';
import { ConfigService                                           } from 'src/app/_services/__Utils/ConfigService/config.service';
import { SearchCustomService                                          } from 'src/app/_services/__Utils/SearchService/search-custom.service';
import { SearchCustomComponent                                        } from 'src/app/_components/search/search-custom.component ';
import { SharedModule } from 'src/app/_modules/shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { SpeechPanelComponent } from 'src/app/_components/speech-panel/speech-panel.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BaseSortableHeader } from 'src/app/_directives/sortable.directive';
import { CustomErrorHandler } from 'src/app/app.module';
@Component({
    selector: 'app-curriculum-angular',
    templateUrl: './curriculumAngular.component.html',
    styleUrl: './curriculumAngular.component.css',
    providers: [
        ConfigService,
        SearchCustomService,
        { provide: PAGE_ID, useValue: PAGE_CURRICULUM_ANGULAR }, // Unique ID for this component
        { provide: PAGE_SIZE, useValue: 8 },
        { provide: SEARCH_TERM,
            useFactory: (configService: ConfigService) => configService.queryUrlParams("searchTerm"),
            deps: [ConfigService], // Dependencies required by the factory function
        },
        // Referenciamos la clase que definimos arriba
        { provide: ErrorHandler, useClass: CustomErrorHandler },
    ],
    imports: [
        SharedModule,
        ReactiveFormsModule,
        SpeechPanelComponent,
        NgbModule,
        BaseSortableHeader,
    ],
    standalone: true
})
export class CurriculumAngularComponent extends SearchCustomComponent  
{
    //
    toogleLisCaption: string = "[Ir a Demos / Angular ...]";
    //
    constructor(
                public override searchService         : SearchCustomService,
                public          router                : Router,
    )  
    {
        //
        super(
              searchService);
    }
    toggleList() 
    {
      this.router.navigate(['/GridParam'], {
        queryParams: {
          pageName: 'PAGE_DEMOS_ANGULAR_JAVASCRIPT'
        }
      });
    }
} 