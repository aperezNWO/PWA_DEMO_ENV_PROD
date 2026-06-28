import { HttpClient } from '@angular/common/http';
import { Component, ViewChild, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PAGE_MISCELANEOUS_FRACTAL_DEMO, PAGE_TITLE_LOG, PAGE_TITLE_NO_SOUND } from 'src/app/_models/common';
import { BackendService } from 'src/app/_services/BackendService/backend.service';
import { ConfigService } from 'src/app/_services/__Utils/ConfigService/config.service';
import { ComputerVisionService } from 'src/app/_services/__AI/ComputerVisionService/Computer-Vision.service';
import { SpeechService } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { PdfService } from 'src/app/_services/__FileGeneration/pdf.service';
import { BaseReferenceComponent } from 'src/app/_components/base-reference/base-reference.component';

export enum FractalType {
  MANDELBROT = 1,
  JULIA      = 2,
  LEAF       = 3
}

export interface LanguageCapability {
  languageCode: string;
  label: string;
  icon: string;
  description: string;
  supportedFractals: { [key in FractalType]: boolean };
}

// ─── Mobile reticle zoom mode ───────────────────────────────────────────────
export type ZoomMode = 'in' | 'out' | null;

@Component({
  selector: 'app-fractalDemo',
  templateUrl: './fractalDemo.component.html',
  styleUrl: './fractalDemo.component.css',
  providers: [{ provide: PAGE_TITLE_LOG, useValue: PAGE_MISCELANEOUS_FRACTAL_DEMO }],
  standalone: false
})
export class FractalDemoComponent extends BaseReferenceComponent implements OnInit, OnDestroy {

  // ── Default parameter snapshot (used by reset) ───────────────────────────
  private readonly defaultValues = {
    maxIterations    : 500,
    realPart         : -0.4,
    imagPart         :  0.6,
    implementation   : 'typescript',
    fractalType      : FractalType.JULIA
  };

  // ── Form-bound parameters ─────────────────────────────────────────────────
  maxIterations         : number    = 500;
  realPart              : number    = -0.4;
  imagPart              : number    =  0.6;
  selectedImplementation: string    = 'typescript';
  selectedFractal       : FractalType = FractalType.JULIA;

  // ── UI state ──────────────────────────────────────────────────────────────
  imageUrl              : string | null = null;
  submitTitle           : string = '[Generate Fractal]';
  pdfButtonCaption      : string = '[Generate PDF]';
  generationTime        : number | null = null;
  lastImplementationUsed: string | null = null;

  // ── Shared zoom/pan viewport state (Mandelbrot AND Julia) ─────────────────
  //    centerX / centerY are in fractal complex-plane coordinates.
  //    baseXRange / baseYRange define the full-zoom-out extent for each type.
  centerX    : number = 0.0;   // Julia default center
  centerY    : number = 0.0;
  zoomFactor : number = 1.0;

  private get baseXRange(): number {
    return this.selectedFractal === FractalType.MANDELBROT ? 3.0 : 3.0;
  }
  private get baseYRange(): number {
    return this.selectedFractal === FractalType.MANDELBROT ? 2.4 : 3.0;
  }

  // ── Mobile reticle state ──────────────────────────────────────────────────
  /** Whether the reticle overlay is visible */
  reticleVisible : boolean  = false;
  /** Reticle position as % of image container (0–100) */
  reticleX       : number   = 50;
  reticleY       : number   = 50;
  /** Active zoom direction selected via minifab */
  activeZoomMode : ZoomMode = null;
  /** true when the user is dragging the reticle */
  isDragging     : boolean  = false;

  private _dragOffsetX = 0;
  private _dragOffsetY = 0;

  // ── Desktop zoom is available for TS Mandelbrot + TS Julia ───────────────
  get isZoomable(): boolean {
    return this.selectedImplementation === 'typescript' &&
           (this.selectedFractal === FractalType.MANDELBROT ||
            this.selectedFractal === FractalType.JULIA);
  }

  // ── Template helpers ──────────────────────────────────────────────────────
  readonly FractalType = FractalType; // expose enum to template

  @ViewChild('_fractal_image') _fractal_image: any;
  @ViewChild('fractalImgWrapper') fractalImgWrapper!: ElementRef<HTMLDivElement>;

