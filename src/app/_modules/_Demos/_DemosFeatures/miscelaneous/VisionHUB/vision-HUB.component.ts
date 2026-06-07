// CORE
import { Component, OnInit, OnDestroy, ElementRef, inject, signal, viewChild, computed, effect, ViewChild, afterEveryRender } from '@angular/core';
import { ActivatedRoute               } from '@angular/router';

// Services
import { BackendService         } from 'src/app/_services/BackendService/backend.service';
import { OCRService             } from 'src/app/_services/__AI/OCRService/ocr.service';
import { ConfigService          } from 'src/app/_services/__Utils/ConfigService/config.service';
import { SpeechService          } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { ComputerVisionService  } from 'src/app/_services/__AI/ComputerVisionService/Computer-Vision.service';

// Models
import { PAGE_MISCELANEOUS_VISION_HUB, PAGE_TITLE_LOG, PAGE_TITLE_NO_SOUND } from 'src/app/_models/common';

// Components
import { BaseReferenceComponent                        } from 'src/app/_components/base-reference/base-reference.component';

// Librariesa
import { NgxSignaturePadComponent, NgxSignatureOptions } from '@eve-sama/ngx-signature-pad';
import { firstValueFrom, Subscription                  } from 'rxjs';

// Basic numeric enum
enum aiFeature {
  NonSelected = 0,
  OCR         = 1,  
  CV          = 2,  
}

enum captureSource 
{
  NonSelected = 0,
  Canvas      = 1,
  Camera      = 2  
}

enum engineLang
{
   Tesseract_NodeJs      = 1,
   Tesseract_CPP         = 2,
   Tesseract_Typescript  = 3,
   OpenCV_NodeJs         = 4,
   OpenCv_CPP            = 5,
   OpenCv_Typescript     = 6,
}

/*
aiFeature = 
  
          OCR : OCR 
          CV  : Computer Vision

langName  = 

          JS  : Node Js / javascript
          CPP : C++ 
          TS  : Angular / Typescript
*/

@Component({
  selector: 'app-vision-hub',
  templateUrl: './vision-HUB.component.html',
  styleUrl: './vision-HUB.component.css',
  providers: [{ provide: PAGE_TITLE_LOG, useValue: PAGE_MISCELANEOUS_VISION_HUB }],
  standalone: false 
})
export class VisionHUBComponent extends BaseReferenceComponent implements OnInit, OnDestroy {
  
  // --- Services ---
  public readonly ocrService  = inject(OCRService);
  public readonly cvService   = inject(ComputerVisionService);
  private readonly _route     = inject(ActivatedRoute);

  // --- Signals ---
  readonly selectedAiFeature  = signal<number>(0); 
  readonly selectedLangEngine = signal<number>(0);  
  readonly selectedSource     = signal<number>(0);  
  readonly isParsing          = signal(false);
  readonly capturedImage      = signal<string | null>(null);
  
  // --- View Queries ---
  readonly signature     = viewChild<NgxSignaturePadComponent>('signature');
  readonly videoElement  = viewChild<ElementRef<HTMLVideoElement>>('video');
  readonly canvasElement = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  @ViewChild('_engineList')    _engineList       : any;

  //
  private videoStream  : MediaStream    | null = null;
  private querySub     : Subscription   | null = null;
  public isFrontCamera : boolean               = true;

  //
  public options   : NgxSignatureOptions = {
    backgroundColor: '#FFFFFF',
    width          : 340,
    height         : 240,
    css            : { 'border': '2px solid #444', 'border-radius': '8px' }
  };
  
  //
  public engineList  : any = [];

  //
  constructor() {
    super(  inject(ConfigService)
          , inject(BackendService)
          , inject(ActivatedRoute)
          , inject(SpeechService), PAGE_TITLE_NO_SOUND);
  }

  //
  ngOnInit(): void {
    this.status_message.set("Synchronizing with URL...");
    this.syncStateFromUrl();
  }

