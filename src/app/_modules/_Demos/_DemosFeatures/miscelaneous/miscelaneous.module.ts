// ANGYULAR MODULES
import { NgModule     } from '@angular/core';
import { CommonModule } from '@angular/common';
// CUSTOM MODULES 
import { SharedModule               } from 'src/app/_modules/shared/shared.module';
import { ChatComponent              } from './chat/chat/chat.component';
import { FractalDemoComponent       } from './fractalDemo/juliaform.component';
import { VisionHUBComponent         } from './VisionHUB/vision-HUB.component';
// THIRD PARTY 
import { NgxSignaturePadModule      } from '@eve-sama/ngx-signature-pad';

@NgModule({
  declarations: [
        VisionHUBComponent,
        ChatComponent,
        FractalDemoComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    NgxSignaturePadModule,
  ],
  exports : [
        VisionHUBComponent,
        ChatComponent,
        FractalDemoComponent,
  ]
})
export class MiscelaneousModule { 
  //
}
