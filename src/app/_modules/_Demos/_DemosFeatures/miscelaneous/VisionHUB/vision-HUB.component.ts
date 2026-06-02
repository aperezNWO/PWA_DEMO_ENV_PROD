// CORE
import { Component, OnInit, OnDestroy, ElementRef, inject, signal, viewChild, computed, effect, ViewChild } from '@angular/core';
import { ActivatedRoute               } from '@angular/router';

// Services
import { BackendService         } from 'src/app/_services/BackendService/backend.service';
import { OCRService             } from 'src/app/_services/__AI/OCRService/ocr.service';
import { ConfigService          } from 'src/app/_services/__Utils/ConfigService/config.service';
import { SpeechService          } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { ComputerVisionService  } from 'src/app/_services/__AI/ComputerVisionService/Computer-Vision.service';

// Models
import { PAGE_MISCELANEOUS_OCR, PAGE_TITLE_LOG, PAGE_TITLE_NO_SOUND } from 'src/app/_models/common';

// Components
import { BaseReferenceComponent                        } from 'src/app/_components/base-reference/base-reference.component';

// Librariesa
import { NgxSignaturePadComponent, NgxSignatureOptions } from '@eve-sama/ngx-signature-pad';
import { firstValueFrom, Subscription                  } from 'rxjs';
@Component({
  selector: 'app-vision-hub',
  templateUrl: './vision-HUB.component.html',
  styleUrl: './vision-HUB.component.css',
  providers: [{ provide: PAGE_TITLE_LOG, useValue: PAGE_MISCELANEOUS_OCR }],
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

          // default value = ocr
          this.selectedAiFeature.set(1);
          
          // default language = c++
          let wantsCpp: boolean = true;

          this.engineList =  [ { id: 0, label: 'Please select \'Engine\'...' , selected: false     }
                    ,{ id: 3, label: 'OpenCV    -> Node.js'                  , selected: !wantsCpp }
                    ,{ id: 4, label: 'OpenCV    -> C++'                      , selected: wantsCpp  }];
          
          this.selectedLangEngine.set(1);

          // force user to choose a source
          this.selectedSource.set(0);

          //
          this.status_message.set("Ready (Defaults Loaded)");

          return;
        }

        console.log(` evaluating url parms ...`);

        //--------------------------------------
        // 1. Parse 'Ai Feature' : OCR | CV
        //--------------------------------------
        let targetFeat = 1; // OCR
        //
        if (params['aiFeature']) {
          //
          const f = params['aiFeature'].toString().toUpperCase();
          //  
          if (f === 'CV') targetFeat = 2; // CV
        }
        // 
        this.selectedAiFeature.set(targetFeat);

        //--------------------------------------------------------  
        // 2. Parse [langName + Engine] based on 'AI Feature
        //--------------------------------------------------------  

        // feature : 'OCR'? 'language values' = 1 (tesseract node.js) else 'language values' = 3 (opencv node.js)
        let targetLangEng = (targetFeat === 1) ? 1 : 3;  
        if (params['langName']) {
            //
            const l          = params['langName'].toString().toUpperCase();
            const wantsCpp   = (l === 'CPP');

            // if feature is 'OCR'
            if (targetFeat === 1) { 
              // if langName is 'CPP' engine== 2 'tesseract for c++' else  engine= 1 'tesseract for node.js'
              targetLangEng = wantsCpp ? 2 : 1;
            } else {
              // if langName is 'CPP' engine== 4 'opencv for c++'    else  engine= 3 'opencv    for node.js'
              targetLangEng = wantsCpp ? 4 : 3;
            }

            //
            if  (this.selectedAiFeature() === 1) 
            {
               this.engineList =  [  { id: 0, label: 'Please select \'Engine\'...' , selected: false     }
                                   , { id: 1, label: 'Tesseract -> Node.js'        , selected: !wantsCpp }
                                   , { id: 2, label: 'Tesseract -> C++'            , selected: wantsCpp  } ];
            } else 
            {
               this.engineList =  [ { id: 0, label: 'Please select \'Engine\'...' , selected: false }
                                   ,{ id: 3, label: 'OpenCV    -> Node.js'        , selected: !wantsCpp }
                                   ,{ id: 4, label: 'OpenCV    -> C++'            , selected: wantsCpp }];
            }
            //
            this.selectedLangEngine.set(targetLangEng); 
            //
            console.log(` Changed lang/engine to  :  ${targetLangEng}`);

        } // end of 'langName' param evaluation 

        //---------------------------------------------------------------
        // 3. Parse Input Source (CNV | CAM)
        //---------------------------------------------------------------
        let targetSrc = 0;
        
        // Handle stream cycle changes if switching directly to camera
        if (targetSrc !== this.selectedSource()) {
          this.selectedSource.set(targetSrc);
          this.stopCamera();
          this.capturedImage.set(null);
          if (targetSrc === 2) {
            await this.startCamera();
          }
        }

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
    if (val === 2) await this.startCamera();
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
        case 1: // NODE.JS  --> OCR
          result = (await firstValueFrom(this.ocrService.uploadBase64ImageNodeJs(base64))).message;
          break;
        case 2:  // C++     --> CPP
          result = (await firstValueFrom(this.ocrService.uploadBase64ImageCPP(base64))).message;
          break;
        case 3:  // NODE.JS --> CV
          const img = await this.loadImage(base64);
          const shapes = this.cvService._OpenCv_js_detectShapes(img);
          result = shapes.length > 0 ? `Detected: ${shapes.join(', ')}` : "No shapes found.";
          break;
        case 4: // CPP     --> CV
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
}