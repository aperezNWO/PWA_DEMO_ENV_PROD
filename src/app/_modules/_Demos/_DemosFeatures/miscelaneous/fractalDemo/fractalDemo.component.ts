import { Component
       , ViewChild
       , OnInit
       , OnDestroy
       , ElementRef
       , HostListener,                     
         inject                           } from '@angular/core';
import { ActivatedRoute                   } from '@angular/router';
import { HttpClient                       } from '@angular/common/http';
import { Chart, registerables             } from 'chart.js';
import { PAGE_MISCELANEOUS_FRACTAL_DEMO, 
         PAGE_TITLE_LOG, 
         PAGE_TITLE_NO_SOUND    } from 'src/app/_models/common';
import { BackendService         } from 'src/app/_services/BackendService/backend.service';
import { ConfigService          } from 'src/app/_services/__Utils/ConfigService/config.service';
import { SpeechService          } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { PdfService             } from 'src/app/_services/__FileGeneration/pdf.service';
import { BaseReferenceComponent } from 'src/app/_components/base-reference/base-reference.component';
import { FractalService         } from 'src/app/_services/fractalService/fractalService';
import { FractalType
        , ZoomMode
        , LanguageCapability
        , FractalEngine         
        , BackendLanguage
        , FractalParams,         
        DEFAULT_FRACTAL_PARAMS
        , FractalBenchmark
        , FractalSliceScore } from '../../../../../_engines/fractal.engine';

Chart.register(...registerables);


@Component({
  selector: 'app-fractalDemo',
  templateUrl: './fractalDemo.component.html',
  styleUrl: './fractalDemo.component.css',
  providers: [{ provide: PAGE_TITLE_LOG, useValue: PAGE_MISCELANEOUS_FRACTAL_DEMO }],
  standalone: false
})
export class FractalDemoComponent extends BaseReferenceComponent implements OnInit, OnDestroy {

  private readonly _fractalEngine        = inject(FractalEngine);

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
  isGenerating           : boolean = false;

  // ── Zoom / pan viewport (TypeScript engine — bounds-based) ────────────────
  centerX    : number = 0.0;
  centerY    : number = 0.0;
  zoomFactor : number = 1.0;

  private get baseXRange(): number { 
    return (this.selectedFractal === FractalType.MANDELBROT || this.selectedFractal === FractalType.MANDELBROT_GRPC) ? 3.0 : 3.0; 
  }

  private get baseYRange(): number { 
    return (this.selectedFractal === FractalType.MANDELBROT || this.selectedFractal === FractalType.MANDELBROT_GRPC) ? 2.4 : 3.0; 
  }
  public  serverZoomFactor: number = 1.0;
  public  serverZoomIn    : boolean = true;

  serverZoomOutStep(): void {
    if (this.serverZoomFactor > 1) {
      this.serverZoomFactor /= 2; // Halve the zoom
    }
    this.serverZoomIn = false;
    this.onSubmit();
  }
  
  // ── Mobile reticle ────────────────────────────────────────────────────────
  reticleVisible  : boolean  = false;
  reticleX        : number   = 50;
  reticleY        : number   = 50;
  activeZoomMode  : ZoomMode = null;
  isDragging      : boolean  = false;

  // ── Computed flags ────────────────────────────────────────────────────────
// NEW: Simplified getter using the config object
  get isZoomable(): boolean {
    const lang = this.backendCapabilities.find(b => b.languageCode === this.selectedImplementation);
    return lang?.supportedFractals[this.selectedFractal].zoomable ?? false;
  }

  // UPDATED: Check 'supported' property instead of boolean directly
  getAvailableFractals() {
    const lang = this.backendCapabilities.find(o => o.languageCode === this.selectedImplementation);
    if (!lang) return [];
    
    // Filter by the .supported property
    return this.fractalOptions.filter(f => lang.supportedFractals[f.id].supported);
  }

