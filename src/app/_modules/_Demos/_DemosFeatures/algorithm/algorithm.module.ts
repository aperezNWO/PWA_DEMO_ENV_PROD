import { NgModule     } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule                } from 'src/app/_modules/shared/shared.module';
import { AlgorithmCollisionComponent } from './algorithm-collision/algorithm-collision.component';
import { AlgorithmDijkstraComponent  } from './algorithm-dijkstra/algorithm-dijkstra.component';
import { AlgorithmRegExComponent     } from './algorithm-reg-ex/algorithm-reg-ex.component';
import { AlgorithmSortComponent      } from './algorithm-sort/algorithm-sort.component';




@NgModule({
  declarations: [
      AlgorithmRegExComponent,
      AlgorithmSortComponent,
      AlgorithmDijkstraComponent,
      AlgorithmCollisionComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
  ],
  exports : [
      AlgorithmRegExComponent,
      AlgorithmSortComponent,
      AlgorithmDijkstraComponent,
      AlgorithmCollisionComponent,
  ]
})
export class AlgorithmModule { }
