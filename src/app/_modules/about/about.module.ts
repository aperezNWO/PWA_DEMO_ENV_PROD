// AMGULAR MODULES
import { NgModule                } from '@angular/core';
import { CommonModule            } from '@angular/common';
// CUSTOM MODULES
import { SharedModule            } from '../shared/shared.module';
// CUSTOM COMPONENTS
import { ContactformComponent    } from './contactform/contactform.component';
import { IndexComponent          } from './index/index.component';
import { SCMComponent            } from './scm/scm.component';
import { TechnicalSpecsComponent } from './technicalspecs/technical-specs/technical-specs.component';
import { SpeechPanelComponent    } from 'src/app/_components/speech-panel/speech-panel.component';

// THIRD PARTY
import { NgbHighlight, NgbPaginationModule, NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  declarations: [
        IndexComponent,
        SCMComponent,
        TechnicalSpecsComponent,
        ContactformComponent,
        //BaseSortableHeader,
  ],
  imports: [
    CommonModule,
    SharedModule,
    SpeechPanelComponent,
    NgbHighlight,
    NgbPaginationModule,
    NgbAlertModule,
  ],
  exports : [
        IndexComponent,
        SCMComponent,
        TechnicalSpecsComponent,
        ContactformComponent,
     
  ]
})
export class AboutModule { 

}
