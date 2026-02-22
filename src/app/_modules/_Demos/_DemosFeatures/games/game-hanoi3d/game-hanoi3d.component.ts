import { 
  Component, 
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  viewChild,      // v21 work: signal-based viewChild() replaces @ViewChild decorator
  inject,         // v21 work: functional inject() replaces constructor parameter injection
  signal,         // v21 work: signal() for reactive state primitives
  computed,       // v21 work: computed() for derived reactive state
  effect,         // v21 work: effect() for reactive side effects
  afterNextRender // v21 work: afterNextRender() replaces ngAfterViewInit + setTimeout()
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BackendService } from 'src/app/_services/BackendService/backend.service';
import { SpeechService } from 'src/app/_services/__Utils/SpeechService/speech.service';
import { BaseReferenceComponent } from 'src/app/_components/base-reference/base-reference.component';
import { ConfigService } from 'src/app/_services/__Utils/ConfigService/config.service';
import { PAGE_TITLE_LOG, PAGE_TITLE_NO_SOUND, PAGE_GAMES_HANOI_3D } from 'src/app/_models/common';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';
import { Tween, Easing, Group } from '@tweenjs/tween.js';

// ============================================================
// INTERFACES
// ============================================================

export interface HanoiMove {
  from: number;
  to: number;
}

// v21 work: typed interface for all user-configurable scene parameters
// A single config signal of this type replaces multiple scattered class properties
export interface HanoiSceneConfig {
  // Puzzle
  numDisks:         number;
  // Camera
  cameraFov:        number;
  cameraY:          number;
  cameraZ:          number;
  // Lighting
  ambientIntensity: number;
  // Animation (Tween)
  tweenDuration:    number;
  tweenLiftHeight:  number;
  // Colors
  bgColor:          string;
  towerColor:       string;
  diskColors:       string[];
}

// v21 work: default config extracted as a constant so resetToDefaults() can restore it cleanly
const DEFAULT_CONFIG: HanoiSceneConfig = {
  numDisks:         3,
  cameraFov:        75,
  cameraY:          10,
  cameraZ:          15,
  ambientIntensity: 0.8,
  tweenDuration:    600,
  tweenLiftHeight:  8,
  bgColor:          '#1a1a1a',
  towerColor:       '#888888',
  diskColors:       ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'],
};

@Component({
  selector: 'app-game-hanoi3d',
  templateUrl: './game-hanoi3d.component.html',
  styleUrl: './game-hanoi3d.component.css',
  providers: [{ provide: PAGE_TITLE_LOG, useValue: PAGE_GAMES_HANOI_3D }],
  standalone: false // v21 work: standalone: false kept since this belongs to an NgModule
})
export class GameHanoi3dComponent extends BaseReferenceComponent implements OnInit, AfterViewInit, OnDestroy {

  // v21 work: viewChild() signal-based DOM query
  // Replaces: @ViewChild('rendererContainer', { static: false }) rendererContainer!: ElementRef
  // Returns Signal<ElementRef | undefined> — undefined until view is initialized
  readonly rendererContainer = viewChild<ElementRef>('rendererContainer');

  // ============================================================
  // v21 work: CONFIG SIGNAL
  // One signal holds the entire scene config; all controls update it via signal.update()
  // Replaces multiple scattered @Input() properties or plain mutable fields
  // ============================================================
  readonly config = signal<HanoiSceneConfig>({ ...DEFAULT_CONFIG });

  // v21 work: computed() signals slicing individual fields from config for clean template binding
  readonly numDisks         = computed(() => this.config().numDisks);
  readonly cameraFov        = computed(() => this.config().cameraFov);
  readonly cameraY          = computed(() => this.config().cameraY);
  readonly cameraZ          = computed(() => this.config().cameraZ);
  readonly ambientIntensity = computed(() => this.config().ambientIntensity);
  readonly tweenDuration    = computed(() => this.config().tweenDuration);
  readonly tweenLiftHeight  = computed(() => this.config().tweenLiftHeight);
  readonly bgColor          = computed(() => this.config().bgColor);
  readonly towerColor       = computed(() => this.config().towerColor);
  readonly diskColors       = computed(() => this.config().diskColors);

  // ============================================================
  // v21 work: GAME STATE SIGNALS
  // Replaces plain mutable class properties with reactive signals
  // ============================================================
  private readonly currentMoveSignal  = signal<number>(0);
  private readonly isAnimatingSignal  = signal<boolean>(false);
  private readonly movesSignal        = signal<HanoiMove[]>([]);
  private readonly hasStartedSignal   = signal<boolean>(false);  // NEW: Start-on-demand gate
  private readonly isPausedSignal     = signal<boolean>(false);  // NEW: Pause / Resume toggle
  private readonly showControlsSignal = signal<boolean>(false);  // NEW: Controls panel toggle

