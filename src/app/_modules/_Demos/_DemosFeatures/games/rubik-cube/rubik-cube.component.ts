import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaseReferenceComponent } from 'src/app/_components/base-reference/base-reference.component';
import { PAGE_GAMES_RUBIK_CUBE, PAGE_TITLE_LOG, PAGE_TITLE_NO_SOUND                      } from 'src/app/_models/common';
import { ConfigService } from 'src/app/_services/__Utils/ConfigService/config.service';
import { SpeechService } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { BackendService } from 'src/app/_services/BackendService/backend.service';
import * as THREE from 'three';

interface CubeMove {
  axis: 'x' | 'y' | 'z';
  layer: number;
  clockwise: boolean;
}

@Component({
  selector: 'app-rubiks-cube',
  templateUrl: './rubik-cube.component.html',
  styleUrl: './rubik-cube.component.css',
  providers: [
          {
              provide:  PAGE_TITLE_LOG,
              useValue: PAGE_GAMES_RUBIK_CUBE
          },
  ],
  standalone: false
})
export class RubikCubeComponent extends BaseReferenceComponent implements AfterViewInit, OnDestroy  {
  //
  constructor(
                  public  override configService    : ConfigService,
                  public  override route            : ActivatedRoute,
                  public  override speechService    : SpeechService,
                  public  override backendService   : BackendService) 
  { 
      //
      super(configService,
            backendService,
            route,
            speechService,
            PAGE_TITLE_NO_SOUND,
      )
  }
  
  @ViewChild('rendererContainer') rendererContainer!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private cubes: THREE.Mesh[] = [];
  
  public isDragging        = false;
  public isAnimating       = false;
  public isClockwise       = true;
  private previousPosition = { x: 0, y: 0 };
  public moveHistory: CubeMove[] = [];


  ngAfterViewInit(): void {
    this.initThreeJS();
    this.createRubiksCube();
    this.animate();
    this.setupEventListeners();
  }

  ngOnDestroy(): void {
    this.disposeCube();
    if (this.renderer) this.renderer.dispose();
  }

  private initThreeJS(): void {
    const container = this.rendererContainer.nativeElement;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);
    
    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    // Move camera closer: Changed from (4, 4, 7) to (3, 3, 5)
    this.camera.position.set(3, 3, 5);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);
    
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 5, 5);
    this.scene.add(dirLight);
  }

  private createRubiksCube(): void {
    const colors = { right: 0x0000ff, left: 0x00ff00, up: 0xffffff, down: 0xffff00, front: 0xff0000, back: 0xffa500 };
    const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const materials = [
            new THREE.MeshLambertMaterial({ color: x === 1 ? colors.right : 0x111111 }),
            new THREE.MeshLambertMaterial({ color: x === -1 ? colors.left : 0x111111 }),
            new THREE.MeshLambertMaterial({ color: y === 1 ? colors.up : 0x111111 }),
            new THREE.MeshLambertMaterial({ color: y === -1 ? colors.down : 0x111111 }),
            new THREE.MeshLambertMaterial({ color: z === 1 ? colors.front : 0x111111 }),
            new THREE.MeshLambertMaterial({ color: z === -1 ? colors.back : 0x111111 })
          ];
          const cube = new THREE.Mesh(geometry, materials);
          cube.position.set(x, y, z);
          this.scene.add(cube);
          this.cubes.push(cube);
        }
      }
    }
  }

  public rotateFace(axis: 'x' | 'y' | 'z', layer: number, clockwise: boolean, record: boolean = true): Promise<void> {
    return new Promise((resolve) => {
      if (this.isAnimating) { resolve(); return; }
      this.isAnimating = true;
      if (record) this.moveHistory.push({ axis, layer, clockwise });

      const group = new THREE.Group();
      this.scene.add(group);
      const cubesInFace = this.cubes.filter(cube => Math.abs(cube.position[axis] - layer) < 0.1);
      cubesInFace.forEach(cube => group.attach(cube));
      
      const targetRotation = clockwise ? -Math.PI / 2 : Math.PI / 2;
      const duration = 200; 
      const startTime = performance.now();

      const animateMove = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        group.rotation[axis] = targetRotation * (1 - Math.pow(1 - progress, 3));
        if (progress < 1) requestAnimationFrame(animateMove);
        else {
          [...group.children].forEach(child => this.scene.attach(child));
          this.scene.remove(group);
          this.isAnimating = false;
          resolve();
        }
      };
      requestAnimationFrame(animateMove);
    });
  }

  public async manualMove(axis: 'x' | 'y' | 'z', layer: number, clockwise: boolean) {
    await this.rotateFace(axis, layer, clockwise, true);
  }

  public async solveByHistory(): Promise<void> {
    if (this.isAnimating || this.moveHistory.length === 0) return;
    const historyToReverse = [...this.moveHistory].reverse();
    this.moveHistory = [];
    for (const move of historyToReverse) {
      await this.rotateFace(move.axis, move.layer, !move.clockwise, false);
    }
  }

  public async shuffleCube(moves: number = 15): Promise<void> {
    const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z'];
    const layers = [-1, 0, 1];
    for (let i = 0; i < moves; i++) {
      await this.rotateFace(axes[Math.floor(Math.random() * 3)], layers[Math.floor(Math.random() * 3)], Math.random() > 0.5, true);
    }
  }

  public resetView(): void { this.scene.rotation.set(0, 0, 0); }
  public resetCube(): void { this.moveHistory = []; this.disposeCube(); this.createRubiksCube(); }
  
  private disposeCube(): void {
    this.cubes.forEach(cube => {
      this.scene.remove(cube);
      cube.geometry.dispose();
      (cube.material as THREE.Material[]).forEach(m => m.dispose());
    });
    this.cubes = [];
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', (e) => { 
      this.isDragging = true; 
      this.previousPosition = { x: e.clientX, y: e.clientY }; 
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;
      this.scene.rotation.y += (e.clientX - this.previousPosition.x) * 0.007;
      this.scene.rotation.x += (e.clientY - this.previousPosition.y) * 0.007;
      this.previousPosition = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener('pointerup', () => this.isDragging = false);
    window.addEventListener('resize', () => {
      const container = this.rendererContainer.nativeElement;
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    });
  }
}