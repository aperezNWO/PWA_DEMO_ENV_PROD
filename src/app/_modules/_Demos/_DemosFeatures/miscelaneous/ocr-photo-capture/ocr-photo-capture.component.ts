import { Component, OnInit, OnDestroy, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop'; // [v21x] Reactive interop to convert Observables to Signals

import { BackendService } from 'src/app/_services/BackendService/backend.service';
import { _languageName } from 'src/app/_models/entity.model';
import { BaseReferenceComponent } from 'src/app/_components/base-reference/base-reference.component';
import { SpeechService } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { ConfigService } from 'src/app/_services/__Utils/ConfigService/config.service';
import { PAGE_MISCELANEOUS_OCR, PAGE_TITLE_LOG, PAGE_TITLE_NO_SOUND } from 'src/app/_models/common';
import { OCRService } from 'src/app/_services/__AI/OCRService/ocr.service';
import { NgxSignaturePadComponent, NgxSignatureOptions } from '@eve-sama/ngx-signature-pad';

@Component({
  selector: 'app-ocr-photo-capture',
  templateUrl: './ocr-photo-capture.component.html',
  styleUrl: './ocr-photo-capture.component.css',
  providers: [{ provide: PAGE_TITLE_LOG, useValue: PAGE_MISCELANEOUS_OCR }],
  standalone: false
})
export class OcrPhotoCaptureComponent extends BaseReferenceComponent implements OnInit, OnDestroy {
  /**
   * [v21x] FUNCTIONAL DI
   * Using 'inject()' outside the constructor is the modern standard for 
   * cleaner class definitions and better type inference.
   */
  public readonly ocrService = inject(OCRService);
  private readonly _route = inject(ActivatedRoute);

  /**
   * [v21x] SIGNAL QUERIES
   * viewChild<T> replaces @ViewChild. It returns a Signal, meaning the template
   * updates automatically when the element appears/disappears without manual 
   * ChangeDetector calls.
   */
  readonly signature = viewChild<NgxSignaturePadComponent>('signature');
  readonly videoElement = viewChild<ElementRef<HTMLVideoElement>>('video');
  readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  readonly _sourceList = viewChild<ElementRef<HTMLSelectElement>>('_sourceList');
  readonly _engineList = viewChild<ElementRef<HTMLSelectElement>>('_engineList');

  tituloListadOrigen = "Source Selection:";
  titleEngineList = "OCR Engine:";

  /**
   * [v21x] RXJS INTEROP
   * 'toSignal' allows you to take an async stream (HTTP call) and treat it 
   * like a synchronous variable in your logic and template.
   */
  private readonly _cppVersionData = toSignal(this.ocrService._GetTesseract_CPPSTDVersion(), { initialValue: '...' });
  
  readonly cppStdVersion = {
    value: this._cppVersionData,
    isLoading: signal(false), // [v21x] Manual signal state
    error: signal(null)
  };

  /**
   * [v21x] WRITABLE SIGNALS
   * signal(initialValue) replaces standard class properties. 
   * This enables Angular's "Zoneless" capability and ultra-fast change detection.
   */
  readonly isParsing = signal(false);
  readonly capturedImage = signal<string | null>(null);
  readonly hiddenCanvasContainer = signal(false);
  readonly hiddenCameraContainer = signal(true);
  readonly cameraContainerHidden = signal(false);
  readonly capturedImageHidden = signal(true);
  
  __sourceList: _languageName[] = [];
  __engineList: _languageName[] = [];
  
  private videoStream: MediaStream | null = null;
  private isFrontCamera = true;
  videoStyle = "width: 250px; height: 250px; border: 2px solid #333; background: #000;";

  public options: NgxSignatureOptions = {
    backgroundColor: '#F4F5F5',
    width: 350,
    height: 200,
    css: { 'border-radius': '8px', 'border': '1px solid #ccc' }
  };

  constructor() {
    /**
     * [v21x] SUPER CONSTRUCTOR DI
     * Still passing 'inject()' calls into the parent class to maintain 
     * compatibility with the legacy BaseReferenceComponent architecture.
     */
    super(inject(ConfigService), inject(BackendService), inject(ActivatedRoute), inject(SpeechService), PAGE_TITLE_NO_SOUND);
  }

  ngOnInit(): void {
    this.startCamera();
    this.queryParams();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  queryParams(): void {
    this._route.queryParams.subscribe(params => {
      this.__sourceList = [
        new _languageName(0, "(CHOOSE OPTION...)", false, ""),
        new _languageName(1, "(FROM CANVAS)", true, ""),
        new _languageName(2, "(FROM CAMERA)", false, "")
      ];
      this.__engineList = [
        new _languageName(0, "(CHOOSE ENGINE...)", false, ""),
        new _languageName(1, "(TESSERACT / Node.js)", true, "JS"),
        new _languageName(2, "(TESSERACT / C++) ", false, "CPP")
      ];
    });
  }

  async flipCamera() {
    this.isFrontCamera = !this.isFrontCamera;
    this.stopCamera();
    await this.startCamera();
  }

  selectionChange() {
    /**
     * [v21x] SIGNAL ACCESS
     * Accessing signals using getter syntax '()'—e.g., this._sourceList() 
     * and updating via '.set()'.
     */
    const index = Number(this._sourceList()?.nativeElement.value || 0);
    this.hiddenCanvasContainer.set(index !== 1);
    this.hiddenCameraContainer.set(index !== 2);
    this.status_message.set("");
  }

  async saveSignature(): Promise<void> {
    const sig = this.signature(); // [v21x] Reading the signal-based view query
    if (!sig || this.isSignaturePadEmpty()) {
      this.status_message.set("Canvas is empty.");
      return;
    }
    await this.processUpload(sig.toDataURL());
  }

  async saveImage(): Promise<void> {
    const img = this.capturedImage(); // [v21x] Reading state via signal
    if (!img) return;
    await this.processUpload(img);
  }

  private async processUpload(base64: string) {
    const engineIndex = Number(this._engineList()?.nativeElement.value || 0);
    if (engineIndex === 0) {
      this.status_message.set("Please select an OCR Engine.");
      return;
    }
    this.isParsing.set(true); // [v21x] Triggering reactive UI state
    this.status_message.set("[...Processing...]");
    try {
      const obs$ = engineIndex === 1 
        ? this.ocrService.uploadBase64ImageNodeJs(base64) 
        : this.ocrService.uploadBase64ImageCPP(base64);
      const response = await firstValueFrom(obs$);
      this.status_message.set(response.message);
    } catch (err: any) {
      this.status_message.set("Error: " + (err.message || "Upload failed"));
    } finally {
      this.isParsing.set(false);
    }
  }

  async startCamera(): Promise<void> {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.isFrontCamera ? 'user' : 'environment' },
      });
      const video = this.videoElement()?.nativeElement;
      if (video) video.srcObject = this.videoStream;
    } catch (e) { console.error(e); }
  }

  stopCamera(): void {
    this.videoStream?.getTracks().forEach(t => t.stop());
  }

  capturePhoto() {
    const video = this.videoElement()?.nativeElement;
    const canvas = this.canvas()?.nativeElement;
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      canvas.width = video.videoWidth / 2;
      canvas.height = video.videoHeight / 2;
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      this.capturedImage.set(canvas.toDataURL('image/png'));
      this.capturedImageHidden.set(false);
      this.cameraContainerHidden.set(true);
    }
  }

  clearSignature(): void {
    this.signature()?.clear();
    this.status_message.set("");
  }

  isSignaturePadEmpty(): boolean {
    return (this.signature() as any)?.isEmpty?.() ?? true;
  }
}