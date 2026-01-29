import { Component, ViewChild, ElementRef, AfterViewInit               } from '@angular/core';
import { ActivatedRoute                                                } from '@angular/router';
import { BaseReferenceComponent                                        } from "src/app/_components/base-reference/base-reference.component";
import { PAGE_ALGORITMOS_COLISION, PAGE_TITLE_LOG, PAGE_TITLE_NO_SOUND } from 'src/app/_models/common';
import { BackendService                                                } from 'src/app/_services/BackendService/backend.service';
import { ConfigService                                                 } from 'src/app/_services/__Utils/ConfigService/config.service';
import { SpeechService                                                 } from 'src/app/_services/__Utils/SpeechService/speech.service';

@Component({
  selector: 'app-algorithm-collision',
  templateUrl: './algorithm-collision.component.html',
  styleUrl: './algorithm-collision.component.css',
  providers: [
    { 
      provide: PAGE_TITLE_LOG, 
      useValue: PAGE_ALGORITMOS_COLISION 
    },
  ]
})
export class AlgorithmCollisionComponent extends BaseReferenceComponent implements AfterViewInit {
  //
  @ViewChild('ballCanvas', { static: false }) canvas!: ElementRef<HTMLCanvasElement> | null;
  //
  private ctx!: CanvasRenderingContext2D | null;
  private ball = {
    x: 100,
    y: 100,
    vx: 5,
    vy: 0,
    radius: 15,
    mass: 1
  };
  private gravity = 0.5;
  private friction = 0.98;
  private restitution = 0.8;
  private animationId: number | null = null; // Track animation frame
  
  constructor(
    public override configService: ConfigService,
    public override speechService: SpeechService,
    public override backendService: BackendService,
    public override route: ActivatedRoute,
  ) {
    super(configService, backendService, route, speechService, PAGE_TITLE_NO_SOUND);
  }

  ngAfterViewInit() {
    this.animate();
  }

  // Reset only the simulation (not the page)
  resetSimulation() {
    // Cancel any ongoing animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    // Reset ball to initial state
    this.ball.x = 100;
    this.ball.y = 100;
    this.ball.vx = 5;
    this.ball.vy = 0;
    
    // Clear canvas
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    }
    
    // Restart animation
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  animate = () => {
    // Initialize context if needed
    if (!this.ctx && this.canvas) {
      this.ctx = this.canvas.nativeElement.getContext('2d');
    }
    
    if (!this.ctx || !this.canvas) return;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);

    // Apply physics
    this.ball.vy += this.gravity; // Apply gravity
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Check for collisions with canvas edges
    if (this.ball.x + this.ball.radius > this.canvas.nativeElement.width || 
        this.ball.x - this.ball.radius < 0) {
      this.ball.vx = -this.ball.vx * this.restitution;
    }
    
    if (this.ball.y + this.ball.radius > this.canvas.nativeElement.height) {
      this.ball.y = this.canvas.nativeElement.height - this.ball.radius;
      this.ball.vy = -this.ball.vy * this.restitution;
      // Apply friction on x-axis when ball hits the ground to slow down
      this.ball.vx *= this.friction;
    }

    // Draw ball
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = "red";
    this.ctx.fill();
    this.ctx.closePath();

    // Continue animation unless stopped
    if (Math.abs(this.ball.vx) >= 0.1 || Math.abs(this.ball.vy) >= 0.1) {
      this.animationId = requestAnimationFrame(this.animate);
    }
  }

  // Optional: Pause/resume functionality
  togglePause() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    } else {
      this.animationId = requestAnimationFrame(this.animate);
    }
  }
}