import { HttpClient } from '@angular/common/http';
import { Component, ViewChild, OnInit } from '@angular/core';
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
  JULIA = 2,
  LEAF = 3
}

export interface LanguageCapability {
  languageCode: string;
  label: string;
  icon: string;
  description: string;
  supportedFractals: {
    [key in FractalType]: boolean;
  };
}

@Component({
    selector: 'app-fractalDemo',
    templateUrl: './fractalDemo.component.html',
    styleUrl: './fractalDemo.component.css',
    providers: [
        {
            provide: PAGE_TITLE_LOG,
            useValue: PAGE_MISCELANEOUS_FRACTAL_DEMO
        },
    ],
    standalone: false
})
export class FractalDemoComponent extends BaseReferenceComponent implements OnInit {
  
  private defaultValues = {
    maxIterations: 500,
    realPart: -0.4,
    imagPart: 0.6,
    implementation: 'typescript',
    fractalType: FractalType.JULIA
  };

  maxIterations: number = 500;
  realPart: number = -0.4;
  imagPart: number = 0.6;
  
  selectedImplementation: string = 'typescript';
  selectedFractal: FractalType = FractalType.JULIA;

  imageUrl: string | null = null;
  submitTitle: string = "[Generate Fractal]";
  pdfButtonCaption: string = "[Generate PDF]";

  // --- MANDELBROT INTERACTIVE ZOOM VIEWPORT STATE ---
  centerX: number = -0.5;
  centerY: number = 0.0;
  zoomFactor: number = 1.0;
  readonly baseXRange: number = 3.0; // View boundary standard spans
  readonly baseYRange: number = 2.4;

  backendCapabilities: LanguageCapability[] = [
    {
      languageCode: 'typescript',
      label: 'TypeScript (Local)',
      icon: '🟡',
      description: 'Runs in browser - Fastest',
      supportedFractals: { [FractalType.MANDELBROT]: true, [FractalType.JULIA]: true, [FractalType.LEAF]: false }
    },
    {
      languageCode: 'nodejs',
      label: 'Node.js (Server)',
      icon: '🟢',
      description: 'Runs on server - Stable',
      supportedFractals: { [FractalType.MANDELBROT]: false, [FractalType.JULIA]: true, [FractalType.LEAF]: false }
    },
    {
      languageCode: 'cpp',
      label: 'C++ (Native)',
      icon: '🔵',
      description: 'Native performance - Most accurate',
      supportedFractals: { [FractalType.MANDELBROT]: false, [FractalType.JULIA]: true, [FractalType.LEAF]: false }
    },
    {
      languageCode: 'j2se',
      label: 'Java J2SE (Spring Boot)',
      icon: '☕',
      description: 'Runs on Spring Boot Engine',
      supportedFractals: { [FractalType.MANDELBROT]: false, [FractalType.JULIA]: true, [FractalType.LEAF]: true }
    }
  ];

  fractalOptions = [
    { id: FractalType.MANDELBROT, label: 'Mandelbrot Set', icon: '🌀' },
    { id: FractalType.JULIA, label: 'Julia Set', icon: '❄️' },
    { id: FractalType.LEAF, label: 'Barnsley Leaf (IFS)', icon: '🌿' }
  ];

  generationTime: number | null = null;
  lastImplementationUsed: string | null = null;

  @ViewChild('_fractal_image') _fractal_image: any;

  constructor(
    public computervisionService: ComputerVisionService,
    public override configService: ConfigService,
    public override backendService: BackendService,
    public override route: ActivatedRoute,
    public override speechService: SpeechService,
    public http: HttpClient,
    public pdfEngine: PdfService,
  ) {
    super(configService, backendService, route, speechService, PAGE_TITLE_NO_SOUND);
  }

  ngOnInit(): void {
    const savedImpl = localStorage.getItem('fractal_implementation');
    if (savedImpl && this.backendCapabilities.some(opt => opt.languageCode === savedImpl)) {
      this.selectedImplementation = savedImpl;
    }
    this.onLanguageChange();
  }

  getAvailableFractals() {
    const currentLang = this.backendCapabilities.find(opt => opt.languageCode === this.selectedImplementation);
    if (!currentLang) return [];
    return this.fractalOptions.filter(fractal => currentLang.supportedFractals[fractal.id]);
  }

  onLanguageChange() {
    this.status_message.set('');
    const available = this.getAvailableFractals();
    const isStillValid = available.some(f => f.id === this.selectedFractal);
    
    if (!isStillValid && available.length > 0) {
      this.selectedFractal = available[0].id;
    }
    // Reset view tracking constraints on engine/fractal transformations
    this.resetZoomViewport();
  }

  onFractalChange(newValue: any) {
    this.selectedFractal = Number(newValue) as FractalType;
    this.status_message.set('');
    this.resetZoomViewport();
  }

  resetZoomViewport() {
    this.centerX = -0.5;
    this.centerY = 0.0;
    this.zoomFactor = 1.0;
  }

