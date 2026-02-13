// ANGYULAR MODULES
import { NgModule     } from '@angular/core';
import { CommonModule } from '@angular/common';
// CUSTOM MODULES 
import { SharedModule               } from 'src/app/_modules/shared/shared.module';
import { ChatComponent              } from './chat/chat/chat.component';
import { FractalDemoComponent       } from './fractalDemo/juliaform.component';
import { OcrPhotoCaptureComponent   } from './ocr-photo-capture/ocr-photo-capture.component';
// THIRD PARTY 
import { NgxSignaturePadModule      } from '@eve-sama/ngx-signature-pad';
import { ComputerVisionComponent    } from './computer-vision/computer-vision.component';

@NgModule({
  declarations: [
        OcrPhotoCaptureComponent,
        ChatComponent,
        FractalDemoComponent,
        ComputerVisionComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    NgxSignaturePadModule
  ],
  exports : [
        OcrPhotoCaptureComponent,
        ChatComponent,
        FractalDemoComponent,
        ComputerVisionComponent,
  ]
})
export class MiscelaneousModule { 
  //
}
