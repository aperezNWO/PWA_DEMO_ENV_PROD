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
    implementation: 'typescript'
  };

  maxIterations: number = 500;
  realPart: number = -0.4;
  imagPart: number = 0.6;
  selectedImplementation: string = 'typescript';
  imageUrl: string | null = null;
  submitTitle: string = "[Generate Fractal]";
  pdfButtonCaption: string = "[Generate PDF]";
  
  // Array de opciones actualizado con la cuarta opción: Java J2SE
  implementationOptions = [
    { value: 'typescript', label: 'TypeScript (Local)', icon: '🟡', description: 'Runs in browser - Fastest' },
    { value: 'nodejs', label: 'Node.js (Server)', icon: '🟢', description: 'Runs on server - Stable' },
    { value: 'cpp', label: 'C++ (Native)', icon: '🔵', description: 'Native performance - Most accurate' },
    { value: 'j2se', label: 'Java J2SE (Spring Boot)', icon: '☕', description: 'Runs on Spring Boot - Structured JSON' }
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
    super(
      configService,
      backendService,
      route,
      speechService,
      PAGE_TITLE_NO_SOUND
    );
  }

  ngOnInit(): void {
    const savedImpl = localStorage.getItem('fractal_implementation');
    if (savedImpl && this.implementationOptions.some(opt => opt.value === savedImpl)) {
      this.selectedImplementation = savedImpl;
    }
  }

  onSubmit() {
    //
    this.status_message.set("[...Generating please wait...]");
    this.generationTime = null;
    //
    const startTime     = performance.now();
 
    // --- FLUJO TRADICIONAL DE BLOBS (TypeScript, Node.js, C++) ---
    let serviceCall;
    
    switch (this.selectedImplementation) {
      case 'typescript':
        serviceCall = this.computervisionService.GetFractal_Typescript(this.maxIterations, this.realPart, this.imagPart);
        break;
      case 'nodejs':
        serviceCall = this.computervisionService._OpenCv_GetFractal_NodeJs(this.maxIterations, this.realPart, this.imagPart);
        break;
      case 'cpp':
        serviceCall = this.computervisionService._OpenCv_GetFractal_CPP(this.maxIterations, this.realPart, this.imagPart);
        break;
      case 'j2se' :
        serviceCall = this.computervisionService.GetFractal_j2se(this.maxIterations);
        break;
      default:
        serviceCall = this.computervisionService.GetFractal_Typescript(this.maxIterations, this.realPart, this.imagPart);
    }
    
    serviceCall.subscribe(
      (response: Blob) => {

        //
        const endTime               = performance.now();
        this.generationTime         = endTime - startTime;
        this.lastImplementationUsed = this.selectedImplementation;
        
        //
        if (this.imageUrl) {
          URL.revokeObjectURL(this.imageUrl);
        }
        this.imageUrl = URL.createObjectURL(response);
        
        //
        const implLabel = this.implementationOptions.find(opt => opt.value === this.selectedImplementation)?.label || this.selectedImplementation;
        this.status_message.set(`[✓ Image generated correctly using ${implLabel} in ${this.generationTime.toFixed(2)}ms]`);
        
        //
        localStorage.setItem('fractal_implementation', this.selectedImplementation);
      },
      (error: any) => {
        //
        console.error('Error fetching the image:', error);

        //
        this.imageUrl    = null;
        const implLabel  = this.implementationOptions.find(opt => opt.value === this.selectedImplementation)?.label || this.selectedImplementation;

        //
        this.status_message.set(`[✗ Error occurred with ${implLabel}. Please try again or switch implementation]`);
      }
    );
  }
  // 
  GeneratePDF() {
    let fileName_input: string = `FRACTAL_IMAGE`;
    let fileName_output: string = '';
    
    this.pdfEngine._GetPDF(
      this.pageTitle,
      this._fractal_image,
      this._fractal_image,
      fileName_input,
    ).subscribe({
      next: (fileName: string) => {
        this.status_message.set('[...Generating PDF...]');
        this.pdfButtonCaption = '[...Generating PDF...]';
        fileName_output = fileName;
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
  
  //
  resetToDefaults(): void {
    //
    this.maxIterations          = this.defaultValues.maxIterations;
    this.realPart               = this.defaultValues.realPart;
    this.imagPart               = this.defaultValues.imagPart;
    this.selectedImplementation = this.defaultValues.implementation;
    
    //
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
      this.imageUrl = null;
    }
    
    //
    this.status_message.set("");
    this.generationTime = null;
    this.lastImplementationUsed = null;

    //
    localStorage.setItem('fractal_implementation', this.selectedImplementation);
  }

  //
  isAtDefaultValues(): boolean {
    return this.maxIterations === this.defaultValues.maxIterations &&
      Math.abs(this.realPart - this.defaultValues.realPart) < 0.001 &&
      Math.abs(this.imagPart - this.defaultValues.imagPart) < 0.001 &&
      this.selectedImplementation === this.defaultValues.implementation;
  }
  
  //
  getSelectedImplementationIcon(): string {
    const option = this.implementationOptions.find(opt => opt.value === this.selectedImplementation);
    return option ? option.icon : '🟡';
  }
  
  //
  getSelectedImplementationDescription(): string {
    const option = this.implementationOptions.find(opt => opt.value === this.selectedImplementation);
    return option ? option.description : '';
  }
  
  //
  getPerformanceColor(): string {
    if (!this.generationTime) return 'secondary';
    if (this.generationTime < 200) return 'success';
    if (this.generationTime < 500) return 'warning';
    return 'danger';
  }
}