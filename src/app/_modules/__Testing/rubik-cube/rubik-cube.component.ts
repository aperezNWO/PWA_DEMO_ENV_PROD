import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { CubeLogic, Move } from './cube-logic';

@Component({
  selector: 'app-rubiks-cube',
  templateUrl: './rubik-cube.component.html',
  styleUrls: ['./rubik-cube.component.css'],
  standalone: false
})
export class RubikCubeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('rendererContainer') rendererContainer!: ElementRef;

  public scene!: THREE.Scene;
  public camera!: THREE.PerspectiveCamera;
  public renderer!: THREE.WebGLRenderer;
  public cubes: THREE.Mesh[] = [];
  public originalPositions: THREE.Vector3[] = [];
  public originalRotations: THREE.Quaternion[] = [];
  
  public cubeLogic = new CubeLogic();
  public appliedMoves: Move[] = []; // Track all moves applied
  
  public isAnimating = false;
  
  // Mouse controls
  public isDragging = false;
  public previousMousePosition = { x: 0, y: 0 };
  public rotation = { x: 0, y: 0 };

  ngAfterViewInit(): void {
    this.initThreeJS();
    this.createRubiksCube();
    this.saveOriginalState();
    this.animate();
    this.setupEventListeners();
    this.resetCube();
  }

  ngOnDestroy(): void {
    if (this.renderer) {
      this.renderer.dispose();
    }
    this.removeEventListeners();
  }

  public initThreeJS(): void {
    const width = this.rendererContainer.nativeElement.clientWidth;
    const height = this.rendererContainer.nativeElement.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.z = 8;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.rendererContainer.nativeElement.appendChild(this.renderer.domElement);
  }

  public createRubiksCube(): void {
    const colorMap: Record<string, number> = {
      'W': 0xffffff, 'Y': 0xffff00, 'R': 0xff0000,
      'O': 0xffa500, 'G': 0x00ff00, 'B': 0x0000ff
    };

    const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const materials = [
            new THREE.MeshLambertMaterial({ color: this.get3DFaceColor(x, y, z, 'right', colorMap) }),
            new THREE.MeshLambertMaterial({ color: this.get3DFaceColor(x, y, z, 'left', colorMap) }),
            new THREE.MeshLambertMaterial({ color: this.get3DFaceColor(x, y, z, 'up', colorMap) }),
            new THREE.MeshLambertMaterial({ color: this.get3DFaceColor(x, y, z, 'down', colorMap) }),
            new THREE.MeshLambertMaterial({ color: this.get3DFaceColor(x, y, z, 'front', colorMap) }),
            new THREE.MeshLambertMaterial({ color: this.get3DFaceColor(x, y, z, 'back', colorMap) })
          ];

          const cube = new THREE.Mesh(geometry, materials);
          cube.position.set(x, y, z);
          this.scene.add(cube);
          this.cubes.push(cube);
        }
      }
    }

    const ambientLight = new THREE.AmbientLight(0x606060);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
  }

  public get3DFaceColor(x: number, y: number, z: number, face: string, colorMap: Record<string, number>): number {
    let logicalFace: keyof typeof this.cubeLogic.faces = 'F';
    let row = 0, col = 0;

    if (face === 'front' && Math.abs(z - 1) < 0.1) { 
      logicalFace = 'F'; row = 1 - y; col = x + 1; 
    }
    else if (face === 'back' && Math.abs(z + 1) < 0.1) { 
      logicalFace = 'B'; row = 1 - y; col = 1 - (x + 1); 
    }
    else if (face === 'up' && Math.abs(y - 1) < 0.1) { 
      logicalFace = 'U'; row = 1 - z; col = x + 1; 
    }
    else if (face === 'down' && Math.abs(y + 1) < 0.1) { 
      logicalFace = 'D'; row = z + 1; col = x + 1; 
    }
    else if (face === 'left' && Math.abs(x + 1) < 0.1) { 
      logicalFace = 'L'; row = 1 - y; col = 1 - (z + 1); 
    }
    else if (face === 'right' && Math.abs(x - 1) < 0.1) { 
      logicalFace = 'R'; row = 1 - y; col = z + 1; 
    }
    else return 0x000000;

    row = Math.max(0, Math.min(2, Math.round(row)));
    col = Math.max(0, Math.min(2, Math.round(col)));
    
    const colorChar = this.cubeLogic.faces[logicalFace][row][col];
    return colorMap[colorChar] || 0x000000;
  }

  public saveOriginalState(): void {
    this.originalPositions = this.cubes.map(cube => cube.position.clone());
    this.originalRotations = this.cubes.map(cube => cube.quaternion.clone());
  }

  public resetCube(): void {
    this.cubeLogic.reset();
    this.appliedMoves = [];
    this.update3DFromState();
  }

  public animate = (): void => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  // DEBUG: Add console logs to see if button is clicked
  shuffleCube(): void {
    console.log('Shuffle button clicked!');
    if (this.isAnimating) {
      console.log('Already animating, skipping...');
      return;
    }
    
    this.isAnimating = true;
    this.resetCube();
    
    // Apply random moves
    const moves: Move[] = ['R', 'L', 'U', 'D', 'F', 'B'];
    const scrambleMoves: Move[] = [];
    
    for (let i = 0; i < 8; i++) {
      const move = moves[Math.floor(Math.random() * moves.length)];
      scrambleMoves.push(move);
      this.appliedMoves.push(move);
    }
    
    this.executeMoves(scrambleMoves);
  }

  solveCube(): void {
    console.log('Solve button clicked!');
    console.log('Applied moves:', this.appliedMoves);
    if (this.isAnimating) {
      console.log('Already animating, skipping...');
      return;
    }
    
    if (this.appliedMoves.length === 0) {
      console.log('No moves to reverse, cube is already solved');
      return;
    }
    
    this.isAnimating = true;
    
    // Reverse the applied moves
    const solution = [...this.appliedMoves].reverse().map(move => {
      if (move.endsWith('\'')) {
        return move.replace('\'', '') as Move;
      } else {
        return (move + '\'') as Move;
      }
    });
    
    console.log('Solution moves:', solution);
    this.executeMoves(solution);
  }

  public async executeMoves(moves: Move[]): Promise<void> {
    for (const move of moves) {
      await this.animateMove(move);
      this.cubeLogic.move(move);
      this.update3DFromState();
    }
    
    // If we just solved, clear the applied moves
    if (this.cubeLogic.isSolved()) {
      this.appliedMoves = [];
    }
    
    this.isAnimating = false;
    console.log('Animation complete!');
  }

  public animateMove(move: Move): Promise<void> {
    return new Promise((resolve) => {
      let baseMove = move.replace(/['2]/g, '') as 'R' | 'L' | 'U' | 'D' | 'F' | 'B';
      let clockwise = !move.includes('\'');

      let axis: THREE.Vector3;
      let angle: number;
      let layerSelector: (cube: THREE.Mesh) => boolean;

      switch (baseMove) {
        case 'R':
          axis = new THREE.Vector3(1, 0, 0);
          angle = clockwise ? -Math.PI / 2 : Math.PI / 2;
          layerSelector = (cube) => Math.abs(cube.position.x - 1) < 0.1;
          break;
        case 'L':
          axis = new THREE.Vector3(1, 0, 0);
          angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
          layerSelector = (cube) => Math.abs(cube.position.x + 1) < 0.1;
          break;
        case 'U':
          axis = new THREE.Vector3(0, 1, 0);
          angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
          layerSelector = (cube) => Math.abs(cube.position.y - 1) < 0.1;
          break;
        case 'D':
          axis = new THREE.Vector3(0, 1, 0);
          angle = clockwise ? -Math.PI / 2 : Math.PI / 2;
          layerSelector = (cube) => Math.abs(cube.position.y + 1) < 0.1;
          break;
        case 'F':
          axis = new THREE.Vector3(0, 0, 1);
          angle = clockwise ? -Math.PI / 2 : Math.PI / 2;
          layerSelector = (cube) => Math.abs(cube.position.z - 1) < 0.1;
          break;
        case 'B':
          axis = new THREE.Vector3(0, 0, 1);
          angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
          layerSelector = (cube) => Math.abs(cube.position.z + 1) < 0.1;
          break;
        default:
          resolve();
          return;
      }

      const layerCubes = this.cubes.filter(layerSelector);
      let progress = 0;
      const duration = 200;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        progress = Math.min(elapsed / duration, 1);

        layerCubes.forEach(cube => {
          const idx = this.cubes.indexOf(cube);
          if (idx >= 0) {
            cube.position.copy(this.originalPositions[idx]);
            cube.quaternion.copy(this.originalRotations[idx]);
          }
        });

        const currentAngle = angle * progress;
        layerCubes.forEach(cube => {
          cube.rotateOnWorldAxis(axis, currentAngle);
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          layerCubes.forEach(cube => {
            const idx = this.cubes.indexOf(cube);
            if (idx >= 0) {
              this.originalPositions[idx] = cube.position.clone();
              this.originalRotations[idx] = cube.quaternion.clone();
            }
          });
          resolve();
        }
      };

      animate();
    });
  }

  public update3DFromState(): void {
    const colorMap: Record<string, number> = {
      'W': 0xffffff, 'Y': 0xffff00, 'R': 0xff0000,
      'O': 0xffa500, 'G': 0x00ff00, 'B': 0x0000ff
    };

    this.cubes.forEach((cube, idx) => {
      const pos = this.originalPositions[idx];
      const x = Math.round(pos.x);
      const y = Math.round(pos.y);
      const z = Math.round(pos.z);

      const materials = cube.material as THREE.MeshLambertMaterial[];
      materials[0].color.set(this.get3DFaceColor(x, y, z, 'right', colorMap));
      materials[1].color.set(this.get3DFaceColor(x, y, z, 'left', colorMap));
      materials[2].color.set(this.get3DFaceColor(x, y, z, 'up', colorMap));
      materials[3].color.set(this.get3DFaceColor(x, y, z, 'down', colorMap));
      materials[4].color.set(this.get3DFaceColor(x, y, z, 'front', colorMap));
      materials[5].color.set(this.get3DFaceColor(x, y, z, 'back', colorMap));
    });
  }

  // === Mouse Event Handlers ===
  public setupEventListeners(): void {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('resize', this.onWindowResize);
  }

  public removeEventListeners(): void {
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('mousedown', this.onMouseDown);
    canvas.removeEventListener('mousemove', this.onMouseMove);
    canvas.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('resize', this.onWindowResize);
  }

  public onMouseDown = (event: MouseEvent): void => {
    if (!this.isAnimating) {
      this.isDragging = true;
      this.previousMousePosition = { x: event.clientX, y: event.clientY };
    }
  };

  public onMouseMove = (event: MouseEvent): void => {
    if (!this.isDragging || this.isAnimating) return;

    const deltaX = event.clientX - this.previousMousePosition.x;
    const deltaY = event.clientY - this.previousMousePosition.y;

    this.rotation.y += deltaX * 0.01;
    this.rotation.x += deltaY * 0.01;
    this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x));

    this.scene.rotation.y = this.rotation.y;
    this.scene.rotation.x = this.rotation.x;
    this.previousMousePosition = { x: event.clientX, y: event.clientY };
  };

  public onMouseUp = (): void => {
    this.isDragging = false;
  };

  public onWindowResize = (): void => {
    const width = this.rendererContainer.nativeElement.clientWidth;
    const height = this.rendererContainer.nativeElement.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  // Simple UI helpers - always allow solving if not animating and has moves
  get canShuffle(): boolean { 
    return !this.isAnimating; 
  }

  get canSolve(): boolean { 
    return !this.isAnimating && this.appliedMoves.length > 0; 
  }
}