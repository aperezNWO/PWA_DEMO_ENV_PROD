import { NgModule                     } from '@angular/core';
import { CommonModule                 } from '@angular/common';
// Import only the components related to this feature
import { FilesGenerationBaseComponent } from './files-generation-base/files-generation-base/files-generation-base.component';
import { FilesGenerationCSVComponent  } from './files-generation-csv/files-generation-csv.component';
import { FilesGenerationPDFComponent  } from './files-generation-pdf/files-generation-pdf.component';
import { FilesGenerationXLSComponent  } from './files-generation-xls/files-generation-xls.component';
import { ChartComponent               } from './chart/chart.component';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { NgbAlertModule, NgbHighlight, NgbModule, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgChartsModule } from 'ng2-charts';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { BaseReferenceComponent } from 'src/app/_components/base-reference/base-reference.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    FilesGenerationBaseComponent,
    FilesGenerationCSVComponent,
    FilesGenerationPDFComponent,
    FilesGenerationXLSComponent,
    ChartComponent,
    BaseReferenceComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatListModule,
    MatTableModule,
    MatPaginatorModule,
    MatTabsModule,
    MatFormFieldModule,
    NgbHighlight,
    NgbPaginationModule,
    NgbAlertModule,
    MatTableModule,   // If your components use tables
    MatInputModule,   // If they use inputs
    NgbModule,        // If they use Bootstrap components
    NgChartsModule,    // Since you have a ChartComponent!
  ],
  exports: [
    FilesGenerationBaseComponent,
    FilesGenerationCSVComponent,
    FilesGenerationPDFComponent,
    FilesGenerationXLSComponent,
    ChartComponent,
    BaseReferenceComponent
  ]
})
export class FileGenerationModule { 
  //
}