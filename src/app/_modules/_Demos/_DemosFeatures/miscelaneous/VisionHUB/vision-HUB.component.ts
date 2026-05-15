import { Component, OnInit, OnDestroy, ElementRef, inject, signal, viewChild, computed, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

// Services
import { BackendService } from 'src/app/_services/BackendService/backend.service';
import { OCRService } from 'src/app/_services/__AI/OCRService/ocr.service';
import { ConfigService } from 'src/app/_services/__Utils/ConfigService/config.service';
import { SpeechService } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { ComputerVisionService } from 'src/app/_services/__AI/ComputerVisionService/Computer-Vision.service';

// Models
import { PAGE_MISCELANEOUS_OCR, PAGE_TITLE_LOG, PAGE_TITLE_NO_SOUND } from 'src/app/_models/common';
import { BaseReferenceComponent } from 'src/app/_components/base-reference/base-reference.component';
import { NgxSignaturePadComponent, NgxSignatureOptions } from '@eve-sama/ngx-signature-pad';

@Component({
  selector: 'app-vision-hub',
  templateUrl: './vision-HUB.component.html',
  styleUrl: './vision-HUB.component.css',
  providers: [{ provide: PAGE_TITLE_LOG, useValue: PAGE_MISCELANEOUS_OCR }],
  standalone: false 
})
export class VisionHUBComponent extends BaseReferenceComponent implements OnInit, OnDestroy {
  // --- Services ---
  public readonly ocrService = inject(OCRService);
  public readonly cvService = inject(ComputerVisionService);
  private readonly _route = inject(ActivatedRoute);

  // --- Signals ---
  readonly selectedFeature = signal<number>(1); 
  readonly selectedSource = signal<number>(0);  
  readonly selectedEngine = signal<number>(1);  
  readonly isParsing = signal(false);
  readonly capturedImage = signal<string | null>(null);
  
  // --- View Queries ---
  readonly signature = viewChild<NgxSignaturePadComponent>('signature');
  readonly videoElement = viewChild<ElementRef<HTMLVideoElement>>('video');
  readonly canvasElement = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  private videoStream: MediaStream | null = null;
  public isFrontCamera = true;

  public options: NgxSignatureOptions = {
    backgroundColor: '#FFFFFF',
    width: 340,
    height: 240,
    css: { 'border': '2px solid #444', 'border-radius': '8px' }
  };

  /**
   * Computed engine list based on feature selection
   */
  readonly engineList = computed(() => {
    return this.selectedFeature() === 1 
      ? [{ id: 1, label: 'Tesseract -> Node.js' }, { id: 2, label: 'Tesseract -> C++' }]
      : [{ id: 3, label: 'OpenCV -> Node.js' }, { id: 4, label: 'OpenCV -> C++' }];
  });

  constructor() {
    super(inject(ConfigService), inject(BackendService), inject(ActivatedRoute), inject(SpeechService), PAGE_TITLE_NO_SOUND);

    /**
     * Safety effect to prevent invalid states during manual UI toggles.
     * It allows C++ (2 or 4) to persist if the feature matches.
     */
    effect(() => {
      const feat = this.selectedFeature();
      const eng = this.selectedEngine();

      const invalidOcr = (feat === 1 && (eng < 1 || eng > 2));
      const invalidCv = (feat === 2 && (eng < 3 || eng > 4));

      if (invalidOcr) this.selectedEngine.set(1);
      if (invalidCv) this.selectedEngine.set(3);
    });
  }

  ngOnInit(): void {
    this.status_message.set("Synchronizing with URL...");
    this.syncStateFromUrl();
  }

  /**
   * REFACTORED: Uses Observable to bypass Hash-routing race conditions
   */
  private async syncStateFromUrl() {
    try {
      // firstValueFrom ensures we get the parameters if they are present on load
      const params = await firstValueFrom(this._route.queryParams);

      // 1. Determine Feature
      let targetFeat = 1;
      if (params['aiFeature']) {
        const f = params['aiFeature'].toString().toUpperCase();
        if (f === 'CV') targetFeat = 2;
      }

      // 2. Determine Engine based on Feature + langName
      let targetEng = (targetFeat === 1) ? 1 : 3; // Defaults
      if (params['langName']) {
        const l = params['langName'].toString().toUpperCase();
        const wantsCpp = (l === 'CPP');

        if (targetFeat === 1) {
          targetEng = wantsCpp ? 2 : 1;
        } else {
          targetEng = wantsCpp ? 4 : 3;
        }
      }

      // 3. Update Signals in one go
      this.selectedFeature.set(targetFeat);
      this.selectedEngine.set(targetEng);

      this.status_message.set("System Ready.");
    } catch (e) {
      this.status_message.set("Ready (Default)");
    }
  }

  ngOnDestroy(): void { this.stopCamera(); }

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
    if (!pad || (pad as any).isEmpty()) return;
    await this.processUpload(pad.toDataURL());
  }

  public async processUpload(base64: string) {
    this.isParsing.set(true);
    const engineId = this.selectedEngine();
    this.status_message.set("Analyzing...");

    try {
      let result = "";
      switch (engineId) {
        case 1: 
          result = (await firstValueFrom(this.ocrService.uploadBase64ImageNodeJs(base64))).message;
          break;
        case 2: 
          result = (await firstValueFrom(this.ocrService.uploadBase64ImageCPP(base64))).message;
          break;
        case 3: 
          const img = await this.loadImage(base64);
          const shapes = this.cvService._OpenCv_js_detectShapes(img);
          result = shapes.length > 0 ? `Detected: ${shapes.join(', ')}` : "No shapes found.";
          break;
        case 4: 
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
    this.videoStream?.getTracks().forEach(t => t.stop()); 
    this.videoStream = null; 
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