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
   Tesseract_NodeJs   = 1,
   Tesseract_CPP      = 2,
   OpenCV_NodeJs      = 3,
   OpenCv_CPP         = 4
}

/*
aiFeature = 
  
          OCR : OCR 
          CV  : Computer Vision

langName  = 

          JS  : Node Js / javascript
          CPP : C++ 
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

          // default value = CV
          this.selectedAiFeature.set(aiFeature.CV);
          
          // default language = c++
          let wantsCpp: boolean = true;

          this.engineList =  [ { id: 0, label: 'Please select \'Engine\'...' , selected: false     }
                    ,{ id: engineLang.OpenCV_NodeJs , label: 'OpenCV    -> Node.js'                  , selected: !wantsCpp }
                    ,{ id: engineLang.OpenCv_CPP    , label: 'OpenCV    -> C++'                      , selected: wantsCpp  }];
          
          this.selectedLangEngine.set(engineLang.OpenCv_CPP);

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
            const l          = params['langName'].toString().toUpperCase();
            const wantsCpp   = (l === 'CPP');

            // if feature is 'OCR' 1
            if (targetFeat === aiFeature.OCR) { 
              // if langName is 'CPP' engine== 2 'tesseract for c++' else  engine= 1 'tesseract for node.js'
              targetEngLang = wantsCpp ? engineLang.Tesseract_CPP  : engineLang.Tesseract_NodeJs;
            } else {
              // if langName is 'CPP' engine== 4 'opencv for c++'    else  engine= 3 'opencv    for node.js'
              targetEngLang = wantsCpp ? engineLang.OpenCv_CPP     : engineLang.OpenCV_NodeJs;
            }

            //
            if  (this.selectedAiFeature() === aiFeature.OCR) 
            {
               this.engineList =  [  { id: 0, label: 'Please select \'Engine\'...' , selected: false     }
                                   , { id: engineLang.Tesseract_NodeJs, label: 'Tesseract -> Node.js'        , selected: !wantsCpp }
                                   , { id: engineLang.Tesseract_CPP   , label: 'Tesseract -> C++'            , selected: wantsCpp  } ];
            } else 
            {
               this.engineList =  [ { id: 0, label: 'Please select \'Engine\'...' , selected: false }
                                   ,{ id: engineLang.OpenCV_NodeJs, label: 'OpenCV    -> Node.js'        , selected: !wantsCpp }
                                   ,{ id: engineLang.OpenCv_CPP   , label: 'OpenCV    -> C++'            , selected: wantsCpp }];
            }
            //
            this.selectedLangEngine.set(targetEngLang); 
            //
            console.log(` Changed lang/engine to  :  ${targetEngLang}`);

        } // end of 'langName' param evaluation 

        //---------------------------------------------------------------
        // 3. Parse Input Source (CNV | CAM)
        //---------------------------------------------------------------
        /*
        let targetSrc = captureSource.NonSelected;
        
        // Handle stream cycle changes if switching directly to camera
        if (targetSrc !== this.selectedSource()) {
          this.selectedSource.set(targetSrc);
          this.stopCamera();
          this.capturedImage.set(null);
          if (targetSrc === captureSource.Camera) {
            await this.startCamera();
          }
        }*/

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
        case engineLang.OpenCV_NodeJs   :  // NODE.JS --> CV
          const img    = await this.loadImage(base64);
          const shapes = this.cvService._OpenCv_js_detectShapes(img);
          result       = shapes.length > 0 ? `Detected: ${shapes.join(', ')}` : "No shapes found.";
          break;
        case engineLang.OpenCv_CPP      : // CPP     --> CV
          //console.log('returning value from opencv c++ : ' + firstValueFrom(this.cvService._OpenCv_CPP_uploadBase64Image(base64)));
          result = (await firstValueFrom(this.cvService._OpenCv_CPP_uploadBase64Image(base64))).message;
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