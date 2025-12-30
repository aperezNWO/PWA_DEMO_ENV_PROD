import { HttpClient                     } from '@angular/common/http';
import { Component, ViewChild           } from '@angular/core';
import { ActivatedRoute                 } from '@angular/router';
import { BaseComponent                  } from 'src/app/_components/base/base.component';
import { PAGE_MISCELANEOUS_FRACTAL_DEMO, PAGE_TITLE_LOG } from 'src/app/_models/common';
import { BackendService                 } from 'src/app/_services/BackendService/backend.service';
import { ConfigService                  } from 'src/app/_services/__Utils/ConfigService/config.service';
import { ComputerVisionService          } from 'src/app/_services/__AI/ComputerVisionService/Computer-Vision.service';
import { SpeechService                  } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { PdfService                     } from 'src/app/_services/__FileGeneration/pdf.service';

@Component({
  selector    : 'app-juliaform',
  templateUrl : './juliaform.component.html',
  styleUrl    : './juliaform.component.css',
  providers   : [
    { 
      provide : PAGE_TITLE_LOG, 
      useValue: PAGE_MISCELANEOUS_FRACTAL_DEMO 
    },
  ]
})
export class FractalDemoComponent  extends BaseComponent {
  //
  maxIterations : number        = 500;
  realPart      : number        = -0.4;
  imagPart      : number        = 0.6;
  imageUrl      : string | null = null;
  submitTitle   : string        = "Generate Fractal";
  //
  @ViewChild('_fractal_image')  _fractal_image  : any;
  //
  constructor(public          computervisionService   : ComputerVisionService,
              public override configService           : ConfigService,
              public override backendService          : BackendService,
              public override route                   : ActivatedRoute,
              public override speechService           : SpeechService,
              public http                             : HttpClient,
              public pdfEngine                        : PdfService,
  )
  {
      //
      super(configService,
            backendService,
            route,
            speechService,
            PAGE_MISCELANEOUS_FRACTAL_DEMO);
  }
  // 
  onSubmit() {
    //
    this.status_message.set("[Generating please wait...]");
    //
    // Fetch the image as a blob
    this.computervisionService._OpenCv_GetFractal(this.maxIterations,this.realPart,this.imagPart).subscribe(
      (response: Blob) => {
        // Convert the blob into an object URL
        this.imageUrl = URL.createObjectURL(response);
        //
        this.status_message.set("[Image generated correctly]");
      },
      (error) => {
        //
        console.error('Error fetching the image:', error);
        //
        this.imageUrl = null;
        //
        this.status_message.set("[An error occurrued, plase try again]");
      }
    );
  }
  //
  GeneratePDF() {
    //
    let fileName_input  : string     = `FRACTAL_IMAGE`;
    let fileName_output : string     = '';
    //
    this.status_message.set('...Generating PDF...');
    //
    this.pdfEngine._GetPDF
      (
        this.pageTitle,
        this._fractal_image,
        this._fractal_image,
        fileName_input,
      )
      .subscribe(
      {
        next: (fileName: string) =>{
          //
          fileName_output = fileName;
        },
        error: (error: { message: string; }) => {
            //
            this.status_message.set('An error occured : ' + error.message);
        },
        complete: () => {
            //
            this.status_message.set(`[PDF File generated correctly]`);
        }
      }
    );      
  }
}