  // v21 work: computed() readonly public accessors — prevent external signal mutation
  readonly currentMove  = computed(() => this.currentMoveSignal());
  readonly isAnimating  = computed(() => this.isAnimatingSignal());
  readonly moves        = computed(() => this.movesSignal());
  readonly totalMoves   = computed(() => this.movesSignal().length);
  readonly hasStarted   = computed(() => this.hasStartedSignal());
  readonly isPaused     = computed(() => this.isPausedSignal());
  readonly showControls = computed(() => this.showControlsSignal());

  // v21 work: computed() for derived UI values
  readonly progressPct = computed(() =>
    this.totalMoves() > 0
      ? Math.round((this.currentMoveSignal() / this.totalMoves()) * 100)
      : 0
  );

  readonly isSolved = computed(() =>
    this.hasStarted() && this.totalMoves() > 0 && this.currentMoveSignal() >= this.totalMoves()
  );

  // ============================================================
  // THREE.js objects — imperative, intentionally outside Angular reactivity
  // ============================================================
  private scene!:        THREE.Scene;
  private camera!:       THREE.PerspectiveCamera;
  private renderer!:     THREE.WebGLRenderer;
  private controls!:     OrbitControls;
  private ambientLight!: THREE.AmbientLight;
  private tweenGroup     = new Group();

  private disks:  THREE.Mesh[] = [];
  private towers: THREE.Mesh[] = [];

  private animationFrameId: number | null = null;
  private readonly TOWER_SPACING = 6;

  // Mobile-friendly: ResizeObserver watches the container and resizes the renderer
  // whenever the element changes size (orientation change, window resize, panel toggle)
  private resizeObserver: ResizeObserver | null = null;

  // ============================================================
  // CONSTRUCTOR
  // ============================================================
  constructor() {
    // v21 work: inject() for functional DI — replaces constructor parameter injection
    super(
      inject(ConfigService),
      inject(BackendService),
      inject(ActivatedRoute),
      inject(SpeechService),
      PAGE_TITLE_NO_SOUND
    );

    // v21 work: afterNextRender() replaces ngAfterViewInit + setTimeout()
    // Runs once after the first render; DOM and viewChild() signals are ready; SSR-safe
    afterNextRender(() => {
      this.initScene();
      this.animate(); // Start the render loop — puzzle waits for startPuzzle()
    });

    // v21 work: effect() reacts to isSolved() computed signal — fires when puzzle completes
    effect(() => {
      if (this.isSolved()) {
        console.log('🎉 Puzzle solved! Total moves:', this.totalMoves());
      }
    });
  }