  /**
   * Listens to the parameter stream continually to handle asynchronous hash arrivals.
   */
  private syncStateFromUrl(): void {
    this.querySub = this._route.queryParams.subscribe({
      next: async (params) => {

        // Skip execution if parameters haven't arrived or parsed yet
        if (!params || Object.keys(params).length === 0) {

          // default value    = CV
          this.selectedAiFeature.set(aiFeature.CV);
          
          // default language = Typescript
          let wantsTS: boolean = true;

          this.engineList =  [  
                     { id: 0                            , label: 'Please select \'Engine\'...'           , selected: false     }
                    ,{ id: engineLang.OpenCV_NodeJs     , label: 'OpenCV    -> Node.js'                  , selected: !wantsTS  }
                    ,{ id: engineLang.OpenCv_CPP        , label: 'OpenCV    -> C++'                      , selected: !wantsTS  }
                    ,{ id: engineLang.OpenCv_Typescript , label: 'OpenCV    -> Typescript'               , selected: wantsTS   }
          ];
          
          //
          console.log("engineList " + JSON.stringify (this.engineList) );

          // Default Engine/Language = OpenCv - Typescript
          this.selectedLangEngine.set(engineLang.OpenCv_Typescript);

          // force user to choose a source
          this.selectedSource.set(captureSource.NonSelected);

          //
          this.status_message.set("Ready (Defaults Loaded)");

          return;
        }

        console.log(` evaluating url parms ...`);

        //--------------------------------------
        // 1. Parse 'Ai Feature' : OCR | CV
        //--------------------------------------
        let targetFeat = aiFeature.OCR ; // OCR
        //
        if (params['aiFeature']) {
          //
          const f = params['aiFeature'].toString().toUpperCase();
          //  
          if (f === 'CV') targetFeat = aiFeature.CV; // CV
        }
        // 
        this.selectedAiFeature.set(targetFeat);

        //--------------------------------------------------------  
        // 2. Parse [langName + Engine] based on 'AI Feature
        //--------------------------------------------------------  

        // feature : 'OCR'? 'language values' = 1 (tesseract node.js) else 'language values' = 3 (opencv node.js)
        let targetEngLang = (targetFeat === aiFeature.OCR) ?  engineLang.Tesseract_NodeJs : engineLang.OpenCV_NodeJs;  
        if (params['langName']) {
            //
            const langName          = params['langName'].toString().toUpperCase();

            // if feature is 'OCR' 1
            if (targetFeat === aiFeature.OCR) { 
              // 
              switch(langName){
                 case 'JS': 
                     targetEngLang = engineLang.Tesseract_NodeJs;
                 break;
                 case 'CPP':
                     targetEngLang = engineLang.Tesseract_CPP;
                 break;
                 case 'TS':
                     targetEngLang = engineLang.Tesseract_Typescript;
                 break;                  
              }                 
            } 
            
            // if feature is 'CV' 2
            if (targetFeat === aiFeature.CV) {          
              // 
              switch(langName){
                 case 'JS': 
                     targetEngLang = engineLang.OpenCV_NodeJs;
                 break;
                 case 'CPP':
                     targetEngLang = engineLang.OpenCv_CPP;
                 break;
                 case 'TS':
                     targetEngLang = engineLang.OpenCv_Typescript;
                 break;                  
              }   
            }

            //
            if  (this.selectedAiFeature() === aiFeature.OCR) 
            {
               this.engineList =  [  { id: 0                               , label: 'Please select \'Engine\'...' , selected: false      }
                                   , { id: engineLang.Tesseract_NodeJs     , label: 'Tesseract -> Node.js'        , selected: (targetEngLang == engineLang.Tesseract_NodeJs     ) }
                                   , { id: engineLang.Tesseract_CPP        , label: 'Tesseract -> C++'            , selected: (targetEngLang == engineLang.Tesseract_CPP        ) } 
                                   , { id: engineLang.Tesseract_Typescript , label: 'Tesseract -> Typescript'     , selected: (targetEngLang == engineLang.Tesseract_Typescript ) } ];
            } 
            //
            if  (this.selectedAiFeature() === aiFeature.CV)  
            {
              this.engineList  =  [ { id: 0                            , label: 'Please select \'Engine\'...'           , selected: false       }
                                   ,{ id: engineLang.OpenCV_NodeJs     , label: 'OpenCV    -> Node.js'                  , selected: (targetEngLang == engineLang.OpenCV_NodeJs)         }
                                   ,{ id: engineLang.OpenCv_CPP        , label: 'OpenCV    -> C++'                      , selected: (targetEngLang == engineLang.OpenCv_CPP   )         }   
                                   ,{ id: engineLang.OpenCv_Typescript , label: 'OpenCV    -> Typescript'               , selected: (targetEngLang == engineLang.OpenCv_Typescript)     }  ] ;
            }
            //
            this.selectedLangEngine.set(targetEngLang); 
            //
            console.log(` Changed lang/engine to  :  ${targetEngLang}`);

        } // end of 'langName' param evaluation 
  
        this.status_message.set("Configuration loaded from URL query.");
      }
    });
  }