  // ── Backend capability matrix ─────────────────────────────────────────────
  backendCapabilities: LanguageCapability[] = [
    {
      languageCode: 'typescript',
      label: 'TypeScript (Local)',
      icon: '🟡',
      description: 'Runs in browser - Fastest',
      supportedFractals: {
        [FractalType.MANDELBROT]: true,
        [FractalType.JULIA]:      true,
        [FractalType.LEAF]:       false
      }
    },
    {
      languageCode: 'nodejs',
      label: 'Node.js (Server)',
      icon: '🟢',
      description: 'Runs on server - Stable',
      supportedFractals: {
        [FractalType.MANDELBROT]: false,
        [FractalType.JULIA]:      true,
        [FractalType.LEAF]:       false
      }
    },
    {
      languageCode: 'cpp',
      label: 'C++ (Native)',
      icon: '🔵',
      description: 'Native performance - Most accurate',
      supportedFractals: {
        [FractalType.MANDELBROT]: false,
        [FractalType.JULIA]:      true,
        [FractalType.LEAF]:       false
      }
    },
    {
      languageCode: 'j2se',
      label: 'Java J2SE (Spring Boot)',
      icon: '☕',
      description: 'Runs on Spring Boot Engine',
      supportedFractals: {
        [FractalType.MANDELBROT]: false,
        [FractalType.JULIA]:      true,
        [FractalType.LEAF]:       true
      }
    }
  ];

  fractalOptions = [
    { id: FractalType.MANDELBROT, label: 'Mandelbrot Set',      icon: '🌀' },
    { id: FractalType.JULIA,      label: 'Julia Set',            icon: '❄️' },
    { id: FractalType.LEAF,       label: 'Barnsley Leaf (IFS)', icon: '🌿' }
  ];

  constructor(
    public  computervisionService: ComputerVisionService,
    public  override configService : ConfigService,
    public  override backendService: BackendService,
    public  override route         : ActivatedRoute,
    public  override speechService : SpeechService,
    public  http                   : HttpClient,
    public  pdfEngine              : PdfService,
  ) {
    super(configService, backendService, route, speechService, PAGE_TITLE_NO_SOUND);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const savedImpl = localStorage.getItem('fractal_implementation');
    if (savedImpl && this.backendCapabilities.some(o => o.languageCode === savedImpl)) {
      this.selectedImplementation = savedImpl;
    }
    this.onLanguageChange();
  }

  ngOnDestroy(): void {
    if (this.imageUrl) URL.revokeObjectURL(this.imageUrl);
  }

  // ── Form helpers ──────────────────────────────────────────────────────────

  getAvailableFractals() {
    const lang = this.backendCapabilities.find(o => o.languageCode === this.selectedImplementation);
    if (!lang) return [];
    return this.fractalOptions.filter(f => lang.supportedFractals[f.id]);
  }

  onLanguageChange(): void {
    this.status_message.set('');
    const available = this.getAvailableFractals();
    if (!available.some(f => f.id === this.selectedFractal) && available.length > 0) {
      this.selectedFractal = available[0].id;
    }
    this.resetZoomViewport();
    this.hideReticle();
  }

  onFractalChange(newValue: any): void {
    this.selectedFractal = Number(newValue) as FractalType;
    this.status_message.set('');
    this.resetZoomViewport();
    this.hideReticle();
  }

  resetZoomViewport(): void {
    // Mandelbrot natural center is slightly left of origin
    if (this.selectedFractal === FractalType.MANDELBROT) {
      this.centerX = -0.5;
      this.centerY =  0.0;
    } else {
      this.centerX = 0.0;
      this.centerY = 0.0;
    }
    this.zoomFactor = 1.0;
  }

  // ── Build complex-plane bounds from current viewport state ────────────────

  private _buildBounds(): { xMin: number; xMax: number; yMin: number; yMax: number } {
    const xRange = this.baseXRange / this.zoomFactor;
    const yRange = this.baseYRange / this.zoomFactor;
    return {
      xMin: this.centerX - xRange / 2,
      xMax: this.centerX + xRange / 2,
      yMin: this.centerY - yRange / 2,
      yMax: this.centerY + yRange / 2,
    };
  }

  // ── Desktop click-to-zoom (Mandelbrot + Julia, TS only) ──────────────────

