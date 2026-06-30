import { Component
       , ViewChild
       , OnInit
       , OnDestroy
       , ElementRef
       , HostListener                    } from '@angular/core';
import { ActivatedRoute                   } from '@angular/router';
import { HttpClient                       } from '@angular/common/http';
import { PAGE_MISCELANEOUS_FRACTAL_DEMO, 
         PAGE_TITLE_LOG, 
         PAGE_TITLE_NO_SOUND    } from 'src/app/_models/common';
import { BackendService         } from 'src/app/_services/BackendService/backend.service';
import { ConfigService          } from 'src/app/_services/__Utils/ConfigService/config.service';
import { SpeechService          } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { PdfService             } from 'src/app/_services/__FileGeneration/pdf.service';
import { BaseReferenceComponent } from 'src/app/_components/base-reference/base-reference.component';
import { FractalEngine, FractalType            } from 'src/app/_services/fractalEngine/fractal.engine';
import { ComputerVisionService  } from 'src/app/_services/__AI/ComputerVisionService/Computer-Vision.service';

export interface LanguageCapability {
  languageCode: string;
  label: string;
  icon: string;
  description: string;
  supportedFractals: { [key in FractalType]: boolean };
}

export type ZoomMode = 'in' | 'out' | null;

@Component({
  selector: 'app-fractalDemo',
  templateUrl: './fractalDemo.component.html',
  styleUrl: './fractalDemo.component.css',
  providers: [{ provide: PAGE_TITLE_LOG, useValue: PAGE_MISCELANEOUS_FRACTAL_DEMO }],
  standalone: false
})
export class FractalDemoComponent extends BaseReferenceComponent implements OnInit, OnDestroy {

  // ── Default parameter snapshot ────────────────────────────────────────────
  private readonly defaultValues = {
    maxIterations  : 500,
    realPart       : -0.4,
    imagPart       :  0.6,
    implementation : 'typescript',
    fractalType    : FractalType.MANDELBROT
  };

  // ── Form-bound parameters ─────────────────────────────────────────────────
  maxIterations          : number      = 500;
  realPart               : number      = -0.4;
  imagPart               : number      =  0.6;
  selectedImplementation : string      = 'typescript';
  selectedFractal        : FractalType = FractalType.MANDELBROT;

  // ── UI state ──────────────────────────────────────────────────────────────
  imageUrl               : string | null = null;
  submitTitle            : string = '[Generate Fractal]';
  pdfButtonCaption       : string = '[Generate PDF]';
  generationTime         : number | null = null;
  lastImplementationUsed : string | null = null;

  // ── Zoom / pan viewport (TypeScript engine — bounds-based) ────────────────
  centerX    : number = 0.0;
  centerY    : number = 0.0;
  zoomFactor : number = 1.0;

  private get baseXRange(): number { return this.selectedFractal === FractalType.MANDELBROT ? 3.0 : 3.0; }
  private get baseYRange(): number { return this.selectedFractal === FractalType.MANDELBROT ? 2.4 : 3.0; }

  // ── Server zoom state (step-based for Node.js & J2SE) ─────────────────────
  /** Cumulative zoom steps sent to the backend.
   * Incremented on zoom-in clicks, decremented (floor 0) on zoom-out.
   * Reset whenever the user switches engine, fractal, or hits Reset. */
  public  serverZoomStep : number  = 0;
  public  serverZoomIn   : boolean = true;

  // ── Mobile reticle ────────────────────────────────────────────────────────
  reticleVisible  : boolean  = false;
  reticleX        : number   = 50;
  reticleY        : number   = 50;
  activeZoomMode  : ZoomMode = null;
  isDragging      : boolean  = false;

  // ── Computed flags ────────────────────────────────────────────────────────

  /** Zoom is available on:
   * - TypeScript → Mandelbrot + Julia  (bounds-based, click-to-pan)
   * - Server (Node/J2SE) → Julia only  (step-based, click increments step) */
  get isZoomable(): boolean {
    if (this.selectedFractal === FractalType.MANDELBROT) {
      return this.selectedImplementation === 'typescript';
    }
    if (this.selectedFractal === FractalType.JULIA) {
      return this.selectedImplementation === 'typescript' ||
             this.selectedImplementation === 'nodejs' ||
             this.selectedImplementation === 'j2se';
    }
    return false;
  }