  ngOnDestroy(): void {
    this.stopCamera();
    if (this.querySub) {
      this.querySub.unsubscribe();
    }
  }

  // --- Logic & Processors ---

  async onSourceChange(event: Event) {
    const val = Number((event.target as HTMLSelectElement).value);
    this.selectedSource.set(val);
    this.stopCamera();
    this.capturedImage.set(null);
    if (val === captureSource.Camera) await this.startCamera();
  }

  clearCanvas() { this.signature()?.clear(); }

  async saveSignature(): Promise<void> {
    const pad = this.signature();
    if (!pad || (pad as any).isEmpty()) {
      this.status_message.set("Canvas is empty.");
      return;
    }
    await this.processUpload(pad.toDataURL());
  }

  public async processUpload(base64: string) {
    this.isParsing.set(true);
    const engineId = this.selectedLangEngine();
    this.status_message.set("Analyzing...");

    try {
      let result = "";
      switch (engineId) {
        case engineLang.Tesseract_NodeJs: // NODE.JS  --> OCR
              result = (await firstValueFrom(this.ocrService.uploadBase64ImageNodeJs(base64))).message;
          break;
        case engineLang.Tesseract_CPP   :  // C++     --> CPP
             result = (await firstValueFrom(this.ocrService.uploadBase64ImageCPP(base64))).message;
          break;
        case engineLang.Tesseract_Typescript  :  // Angular --> OCR
             const img_ts_ocr     = await this.loadImage(base64);
             const text_ts_ocr    = await this.ocrService._Tesseract_ts_detectText(img_ts_ocr);
             result               = text_ts_ocr.length > 0 ? `Detected Text: ${text_ts_ocr}` : "No Text found.";
          break;  
        case engineLang.OpenCV_NodeJs   :  // NODE.JS --> CV
            const shapes = (await firstValueFrom(this.cvService.uploadBase64ImageNodeJs(base64))).message;
            console.log('returning value from opencv js : ' + shapes);
            result         = shapes.length > 0 ? ` ${JSON.stringify(shapes)}` : "No shapes found.";
          break;
        case engineLang.OpenCv_CPP      : // CPP     --> CV
            result = (await firstValueFrom(this.cvService._OpenCv_CPP_uploadBase64Image(base64))).message;
          break;
        case engineLang.OpenCv_Typescript  :    // Angular --> CV
     const img_ts_cv     = await this.loadImage(base64);
            const shapes_ts_cv  = this.cvService._OpenCv_ts_detectShapes(img_ts_cv);
            result              = shapes_ts_cv.length > 0 ? `Detected: ${shapes_ts_cv.join(', ')}` : "No shapes found.";
          break;
      }
      this.status_message.set(result);
    } catch (err: any) {
      this.status_message.set("Error: " + err.message);
    } finally {
      this.isParsing.set(false);
    }
  }

  private loadImage(base64: string): Promise<HTMLImageElement> {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = base64;
    });
  }

  async startCamera() {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.isFrontCamera ? 'user' : 'environment' }
      });
      setTimeout(() => {
        const video = this.videoElement()?.nativeElement;
        if (video) video.srcObject = this.videoStream;
      }, 200);
    } catch (err) { this.status_message.set("Camera error."); }
  }

  stopCamera() { 
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(t => t.stop());
      this.videoStream = null; 
    }
  }

  capturePhoto() {
    const video = this.videoElement()?.nativeElement;
    const canvas = this.canvasElement()?.nativeElement;
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth; 
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0);
      this.capturedImage.set(canvas.toDataURL('image/png'));
      this.stopCamera();
    }
  }

  //
  async flipCamera() : Promise<void> {
    //
    this.isFrontCamera = !this.isFrontCamera;
    this.stopCamera();
    await this.startCamera();
  }
}