  onCanvasClick(event: MouseEvent): void {
    // Only perform interactive coordinate zoom on local TypeScript Mandelbrot operations
    if (this.selectedImplementation !== 'typescript' || this.selectedFractal !== FractalType.MANDELBROT) return;

    const imgElement = event.target as HTMLImageElement;
    const rect = imgElement.getBoundingClientRect();

    const clickXRatio = (event.clientX - rect.left) / rect.width;
    const clickYRatio = (event.clientY - rect.top) / rect.height;

    const currentXRange = this.baseXRange / this.zoomFactor;
    const currentYRange = this.baseYRange / this.zoomFactor;
    
    const currentXMin = this.centerX - currentXRange / 2;
    const currentYMin = this.centerY - currentYRange / 2;

    this.centerX = currentXMin + clickXRatio * currentXRange;
    this.centerY = currentYMin + clickYRatio * currentYRange;

    if (event.shiftKey) {
      this.zoomFactor = Math.max(1, this.zoomFactor / 2);
    } else {
      this.zoomFactor *= 2;
    }

    this.onSubmit();
  }

  onSubmit() {
    this.status_message.set("[...Generating please wait...]");
    this.generationTime = null;
    const startTime = performance.now();
    let serviceCall;
    


      switch (this.selectedImplementation) {
        case 'typescript': {
          const currentXRange = this.baseXRange / this.zoomFactor;
          const currentYRange = this.baseYRange / this.zoomFactor;
          const dynamicBounds = {
            xMin: this.centerX - currentXRange / 2,
            xMax: this.centerX + currentXRange / 2,
            yMin: this.centerY - currentYRange / 2,
            yMax: this.centerY + currentYRange / 2
          };

          serviceCall = this.computervisionService.GetFractal_Typescript(
            this.maxIterations, 
            this.realPart, 
            this.imagPart, 
            this.selectedFractal,
            dynamicBounds
          );
          break;
        }
        case 'nodejs':
          serviceCall = this.computervisionService._OpenCv_GetFractal_NodeJs(this.maxIterations, this.realPart, this.imagPart);
          break;
        case 'cpp':
          serviceCall = this.computervisionService._OpenCv_GetFractal_CPP(this.maxIterations, this.realPart, this.imagPart);
          break;
        case 'j2se' :
                serviceCall = this.computervisionService.GetFractal_j2se(this.maxIterations, this.selectedFractal);
          break;
        default:
          serviceCall = this.computervisionService.GetFractal_Typescript(this.maxIterations, this.realPart, this.imagPart, this.selectedFractal);
      }

    
    serviceCall.subscribe({
      next: (response: Blob) => {
        const endTime = performance.now();
        this.generationTime = endTime - startTime;
        this.lastImplementationUsed = this.selectedImplementation;
        
        if (this.imageUrl) {
          URL.revokeObjectURL(this.imageUrl);
        }
        this.imageUrl = URL.createObjectURL(response);
        
        const implLabel = this.backendCapabilities.find(opt => opt.languageCode === this.selectedImplementation)?.label || this.selectedImplementation;
        this.status_message.set(`[✓ Image generated correctly using ${implLabel} in ${this.generationTime.toFixed(2)}ms]`);
        localStorage.setItem('fractal_implementation', this.selectedImplementation);
      },
      error: (error: any) => {
        console.error('Error fetching the image:', error);
        this.imageUrl = null;
        const implLabel = this.backendCapabilities.find(opt => opt.languageCode === this.selectedImplementation)?.label || this.selectedImplementation;
        this.status_message.set(`[✗ Error occurred with ${implLabel}. Please try again or switch implementation]`);
      }
    });
  }
  
  GeneratePDF() {
    let fileName_input: string = `FRACTAL_IMAGE`;
    this.pdfEngine._GetPDF(this.pageTitle, this._fractal_image, this._fractal_image, fileName_input).subscribe({
      next: () => {
        this.status_message.set('[...Generating PDF...]');
        this.pdfButtonCaption = '[...Generating PDF...]';
      },
      error: (error: { message: string; }) => {
        this.status_message.set('An error occured : ' + error.message);
        this.pdfButtonCaption = "[Generate PDF]";
      },
      complete: () => {
        this.status_message.set(`[PDF File generated correctly]`);
        this.pdfButtonCaption = "[Generate PDF]";
      }
    });
  }
  
  resetFractalsToDefaults(): void {
    this.maxIterations = this.defaultValues.maxIterations;
    this.realPart = this.defaultValues.realPart;
    this.imagPart = this.defaultValues.imagPart;
    this.selectedImplementation = this.defaultValues.implementation;
    this.selectedFractal = this.defaultValues.fractalType;
    this.resetZoomViewport();
    
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
      this.imageUrl = null;
    }
    
    this.status_message.set("");
    this.generationTime = null;
    this.lastImplementationUsed = null;
    localStorage.setItem('fractal_implementation', this.selectedImplementation);
  }

  isAtDefaultValues(): boolean {
    return this.maxIterations === this.defaultValues.maxIterations &&
      Math.abs(this.realPart - this.defaultValues.realPart) < 0.001 &&
      Math.abs(this.imagPart - this.defaultValues.imagPart) < 0.001 &&
      this.selectedImplementation === this.defaultValues.implementation &&
      this.selectedFractal === this.defaultValues.fractalType &&
      this.zoomFactor === 1.0;
  }
  
  getSelectedImplementationIcon(): string {
    const option = this.backendCapabilities.find(opt => opt.languageCode === this.selectedImplementation);
    return option ? option.icon : '🟡';
  }
  
  getSelectedImplementationDescription(): string {
    const option = this.backendCapabilities.find(opt => opt.languageCode === this.selectedImplementation);
    return option ? option.description : '';
  }
  
  getPerformanceColor(): string {
    if (!this.generationTime) return 'secondary';
    if (this.generationTime < 200) return 'success';
    if (this.generationTime < 500) return 'warning';
    return 'danger';
  }
}