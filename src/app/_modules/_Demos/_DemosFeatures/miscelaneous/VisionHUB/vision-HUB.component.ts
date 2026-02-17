import { Component, OnInit, OnDestroy, ElementRef, inject, signal, viewChild, computed, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

// Services
import { BackendService        } from 'src/app/_services/BackendService/backend.service';
import { OCRService            } from 'src/app/_services/__AI/OCRService/ocr.service';
import { ConfigService         } from 'src/app/_services/__Utils/ConfigService/config.service';
import { SpeechService         } from 'src/app/_services/__Utils/SpeechService/speech.service';

// Models
import { _languageName                                              } from 'src/app/_models/entity.model';
import { PAGE_MISCELANEOUS_OCR, PAGE_TITLE_LOG, PAGE_TITLE_NO_SOUND } from 'src/app/_models/common';
import { BaseReferenceComponent                                     } from 'src/app/_components/base-reference/base-reference.component';
import { NgxSignaturePadComponent, NgxSignatureOptions              } from '@eve-sama/ngx-signature-pad';
import { ComputerVisionService                                      } from 'src/app/_services/__AI/ComputerVisionService/Computer-Vision.service';

@Component({
  selector: 'app-vision-hub',
  templateUrl: './vision-HUB.component.html',
  styleUrl: './vision-HUB.component.css',
  providers: [{ provide: PAGE_TITLE_LOG, useValue: PAGE_MISCELANEOUS_OCR }],
  standalone: false 
})
export class VisionHUBComponent extends BaseReferenceComponent implements OnInit, OnDestroy {
  public readonly ocrService = inject(OCRService);
  public readonly cvService = inject(ComputerVisionService);

  readonly selectedFeature = signal<number>(1); 
  readonly selectedSource = signal<number>(0);  
  readonly selectedEngine = signal<number>(1);  
  readonly isParsing = signal(false);
  readonly capturedImage = signal<string | null>(null);
  
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
   * [v21x] COMPUTED: Defines options for the 3rd dropdown
   */
  readonly engineList = computed(() => {
    return this.selectedFeature() === 1 
      ? [{ id: 1, label: 'Tesseract -> Node.js' }, { id: 2, label: 'Tesseract -> C++' }]
      : [{ id: 3, label: 'OpenCV -> Node.js' }, { id: 4, label: 'OpenCV -> C++' }];
  });

  constructor() {
    super(inject(ConfigService), inject(BackendService), inject(ActivatedRoute), inject(SpeechService), PAGE_TITLE_NO_SOUND);

    /**
     * [v21x] AUTO-RESET EFFECT
     * Resets the engine selection when Feature or Source changes
     */
    effect(() => {
      const feature = this.selectedFeature();
      // Reset to first engine of the group
      this.selectedEngine.set(feature === 1 ? 1 : 3);
      this.status_message.set(`Engine reset to ${feature === 1 ? 'OCR' : 'CV'} defaults.`);
    });
  }

  ngOnInit(): void {
    this.status_message.set("Ready. Select Feature and Source.");
  }

  ngOnDestroy(): void { this.stopCamera(); }

  // UI Handlers
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

  /**
   * UPDATED: Routes data based on the dynamic selectedEngine()
   */
  public async processUpload(base64: string) {
    this.isParsing.set(true);
    const engineId = this.selectedEngine();
    this.status_message.set("Running AI Processing...");

    try {
      let result = "";
      if (engineId === 1) {
        const res = await firstValueFrom(this.ocrService.uploadBase64ImageNodeJs(base64));
        result = res.message;
      } else if (engineId === 2) {
        const res = await firstValueFrom(this.ocrService.uploadBase64ImageCPP(base64));
        result = res.message;
      } else if (engineId === 3) {
        const img = await this.loadImage(base64);
        const shapes = this.cvService._OpenCv_js_detectShapes(img);
        result = shapes.length > 0 ? `Detected: ${shapes.join(', ')}` : "No shapes found.";
      } else if (engineId === 4) {
        const res = await firstValueFrom(this.cvService._OpenCv_CPP_uploadBase64Image(base64));
        result = res.message;
      }
      this.status_message.set(result);
    } catch (err: any) {
      this.status_message.set("Error: " + err.message);
    } finally {
      this.isParsing.set(false);
    }
  }

  // Camera & Image Utils
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
    } catch (err) { this.status_message.set("Camera permission denied."); }
  }

  stopCamera() { this.videoStream?.getTracks().forEach(t => t.stop()); this.videoStream = null; }

  capturePhoto() {
    const video = this.videoElement()?.nativeElement;
    const canvas = this.canvasElement()?.nativeElement;
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0);
      this.capturedImage.set(canvas.toDataURL('image/png'));
      this.stopCamera();
    }
  }
}