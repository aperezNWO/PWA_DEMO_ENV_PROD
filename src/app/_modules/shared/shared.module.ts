import { NgModule                           } from '@angular/core';
import { CommonModule                       } from '@angular/common';
import { FormsModule, ReactiveFormsModule   } from '@angular/forms';
import { RouterModule                       } from '@angular/router'; // 1. Add this import
import { BaseReferenceComponent             } from '../../_components/base-reference/base-reference.component';

@NgModule({
  declarations: [
    BaseReferenceComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule // 2. Add this to imports
  ],
  exports: [
    BaseReferenceComponent,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule // 3. Export it so other modules using SharedModule get routing too
  ]
})
export class SharedModule {
  
 }