  /** True when the active engine+fractal pair uses step-based zoom
   * (Node.js or J2SE Julia) rather than bounds-based click-to-pan. */
  get isServerZoom(): boolean {
    return (this.selectedImplementation === 'nodejs' || this.selectedImplementation === 'j2se') &&
           this.selectedFractal        === FractalType.JULIA;
  }

  get iterationsLabel(): string {
    return this.selectedFractal === FractalType.BARNSLEY_FERN
      ? 'Point Density (×20 iterations)'
      : 'Max Resolution Iterations';
  }

  get iterationsHint(): string {
    if (this.selectedFractal !== FractalType.BARNSLEY_FERN) return '';
    const pts = Math.min(this.maxIterations * 20, 1_000_000).toLocaleString();
    return `≈ ${pts} IFS points will be plotted (cap: 1 000 000)`;
  }

  get zoomHint(): string {
    if (!this.isZoomable) return '';
    if (this.isServerZoom)
      return `Click to zoom IN · Shift+click to zoom OUT · Step: ${this.serverZoomStep}`;
    return 'Click to zoom IN · Shift+click to zoom OUT';
  }

  readonly FractalType = FractalType;

  @ViewChild('_fractal_image')    _fractal_image!: any;
  @ViewChild('fractalImgWrapper') fractalImgWrapper!: ElementRef<HTMLDivElement>;

  // ── Backend capability matrix ─────────────────────────────────────────────
  backendCapabilities: LanguageCapability[] = [
    {
      languageCode: 'typescript',
      label: 'TypeScript (Local)',
      icon: '🟡',
      description: 'Runs in browser — Fastest',
      supportedFractals: {
        [FractalType.MANDELBROT]   : true,
        [FractalType.JULIA]        : true,
        [FractalType.BARNSLEY_FERN]: false
      }
    },
    {
      languageCode: 'nodejs',
      label: 'Node.js (Server)',
      icon: '🟢',
      description: 'Runs on server — Stable',
      supportedFractals: {
        [FractalType.MANDELBROT]   : false,
        [FractalType.JULIA]        : false,
        [FractalType.BARNSLEY_FERN]: true
      }
    },
    {
      languageCode: 'cpp',
      label: 'C++ (Native)',
      icon: '🔵',
      description: 'Native performance — Most accurate',
      supportedFractals: {
        [FractalType.MANDELBROT]   : false,
        [FractalType.JULIA]        : true,
        [FractalType.BARNSLEY_FERN]: false
      }
    },
    {
      languageCode: 'j2se',
      label: 'Java J2SE (Spring Boot)',
      icon: '☕',
      description: 'Runs on Spring Boot Engine',
      supportedFractals: {
        [FractalType.MANDELBROT]   : false,
        [FractalType.JULIA]        : false,
        [FractalType.BARNSLEY_FERN]: true
      }
    }
  ];

  fractalOptions = [
    { id: FractalType.MANDELBROT,    label: 'Mandelbrot Set',           icon: '🌀' },
    { id: FractalType.JULIA,         label: 'Julia Set',                icon: '❄️' },
    { id: FractalType.BARNSLEY_FERN, label: 'Barnsley Fern (IFS — TS)', icon: '🍃' }
  ];

  constructor(
    public  fractalEngine  : FractalEngine,
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
    this.selectedImplementation = 'typescript';
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
    const available = this.getAvailableFractals();
    if (!available.some(f => f.id === this.selectedFractal) && available.length > 0) {
      this.selectedFractal = available[0].id;
    }
    this.resetZoomViewport();
    this.hideReticle();
    this.imageUrl = null;
    this.status_message.set("[Engine swapped — Viewport initialized]");
  }

  onFractalChange(newValue: any): void {
    this.selectedFractal = Number(newValue) as FractalType;
    this.resetZoomViewport();
    this.hideReticle();
    this.imageUrl = null;
    this.status_message.set(`[Switched to ${this.getFractalLabel(this.selectedFractal)} — Viewport initialized]`);
  }