  // Kept for BaseReferenceComponent compatibility; logic moved to afterNextRender()
  ngOnInit(): void {}
  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.cleanupScene();
  }

  // ============================================================
  // SCENE SETUP
  // ============================================================

  private initScene(): void {
    // v21 work: reading viewChild() signal — returns ElementRef | undefined
    const el = this.rendererContainer()!.nativeElement;

    this.scene = new THREE.Scene();
    // v21 work: reading config signal values to initialize the scene
    this.scene.background = new THREE.Color(this.config().bgColor);

    this.camera = new THREE.PerspectiveCamera(
      this.config().cameraFov,
      el.offsetWidth / el.offsetHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, this.config().cameraY, this.config().cameraZ);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(el.offsetWidth, el.offsetHeight);
    el.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Mobile-friendly: observe container size changes (orientation flip, window resize)
    // and keep the renderer + camera aspect ratio in sync automatically
    this.resizeObserver = new ResizeObserver(() => this.onContainerResize(el));
    this.resizeObserver.observe(el);

    this.ambientLight = new THREE.AmbientLight(0xffffff, this.config().ambientIntensity);
    this.scene.add(this.ambientLight);

    // Base platform
    const baseGeo = new THREE.BoxGeometry(22, 0.3, 4);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
    const base    = new THREE.Mesh(baseGeo, baseMat);
    base.position.set(0, -0.15, 0);
    this.scene.add(base);

    this.createTowers();
    this.createDisks();
    // Pre-compute the solution — animation only starts when hasStarted() becomes true
    this.solveHanoi(this.config().numDisks, 0, 2, 1);
    console.log('Total moves planned:', this.totalMoves());
  }

  private createTowers(): void {
    const geo = new THREE.CylinderGeometry(0.2, 0.2, 5, 32);
    // v21 work: reading towerColor from config signal
    const mat = new THREE.MeshStandardMaterial({ color: this.config().towerColor });
    for (let i = 0; i < 3; i++) {
      const tower = new THREE.Mesh(geo, mat);
      tower.position.set((i - 1) * this.TOWER_SPACING, 2.5, 0);
      this.towers.push(tower);
      this.scene.add(tower);
    }
  }

  private createDisks(): void {
    // v21 work: reading numDisks and diskColors from config signal
    const cfg    = this.config();
    const colors = cfg.diskColors;
    for (let i = 0; i < cfg.numDisks; i++) {
      const radius   = 2.5 - (i * 0.4);
      const geo      = new THREE.CylinderGeometry(radius, radius, 0.6, 32);
      // Fall back to HSL if user has fewer custom colors than disks
      const colorVal = colors[i] ?? `#${new THREE.Color().setHSL(i / cfg.numDisks, 0.7, 0.5).getHexString()}`;
      const mat      = new THREE.MeshStandardMaterial({ color: new THREE.Color(colorVal) });
      const disk     = new THREE.Mesh(geo, mat);
      disk.position.set(-this.TOWER_SPACING, (i * 0.7) + 0.3, 0);
      this.disks.push(disk);
      this.scene.add(disk);
    }
  }

  private solveHanoi(n: number, s: number, t: number, a: number): void {
    if (n > 0) {
      this.solveHanoi(n - 1, s, a, t);
      // v21 work: signal.update() appends moves immutably — replaces array.push()
      this.movesSignal.update(moves => [...moves, { from: s, to: t }]);
      this.solveHanoi(n - 1, a, t, s);
    }
  }

  // ============================================================
  // ANIMATION LOOP
  // ============================================================

  // Mobile-friendly: called by ResizeObserver whenever the container changes dimensions.
  // Updates renderer pixel size and camera aspect ratio to match the new container size.
  private onContainerResize(el: HTMLElement): void {
    if (!this.renderer || !this.camera) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private animateMove(): void {
    // v21 work: reading computed() signals to guard animation
    if (this.currentMoveSignal() >= this.totalMoves()) return;
    if (this.isAnimatingSignal())                       return;
    if (!this.hasStartedSignal())                       return; // NEW: wait for Start button
    if (this.isPausedSignal())                          return; // NEW: respect Pause state

    // v21 work: signal.set() to mark animation as in-progress
    this.isAnimatingSignal.set(true);

    // v21 work: reading movesSignal() and config signal for live tween parameters
    const move     = this.movesSignal()[this.currentMoveSignal()];
    const sourceX  = (move.from - 1) * this.TOWER_SPACING;
    const targetX  = (move.to   - 1) * this.TOWER_SPACING;
    const duration = this.config().tweenDuration;   // v21 work: live from config signal
    const liftH    = this.config().tweenLiftHeight; // v21 work: live from config signal

    const disksOnSource = this.disks
      .filter(d => Math.abs(d.position.x - sourceX) < 0.5)
      .sort((a, b) => b.position.y - a.position.y);

    if (disksOnSource.length > 0) {
      const disk          = disksOnSource[0];
      const disksOnTarget = this.disks.filter(d => Math.abs(d.position.x - targetX) < 0.5);
      const targetY       = (disksOnTarget.length * 0.7) + 0.3;

      new Tween(disk.position, this.tweenGroup)
        .to({ y: liftH }, duration)
        .easing(Easing.Quadratic.Out)
        .onComplete(() => {
          new Tween(disk.position, this.tweenGroup)
            .to({ x: targetX }, duration)
            .easing(Easing.Quadratic.InOut)
            .onComplete(() => {
              new Tween(disk.position, this.tweenGroup)
                .to({ y: targetY }, duration)
                .easing(Easing.Bounce.Out)
                .onComplete(() => {
                  // v21 work: signal.update() increments move counter immutably
                  this.currentMoveSignal.update(m => m + 1);
                  // v21 work: signal.set() clears animation lock
                  this.isAnimatingSignal.set(false);
                })
                .start();
            })
            .start();
        })
        .start();
    } else {
      console.error('No disk found at source!', sourceX);
      this.currentMoveSignal.update(m => m + 1);
      this.isAnimatingSignal.set(false);
    }
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    this.tweenGroup.update();
    this.controls.update();

    // v21 work: reading isAnimating() computed signal in the render loop
    if (!this.isAnimating()) {
      this.animateMove();
    }

    this.renderer.render(this.scene, this.camera);
  }

  // ============================================================
  // PUBLIC ACTIONS — called from template buttons
  // ============================================================

  /** NEW: Starts the animation; called by the Start button */
  startPuzzle(): void {
    // v21 work: signal.set() flips the hasStarted gate — animateMove() will now run
    this.hasStartedSignal.set(true);
    this.isPausedSignal.set(false);
  }

  /** NEW: Toggles Pause / Resume */
  togglePause(): void {
    // v21 work: signal.update() toggles isPaused immutably
    this.isPausedSignal.update(v => !v);
  }

  /** NEW: Toggles the controls side panel */
  toggleControls(): void {
    // v21 work: signal.update() toggles showControls immutably
    this.showControlsSignal.update(v => !v);
  }

  /** Resets all scene config to factory defaults and restarts the puzzle */
  resetToDefaults(): void {
    // v21 work: signal.set() restores the entire config signal to the DEFAULT_CONFIG snapshot
    // Deep-copying diskColors array prevents shared reference mutation
    this.config.set({ ...DEFAULT_CONFIG, diskColors: [...DEFAULT_CONFIG.diskColors] });
    // Restart so geometry and materials rebuild with the default values
    this.restart();
  }

  // ============================================================
  // CONFIG UPDATERS
  // Each uses signal.update() to immutably patch the config field
  // and applies the change live to the THREE.js scene where possible
  // v21 work: signal.update() with object spread replaces direct property mutation
  // ============================================================

  setNumDisks(value: number): void {
    this.config.update(c => ({ ...c, numDisks: value }));
    // numDisks takes effect on next restart (rebuilds geometry)
  }

  setCameraFov(value: number): void {
    this.config.update(c => ({ ...c, cameraFov: value }));
    if (this.camera) {
      this.camera.fov = value;
      this.camera.updateProjectionMatrix();
    }
  }

  setCameraY(value: number): void {
    this.config.update(c => ({ ...c, cameraY: value }));
    if (this.camera) this.camera.position.setY(value);
  }

  setCameraZ(value: number): void {
    this.config.update(c => ({ ...c, cameraZ: value }));
    if (this.camera) this.camera.position.setZ(value);
  }

  setAmbientIntensity(value: number): void {
    this.config.update(c => ({ ...c, ambientIntensity: value }));
    if (this.ambientLight) this.ambientLight.intensity = value;
  }

  setTweenDuration(value: number): void {
    // v21 work: signal.update() — new duration is read from config signal at animation time
    this.config.update(c => ({ ...c, tweenDuration: value }));
  }

  setTweenLiftHeight(value: number): void {
    this.config.update(c => ({ ...c, tweenLiftHeight: value }));
  }

  setBgColor(value: string): void {
    this.config.update(c => ({ ...c, bgColor: value }));
    if (this.scene) this.scene.background = new THREE.Color(value);
  }

  setTowerColor(value: string): void {
    this.config.update(c => ({ ...c, towerColor: value }));
    // Live-update all tower materials in the scene
    this.towers.forEach(t =>
      (t.material as THREE.MeshStandardMaterial).color.set(value)
    );
  }

  setDiskColor(index: number, value: string): void {
    // v21 work: signal.update() to immutably replace one element in the diskColors array
    this.config.update(c => {
      const diskColors  = [...c.diskColors];
      diskColors[index] = value;
      return { ...c, diskColors };
    });
    // Live-update the specific disk material in the scene
    if (this.disks[index]) {
      (this.disks[index].material as THREE.MeshStandardMaterial).color.set(value);
    }
  }

  // ============================================================
  // RESTART — original method preserved + extended for v21 state reset
  // ============================================================
  restart(): void {
    this.cleanupScene();

    // v21 work: signal.set() calls reset all reactive game state atomically
    this.currentMoveSignal.set(0);
    this.isAnimatingSignal.set(false);
    this.movesSignal.set([]);
    this.hasStartedSignal.set(false);  // NEW: return to pre-start state
    this.isPausedSignal.set(false);    // NEW: clear any pause

    this.disks      = [];
    this.towers     = [];
    this.tweenGroup = new Group();

    // Re-initialize with current config signal values
    this.initScene();
    this.animate();
  }

  // ============================================================
  // CLEANUP
  // ============================================================
  private cleanupScene(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    // Mobile-friendly: disconnect the observer to avoid memory leaks
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    this.tweenGroup.removeAll();
    this.disks.forEach(d => {
      d.geometry.dispose();
      (d.material as THREE.Material).dispose();
    });
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
  }
}