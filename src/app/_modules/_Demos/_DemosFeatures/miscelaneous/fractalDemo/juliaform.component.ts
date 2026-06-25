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

// 1. Core Architecture Enum Configuration
export enum FractalType {
  MANDELBROT = 1,
  JULIA = 2,
  LEAF = 3
}

// 2. Strongly Typed Matrix Interfaces
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
    selector: 'app-juliaform',
    templateUrl: './juliaform.component.html',
    styleUrl: './juliaform.component.css',
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
  
  selectedImplementation: string = 'typescript'; // Primary Dropdown Target
  selectedFractal: FractalType = FractalType.JULIA; // Nested Dropdown Target

  imageUrl: string | null = null;
  submitTitle: string = "[Generate Fractal]";
  pdfButtonCaption: string = "[Generate PDF]";

  // 3. Centralized Feature Toggle Dictionary Map 
  backendCapabilities: LanguageCapability[] = [
    {
      languageCode: 'typescript',
      label: 'TypeScript (Local)',
      icon: '🟡',
      description: 'Runs in browser - Fastest',
      supportedFractals: { 
        [FractalType.MANDELBROT]: true,  // Now enabled locally!
        [FractalType.JULIA]: true, 
        [FractalType.LEAF]: false 
      }
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

  // 4. Fractal Metadata Configuration Master List
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

  // Helper method used by HTML templates to extract child lists based on matrix constraints
  getAvailableFractals() {
    const currentLang = this.backendCapabilities.find(opt => opt.languageCode === this.selectedImplementation);
    if (!currentLang) return [];
    return this.fractalOptions.filter(fractal => currentLang.supportedFractals[fractal.id]);
  }

  // Automatic recovery fallback if selected fractal isn't available under the new language context
  onLanguageChange() {
    this.status_message.set('');
    const available = this.getAvailableFractals();
    const isStillValid = available.some(f => f.id === this.selectedFractal);
    
    if (!isStillValid && available.length > 0) {
      this.selectedFractal = available[0].id;
    }
  }

  // Explicit typecasting handler to avoid native HTML value string-coercion bugs
  onFractalChange(newValue: any) {
    this.selectedFractal = Number(newValue) as FractalType;
    this.status_message.set('');
  }

  onSubmit() {
    //
    this.status_message.set("[...Generating please wait...]");
    this.generationTime = null;
    const startTime = performance.now();
    let serviceCall;
    
    switch (this.selectedImplementation) {
        case 'typescript':
          serviceCall = this.computervisionService.GetFractal_Typescript(
            this.maxIterations, 
            this.realPart, 
            this.imagPart, 
            this.selectedFractal
          );
          break;
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
    };
    
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
  
  resetToDefaults(): void {
    this.maxIterations = this.defaultValues.maxIterations;
    this.realPart = this.defaultValues.realPart;
    this.imagPart = this.defaultValues.imagPart;
    this.selectedImplementation = this.defaultValues.implementation;
    this.selectedFractal = this.defaultValues.fractalType;
    
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
      this.selectedFractal === this.defaultValues.fractalType;
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