  resetZoomViewport(): void {
    // TypeScript bounds-based zoom
    this.centerX    = this.selectedFractal === FractalType.MANDELBROT ? -0.5 : 0.0;
    this.centerY    = 0.0;
    this.zoomFactor = 1.0;
    
    // Server step-based zoom — always reset direction to 'in'
    this.serverZoomStep = 0;
    this.serverZoomIn   = true;
  }

  // ── Complex-plane bounds (TypeScript engine only) ─────────────────────────

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

  // ── Server step-based zoom ────────────────────────────────────────────────

  serverZoomInStep(): void {
    this.serverZoomStep++;
    this.serverZoomIn = true;
    this.onSubmit();
  }

  serverZoomOutStep(): void {
    // Send the current step with zoominout=false to exactly undo the last zoom-in
    this.serverZoomIn = this.serverZoomStep <= 1 ? true : false;
    this.onSubmit();
    // Decrement AFTER submit so the URL carries the correct step
    if (this.serverZoomStep > 0) this.serverZoomStep--;
  }

  // ── Desktop click handler ─────────────────────────────────────────────────

  onCanvasClick(event: MouseEvent): void {
    if (!this.isZoomable) return;

    // Server (Node/J2SE) Julia: translate click into a zoom step
    if (this.isServerZoom) {
      if (event.shiftKey) {
        this.serverZoomOutStep();  // shift+click = zoom out
      } else {
        this.serverZoomInStep();   // plain click  = zoom in
      }
      return;
    }

    // TypeScript: full bounds-based click-to-pan + zoom
    const img    = event.target as HTMLImageElement;
    const rect   = img.getBoundingClientRect();
    const bounds = this._buildBounds();
    this.centerX    = bounds.xMin + ((event.clientX - rect.left)  / rect.width)  * (bounds.xMax - bounds.xMin);
    this.centerY    = bounds.yMin + ((event.clientY - rect.top)   / rect.height) * (bounds.yMax - bounds.yMin);
    this.zoomFactor = event.shiftKey
      ? Math.max(1, this.zoomFactor / 2)
      : this.zoomFactor * 2;
    this.onSubmit();
  }

  // ── Mobile reticle ────────────────────────────────────────────────────────

  toggleReticle(): void {
    this.reticleVisible = !this.reticleVisible;
    if (this.reticleVisible) {
      this.reticleX       = 50;
      this.reticleY       = 50;
      this.activeZoomMode = 'in';
    } else {
      this.activeZoomMode = null;
    }
  }

  hideReticle(): void {
    this.reticleVisible = false;
    this.activeZoomMode = null;
  }

  setZoomMode(mode: ZoomMode): void { this.activeZoomMode = mode; }

  applyReticleZoom(): void {
    if (!this.isZoomable || !this.activeZoomMode) return;

    // Server (Node/J2SE) Julia: reticle direction maps to a zoom step
    if (this.isServerZoom) {
      this.activeZoomMode === 'in'
        ? this.serverZoomInStep()
        : this.serverZoomOutStep();
      this.reticleX = 50;
      this.reticleY = 50;
      return;
    }

    // TypeScript: full bounds-based pan + zoom
    const bounds    = this._buildBounds();
    this.centerX    = bounds.xMin + (this.reticleX / 100) * (bounds.xMax - bounds.xMin);
    this.centerY    = bounds.yMin + (this.reticleY / 100) * (bounds.yMax - bounds.yMin);
    this.zoomFactor = this.activeZoomMode === 'in'
      ? this.zoomFactor * 2
      : Math.max(1, this.zoomFactor / 2);
    this.reticleX   = 50;
    this.reticleY   = 50;
    this.onSubmit();
  }

  onReticleTouchStart(event: TouchEvent): void { event.preventDefault(); this.isDragging = true;  this._updateReticleFromTouch(event.touches[0]); }
  onReticleTouchMove(event: TouchEvent):  void { if (!this.isDragging) return; event.preventDefault(); this._updateReticleFromTouch(event.touches[0]); }
  onReticleTouchEnd():                    void { this.isDragging = false; }
  onReticleMouseDown(event: MouseEvent):  void { event.preventDefault(); this.isDragging = true; }

