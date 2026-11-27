import { Injectable } from '@angular/core';

export interface PhysicsSnapshot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  kineticEnergy: number;
  potentialEnergy: number;
  totalEnergy: number;
  momentum: number;
  collisionCount: number;
  stopped: boolean;
}

export interface StepSimulationParams {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  gravity: number;
  friction: number;
  restitution: number;
  width: number;
  height: number;
  collisionCount: number;
}

interface CollisionWasmExports {
  memory: WebAssembly.Memory;
  getStatePtr: () => number;
  computeMetrics: (...args: number[]) => number;
  stepSimulation: (
    x: number,
    y: number,
    vx: number,
    vy: number,
    radius: number,
    mass: number,
    gravity: number,
    friction: number,
    restitution: number,
    width: number,
    height: number,
    collisionCount: number
  ) => void;
}

@Injectable({ providedIn: 'root' })
export class CollisionWasmService {
  private exports: CollisionWasmExports | null = null;
  private readonly defaultWasmUrl = 'assets/wasm/collision_engine-wasm/collision_engine.wasm';

  async init(wasmUrl = this.defaultWasmUrl): Promise<void> {
    if (this.exports) return;

    const response = await fetch(wasmUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Wasm module from ${wasmUrl}: ${response.status}`);
    }

    const bytes = await response.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(bytes, {});
    this.exports = instance.exports as unknown as CollisionWasmExports;
  }

  step(params: StepSimulationParams): PhysicsSnapshot {
    if (!this.exports) {
      throw new Error('CollisionWasmService is not initialized. Call init() first.');
    }

    this.exports.stepSimulation(
      params.x,
      params.y,
      params.vx,
      params.vy,
      params.radius,
      params.mass,
      params.gravity,
      params.friction,
      params.restitution,
      params.width,
      params.height,
      params.collisionCount
    );

    return this.readSnapshot();
  }

  readSnapshot(): PhysicsSnapshot {
    if (!this.exports) {
      throw new Error('CollisionWasmService is not initialized. Call init() first.');
    }

    const ptr = this.exports.getStatePtr() >>> 0;
    const view = new DataView(this.exports.memory.buffer, ptr, 80);

    return {
      x: view.getFloat64(0, true),
      y: view.getFloat64(8, true),
      vx: view.getFloat64(16, true),
      vy: view.getFloat64(24, true),
      speed: view.getFloat64(32, true),
      kineticEnergy: view.getFloat64(40, true),
      potentialEnergy: view.getFloat64(48, true),
      totalEnergy: view.getFloat64(56, true),
      momentum: view.getFloat64(64, true),
      collisionCount: view.getInt32(72, true),
      stopped: view.getInt32(76, true) !== 0,
    };
  }
}
