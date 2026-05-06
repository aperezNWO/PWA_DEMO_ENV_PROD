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
  
  private isDragging = false;
  public isAnimating = false;
  public isClockwise = true;
  private previousPosition = { x: 0, y: 0 };

  ngAfterViewInit(): void {
    this.initThreeJS();
    this.createRubiksCube();
    this.animate();
    this.setupEventListeners();
  }

  ngOnDestroy(): void {
    this.disposeCube();
    if (this.renderer) this.renderer.dispose();
    this.removeEventListeners();
  }

  private initThreeJS(): void {
    const width = this.rendererContainer.nativeElement.clientWidth;
    const height = this.rendererContainer.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(4, 4, 7);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 5, 5);
    this.scene.add(dirLight);
  }

  private createRubiksCube(): void {
    const colors = {
      right: 0x0000ff, left: 0x00ff00, 
      up: 0xffffff,    down: 0xffff00, 
      front: 0xff0000, back: 0xffa500
    };

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

  public rotateFace(axis: 'x' | 'y' | 'z', layer: number, clockwise: boolean): void {
    if (this.isAnimating) return;
    this.isAnimating = true;

    const group = new THREE.Group();
    this.scene.add(group);

    const cubesInFace = this.cubes.filter(cube => Math.abs(cube.position[axis] - layer) < 0.1);
    cubesInFace.forEach(cube => group.attach(cube));

    const targetRotation = clockwise ? -Math.PI / 2 : Math.PI / 2;
    const duration = 350; 
    const startTime = performance.now();

    const animateMove = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      group.rotation[axis] = targetRotation * eased;

      if (progress < 1) {
        requestAnimationFrame(animateMove);
      } else {
        [...group.children].forEach(child => this.scene.attach(child));
        this.scene.remove(group);
        this.isAnimating = false;
      }
    };
    requestAnimationFrame(animateMove);
  }

  public resetView(): void { this.scene.rotation.set(0, 0, 0); }

  public resetCube(): void {
    if (this.isAnimating) return;
    this.disposeCube();
    this.createRubiksCube();
  }

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
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove, { passive: false });
    canvas.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('resize', this.onWindowResize);
  }

  private removeEventListeners(): void {
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('resize', this.onWindowResize);
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.isDragging = true;
    this.previousPosition = { x: e.clientX, y: e.clientY };
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.isDragging) return;
    if (e.cancelable) e.preventDefault();
    const deltaX = e.clientX - this.previousPosition.x;
    const deltaY = e.clientY - this.previousPosition.y;
    this.scene.rotation.y += deltaX * 0.007;
    this.scene.rotation.x += deltaY * 0.007;
    this.previousPosition = { x: e.clientX, y: e.clientY };
  };

  private onPointerUp = (): void => { this.isDragging = false; };

  private onWindowResize = (): void => {
    const container = this.rendererContainer.nativeElement;
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  };
}