// AMGULAR MODULES
import { ErrorHandler, NgModule               } from '@angular/core';
import { CommonModule, DecimalPipe            } from '@angular/common';
import { FormsModule                          } from '@angular/forms';
import { RouterLink                           } from '@angular/router';
// CUSTOM MODULES
import { SharedModule            } from '../shared/shared.module';
import { BaseSortableHeader      } from 'src/app/_directives/sortable.directive';
import { CustomErrorHandler      } from 'src/app/app.module';
// CUSTOM COMPONENTS

import { ContactformComponent                    } from './contactform/contactform.component';
import { IndexComponent, IndexSortableHeader     } from './index/index.component';
import { SCMComponent                            } from './scm/scm.component';
import { TechnicalSpecsComponent                 } from './technicalspecs/technical-specs/technical-specs.component';
import { SpeechPanelComponent                    } from 'src/app/_components/speech-panel/speech-panel.component';
// THIRD PARTY
import { NgbHighlight, NgbPaginationModule, NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { ProgramDescriptionComponent                       } from './programDescription/program-description.component';

@NgModule({
  declarations: [
        IndexComponent,
        SCMComponent,
        TechnicalSpecsComponent,
        ContactformComponent,
        ProgramDescriptionComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    SpeechPanelComponent,
    NgbHighlight,
    NgbPaginationModule,
    NgbAlertModule,
    BaseSortableHeader,
    DecimalPipe, 
    IndexSortableHeader, 
    FormsModule, 
    RouterLink
  ],
  exports : [
        IndexComponent,
        SCMComponent,
        TechnicalSpecsComponent,
        ContactformComponent,
     
  ],
  providers : [
    // Referenciamos la clase que definimos arriba
    { provide: ErrorHandler, useClass: CustomErrorHandler },
  ]
})
export class AboutModule { 

}