  @HostListener('document:mousemove', ['$event'])
  onDocMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.fractalImgWrapper) return;
    this._updateReticleFromMouse(event);
  }

  @HostListener('document:mouseup')
  onDocMouseUp(): void { this.isDragging = false; }

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
        serviceCall = this.fractalEngine.GetFractal_Typescript(
          this.maxIterations,
          this.realPart,
          this.imagPart,
          this.selectedFractal,
          this.isZoomable ? this._buildBounds() : undefined
        );
        break;

      case 'nodejs':
        serviceCall = this.fractalEngine.GetFractal_NodeJs(
          this.maxIterations,
          this.selectedFractal,
          this.serverZoomIn,    
          this.serverZoomStep   
        );
        break;

        case 'j2se':
          serviceCall = this.fractalEngine.GetFractal_j2se(
            this.maxIterations, 
            this.selectedFractal,
            this.serverZoomIn, 
            this.serverZoomStep
          );
          break;

      case 'cpp':
        serviceCall = this.fractalEngine._OpenCv_GetFractal_CPP(
          this.maxIterations, this.realPart, this.imagPart
        );
        break;

      default:
        serviceCall = this.fractalEngine.GetFractal_Typescript(
          this.maxIterations, this.realPart, this.imagPart, this.selectedFractal
        );
    }

    serviceCall.subscribe({
      next: (blob: Blob) => {
        this.generationTime         = performance.now() - t0;
        this.lastImplementationUsed = this.selectedImplementation;
        if (this.imageUrl) URL.revokeObjectURL(this.imageUrl);
        this.imageUrl = URL.createObjectURL(blob);
        const label = this.backendCapabilities
          .find(o => o.languageCode === this.selectedImplementation)?.label
          ?? this.selectedImplementation;
        this.status_message.set(`[✓ Generated using ${label} in ${this.generationTime.toFixed(2)}ms]`);
        localStorage.setItem('fractal_implementation', this.selectedImplementation);
      },
      error: (err: any) => {
        console.error('Fractal generation error:', err);
        this.imageUrl = null;
        const label = this.backendCapabilities
          .find(o => o.languageCode === this.selectedImplementation)?.label
          ?? this.selectedImplementation;
        this.status_message.set(`[✗ Error with ${label}. Please try again or switch implementation]`);
      }
    });
  }

  // ── PDF ───────────────────────────────────────────────────────────────────

  GeneratePDF(): void {
    this.pdfEngine._GetPDF(this.pageTitle, this._fractal_image, this._fractal_image, 'FRACTAL_IMAGE').subscribe({
      next     : ()                     => { this.status_message.set('[...Generating PDF...]');    this.pdfButtonCaption = '[...Generating PDF...]'; },
      error    : (e: {message:string}) => { this.status_message.set('Error: ' + e.message);       this.pdfButtonCaption = '[Generate PDF]'; },
      complete : ()                     => { this.status_message.set('[PDF generated correctly]'); this.pdfButtonCaption = '[Generate PDF]'; }
    });
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

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
    return this.maxIterations        === this.defaultValues.maxIterations
      && Math.abs(this.realPart      -   this.defaultValues.realPart) < 0.001
      && Math.abs(this.imagPart      -   this.defaultValues.imagPart) < 0.001
      && this.selectedImplementation === this.defaultValues.implementation
      && this.selectedFractal        === this.defaultValues.fractalType
      && this.zoomFactor             === 1.0
      && this.serverZoomStep         === 0; // Updated to match the new generic state
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getSelectedImplementationIcon():        string { return this.backendCapabilities.find(o => o.languageCode === this.selectedImplementation)?.icon        ?? '🟡'; }
  getSelectedImplementationDescription(): string { return this.backendCapabilities.find(o => o.languageCode === this.selectedImplementation)?.description ?? ''; }

  getPerformanceColor(): string {
    if (!this.generationTime)      return 'secondary';
    if (this.generationTime < 200) return 'success';
    if (this.generationTime < 500) return 'warning';
    return 'danger';
  }

  private getFractalLabel(type: FractalType): string {
    switch (type) {
      case FractalType.MANDELBROT:    return 'Mandelbrot';
      case FractalType.JULIA:         return 'Julia';
      case FractalType.BARNSLEY_FERN: return 'Barnsley Leaf';
      default:                        return 'Fractal';
    }
  }
}