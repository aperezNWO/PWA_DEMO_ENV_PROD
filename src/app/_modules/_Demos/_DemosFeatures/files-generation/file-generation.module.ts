import { ErrorHandler, NgModule                         } from '@angular/core';
import { CommonModule                     } from '@angular/common';
import { RouterModule                     } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule               } from '@angular/material/input';
import { MatTableModule               } from '@angular/material/table';
import { MatFormFieldModule           } from '@angular/material/form-field';
import { MatListModule                } from '@angular/material/list';
import { MatPaginatorModule           } from '@angular/material/paginator';
import { MatTabsModule                } from '@angular/material/tabs';
// Import only the components related to this feature
import { SharedModule                 } from 'src/app/_modules/shared/shared.module';
import { FilesGenerationBaseComponent } from './files-generation-base/files-generation-base/files-generation-base.component';
import { FilesGenerationCSVComponent  } from './files-generation-csv/files-generation-csv.component';
import { FilesGenerationPDFComponent  } from './files-generation-pdf/files-generation-pdf.component';
import { FilesGenerationXLSComponent  } from './files-generation-xls/files-generation-xls.component';
import { ChartComponent               } from './chart/chart.component';
import { NgbAlertModule, NgbHighlight, NgbModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgChartsModule                                               } from 'ng2-charts'
import { CustomErrorHandler } from 'src/app/app.module';

@NgModule({
  declarations: [
    FilesGenerationBaseComponent,
    FilesGenerationCSVComponent,
    FilesGenerationPDFComponent,
    FilesGenerationXLSComponent,
    ChartComponent,
  ],
  imports: [
    SharedModule,
    CommonModule,
    NgChartsModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatListModule,
    MatTableModule,
    MatPaginatorModule,
    MatTabsModule,
    MatFormFieldModule,
    MatTableModule,   // If your components use tables
    MatInputModule,   // If they use inputs
    NgbModule,        // If they use Bootstrap components
    NgChartsModule,    // Since you have a ChartComponent!
    NgbHighlight,
    NgbPaginationModule,
    NgbAlertModule,
  ],
  exports: [
    FilesGenerationBaseComponent,
    FilesGenerationCSVComponent,
    FilesGenerationPDFComponent,
    FilesGenerationXLSComponent,
    ChartComponent,
  ],
  providers : [
      // Referenciamos la clase que definimos arriba
    { provide: ErrorHandler, useClass: CustomErrorHandler },
  ]
})
export class FileGenerationModule { 
  //
}