  // Backends with enabled:false (e.g. C++, on hold) are hidden from the
  // dropdown entirely but stay in backendCapabilities so re-enabling later
  // is a one-line flip, not a re-write.
  getAvailableBackends(): LanguageCapability[] {
    return this.backendCapabilities.filter(b => b.enabled);
  }

  /** Legacy flag for the old step-based zoom model. Both Node.js and J2SE
   * Julia are now fully bounds-based server-side (xMin/xMax/yMin/yMax),
   * matching TypeScript's click-to-pan model — so this is always false
   * until/unless a future backend genuinely needs step-based zoom again. */
  get isServerZoom(): boolean {
    return false;
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
      return `Click to zoom IN · Shift+click to zoom OUT · Step: ${this.serverZoomFactor}`;
    return 'Click to zoom IN · Shift+click to zoom OUT';
  }

  readonly FractalType = FractalType;

  @ViewChild('_fractal_image')    _fractal_image!   : any;
  @ViewChild('fractalImgWrapper') fractalImgWrapper!: ElementRef<HTMLDivElement>;

  // ── Tabs ──────────────────────────────────────────────────────────────────
  activeTab: 'fractals' | 'benchmark' = 'fractals';

  // ── Language benchmark ───────────────────────────────────────────────────
  @ViewChild('pieCanvas') pieCanvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('barCanvas') barCanvasRef?: ElementRef<HTMLCanvasElement>;

  private _pieChart?: Chart<'pie', number[], string>;
  private _barChart?: Chart<'bar', number[], string>;

  selectedBenchmarkFractal : FractalType | null = null;
  hasBenchmarkData         : boolean            = false;

