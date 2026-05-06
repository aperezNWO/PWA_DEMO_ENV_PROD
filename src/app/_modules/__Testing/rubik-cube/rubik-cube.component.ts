import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-rubiks-cube',
  templateUrl: './rubik-cube.component.html',
  styleUrl: './rubik-cube.component.css',
  standalone: false
})
export class RubikCubeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('rendererContainer') rendererContainer!: ElementRef;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private cubes: THREE.Mesh[] = [];
  
  // Pointer interaction
  private isDragging = false;
  private previousPosition = { x: 0, y: 0 };
  private rotation = { x: 0, y: 0 };

  ngAfterViewInit(): void {
    this.initThreeJS();
    this.createRubiksCube();
    this.animate();
    this.setupEventListeners();
  }

  ngOnDestroy(): void {
    if (this.renderer) {
      this.renderer.dispose();
    }
    this.removeEventListeners();
  }

  private initThreeJS(): void {
    const width = this.rendererContainer.nativeElement.clientWidth;
    const height = this.rendererContainer.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a); // Dark gray

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.z = 8;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);
  }

  private createRubiksCube(): void {
    const colors = {
      up: 0xffffff,      // white
      down: 0xffff00,    // yellow
      front: 0xff0000,   // red
      back: 0xffa500,    // orange
      left: 0x00ff00,    // green
      right: 0x0000ff    // blue
    };

    const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const materials = [
            new THREE.MeshLambertMaterial({ 
              color: x === 1 ? colors.right : 0x222222 
            }), // right
            new THREE.MeshLambertMaterial({ 
              color: x === -1 ? colors.left : 0x222222 
            }), // left
            new THREE.MeshLambertMaterial({ 
              color: y === 1 ? colors.up : 0x222222 
            }), // up
            new THREE.MeshLambertMaterial({ 
              color: y === -1 ? colors.down : 0x222222 
            }), // down
            new THREE.MeshLambertMaterial({ 
              color: z === 1 ? colors.front : 0x222222 
            }), // front
            new THREE.MeshLambertMaterial({ 
              color: z === -1 ? colors.back : 0x222222 
            })  // back
          ];

          const cube = new THREE.Mesh(geometry, materials);
          cube.position.set(x, y, z);
          this.scene.add(cube);
          this.cubes.push(cube);
        }
      }
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(2, 2, 2);
    this.scene.add(directionalLight);
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  // === Pointer Event Handlers (Cross-browser compatible) ===
  private setupEventListeners(): void {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerUp);
    window.addEventListener('resize', this.onWindowResize);
  }

  private removeEventListeners(): void {
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    canvas.removeEventListener('pointercancel', this.onPointerUp);
    window.removeEventListener('resize', this.onWindowResize);
  }

  private onPointerDown = (event: PointerEvent): void => {
    event.preventDefault();
    this.isDragging = true;
    this.previousPosition = { x: event.clientX, y: event.clientY };
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.isDragging) return;
    event.preventDefault();

    const deltaX = event.clientX - this.previousPosition.x;
    const deltaY = event.clientY - this.previousPosition.y;

    this.rotation.y += deltaX * 0.01;
    this.rotation.x += deltaY * 0.01;
    this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));

    this.scene.rotation.y = this.rotation.y;
    this.scene.rotation.x = this.rotation.x;

    this.previousPosition = { x: event.clientX, y: event.clientY };
  };

  private onPointerUp = (event: PointerEvent): void => {
    event.preventDefault();
    this.isDragging = false;
  };

  private onWindowResize = (): void => {
    const width = this.rendererContainer.nativeElement.clientWidth;
    const height = this.rendererContainer.nativeElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };
}