  onCanvasClick(event: MouseEvent): void {
    if (!this.isZoomable) return;

    const img    = event.target as HTMLImageElement;
    const rect   = img.getBoundingClientRect();
    const ratioX = (event.clientX - rect.left)  / rect.width;
    const ratioY = (event.clientY - rect.top)   / rect.height;

    const bounds         = this._buildBounds();
    this.centerX         = bounds.xMin + ratioX * (bounds.xMax - bounds.xMin);
    this.centerY         = bounds.yMin + ratioY * (bounds.yMax - bounds.yMin);
    this.zoomFactor      = event.shiftKey
      ? Math.max(1, this.zoomFactor / 2)
      : this.zoomFactor * 2;

    this.onSubmit();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MOBILE RETICLE — minifab + draggable crosshair overlay
  // ─────────────────────────────────────────────────────────────────────────

  /** Show/hide the reticle overlay. Called by the ⊕ minifab. */
  toggleReticle(): void {
    this.reticleVisible = !this.reticleVisible;
    if (this.reticleVisible) {
      this.reticleX      = 50;
      this.reticleY      = 50;
      this.activeZoomMode = 'in';
    } else {
      this.activeZoomMode = null;
    }
  }

  hideReticle(): void {
    this.reticleVisible  = false;
    this.activeZoomMode  = null;
  }

  /** Tap one of the +/– minifab pills to select zoom direction. */
  setZoomMode(mode: ZoomMode): void {
    this.activeZoomMode = mode;
  }

  /**
   * Apply zoom at the reticle's current position.
   * reticleX/Y are percentages (0–100) relative to the image container.
   */
  applyReticleZoom(): void {
    if (!this.isZoomable || !this.activeZoomMode) return;

    const ratioX = this.reticleX / 100;
    const ratioY = this.reticleY / 100;

    const bounds     = this._buildBounds();
    this.centerX     = bounds.xMin + ratioX * (bounds.xMax - bounds.xMin);
    this.centerY     = bounds.yMin + ratioY * (bounds.yMax - bounds.yMin);
    this.zoomFactor  = this.activeZoomMode === 'in'
      ? this.zoomFactor * 2
      : Math.max(1, this.zoomFactor / 2);

    this.reticleX = 50;
    this.reticleY = 50;
    this.onSubmit();
  }

  // ── Reticle drag (touch) ──────────────────────────────────────────────────

  onReticleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    this.isDragging = true;
    const touch     = event.touches[0];
    this._updateReticleFromTouch(touch);
  }

  onReticleTouchMove(event: TouchEvent): void {
    if (!this.isDragging) return;
    event.preventDefault();
    this._updateReticleFromTouch(event.touches[0]);
  }

  onReticleTouchEnd(): void {
    this.isDragging = false;
  }

  // ── Reticle drag (mouse — for desktop testing of mobile UI) ──────────────

  onReticleMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isDragging  = true;
  }

  @HostListener('document:mousemove', ['$event'])
  onDocMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.fractalImgWrapper) return;
    this._updateReticleFromMouse(event);
  }

  @HostListener('document:mouseup')
  onDocMouseUp(): void {
    this.isDragging = false;
  }

  private _updateReticleFromTouch(touch: Touch): void {
    if (!this.fractalImgWrapper) return;
    const rect    = this.fractalImgWrapper.nativeElement.getBoundingClientRect();
    this.reticleX = Math.min(100, Math.max(0, ((touch.clientX - rect.left)  / rect.width)  * 100));
    this.reticleY = Math.min(100, Math.max(0, ((touch.clientY - rect.top)   / rect.height) * 100));
  }

  private _updateReticleFromMouse(event: MouseEvent): void {
    const rect    = this.fractalImgWrapper.nativeElement.getBoundingClientRect();
    this.reticleX = Math.min(100, Math.max(0, ((event.clientX - rect.left)  / rect.width)  * 100));
    this.reticleY = Math.min(100, Math.max(0, ((event.clientY - rect.top)   / rect.height) * 100));
  }

  // ── Main generation ───────────────────────────────────────────────────────

  onSubmit(): void {
    this.status_message.set('[...Generating please wait...]');
    this.generationTime = null;
    const t0 = performance.now();

    let serviceCall;

    switch (this.selectedImplementation) {
      case 'typescript':
        serviceCall = this.computervisionService.GetFractal_Typescript(
          this.maxIterations,
          this.realPart,
          this.imagPart,
          this.selectedFractal,
          this._buildBounds()          // ← pass current viewport to both Mandelbrot and Julia
        );
        break;

      case 'nodejs':
        serviceCall = this.computervisionService._OpenCv_GetFractal_NodeJs(
          this.maxIterations, this.realPart, this.imagPart
        );
        break;

      case 'cpp':
        serviceCall = this.computervisionService._OpenCv_GetFractal_CPP(
          this.maxIterations, this.realPart, this.imagPart
        );
        break;

      case 'j2se':
        serviceCall = this.computervisionService.GetFractal_j2se(
          this.maxIterations, this.selectedFractal
        );
        break;

      default:
        serviceCall = this.computervisionService.GetFractal_Typescript(
          this.maxIterations, this.realPart, this.imagPart, this.selectedFractal
        );
    }

    serviceCall.subscribe({
      next: (blob: Blob) => {
        this.generationTime        = performance.now() - t0;
        this.lastImplementationUsed = this.selectedImplementation;
        if (this.imageUrl) URL.revokeObjectURL(this.imageUrl);
        this.imageUrl = URL.createObjectURL(blob);
        const label   = this.backendCapabilities.find(o => o.languageCode === this.selectedImplementation)?.label
                        ?? this.selectedImplementation;
        this.status_message.set(
          `[✓ Image generated using ${label} in ${this.generationTime.toFixed(2)}ms]`
        );
        localStorage.setItem('fractal_implementation', this.selectedImplementation);
      },
      error: (err: any) => {
        console.error('Fractal generation error:', err);
        this.imageUrl = null;
        const label   = this.backendCapabilities.find(o => o.languageCode === this.selectedImplementation)?.label
                        ?? this.selectedImplementation;
        this.status_message.set(`[✗ Error with ${label}. Please try again or switch implementation]`);
      }
    });
  }

  GeneratePDF(): void {
    this.pdfEngine._GetPDF(this.pageTitle, this._fractal_image, this._fractal_image, 'FRACTAL_IMAGE').subscribe({
      next     : ()    => { this.status_message.set('[...Generating PDF...]'); this.pdfButtonCaption = '[...Generating PDF...]'; },
      error    : (e: { message: string }) => { this.status_message.set('Error: ' + e.message); this.pdfButtonCaption = '[Generate PDF]'; },
      complete : ()    => { this.status_message.set('[PDF File generated correctly]');            this.pdfButtonCaption = '[Generate PDF]'; }
    });
  }

  resetFractalsToDefaults(): void {
    this.maxIterations          = this.defaultValues.maxIterations;
    this.realPart               = this.defaultValues.realPart;
    this.imagPart               = this.defaultValues.imagPart;
    this.selectedImplementation = this.defaultValues.implementation;
    this.selectedFractal        = this.defaultValues.fractalType;
    this.resetZoomViewport();
    this.hideReticle();
    if (this.imageUrl) { URL.revokeObjectURL(this.imageUrl); this.imageUrl = null; }
    this.status_message.set('');
    this.generationTime         = null;
    this.lastImplementationUsed = null;
    localStorage.setItem('fractal_implementation', this.selectedImplementation);
  }

  isAtDefaultValues(): boolean {
    return this.maxIterations === this.defaultValues.maxIterations
      && Math.abs(this.realPart - this.defaultValues.realPart)   < 0.001
      && Math.abs(this.imagPart - this.defaultValues.imagPart)   < 0.001
      && this.selectedImplementation === this.defaultValues.implementation
      && this.selectedFractal        === this.defaultValues.fractalType
      && this.zoomFactor             === 1.0;
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  getSelectedImplementationIcon(): string {
    return this.backendCapabilities.find(o => o.languageCode === this.selectedImplementation)?.icon ?? '🟡';
  }

  getSelectedImplementationDescription(): string {
    return this.backendCapabilities.find(o => o.languageCode === this.selectedImplementation)?.description ?? '';
  }

  getPerformanceColor(): string {
    if (!this.generationTime)        return 'secondary';
    if (this.generationTime  < 200)  return 'success';
    if (this.generationTime  < 500)  return 'warning';
    return 'danger';
  }

  get zoomHint(): string {
    if (!this.isZoomable) return '';
    return 'Click to zoom IN · Shift+click to zoom OUT';
  }
}