  backendCapabilities: LanguageCapability[] = [
  {
    backendLanguage  : BackendLanguage.TYPESCRIPT,
    languageCode     : 'typescript',
    label            : 'TypeScript (Local)',
    icon             : '🔷',
    description      : 'Runs in browser — Fastest',
    enabled          : true,
    supportedFractals: {
      [FractalType.MANDELBROT]     : { supported: true, zoomable: true     },
      [FractalType.JULIA]          : { supported: true, zoomable: true     },
      [FractalType.BARNSLEY_FERN]  : { supported: true, zoomable: false    },
      [FractalType.MANDELBROT_GRPC]: { supported: false,  zoomable: true   }, // Enabled for Go            
    }
  },
  {
    backendLanguage   : BackendLanguage.KOTLIN,
    languageCode      : 'Kotlin',
    label             : 'Kotlin (Spring Boot)',
    icon              : '🟪',
    description       : 'Runs on Spring Boot Engine',
    enabled           : true,
    supportedFractals : {
      [FractalType.MANDELBROT]     : { supported: true,   zoomable: true   },
      [FractalType.JULIA]          : { supported: true ,  zoomable: true   },
      [FractalType.BARNSLEY_FERN]  : { supported: true,   zoomable: false  },
      [FractalType.MANDELBROT_GRPC]: { supported: false,  zoomable: true   }, // Enabled for Go            
    }
  },
  {
    backendLanguage   : BackendLanguage.DART,
    languageCode      : 'Dart',
    label             : 'Dart (Shelf)',
    icon              : '🎯',
    description       : 'Runs on Shelf Engine',
    enabled           : true,
    supportedFractals : {
      [FractalType.MANDELBROT]     :   { supported: true,   zoomable: true   },
      [FractalType.JULIA]          :   { supported: true ,  zoomable: true   },
      [FractalType.BARNSLEY_FERN]  :   { supported: true,   zoomable: false  },
      [FractalType.MANDELBROT_GRPC]:   { supported: false,  zoomable: true   }, // Enabled for Go      
    }
  },
  {
    backendLanguage   : BackendLanguage.GOLANG,
    languageCode      : 'golang',
    label             : 'Go (net-http / gRPC-Web)',
    icon              : '🔵',
    description       : 'Runs on native net/http & gRPC-Web Engine',
    enabled           : true,
    supportedFractals : {
      [FractalType.MANDELBROT]     : { supported: true,  zoomable: true  },
      [FractalType.JULIA]          : { supported: true,  zoomable: true  },
      [FractalType.BARNSLEY_FERN]  : { supported: true,  zoomable: false },
      [FractalType.MANDELBROT_GRPC]: { supported: true,  zoomable: false }, // Enabled for Go
    }
  },
  {
    backendLanguage   : BackendLanguage.RUSTLANG,
    languageCode      : 'rustlang',
    label             : 'Rust (Actix-web)',
    icon              : '⚡',
    description       : 'Runs on Actix-web ',
    enabled           : true,
    supportedFractals : {
      [FractalType.MANDELBROT]     : { supported: true,   zoomable: true   },
      [FractalType.JULIA]          : { supported: true ,  zoomable: true   },
      [FractalType.BARNSLEY_FERN]  : { supported: true,   zoomable: false  },
      [FractalType.MANDELBROT_GRPC]: { supported: false,  zoomable: true   }, // Enabled for Go            
    }
  },
  {
    backendLanguage  : BackendLanguage.NODEJS,
    languageCode     : 'nodejs',
    label            : 'Node.js (Server)',
    icon             : '🟢',
    description      : 'Runs on server — Stable',
    enabled: true,
    supportedFractals: {
      [FractalType.MANDELBROT]     : { supported: true,  zoomable : true  },
      [FractalType.JULIA]          : { supported: true , zoomable : true  },
      [FractalType.BARNSLEY_FERN]  : { supported: true , zoomable : false },
      [FractalType.MANDELBROT_GRPC]: { supported: false,  zoomable: true  }, // Enabled for Go                  
    }
  },
  {
    backendLanguage   : BackendLanguage.J2SE,
    languageCode      : 'j2se',
    label             : 'Java J2SE (Spring Boot)',
    icon              : '☕',
    description       : 'Runs on Spring Boot Engine',
    enabled           : true,
    supportedFractals : {
      [FractalType.MANDELBROT]     : { supported: true,   zoomable: true   },
      [FractalType.JULIA]          : { supported: true ,  zoomable: true   },
      [FractalType.BARNSLEY_FERN]  : { supported: true,   zoomable: false  },
      [FractalType.MANDELBROT_GRPC]: { supported: false,  zoomable: true   }, // Enabled for Go                  
    }
  },
  {
    backendLanguage   : BackendLanguage.CPP, 
    languageCode      : 'cpp',
    label             : 'C++ (Native)',
    icon              : '⚙️',
    description       : 'Native performance — On hold (pending pure-math migration)',
    enabled           : false,   // ← disabled: hidden from the dropdown, config kept for when work resumes
    supportedFractals : {
      [FractalType.MANDELBROT]     : { supported: false, zoomable: false  },
      [FractalType.JULIA]          : { supported: true,  zoomable: false  }, 
      [FractalType.BARNSLEY_FERN]  : { supported: false, zoomable: false  },
      [FractalType.MANDELBROT_GRPC]: { supported: false,  zoomable: true  }, // Enabled for Go                  
    }
  },
];

//
fractalOptions = [
    { id: FractalType.MANDELBROT,      label: 'Mandelbrot Set',           icon: '🌀' },
    { id: FractalType.JULIA,           label: 'Julia Set',                icon: '❄️' },
    { id: FractalType.BARNSLEY_FERN,   label: 'Barnsley Fern (IFS — TS)', icon: '🍃' },
    { id: FractalType.MANDELBROT_GRPC, label: 'Mandelbrot Set (gRPC)',    icon: '⚡' },    
];

//
constructor(
    public  fractalService         : FractalService,
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

  // Maps a short, URL-friendly code (?langName=KT) to the actual languageCode
  // used internally in backendCapabilities. Keys are matched case-insensitively.
  private readonly LANG_QUERY_PARAM_MAP: { [key: string]: string } = {
    'TS'   : 'typescript',
    'KT'   : 'Kotlin',
    'DART' : 'Dart',
    'JS'   : 'nodejs',
    'NODE' : 'nodejs',
    'JAVA' : 'j2se',
    'J2SE' : 'j2se',
    'CPP'  : 'cpp',
    'GO'   : 'golang',
    'RS'   : 'rustlang',
  };

  ngOnInit(): void {
    this.selectedImplementation = this._resolveImplementationFromQueryParam() ?? 'typescript';
    this.onLanguageChange();
  }

  /**
   * Reads ?langName=XX from the current URL and resolves it to a
   * backendCapabilities.languageCode. Falls back to null (→ default
   * 'typescript') if the param is missing, unrecognized, or maps to a
   * backend that's currently disabled (e.g. ?langName=CPP while C++ is
   * on hold) — never silently selects something the dropdown itself
   * wouldn't offer.
   */
  private _resolveImplementationFromQueryParam(): string | null {
    const raw = this.route.snapshot.queryParamMap.get('langName');
    if (!raw) return null;

    const mappedCode = this.LANG_QUERY_PARAM_MAP[raw.toUpperCase()];
    if (!mappedCode) {
      console.warn(`[FractalDemo] Unknown langName query param "${raw}" — falling back to default.`);
      return null;
    }

    const backend = this.backendCapabilities.find(b => b.languageCode === mappedCode);
    if (!backend || !backend.enabled) {
      console.warn(`[FractalDemo] langName "${raw}" resolves to a disabled or unknown backend — falling back to default.`);
      return null;
    }

    return backend.languageCode;
  }

  ngOnDestroy(): void {
    if (this.imageUrl) URL.revokeObjectURL(this.imageUrl);
    this._pieChart?.destroy();
    this._barChart?.destroy();
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  switchTab(tab: 'fractals' | 'benchmark'): void {
    this.activeTab = tab;
    if (tab === 'benchmark') {
      // Canvas must exist in the DOM (post-*ngIf) before Chart.js can size
      // itself against it — defer one tick. Re-render the bar chart too if
      // a fractal was already selected, since *ngIf destroyed its old canvas.
      setTimeout(() => {
        this._renderPieChart();
        if (this.selectedBenchmarkFractal !== null) {
          this._renderBarChart(this.selectedBenchmarkFractal);
        }
      }, 0);
    }
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
    // Center on real axis -0.5 for both standard and gRPC Mandelbrot
    const isMandelbrot = this.selectedFractal === FractalType.MANDELBROT 
                      || this.selectedFractal === FractalType.MANDELBROT_GRPC;

    this.centerX    = isMandelbrot ? -0.5 : 0.0;
    this.centerY    = 0.0;
    this.zoomFactor = 1.0;
    
    // Server step-based zoom — always reset direction to 'in'
    this.serverZoomFactor = 0;
    this.serverZoomIn     = true;
  }
  // ── Complex-plane bounds  ─────────────────────────

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
    this.serverZoomFactor++;
    this.serverZoomIn = true;
    this.onSubmit();
  }

  // ── Desktop click handler ─────────────────────────────────────────────────

  onCanvasClick(event: MouseEvent): void {
    if (!this.isZoomable || this.isGenerating) return;

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
    if (!this.isZoomable || !this.activeZoomMode || this.isGenerating) return;

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
    this.isGenerating   = true;
    const t0            = performance.now();

    let serviceCall      : any = null;
    let fractalParams    : FractalParams = { 
        ...DEFAULT_FRACTAL_PARAMS 
    };

    switch (this.selectedImplementation) {

      case 'typescript':

        fractalParams = { 
            ...DEFAULT_FRACTAL_PARAMS 
            ,selectedBackend : BackendLanguage.TYPESCRIPT
            ,selectedFractal : this.selectedFractal
            ,maxIterations   : this.maxIterations
            ,realPart        : this.realPart
            ,imagPart        : this.imagPart            
            ,isZoomable      : this._buildBounds()
        };

        serviceCall = this._fractalEngine.GetFractal(
          fractalParams
        );

      break;

      case 'Kotlin':

        fractalParams = { 
            ...DEFAULT_FRACTAL_PARAMS 
            ,selectedBackend  : BackendLanguage.KOTLIN
            ,selectedFractal  : this.selectedFractal
            ,maxIterations    : this.maxIterations
            ,isZoomable       : this._buildBounds()
            ,serverZoomIn     : this.serverZoomIn
            ,serverZoomFactor : this.serverZoomFactor
        };

        serviceCall = this._fractalEngine.GetFractal(
          fractalParams
        );
      break;

       case 'Dart':

        fractalParams = { 
            ...DEFAULT_FRACTAL_PARAMS 
            ,selectedBackend  : BackendLanguage.DART
            ,selectedFractal  : this.selectedFractal
            ,maxIterations    : this.maxIterations
            ,isZoomable       : this._buildBounds()
            ,serverZoomIn     : this.serverZoomIn
            ,serverZoomFactor : this.serverZoomFactor
        };

        serviceCall = this._fractalEngine.GetFractal(
          fractalParams
        );
      break;

      case 'nodejs':

       fractalParams = { 
            ...DEFAULT_FRACTAL_PARAMS 
            ,selectedBackend  : BackendLanguage.NODEJS
            ,selectedFractal  : this.selectedFractal
            ,maxIterations    : this.maxIterations
            ,isZoomable       : this._buildBounds()
            ,serverZoomIn     : this.serverZoomIn
            ,serverZoomFactor : this.serverZoomFactor
        };

        serviceCall = this._fractalEngine.GetFractal(
          fractalParams
        );

        break;

        case 'j2se':

        fractalParams = { 
            ...DEFAULT_FRACTAL_PARAMS 
            ,selectedBackend  : BackendLanguage.J2SE
            ,selectedFractal  : this.selectedFractal
            ,maxIterations    : this.maxIterations
            ,isZoomable       : this._buildBounds()
            ,serverZoomIn     : this.serverZoomIn
            ,serverZoomFactor : this.serverZoomFactor
        };

        serviceCall = this._fractalEngine.GetFractal(
          fractalParams
        );
        break;

      case 'golang':

         fractalParams = { 
            ...DEFAULT_FRACTAL_PARAMS 
            ,selectedBackend  : BackendLanguage.GOLANG
            ,selectedFractal  : this.selectedFractal
            ,maxIterations    : this.maxIterations
            ,isZoomable       : this._buildBounds()
            ,serverZoomIn     : this.serverZoomIn
            ,serverZoomFactor : this.serverZoomFactor
        };

        serviceCall = this._fractalEngine.GetFractal(
          fractalParams
        );
      break;  

      case 'rustlang':

        fractalParams = { 
              ...DEFAULT_FRACTAL_PARAMS 
              ,selectedBackend  : BackendLanguage.RUSTLANG
              ,selectedFractal  : this.selectedFractal
              ,maxIterations    : this.maxIterations
              ,isZoomable       : this._buildBounds()
              ,serverZoomIn     : this.serverZoomIn
              ,serverZoomFactor : this.serverZoomFactor
          };

          serviceCall = this._fractalEngine.GetFractal(
            fractalParams
          );
      break;  

      case 'cpp':
        serviceCall = this.fractalService.GetFractal_CPP(
          this.maxIterations, this.realPart, this.imagPart
        );
        break;

      default:
        {
              fractalParams = { 
                  ...DEFAULT_FRACTAL_PARAMS 
                  ,isZoomable : this._buildBounds()
              };

              serviceCall = this._fractalEngine.GetFractal(
                fractalParams
              );
        }
        
    }

    serviceCall.subscribe({
      next: (blob: Blob) => {
        this.generationTime         = performance.now() - t0;
        this.lastImplementationUsed = this.selectedImplementation;
        this.isGenerating           = false;
        if (this.imageUrl) URL.revokeObjectURL(this.imageUrl);
        this.imageUrl = URL.createObjectURL(blob);
        const label = this.backendCapabilities
          .find(o => o.languageCode === this.selectedImplementation)?.label
          ?? this.selectedImplementation;
        this.status_message.set(`[✓ Generated using ${label} in ${this.generationTime.toFixed(2)}ms]`);
        localStorage.setItem('fractal_implementation', this.selectedImplementation);
        FractalBenchmark.record(this.selectedImplementation, this.selectedFractal, this.generationTime);
      },
      error: (err: any) => {
        console.error('Fractal generation error:', err);
        this.isGenerating = false;
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
      && this.serverZoomFactor       === 0; // Updated to match the new generic state
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

  // ── Language benchmark ───────────────────────────────────────────────────

  /** Template-facing wrapper — private getFractalLabel() can't be called directly from HTML. */
  fractalLabel(type: FractalType): string { return this.getFractalLabel(type); }

  private _renderPieChart(): void {
    const store        = FractalBenchmark.load();
    const enabledCodes = this.getAvailableBackends().map(b => b.languageCode);
    const fractalIds   = this.fractalOptions.map(o => o.id);

    const slices = FractalBenchmark
      .computeSliceScores(store, enabledCodes, fractalIds)
      .filter(s => s.score > 0);

    // Compute the flag FIRST, independent of whether the canvas exists yet —
    // the canvas is only mounted/visible once hasBenchmarkData is true, so
    // checking for it before this point created a deadlock (canvas never
    // appears because the flag that reveals it was never set).
    this.hasBenchmarkData = slices.length > 0;
    this._pieChart?.destroy();
    this._pieChart = undefined;

    if (!this.hasBenchmarkData) return;

    // Defer the actual draw one more tick: [hidden]="!hasBenchmarkData" was
    // just flipped above, but Angular hasn't flushed that to the DOM yet in
    // this same synchronous call — drawing immediately would measure a
    // still-hidden (0×0) canvas.
    setTimeout(() => this._drawPieChart(slices), 0);
  }

  private _drawPieChart(slices: FractalSliceScore[]): void {
    if (!this.pieCanvasRef) return;

    const colors = ['#4285F4', '#34a853', '#fbbc05', '#ea4335', '#9c27b0'];

    this._pieChart = new Chart(this.pieCanvasRef.nativeElement, {
      type: 'pie',
      data: {
        labels: slices.map(s => this.getFractalLabel(s.fractalType)),
        datasets: [{
          data           : slices.map(s => s.score),
          backgroundColor: slices.map((_, i) => colors[i % colors.length]),
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend : { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.label}: ${(ctx.raw as number).toFixed(2)} pts`
            }
          }
        },
        onClick: (_evt, elements) => {
          if (!elements.length) return;
          const idx     = elements[0].index;
          const clicked = slices[idx].fractalType;
          this.selectedBenchmarkFractal = clicked;
          // *ngIf="selectedBenchmarkFractal !== null" just flipped — defer
          // so the bar-section/canvas exists before we try to draw into it.
          setTimeout(() => this._renderBarChart(clicked), 0);
        }
      }
    });
  }

  private _renderBarChart(fractalType: FractalType): void {
    if (!this.barCanvasRef) return;

    const store    = FractalBenchmark.load();
    const backends = this.getAvailableBackends().map(b => ({ code: b.languageCode, label: b.label }));
    const bars     = FractalBenchmark.computeBackendTimeBars(store, backends, fractalType);

    this._barChart?.destroy();

    this._barChart = new Chart(this.barCanvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels: bars.map(b => b.label),
        datasets: [{
          label          : `Performance score — ${this.getFractalLabel(fractalType)}`,
          data           : bars.map(b => b.score),
          backgroundColor: '#4285F4',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Performance score (higher = faster)' } }
        },
        plugins: {
          legend : { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const bar = bars[ctx.dataIndex];
                return bar.bestTimeMs === null
                  ? 'No data recorded yet'
                  : `${bar.bestTimeMs.toFixed(2)}ms (score: ${bar.score.toFixed(2)})`;
              }
            }
          }
        }
      }
    });
  }

  clearBenchmarkData(): void {
    FractalBenchmark.clear();
    this.selectedBenchmarkFractal = null;
    this._barChart?.destroy();
    this._barChart = undefined;
    this._renderPieChart();
  }
}