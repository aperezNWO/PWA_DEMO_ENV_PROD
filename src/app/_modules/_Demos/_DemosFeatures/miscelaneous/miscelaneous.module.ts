// ANGYULAR MODULES
import { ErrorHandler, NgModule     } from '@angular/core';
import { CommonModule               } from '@angular/common';
// CUSTOM MODULES 
import { SharedModule               } from 'src/app/_modules/shared/shared.module';
import { ChatComponent              } from './chat/chat/chat.component';
import { FractalDemoComponent       } from './fractalDemo/fractalDemo.component';
import { VisionHUBComponent         } from './VisionHUB/vision-HUB.component';
import { LLMTesting                 } from './LLMTesting/LLMTesting.component';
// THIRD PARTY 
import { NgxSignaturePadModule      } from '@eve-sama/ngx-signature-pad';
import { CustomErrorHandler         } from 'src/app/app.module';


@NgModule({
  declarations: [
        VisionHUBComponent,
        ChatComponent,
        FractalDemoComponent,
        LLMTesting
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
        LLMTesting
  ],
  providers : [
      // Referenciamos la clase que definimos arriba
    { provide: ErrorHandler, useClass: CustomErrorHandler },
  ]
})
export class MiscelaneousModule { 
  //
}
